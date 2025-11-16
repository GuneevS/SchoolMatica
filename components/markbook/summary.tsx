import type { MarkbookPayload, MarkbookStats } from "@/lib/markbook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  stats: MarkbookStats;
  plan: NonNullable<MarkbookPayload["assessmentPlan"]>;
}

export function MarkbookSummary({ stats, plan }: Props) {
  const totalAssessments = plan.assessments?.length ?? 0;
  const completion = stats.totalMarks === 0 ? 0 : (stats.capturedMarks / stats.totalMarks) * 100;
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <SummaryCard label="Assessments" value={totalAssessments} helper={`${plan.termCount} terms`} />
      <SummaryCard label="Captured marks" value={`${stats.capturedMarks}/${stats.totalMarks}`} helper={`${completion.toFixed(1)}% complete`} />
      <SummaryCard label="Average SBA" value={`${stats.averageSba.toFixed(1)}%`} helper="Across class" />
      <SummaryCard label="At-risk learners" value={stats.atRiskLearners.toString()} helper="Below 40%" />
      <SummaryCard label="Average PAT" value={`${stats.averagePat.toFixed(1)}%`} helper="Practical components" />
    </div>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: string | number; helper: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
