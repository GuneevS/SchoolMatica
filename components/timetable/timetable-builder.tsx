
"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AssessmentPlan,
  ClassGroup,
  Subject,
  Teacher,
  Timetable,
  TimetablePeriod,
  TimetableSlot,
} from "@prisma/client";
import { TimetableGrid } from "@/components/timetable/timetable-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CheckCircle2, LayoutGrid, Pencil, Sparkles, Users2 } from "lucide-react";

type TimetableSlotWithRelations = TimetableSlot & {
  classGroup: ClassGroup & { subject: Subject | null };
  teacher: Teacher | null;
  period: TimetablePeriod;
  assessmentPlan: AssessmentPlan | null;
};

type TimetablePeriodWithSlots = TimetablePeriod & {
  slots: TimetableSlotWithRelations[];
};

type ClassGroupWithSubject = ClassGroup & { subject: Subject | null };
type AssessmentPlanWithClass = AssessmentPlan & { classGroup: ClassGroupWithSubject };

interface TimetableBuilderProps {
  timetable: Timetable & {
    periods: TimetablePeriodWithSlots[];
    slots: TimetableSlotWithRelations[];
  };
  classes: ClassGroupWithSubject[];
  teachers: Teacher[];
  assessmentPlans: AssessmentPlanWithClass[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const isBreakPeriod = (period?: TimetablePeriod | null) => {
  if (!period?.name) return false;
  const lower = period.name.toLowerCase();
  return lower.includes("break") || lower.includes("lunch");
};

interface SlotFormState {
  classGroupId: string;
  teacherId: string;
  assessmentPlanId: string;
  room: string;
  notes: string;
}

interface PeriodFormState {
  name: string;
  startTime: string;
  endTime: string;
  applyScope: string;
}

interface PeriodGroup {
  periodNumber: number;
  base: TimetablePeriod;
  periods: TimetablePeriod[];
}

export function TimetableBuilder({ timetable, classes, teachers, assessmentPlans }: TimetableBuilderProps) {
  const router = useRouter();
  const [slots, setSlots] = useState<TimetableSlotWithRelations[]>(timetable.slots);
  const [periods, setPeriods] = useState<TimetablePeriodWithSlots[]>(timetable.periods);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [activeSlot, setActiveSlot] = useState<TimetableSlotWithRelations | null>(null);
  const [activePeriod, setActivePeriod] = useState<TimetablePeriod | null>(null);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [slotForm, setSlotForm] = useState<SlotFormState>({
    classGroupId: classes[0]?.id ?? "",
    teacherId: "none",
    assessmentPlanId: "none",
    room: "",
    notes: "",
  });
  const [periodForm, setPeriodForm] = useState<PeriodFormState>({
    name: "",
    startTime: "",
    endTime: "",
    applyScope: "all",
  });
  const [isSavingSlot, setIsSavingSlot] = useState(false);
  const [isSavingPeriod, setIsSavingPeriod] = useState(false);
  const [isRefreshing, startTransition] = useTransition();
  const [activePeriodGroup, setActivePeriodGroup] = useState<PeriodGroup | null>(null);

  const classLabel = (classGroup: ClassGroupWithSubject) => {
    const subjectName = classGroup.subject?.name ? ` · ${classGroup.subject.name}` : "";
    return `Grade ${classGroup.grade} · ${classGroup.name}${subjectName}`;
  };

  const plansByClass = useMemo(() => {
    const map = new Map<string, AssessmentPlanWithClass[]>();
    for (const plan of assessmentPlans) {
      const list = map.get(plan.classGroupId) ?? [];
      list.push(plan);
      map.set(plan.classGroupId, list);
    }
    return map;
  }, [assessmentPlans]);

  const periodGroups = useMemo<PeriodGroup[]>(() => {
    const map = new Map<number, TimetablePeriod[]>();
    periods.forEach((period) => {
      const list = map.get(period.periodNumber) ?? [];
      list.push(period);
      map.set(period.periodNumber, list);
    });

    return Array.from(map.entries())
      .map(([periodNumber, grouped]) => {
        const base = grouped.find((period) => period.dayOfWeek === 0) ?? grouped[0];
        return {
          periodNumber,
          base,
          periods: grouped,
        };
      })
      .sort((a, b) => a.periodNumber - b.periodNumber);
  }, [periods]);

  const scheduleMetrics = useMemo(() => {
    const totalPeriods = periods.length;
    const breakPeriods = periods.filter((period) => isBreakPeriod(period)).length;
    const scheduledSlots = slots.length;
    const openSlots = Math.max(0, totalPeriods - breakPeriods - scheduledSlots);
    const uniqueTeachers = new Set(slots.map((slot) => slot.teacherId).filter(Boolean)).size;
    return {
      totalPeriods,
      breakPeriods,
      scheduledSlots,
      openSlots,
      uniqueTeachers,
    };
  }, [periods, slots]);

  function openCreateSlot(period: TimetablePeriod) {
    const defaultClass = selectedClassId !== "all" ? selectedClassId : classes[0]?.id ?? "";
    setActiveSlot(null);
    setActivePeriod(period);
    setSlotForm({
      classGroupId: defaultClass,
      teacherId: "none",
      assessmentPlanId: "none",
      room: "",
      notes: "",
    });
    setSlotError(null);
    setSlotDialogOpen(true);
  }

  function openEditSlot(slot: TimetableSlotWithRelations) {
    setActiveSlot(slot);
    setActivePeriod(slot.period);
    setSlotForm({
      classGroupId: slot.classGroupId,
      teacherId: slot.teacherId ?? "none",
      assessmentPlanId: slot.assessmentPlanId ?? "none",
      room: slot.room ?? "",
      notes: slot.notes ?? "",
    });
    setSlotError(null);
    setSlotDialogOpen(true);
  }

  function openPeriodEditor(group: PeriodGroup) {
    setActivePeriodGroup(group);
    setPeriodForm({
      name: group.base.name,
      startTime: group.base.startTime,
      endTime: group.base.endTime,
      applyScope: "all",
    });
    setPeriodError(null);
    setPeriodDialogOpen(true);
  }

  async function handleSaveSlot() {
    if (!activePeriod) return;
    if (!slotForm.classGroupId) {
      setSlotError("Select a class group before saving.");
      return;
    }

    setIsSavingSlot(true);
    setSlotError(null);

    const payload = {
      classGroupId: slotForm.classGroupId,
      teacherId: slotForm.teacherId === "none" ? null : slotForm.teacherId,
      room: slotForm.room.trim() === "" ? null : slotForm.room.trim(),
      notes: slotForm.notes.trim() === "" ? null : slotForm.notes.trim(),
      assessmentPlanId: slotForm.assessmentPlanId === "none" ? null : slotForm.assessmentPlanId,
    };

    try {
      const response = await fetch(
        activeSlot ? `/api/timetable-slots/${activeSlot.id}` : `/api/timetables/${timetable.id}/slots`,
        {
          method: activeSlot ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            activeSlot
              ? payload
              : {
                  ...payload,
                  periodId: activePeriod.id,
                },
          ),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setSlotError(errorData?.error ?? "Unable to save this slot. Check your permissions.");
        return;
      }

      const savedSlot = (await response.json()) as TimetableSlotWithRelations;
      setSlots((current) => {
        const existing = current.find((slot) => slot.id === savedSlot.id);
        if (existing) {
          return current.map((slot) => (slot.id === savedSlot.id ? savedSlot : slot));
        }
        return [...current, savedSlot];
      });

      setSlotDialogOpen(false);
      setActiveSlot(null);
      setActivePeriod(null);
      startTransition(() => router.refresh());
    } catch (error) {
      console.error("Failed to save slot:", error);
      setSlotError("Something went wrong while saving. Please try again.");
    } finally {
      setIsSavingSlot(false);
    }
  }

  async function handleDeleteSlot() {
    if (!activeSlot) return;
    setIsSavingSlot(true);
    setSlotError(null);

    try {
      const response = await fetch(`/api/timetable-slots/${activeSlot.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setSlotError(errorData?.error ?? "Unable to delete this slot.");
        return;
      }

      setSlots((current) => current.filter((slot) => slot.id !== activeSlot.id));
      setSlotDialogOpen(false);
      setActiveSlot(null);
      setActivePeriod(null);
      startTransition(() => router.refresh());
    } catch (error) {
      console.error("Failed to delete slot:", error);
      setSlotError("Something went wrong while deleting. Please try again.");
    } finally {
      setIsSavingSlot(false);
    }
  }

  async function handleSavePeriod() {
    if (!activePeriodGroup) return;
    if (!periodForm.name.trim()) {
      setPeriodError("Period label is required.");
      return;
    }

    setIsSavingPeriod(true);
    setPeriodError(null);

    const targets =
      periodForm.applyScope === "all"
        ? activePeriodGroup.periods
        : activePeriodGroup.periods.filter(
            (period) => period.dayOfWeek === Number(periodForm.applyScope),
          );

    try {
      const updates = await Promise.all(
        targets.map((period) =>
          fetch(`/api/timetables/${timetable.id}/periods`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: period.id,
              name: periodForm.name.trim(),
              startTime: periodForm.startTime,
              endTime: periodForm.endTime,
            }),
          }).then(async (response) => {
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData?.error ?? "Failed to update period");
            }
            return response.json();
          }),
        ),
      );

      const updateMap = new Map<string, TimetablePeriod>(updates.map((period) => [period.id, period]));
      setPeriods((current) =>
        current.map((period) => {
          const updated = updateMap.get(period.id);
          return updated ? { ...period, ...updated } : period;
        }),
      );
      setPeriodDialogOpen(false);
      setActivePeriodGroup(null);
      startTransition(() => router.refresh());
    } catch (error) {
      console.error("Failed to update period:", error);
      setPeriodError("Unable to save period changes. Please try again.");
    } finally {
      setIsSavingPeriod(false);
    }
  }

  const timetableForGrid = useMemo(
    () => ({
      ...timetable,
      periods,
      slots,
    }),
    [timetable, periods, slots],
  );

  const selectedClass = classes.find((item) => item.id === selectedClassId);

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <Card className="border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent-iris))/0.3] bg-[hsl(var(--accent-iris))/0.1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(var(--accent-iris))]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Timetable Studio
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {timetable.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="font-normal">
                    {timetable.term}
                  </Badge>
                  <span>{timetable.year}</span>
                  <span className="text-xs">•</span>
                  <Badge
                    variant={timetable.status === "Active" ? "default" : "secondary"}
                    className="text-[10px] h-5 px-1.5"
                  >
                    {timetable.status}
                  </Badge>
                  <span className="text-xs">•</span>
                  <span>{timetable.cycleType} cycle</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Select
                  value={selectedClassId}
                  onValueChange={setSelectedClassId}
                >
                  <SelectTrigger className="min-w-[220px]">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {classes.map((classGroup) => (
                      <SelectItem key={classGroup.id} value={classGroup.id}>
                        {classLabel(classGroup)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => openPeriodEditor(periodGroups[0])}
                  disabled={periodGroups.length === 0}
                >
                  <Pencil className="h-4 w-4" />
                  Edit periods
                </Button>
              </div>
            </div>

            {selectedClass && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--accent-mint))]" />
                Viewing schedule focus for {classLabel(selectedClass)}
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-[hsl(var(--border))/0.4] bg-background/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    Scheduled slots
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{scheduleMetrics.scheduledSlots}</span>
                  <span className="text-xs text-muted-foreground">classes set</span>
                </CardContent>
              </Card>
              <Card className="border-[hsl(var(--border))/0.4] bg-background/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    Open slots
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{scheduleMetrics.openSlots}</span>
                  <span className="text-xs text-muted-foreground">ready to fill</span>
                </CardContent>
              </Card>
              <Card className="border-[hsl(var(--border))/0.4] bg-background/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    Break windows
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{scheduleMetrics.breakPeriods}</span>
                  <span className="text-xs text-muted-foreground">protected</span>
                </CardContent>
              </Card>
              <Card className="border-[hsl(var(--border))/0.4] bg-background/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    Teachers scheduled
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{scheduleMetrics.uniqueTeachers}</span>
                  <span className="text-xs text-muted-foreground">assigned</span>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            <Card className="border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <LayoutGrid className="h-4 w-4 text-[hsl(var(--accent-iris))]" />
                  Period blueprint
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Shape the rhythm of each day. Rename periods or mark breaks.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {periodGroups.map((group) => (
                  <div
                    key={group.periodNumber}
                    className="rounded-2xl border border-[hsl(var(--border))/0.5] bg-[hsl(var(--surface-soft))] p-4 shadow-ambient-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Period {group.periodNumber}</Badge>
                          {isBreakPeriod(group.base) && (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 text-amber-600"
                            >
                              Break
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">{group.base.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.base.startTime} - {group.base.endTime}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => openPeriodEditor(group)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground/70">
                      {group.periods
                        .map((period) => DAYS[period.dayOfWeek])
                        .filter((day) => day)
                        .map((day) => (
                          <span key={day}>{day.slice(0, 3)}</span>
                        ))}
                    </div>
                  </div>
                ))}
                {periodGroups.length === 0 && (
                  <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No periods defined yet. Create a timetable first.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users2 className="h-4 w-4 text-[hsl(var(--accent-mint))]" />
                  Builder tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[hsl(var(--accent-iris))]" />
                  Click any open slot to assign a class, teacher, and room.
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[hsl(var(--accent-mint))]" />
                  Mark periods as breaks to keep the grid clean and prevent accidental scheduling.
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[hsl(var(--accent-cobalt))]" />
                  Filter by class to focus on a single timetable stream.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <TimetableGrid
              timetable={timetableForGrid}
              onSlotClick={openEditSlot}
              onEmptySlotClick={openCreateSlot}
              highlightClassId={selectedClassId !== "all" ? selectedClassId : undefined}
            />
          </div>
        </div>

        <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <DialogTitle>{activeSlot ? "Edit scheduled class" : "Add class to timetable"}</DialogTitle>
              <DialogDescription>
                {activePeriod
                  ? `Period ${activePeriod.periodNumber} · ${DAYS[activePeriod.dayOfWeek]} · ${activePeriod.startTime} - ${activePeriod.endTime}`
                  : "Choose the class, teacher, and space for this slot."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="classGroup">Class</Label>
                <Select
                  value={slotForm.classGroupId}
                  onValueChange={(value) =>
                    setSlotForm((state) => ({
                      ...state,
                      classGroupId: value,
                      assessmentPlanId: "none",
                    }))
                  }
                >
                  <SelectTrigger id="classGroup">
                    <SelectValue placeholder="Choose class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classGroup) => (
                      <SelectItem key={classGroup.id} value={classGroup.id}>
                        {classLabel(classGroup)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="teacher">Teacher</Label>
                  <Select
                    value={slotForm.teacherId}
                    onValueChange={(value) =>
                      setSlotForm((state) => ({ ...state, teacherId: value }))
                    }
                  >
                    <SelectTrigger id="teacher">
                      <SelectValue placeholder="Assign teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.firstName} {teacher.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="plan">Assessment plan</Label>
                  <Select
                    value={slotForm.assessmentPlanId}
                    onValueChange={(value) =>
                      setSlotForm((state) => ({ ...state, assessmentPlanId: value }))
                    }
                  >
                    <SelectTrigger id="plan">
                      <SelectValue placeholder="Optional plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No plan</SelectItem>
                      {(plansByClass.get(slotForm.classGroupId) ?? []).map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="room">Room</Label>
                <Input
                  id="room"
                  value={slotForm.room}
                  onChange={(event) =>
                    setSlotForm((state) => ({ ...state, room: event.target.value }))
                  }
                  placeholder="Room, lab, or venue"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slotNotes">Additional details</Label>
                <Textarea
                  id="slotNotes"
                  value={slotForm.notes}
                  onChange={(event) =>
                    setSlotForm((state) => ({ ...state, notes: event.target.value }))
                  }
                  placeholder="Add any context teachers or admins should see."
                />
              </div>

              {slotError && <p className="text-sm text-destructive">{slotError}</p>}
            </div>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isSavingSlot || isRefreshing ? "Saving..." : "Changes apply instantly."}
              </div>
              <div className="flex gap-2">
                {activeSlot && (
                  <Button variant="outline" onClick={handleDeleteSlot} disabled={isSavingSlot}>
                    Remove slot
                  </Button>
                )}
                <Button onClick={handleSaveSlot} disabled={isSavingSlot}>
                  {activeSlot ? "Save changes" : "Add to timetable"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Period settings</DialogTitle>
              <DialogDescription>
                Update the label and time window for this period.
              </DialogDescription>
            </DialogHeader>
            {activePeriodGroup && (
              <div className="grid gap-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Period {activePeriodGroup.periodNumber}</Badge>
                  <Badge variant="outline">
                    {activePeriodGroup.base.startTime} - {activePeriodGroup.base.endTime}
                  </Badge>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="periodName">Label</Label>
                  <Input
                    id="periodName"
                    value={periodForm.name}
                    onChange={(event) =>
                      setPeriodForm((state) => ({ ...state, name: event.target.value }))
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="periodStart">Start time</Label>
                    <Input
                      id="periodStart"
                      type="time"
                      value={periodForm.startTime}
                      onChange={(event) =>
                        setPeriodForm((state) => ({ ...state, startTime: event.target.value }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="periodEnd">End time</Label>
                    <Input
                      id="periodEnd"
                      type="time"
                      value={periodForm.endTime}
                      onChange={(event) =>
                        setPeriodForm((state) => ({ ...state, endTime: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="periodScope">Apply to</Label>
                  <Select
                    value={periodForm.applyScope}
                    onValueChange={(value) =>
                      setPeriodForm((state) => ({ ...state, applyScope: value }))
                    }
                  >
                    <SelectTrigger id="periodScope">
                      <SelectValue placeholder="Apply to days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All weekdays</SelectItem>
                      {activePeriodGroup.periods.map((period) => (
                        <SelectItem key={period.id} value={period.dayOfWeek.toString()}>
                          {DAYS[period.dayOfWeek]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(isBreakPeriod(activePeriodGroup.base) && "border-amber-500/50")}
                        onClick={() =>
                          setPeriodForm((state) => ({
                            ...state,
                            name: "Break",
                          }))
                        }
                      >
                        Mark break
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Rename to a break so the grid blocks scheduling.</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setPeriodForm((state) => ({
                        ...state,
                        name: "Lunch",
                      }))
                    }
                  >
                    Lunch
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setPeriodForm((state) => ({
                        ...state,
                        name: `Period ${activePeriodGroup.periodNumber}`,
                      }))
                    }
                  >
                    Reset label
                  </Button>
                </div>

                {periodError && <p className="text-sm text-destructive">{periodError}</p>}
              </div>
            )}
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isSavingPeriod ? "Saving..." : "Changes update immediately."}
              </div>
              <Button onClick={handleSavePeriod} disabled={isSavingPeriod}>
                Save period
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
