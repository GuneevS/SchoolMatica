
"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AssessmentPlan,
  ClassGroup,
  GradeLevel,
  GradeSubjectConfig,
  Subject,
  Teacher,
  Timetable,
  TimetablePeriod,
  TimetableSlot,
} from "@prisma/client";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable } from "@dnd-kit/core";
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
import { BookOpen, CheckCircle2, Clock, GripVertical, LayoutGrid, Pencil, Sparkles, Users2 } from "lucide-react";

type TimetableSlotWithRelations = TimetableSlot & {
  classGroup: ClassGroup & { subject: Subject | null };
  teacher: Teacher | null;
  period: TimetablePeriod;
  assessmentPlan: AssessmentPlan | null;
};

type TimetablePeriodWithSlots = TimetablePeriod & {
  slots: TimetableSlotWithRelations[];
};

type ClassGroupWithSubject = ClassGroup & { subject: Subject | null; gradeLevel: GradeLevel | null };
type AssessmentPlanWithClass = AssessmentPlan & { classGroup: ClassGroupWithSubject };
type GradeSubjectConfigWithRelations = GradeSubjectConfig & { subject: Subject; gradeLevel: GradeLevel };

interface TimetableBuilderProps {
  timetable: Timetable & {
    periods: TimetablePeriodWithSlots[];
    slots: TimetableSlotWithRelations[];
  };
  classes: ClassGroupWithSubject[];
  teachers: Teacher[];
  assessmentPlans: AssessmentPlanWithClass[];
  subjects: Subject[];
  gradeSubjectConfigs: GradeSubjectConfigWithRelations[];
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

// Draggable Subject Component
function DraggableSubject({ subject, isDragging }: { subject: Subject; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `subject-${subject.id}`,
    data: { type: 'subject', subject },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing transition-all",
        "bg-card hover:bg-accent hover:border-primary/30 hover:shadow-sm",
        isDragging && "opacity-50 ring-2 ring-primary"
      )}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{subject.name}</p>
        <p className="text-xs text-muted-foreground">{subject.code}</p>
      </div>
      <Badge variant="outline" className="text-[10px] h-5 shrink-0">{subject.phase}</Badge>
    </div>
  );
}



