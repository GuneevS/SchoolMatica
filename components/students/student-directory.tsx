"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenCheck,
  Filter,
  GraduationCap,
  LayoutList,
  PanelsTopLeft,
  Search,
  Users2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type SortKey = "name" | "grade" | "recent";

export type StudentDirectoryEntry = {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  gender: string;
  grade: number;
  className: string;
  classId: string;
  subjectName: string;
  subjectCode: string;
  subjectPhase: string;
  advisorName?: string | null;
  parents?: Array<{
    id: string;
    fullName: string;
    relationship: string;
    email?: string | null;
    phone?: string | null;
    primary: boolean;
  }>;
  updatedAt: string;
};

interface StudentDirectoryProps {
  students: StudentDirectoryEntry[];
}

export function StudentDirectory({ students }: StudentDirectoryProps) {
  const [search, setSearch] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [viewMode, setViewMode] = useState<"table" | "segments">("table");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const gradeSegments = useMemo(() => {
    const map = new Map<number, number>();
    students.forEach((student) => {
      map.set(student.grade, (map.get(student.grade) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => a.grade - b.grade);
  }, [students]);

  const subjectOptions = useMemo(() => {
    const map = new Map<
      string,
      { code: string; name: string; count: number; phase: string }
    >();
    students.forEach((student) => {
      if (!map.has(student.subjectCode)) {
        map.set(student.subjectCode, {
          code: student.subjectCode,
          name: student.subjectName,
          count: 0,
          phase: student.subjectPhase,
        });
      }
      const entry = map.get(student.subjectCode)!;
      entry.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const classOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    students.forEach((student) => {
      if (!map.has(student.classId)) {
        map.set(student.classId, { id: student.classId, name: student.className, count: 0 });
      }
      const entry = map.get(student.classId)!;
      entry.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const filteredStudents = useMemo(() => {
    return [...students]
      .filter((student) => {
        const needle = search.trim().toLowerCase();
        const haystack = `${student.firstName} ${student.lastName} ${student.admissionNumber}`.toLowerCase();
        const matchesSearch = !needle || haystack.includes(needle);
        const matchesGrade =
          selectedGrades.length === 0 || selectedGrades.includes(student.grade);
        const matchesSubject =
          subjectFilter === "all" || student.subjectCode === subjectFilter;
        const matchesClass = classFilter === "all" || student.classId === classFilter;
        return matchesSearch && matchesGrade && matchesSubject && matchesClass;
      })
      .sort((a, b) => {
        if (sortKey === "name") {
          return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
        }
        if (sortKey === "grade") {
          return b.grade - a.grade || a.lastName.localeCompare(b.lastName);
        }
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  }, [students, search, selectedGrades, subjectFilter, classFilter, sortKey]);

  const groupedByGrade = useMemo(() => {
    const map = new Map<number, StudentDirectoryEntry[]>();
    filteredStudents.forEach((student) => {
      map.set(student.grade, [...(map.get(student.grade) ?? []), student]);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredStudents]);

  const latestUpdate = useMemo(() => {
    if (!students.length) return null;
    return students.reduce((latest, current) => {
      return new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest;
    });
  }, [students]);

  const toggleGrade = (grade: number) => {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade],
    );
  };

  const activeFilters = useMemo(
    () => {
      const filters: { key: string; label: string; onRemove: () => void }[] = [];
      selectedGrades.forEach((grade) => {
        filters.push({
          key: `grade-${grade}`,
          label: `Grade ${grade}`,
          onRemove: () => toggleGrade(grade),
        });
      });
      if (subjectFilter !== "all") {
        const option = subjectOptions.find((entry) => entry.code === subjectFilter);
        filters.push({
          key: "subject",
          label: option ? `${option.name} (${option.phase})` : "Subject",
          onRemove: () => setSubjectFilter("all"),
        });
      }
      if (classFilter !== "all") {
        const option = classOptions.find((entry) => entry.id === classFilter);
        filters.push({
          key: "class",
          label: option ? option.name : "Class",
          onRemove: () => setClassFilter("all"),
        });
      }
      return filters;
    },
    [selectedGrades, subjectFilter, classFilter, subjectOptions, classOptions],
  );

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  const resetFilters = () => {
    setSelectedGrades([]);
    setSubjectFilter("all");
    setClassFilter("all");
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[hsl(var(--border-strong))/0.5] bg-[hsl(var(--surface-strong))/0.85] p-6 shadow-ambient-sm backdrop-blur">
        <div className="grid gap-4 md:grid-cols-3">
          <InsightCard
            icon={<Users2 className="h-4 w-4" />}
            label="Learners in roster"
            value={`${students.length}`}
            helper="Across the entire academic footprint"
          />
          <InsightCard
            icon={<GraduationCap className="h-4 w-4" />}
            label="Grade bands"
            value={`${gradeSegments.length}`}
            helper="Focused cohorts to monitor"
          />
          <InsightCard
            icon={<BookOpenCheck className="h-4 w-4" />}
            label="Subjects represented"
            value={`${subjectOptions.length}`}
            helper={
              latestUpdate
                ? `Last update ${new Date(latestUpdate.updatedAt).toLocaleDateString()}`
                : undefined
            }
          />
        </div>
      </section>

      <section className="space-y-4 rounded-[32px] border border-[hsl(var(--border-strong))/0.5] bg-[hsl(var(--surface-strong))/0.9] p-6 shadow-ambient-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or admission"
              className="pl-9"
              aria-label="Search learners"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger size="sm" className="min-w-[180px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjectOptions.map((subject) => (
                  <SelectItem key={subject.code} value={subject.code}>
                    {subject.name} · {subject.count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger size="sm" className="min-w-[180px]">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classOptions.map((classOption) => (
                  <SelectItem key={classOption.id} value={classOption.id}>
                    {classOption.name} · {classOption.count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
              <SelectTrigger size="sm" className="min-w-[160px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A–Z</SelectItem>
                <SelectItem value="grade">Grade (high to low)</SelectItem>
                <SelectItem value="recent">Recently updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex gap-2">
            <ViewToggleButton
              icon={LayoutList}
              label="Table"
              active={viewMode === "table"}
              onClick={() => setViewMode("table")}
            />
            <ViewToggleButton
              icon={PanelsTopLeft}
              label="Segments"
              active={viewMode === "segments"}
              onClick={() => setViewMode("segments")}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {gradeSegments.map((segment) => (
            <button
              key={segment.grade}
              onClick={() => toggleGrade(segment.grade)}
              className={cn(
                "flex min-w-[140px] flex-col rounded-2xl border px-4 py-2 text-left transition",
                selectedGrades.includes(segment.grade)
                  ? "border-transparent bg-[linear-gradient(120deg,#312e81,#4338ca)] text-white shadow-ambient-sm"
                  : "border-[hsl(var(--border))/0.7] bg-[hsl(var(--surface-strong))] text-foreground hover:border-[hsl(var(--accent-iris))]",
              )}
            >
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Grade {segment.grade}
              </span>
              <span className="text-lg font-semibold">{segment.count} learners</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2 border-dashed px-3 py-1 text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </Badge>
          {activeFilters.length === 0 ? (
            <p className="text-xs text-muted-foreground">Showing all learners</p>
          ) : (
            <>
              {activeFilters.map((filter) => (
                <ActiveFilterChip key={filter.key} label={filter.label} onRemove={filter.onRemove} />
              ))}
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
                Reset
              </Button>
            </>
          )}
        </div>
      </section>

      <section className="rounded-[32px] border border-[hsl(var(--border-strong))/0.45] bg-[hsl(var(--surface-strong))/0.95] p-0 shadow-ambient-sm">
        {viewMode === "table" ? (
          <div className="overflow-hidden rounded-[32px]">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[30%]">Learner</TableHead>
                  <TableHead>Admission</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class / Teacher</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer transition hover:bg-muted/40"
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Grade {student.grade} · {student.gender === "F" ? "Female" : "Male"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] px-3 py-1">
                        {student.admissionNumber}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{student.subjectName}</p>
                        <p className="text-xs text-muted-foreground">{student.subjectPhase}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{student.className}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.advisorName ? `Advisor: ${student.advisorName}` : "Advisor not assigned"}
                        </p>
                        <Link
                          href={`/classes/${student.classId}`}
                          className="text-xs text-primary underline-offset-4 hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Open class
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedStudentId(student.id);
                        }}
                      >
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredStudents.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center text-muted-foreground">
                <Users2 className="h-8 w-8" />
                <p>No learners match your filters.</p>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {groupedByGrade.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                <Users2 className="h-8 w-8" />
                <p>No cohorts to display.</p>
              </div>
            )}
            {groupedByGrade.map(([grade, learners]) => (
              <div key={grade} className="rounded-[28px] border border-[hsl(var(--border))/0.7] bg-[hsl(var(--surface-strong))/0.85] p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Grade {grade}</p>
                    <p className="text-lg font-semibold">{learners.length} learners</p>
                  </div>
                  <Badge variant="outline" className="border-dashed">
                    {learners[0]?.subjectName}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {learners.map((learner) => (
                    <button
                      key={learner.id}
                      onClick={() => setSelectedStudentId(learner.id)}
                      className="group flex items-center justify-between rounded-2xl border border-[hsl(var(--border))/0.7] bg-[hsl(var(--surface-strong))] px-4 py-3 text-left shadow-ambient-sm transition hover:-translate-y-0.5"
                    >
                      <div>
                        <p className="font-medium">
                          {learner.firstName} {learner.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {learner.className} · {learner.admissionNumber}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Sheet open={Boolean(selectedStudent)} onOpenChange={(open) => !open && setSelectedStudentId(null)}>
        <SheetContent className="w-full border-l bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-900/90 text-white shadow-[0_25px_60px_rgba(15,23,42,0.6)] sm:max-w-md">
          {selectedStudent && (
            <>
              <SheetHeader className="text-left text-white">
                <SheetTitle className="text-2xl font-semibold text-white">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </SheetTitle>
                <SheetDescription className="text-white/70">
                  Admission {selectedStudent.admissionNumber} · Grade {selectedStudent.grade}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-6 px-4 pb-8">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white/10 text-white">Class {selectedStudent.className}</Badge>
                  <Badge className="bg-white/10 text-white">{selectedStudent.subjectName}</Badge>
                  <Badge className="bg-white/10 text-white">{selectedStudent.gender === "F" ? "Female" : "Male"}</Badge>
                </div>
                <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">Quick insights</p>
                  <div className="grid gap-3">
                    <InfoRow label="Advisor" value={selectedStudent.advisorName ?? "Not assigned"} />
                    <InfoRow label="Subject focus" value={`${selectedStudent.subjectName} (${selectedStudent.subjectPhase})`} />
                    <InfoRow label="Last synced" value={new Date(selectedStudent.updatedAt).toLocaleString()} />
                  </div>
                </div>
                {selectedStudent.parents && selectedStudent.parents.length > 0 && (
                  <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-foreground">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">Family contacts</p>
                    <div className="space-y-2">
                      {selectedStudent.parents.map((parent) => (
                        <div key={parent.id} className="rounded-2xl border border-white/15 bg-black/20 p-3">
                          <p className="text-sm font-semibold text-white">
                            {parent.fullName} {parent.primary && <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">Primary</span>}
                          </p>
                          <p className="text-xs text-white/70">{parent.relationship}</p>
                          <p className="text-xs text-white/70">{parent.email ?? "Email unavailable"}</p>
                          <p className="text-xs text-white/70">{parent.phone ?? "Phone unavailable"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">Next actions</p>
                  <div className="space-y-2">
                    <QuickActionLink href={`/students/${selectedStudent.id}`} label="Open learner workspace" description="Full profile, SBA breakdown & moderation context." />
                    <QuickActionLink href={`/classes/${selectedStudent.classId}`} label="Jump to class markbook" description="Capture marks or review SBA weighting in context." />
                    <QuickActionLink href="/assessment-plans" label="Review assessment plan" description="Validate weighting, moderation and linked documents." />
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InsightCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/30 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-ambient-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-muted-foreground">
        <span className="rounded-2xl bg-secondary/60 p-2 text-primary">{icon}</span>
        {label}
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="flex items-center gap-1 rounded-full border border-[hsl(var(--border))/0.65] bg-[hsl(var(--surface-soft))] px-3 py-1 text-xs text-foreground transition hover:border-primary hover:text-primary"
    >
      {label}
      <X className="h-3 w-3" />
    </button>
  );
}

function ViewToggleButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      className={cn(active ? "bg-[linear-gradient(120deg,#312e81,#4338ca)] text-white" : "text-muted-foreground")}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/60">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function QuickActionLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm transition hover:border-white/40"
    >
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-xs text-white/70">{description}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-white/70" />
    </Link>
  );
}
