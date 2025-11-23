import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnifiedAssessmentWorkspace } from "@/components/plans/unified-assessment-workspace";
import { ModerationPanel } from "@/components/plans/moderation-panel";
import { PlanDocuments } from "@/components/plans/plan-documents";
import { formatDateReadable } from "@/lib/date-utils";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { ClipboardList } from "lucide-react";
import { calculateAssessmentWeightInsights, type TermWeights } from "@/lib/calculations";

interface Props {
  params: Promise<{ planId: string }>;
}

export default async function PlanDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const plan = await prisma.assessmentPlan.findUnique({
    where: { id: resolvedParams.planId },
    include: {
      classGroup: { include: { subject: true } },
      assessments: { orderBy: { sequence: "asc" } },
      template: true,
      documents: {
        include: { approvals: { orderBy: { createdAt: "desc" } } },
        orderBy: { uploadedAt: "desc" },
      },
      moderationThreads: {
        include: { comments: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  if (!plan) {
    notFound();
  }

  const termWeights = plan.termWeights as TermWeights | null;
  const weightInsights = plan.assessments.length
    ? calculateAssessmentWeightInsights({ assessments: plan.assessments, termWeights })
    : null;

  return (
    <div className="space-y-6">
      <AuroraHero
        eyebrow="Assessment Plan"
        title={<span className="gradient-text">{plan.name}</span>}
        description={`${plan.classGroup.name}${plan.classGroup.subject ? ` · ${plan.classGroup.subject.name}` : ""}`}
        badges={[
          { label: plan.status, color: "hsl(var(--accent-mint))" },
          ...(plan.template ? [{ label: plan.template.name, color: "hsl(var(--accent-gold))" }] : []),
        ]}
        aside={
          <HeroMetricPanel
            title="Plan Overview"
            icon={<ClipboardList className="h-4 w-4" />}
            metrics={[
              { label: "Assessments", value: plan.assessments.length.toString(), helper: `${plan.termCount} terms`, accent: "highlight" },
              { label: "Documents", value: plan.documents.length.toString() },
              { label: "Moderation", value: plan.moderationThreads.length.toString() },
            ]}
          />
        }
      />

      <UnifiedAssessmentWorkspace
        key={plan.updatedAt.toISOString()}
        plan={plan}
        termWeights={termWeights}
        weightInsights={weightInsights ?? undefined}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <PlanDocuments planId={plan.id} documents={plan.documents} />
        <ModerationPanel planId={plan.id} threads={plan.moderationThreads} />
      </div>
    </div>
  );
}
