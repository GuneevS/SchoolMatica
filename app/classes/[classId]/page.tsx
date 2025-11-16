import { notFound } from "next/navigation";
import { getClassMarkbookPayload, type MarkbookPayload } from "@/lib/markbook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkbookGrid } from "@/components/markbook/markbook-grid";
import { PlanSwitcher } from "@/components/markbook/plan-switcher";
import { MarkbookSummary } from "@/components/markbook/summary";
import { AddStudentDialog } from "@/components/markbook/add-student-dialog";
import { DistributionChart } from "@/components/markbook/distribution-chart";
import { HelpPanel } from "@/components/help/help-panel";
import { markbookHelp } from "@/lib/help-content";

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
  const currentPlan = markbook.assessmentPlan!;

  return (
    <>
      <HelpPanel page="markbook" content={markbookHelp} />
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{markbook.classGroup.name}</h1>
          <p className="text-muted-foreground">
            {markbook.classGroup.subject.name} · {currentPlan.status}
          </p>
        </div>
        <div className="flex gap-2">
          <PlanSwitcher plans={markbook.availablePlans} currentPlanId={currentPlan.id} />
          <AddStudentDialog classId={markbook.classGroup.id} />
          <a
            href={`/api/classes/${markbook.classGroup.id}/export`}
            target="_blank"
            className="inline-flex items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm"
          >
            Download CSV
          </a>
        </div>
      </div>
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
