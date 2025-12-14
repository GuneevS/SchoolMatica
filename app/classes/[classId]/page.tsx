import { notFound } from "next/navigation";
import { getClassMarkbookPayload, type MarkbookPayload } from "@/lib/markbook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarkbookGrid } from "@/components/markbook/markbook-grid";
import { PlanSwitcher } from "@/components/markbook/plan-switcher";
import { MarkbookSummary } from "@/components/markbook/summary";
import { AddStudentDialog } from "@/components/markbook/add-student-dialog";
import { DistributionChart } from "@/components/markbook/distribution-chart";
import { HelpPanel } from "@/components/help/help-panel";
import { markbookHelp } from "@/lib/help-content";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { BookOpenCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerAuthContext } from "@/lib/auth-server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManageTeachers } from "@/components/classes/manage-teachers";
import { ManageStudents } from "@/components/classes/manage-students";
import { TimetableGrid } from "@/components/timetable/timetable-grid";

interface Props {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ planId?: string }>;
}

 export default async function ClassMarkbookPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const auth = await getServerAuthContext();
  if (!auth || !auth.permissions.has("class:read") || !auth.permissions.has("mark:read")) {
    notFound();
  }

  const classGroupMeta = await prisma.classGroup.findUnique({
    where: { id: resolvedParams.classId },
    select: { schoolId: true },
  });

  if (!classGroupMeta) {
    notFound();
  }

  if (!auth.isAdmin && !auth.schoolIds.includes(classGroupMeta.schoolId)) {
    notFound();
  }

  const schoolId = classGroupMeta.schoolId;
  
  // Parallel data fetching
  const [payload, assignments, timetable] = await Promise.all([
      getClassMarkbookPayload(resolvedParams.classId, resolvedSearchParams?.planId),
      prisma.classTeacherAssignment.findMany({
        where: { classGroupId: resolvedParams.classId },
        include: { teacher: true },
      }),
      prisma.timetable.findFirst({
        where: { 
            schoolId,
            // status: "Active" // removed status filter for now to ensure we see something
        },
        orderBy: { createdAt: "desc" },
        include: {
            periods: {
                include: {
                    slots: {
                        where: { classGroupId: resolvedParams.classId },
                        include: {
                            classGroup: { include: { subject: true } },
                            teacher: true,
                            period: true,
                            assessmentPlan: true
                        }
                    }
                }
            },
            slots: {
                where: { classGroupId: resolvedParams.classId },
                 include: {
                    classGroup: { include: { subject: true } },
                    teacher: true,
                    period: true,
                    assessmentPlan: true
                }
            }
        }
      })
  ]);

  if (!payload) {
    notFound();
  }

  const markbook = payload as MarkbookPayload;
  const students = payload.rows.map(row => row.student);
  const teacherOptions = await prisma.teacher.findMany({
    where: { schoolId },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  
  const currentPlan = markbook.assessmentPlan;
  const rosterSize = markbook.rows.length;
  const completion = markbook.stats.totalMarks === 0 ? 0 : Math.round((markbook.stats.capturedMarks / markbook.stats.totalMarks) * 100);

  return (
    <>
      <HelpPanel page="markbook" content={markbookHelp} />
      <div className="space-y-6">
        <AuroraHero
          eyebrow={`Grade ${markbook.classGroup.grade}`}
          title={
            <>
              <span className="gradient-text">{markbook.classGroup.name}</span>
            </>
          }
          description={`${markbook.classGroup.subject?.name} · ${rosterSize} learners tracked`}
          badges={currentPlan ? [
            { label: currentPlan.status, color: "hsl(var(--accent-mint))" },
            { label: `${markbook.availablePlans.length} plans available`, color: "hsl(var(--accent-cobalt))" },
          ] : []}
          actions={
            <div className="flex flex-wrap gap-2">
              {currentPlan && (
                  <PlanSwitcher plans={markbook.availablePlans} currentPlanId={currentPlan.id} />
              )}
              <AddStudentDialog
                classId={markbook.classGroup.id}
                teachers={teacherOptions.map((teacher) => ({
                  id: teacher.id,
                  name: `${teacher.firstName} ${teacher.lastName}`,
                }))}
              />
              <Button asChild variant="outline">
                <a href={`/api/classes/${markbook.classGroup.id}/export`} target="_blank">
                  Download CSV
                </a>
              </Button>
            </div>
          }
          aside={
            <HeroMetricPanel
              title="Performance pulse"
              icon={<BookOpenCheck className="h-4 w-4" />}
              metrics={[
                { label: "Average SBA", value: `${markbook.stats.averageSba.toFixed(1)}%`, helper: "classwide", accent: "highlight" },
                { label: "At-risk learners", value: markbook.stats.atRiskLearners.toString() },
                { label: "Completion", value: `${completion}%`, helper: `${markbook.stats.capturedMarks}/${markbook.stats.totalMarks} marks` },
              ]}
            />
          }
        />

        <Tabs defaultValue="markbook" className="w-full">
            <TabsList>
                <TabsTrigger value="markbook">Markbook</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="teachers">Teachers</TabsTrigger>
                <TabsTrigger value="timetable">Timetable</TabsTrigger>
            </TabsList>

            <TabsContent value="markbook" className="space-y-6">
                {!currentPlan ? (
                    <Card>
                        <CardHeader>
                        <CardTitle>No assessment plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <p className="text-muted-foreground">
                            Create an assessment plan for this class before capturing marks.
                        </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <MarkbookSummary stats={markbook.stats} plan={currentPlan} />
                        <Card>
                            <CardHeader>
                            <CardTitle>SBA distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                            <DistributionChart payload={markbook} />
                            </CardContent>
                        </Card>
                        <MarkbookGrid key={currentPlan.id} payload={markbook} />
                    </>
                )}
            </TabsContent>

            <TabsContent value="students">
                <ManageStudents 
                    classId={markbook.classGroup.id}
                    students={students}
                />
            </TabsContent>

            <TabsContent value="teachers">
                <ManageTeachers 
                    classId={markbook.classGroup.id}
                    assignments={assignments}
                    allTeachers={teacherOptions}
                />
            </TabsContent>

            <TabsContent value="timetable">
                 {timetable ? (
                     <TimetableGrid timetable={timetable} />
                 ) : (
                     <Card>
                         <CardHeader><CardTitle>No Timetable</CardTitle></CardHeader>
                         <CardContent>
                             <p className="text-muted-foreground">No active timetable found for this school year.</p>
                         </CardContent>
                     </Card>
                 )}
            </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