export function TimetableBuilder({ timetable, classes, teachers, assessmentPlans, subjects, gradeSubjectConfigs }: TimetableBuilderProps) {
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
  
  // Drag-and-drop state
  const [draggingSubject, setDraggingSubject] = useState<Subject | null>(null);
  const [showSubjectPalette, setShowSubjectPalette] = useState(true);
  
  // Smart defaults: remember teacher preferences per subject
  const [teacherBySubject, setTeacherBySubject] = useState<Map<string, string>>(new Map());
  
  // Separate homeroom classes (for slot assignment) from subject classes
  const homeroomClasses = useMemo(() => 
    classes.filter(c => c.classType === "Homeroom" || !c.subjectId),
    [classes]
  );
  
  // Get subjects available for a specific grade
  const getSubjectsForGrade = (grade: number) => {
    // Find grade level for this grade number
    const gradeLevel = classes.find(c => c.grade === grade)?.gradeLevel;
    if (!gradeLevel) return subjects; // Fallback to all subjects
    
    // Get subjects linked to this grade level
    const linkedSubjectIds = gradeSubjectConfigs
      .filter(config => config.gradeLevelId === gradeLevel.id)
      .map(config => config.subjectId);
    
    if (linkedSubjectIds.length === 0) return subjects; // Fallback if no configs
    
    return subjects.filter(s => linkedSubjectIds.includes(s.id));
  };
  
  // When class is selected, get its subjects
  const selectedClassSubjects = useMemo(() => {
    const selectedClass = classes.find(c => c.id === slotForm.classGroupId);
    if (!selectedClass) return subjects;
    return getSubjectsForGrade(selectedClass.grade);
  }, [slotForm.classGroupId, classes, subjects, gradeSubjectConfigs]);

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

  const saveSlotInstantly = async (period: TimetablePeriod, classId: string, subject: Subject) => {
    setIsSavingSlot(true);
    setSlotError(null);
    const rememberedTeacher = teacherBySubject.get(subject.id);
    const payload = {
      classGroupId: classId,
      teacherId: rememberedTeacher ?? null,
      room: null,
      notes: null,
      assessmentPlanId: null,
      periodId: period.id,
    };

    try {
      const response = await fetch(`/api/timetables/${timetable.id}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setSlotError(errorData?.error ?? "Unable to save this slot instantly.");
        openCreateSlotWithDefaults(period, classId, subject);
        return;
      }

      const savedSlot = (await response.json()) as TimetableSlotWithRelations;
      setSlots((current) => [...current, savedSlot]);
      startTransition(() => router.refresh());
    } catch (error) {
      console.error("Failed to auto-save slot:", error);
      openCreateSlotWithDefaults(period, classId, subject);
    } finally {
      setIsSavingSlot(false);
    }
  };

  // Drag-and-drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'subject') {
      setDraggingSubject(active.data.current.subject);
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingSubject(null);
    
    if (!over || !active.data.current?.subject) return;
    
    // Check if dropped on a period
    if (over.data.current?.type === 'period') {
      const droppedSubject = active.data.current.subject as Subject;
      const targetPeriod = over.data.current.period as TimetablePeriod;
      
      // Check if period already has a slot
      const existingSlot = slots.find(s => s.periodId === targetPeriod.id);
      if (existingSlot) return; // Don't replace existing slots
      
      // Try to predict the intended class
      let targetClassId = selectedClassId !== "all" ? selectedClassId : null;
      
      if (!targetClassId) {
        const subjectClass = classes.find(c => c.subjectId === droppedSubject.id);
        if (subjectClass) targetClassId = subjectClass.id;
      }
      
      if (targetClassId) {
        // Auto-save instantly for a seamless experience
        saveSlotInstantly(targetPeriod, targetClassId, droppedSubject);
      } else {
        // Fallback to the dialog if we cannot confidently guess the class
        const defaultClass = homeroomClasses[0]?.id ?? classes[0]?.id ?? "";
        openCreateSlotWithDefaults(targetPeriod, defaultClass, droppedSubject);
      }
    }
  }, [slots, classes, homeroomClasses, selectedClassId, timetable.id, teacherBySubject]);

  // Open slot dialog with pre-filled subject info
  function openCreateSlotWithDefaults(period: TimetablePeriod, classId: string, subject?: Subject) {
    setActiveSlot(null);
    setActivePeriod(period);
    
    // Get remembered teacher for this subject
    const rememberedTeacher = subject ? teacherBySubject.get(subject.id) : undefined;
    
    setSlotForm({
      classGroupId: classId,
      teacherId: rememberedTeacher ?? "none",
      assessmentPlanId: "none",
      room: "",
      notes: subject ? `Subject: ${subject.name}` : "",
    });
    setSlotError(null);
    setSlotDialogOpen(true);
  }

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
        const errorMsg = typeof errorData?.error === 'string' 
          ? errorData.error 
          : Array.isArray(errorData?.error)
            ? errorData.error.map((e: { message?: string }) => e.message || String(e)).join(', ')
            : "Unable to save this slot. Check your permissions.";
        setSlotError(errorMsg);
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
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <TooltipProvider>
      <div className="flex gap-6">
        {/* Subject Palette Sidebar */}
        {showSubjectPalette && (
          <div className="w-72 shrink-0 space-y-4">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Subject Palette
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSubjectPalette(false)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Drag subjects onto the timetable grid
                </p>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                {subjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No subjects configured for this school
                  </p>
                ) : (
                  subjects.map((subject) => (
                    <DraggableSubject
                      key={subject.id}
                      subject={subject}
                      isDragging={draggingSubject?.id === subject.id}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 space-y-8">
        {!showSubjectPalette && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSubjectPalette(true)}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Show Subject Palette
          </Button>
        )}
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
                <Label htmlFor="classGroup">Class (Homeroom)</Label>
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
                    {homeroomClasses.map((classGroup) => (
                      <SelectItem key={classGroup.id} value={classGroup.id}>
                        {classLabel(classGroup)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedClassSubjects.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground">Subjects for this grade:</span>
                    {selectedClassSubjects.slice(0, 6).map(s => (
                      <Badge key={s.id} variant="outline" className="text-[10px] h-5">
                        {s.code}
                      </Badge>
                    ))}
                    {selectedClassSubjects.length > 6 && (
                      <Badge variant="outline" className="text-[10px] h-5">
                        +{selectedClassSubjects.length - 6} more
                      </Badge>
                    )}
                  </div>
                )}
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

                {/* Quick Duration Presets */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Quick Duration
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[30, 40, 45, 50, 60].map((mins) => (
                      <Button
                        key={mins}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const [h, m] = periodForm.startTime.split(':').map(Number);
                          const totalMins = h * 60 + m + mins;
                          const endH = Math.floor(totalMins / 60) % 24;
                          const endM = totalMins % 60;
                          setPeriodForm((state) => ({
                            ...state,
                            endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
                          }));
                        }}
                      >
                        {mins}min
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Quick Type Presets */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Quick Type</Label>
                  <div className="flex flex-wrap gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn("h-7", isBreakPeriod(activePeriodGroup.base) && "border-amber-500/50 bg-amber-50")}
                          onClick={() =>
                            setPeriodForm((state) => ({
                              ...state,
                              name: "Break",
                            }))
                          }
                        >
                          ☕ Break
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Mark as break (blocks scheduling)</p>
                      </TooltipContent>
                    </Tooltip>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7"
                      onClick={() => {
                        const [h, m] = periodForm.startTime.split(':').map(Number);
                        const totalMins = h * 60 + m + 45; // 45 min lunch
                        const endH = Math.floor(totalMins / 60) % 24;
                        const endM = totalMins % 60;
                        setPeriodForm((state) => ({
                          ...state,
                          name: "Lunch",
                          endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
                        }));
                      }}
                    >
                      🍽️ Lunch (45min)
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7"
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
      </div>
    </TooltipProvider>
    
    {/* Drag overlay for visual feedback */}
    <DragOverlay>
      {draggingSubject && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card shadow-lg opacity-90">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{draggingSubject.name}</p>
            <p className="text-xs text-muted-foreground">{draggingSubject.code}</p>
          </div>
        </div>
      )}
    </DragOverlay>
    </DndContext>
  );
}
