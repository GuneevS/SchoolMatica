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
import { getActiveSchool } from "@/lib/school";

interface Props {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ planId?: string }>;
}

export default async function ClassMarkbookPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const payload = await getClassMarkbookPayload(resolvedParams.classId, resolvedSearchParams?.planId);
  if (!payload) {
    notFound();
  }
  if (!payload.assessmentPlan) {
    return (
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
    );
  }

  const markbook = payload as MarkbookPayload;
  const school = await getActiveSchool();
  const teacherOptions = school
    ? await prisma.teacher.findMany({
        where: { schoolId: school.id },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      })
    : [];
  const currentPlan = markbook.assessmentPlan!;
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
              <span className="gradient-text">{markbook.classGroup.name}</span> markbook
            </>
          }
          description={`${markbook.classGroup.subject.name} · ${rosterSize} learners tracked`}
          badges={[
            { label: currentPlan.status, color: "hsl(var(--accent-mint))" },
            { label: `${markbook.availablePlans.length} plans available`, color: "hsl(var(--accent-cobalt))" },
          ]}
          actions={
            <div className="flex flex-wrap gap-2">
              <PlanSwitcher plans={markbook.availablePlans} currentPlanId={currentPlan.id} />
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
    </div>
    </>
  );
}
