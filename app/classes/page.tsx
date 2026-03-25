import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateClassDialog } from "@/components/classes/create-class-dialog";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { Users, Home, BookOpen } from "lucide-react";
import { getAuthorizedActiveSchool, getServerAuthContext } from "@/lib/auth-server";
import { AssignTeacherDialog } from "@/components/classes/assign-teacher-dialog";
import { StatusBadge } from "@/components/ui/status-badge";

// Force dynamic rendering - requires auth and database
export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const [auth, school] = await Promise.all([
    getServerAuthContext(),
    getAuthorizedActiveSchool(),
  ]);

  if (!auth) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Please sign in to access classes.</p>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>No schools found. Create one from the Schools workspace to get started.</p>
      </div>
    );
  }
  const [classes, subjects, teachers, grades] = await Promise.all([
    prisma.classGroup.findMany({
      where: { schoolId: school.id },
      include: {
        subject: true,
        primaryTeacher: true,
        teacherAssignments: {
          include: { teacher: true, subject: true },
        },
        _count: { select: { students: true, assessmentPlans: true } },
        assessmentPlans: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
    prisma.subject.findMany({ where: { schoolId: school.id }, orderBy: { name: "asc" } }),
    prisma.teacher.findMany({
      where: { schoolId: school.id },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.gradeLevel.findMany({ where: { schoolId: school.id }, orderBy: { order: "asc" } }),
  ]);

  const totalLearners = classes.reduce((sum, classGroup) => sum + classGroup._count.students, 0);
  const configuredPlans = classes.filter((classGroup) => classGroup.assessmentPlans.length > 0).length;
  const averageRoster = classes.length === 0 ? 0 : Math.round(totalLearners / classes.length);

  const teacherOptions = teachers.map((teacher) => ({
    id: teacher.id,
    name: `${teacher.firstName} ${teacher.lastName}`,
  }));
  const gradeOptions = grades.map((grade) => ({ id: grade.id, name: grade.name }));

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Workspace"
        title={
          <>
            <span className="gradient-text">Classes</span> overview
          </>
        }
        description={`Align grade groups with subjects, confirm learner counts, and keep ${school.name}'s classes synced to moderation.`}
        badges={[
          { label: `${classes.length} active classes`, color: "hsl(var(--accent-iris))" },
          { label: `${subjects.length} subjects`, color: "hsl(var(--accent-mint))" },
          { label: `${configuredPlans} plans configured`, color: "hsl(var(--accent-gold))" },
        ]}
        actions={<CreateClassDialog subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name }))} teachers={teacherOptions} grades={gradeOptions} />}
        aside={
          <HeroMetricPanel
            title="Roster insights"
            icon={<Users className="h-4 w-4" />}
            metrics={[
              { label: "Average roster", value: `${averageRoster} learners`, helper: "per class", accent: "highlight" },
              { label: "Learners tracked", value: totalLearners.toString() },
              { label: "Plans ready", value: configuredPlans.toString(), helper: "classes with plans" },
            ]}
          />
        }
      />

      <div className="grid gap-6 md:grid-cols-2 stagger-grid">
        {classes.map((classGroup) => {
          const planStatus = classGroup.assessmentPlans[0]?.status ?? "Draft";
          return (
          <Card key={classGroup.id} className="surface-panel rounded-[24px] border border-[hsl(var(--border-strong))/0.5] shadow-ambient">
            <CardHeader className="border-b border-[hsl(var(--border))/0.5] pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground/70">Grade {classGroup.grade}</p>
                    <Badge variant={classGroup.classType === "Homeroom" ? "secondary" : "outline"} className="text-[10px] h-5">
                      {classGroup.classType === "Homeroom" ? (
                        <><Home className="h-3 w-3 mr-1" />Homeroom</>
                      ) : (
                        <><BookOpen className="h-3 w-3 mr-1" />Subject</>
                      )}
                    </Badge>
                  </div>
                  <CardTitle className="mt-1 text-2xl">{classGroup.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {classGroup.classType === "Homeroom" 
                      ? "All subjects" 
                      : classGroup.subject?.name ?? "No Subject"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={planStatus} />
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/classes/${classGroup.id}`}>Open</Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-2xl border border-[hsl(var(--border))/0.4] bg-white/5 p-3 text-center dark:bg-white/5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Learners</p>
                  <p className="text-2xl font-semibold text-foreground">{classGroup._count.students}</p>
                </div>
                <div className="rounded-2xl border border-[hsl(var(--border))/0.4] bg-white/5 p-3 text-center dark:bg-white/5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan status</p>
                  <p className="text-2xl font-semibold text-foreground">{planStatus}</p>
                </div>
                <div className="rounded-2xl border border-[hsl(var(--border))/0.4] bg-white/5 p-3 text-center dark:bg-white/5">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Teachers</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {classGroup.teacherAssignments.length || (classGroup.primaryTeacher ? 1 : 0)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[hsl(var(--border))/0.4] bg-white/5 p-4 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/80 mb-1">Primary teacher</p>
                {classGroup.primaryTeacher ? (
                  <p className="font-semibold text-foreground">
                    {classGroup.primaryTeacher.firstName} {classGroup.primaryTeacher.lastName}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No lead assigned</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {classGroup.teacherAssignments.map((assignment) => (
                    <span key={assignment.id} className="rounded-full border border-[hsl(var(--border))/0.4] px-3 py-1 text-xs text-muted-foreground bg-white/10">
                      {assignment.teacher.firstName} {assignment.teacher.lastName} · {assignment.role}{assignment.subject ? ` · ${assignment.subject.name}` : ""}
                    </span>
                  ))}
                  {classGroup.teacherAssignments.length === 0 && (
                    <span className="text-xs text-muted-foreground">No additional teachers assigned.</span>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <AssignTeacherDialog classId={classGroup.id} subjectId={classGroup.subjectId ?? undefined} teachers={teacherOptions} triggerLabel="Assign teacher" />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/classes/${classGroup.id}`}>Manage class</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>
    </div>
  );
}
