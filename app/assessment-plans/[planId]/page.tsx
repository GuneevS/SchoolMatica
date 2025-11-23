import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanEditorGrouped } from "@/components/plans/plan-editor-grouped";
import { ModerationPanel } from "@/components/plans/moderation-panel";
import { WeightChart } from "@/components/plans/weight-chart";
import { PlanDocuments } from "@/components/plans/plan-documents";
import { TermWeightConfig } from "@/components/plans/term-weight-config";
import { WeightAdjusterPanel } from "@/components/plans/weight-adjuster-panel";
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
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <AuroraHero
          eyebrow="Assessment plan"
          title={
            <>
              <span className="gradient-text">{plan.name}</span>
            </>
          }
          description={`${plan.classGroup.name}${plan.classGroup.subject ? ` · ${plan.classGroup.subject.name}` : ""}`}
          badges={[
            { label: plan.status, color: "hsl(var(--accent-mint))" },
            ...(plan.template ? [{ label: plan.template.name, color: "hsl(var(--accent-gold))" }] : []),
          ]}
          aside={
            <HeroMetricPanel
              title="Plan makeup"
              icon={<ClipboardList className="h-4 w-4" />}
              metrics={[
                { label: "Assessments", value: plan.assessments.length.toString(), helper: `${plan.termCount} terms`, accent: "highlight" },
                { label: "Moderation threads", value: plan.moderationThreads.length.toString() },
                { label: "Documents", value: plan.documents.length.toString() },
                { label: "Term weights", value: termWeights ? Object.keys(termWeights).length.toString() : "0" },
              ]}
            />
          }
        />
        <PlanEditorGrouped
          key={plan.updatedAt.toISOString()}
          plan={plan}
          threads={plan.moderationThreads}
          weightInsights={weightInsights ?? undefined}
        />
        <TermWeightConfig
          termCount={plan.termCount}
          initialWeights={termWeights || undefined}
          onSave={async (weights) => {
            "use server";
            const { revalidatePath } = await import("next/cache");
            await prisma.assessmentPlan.update({
              where: { id: plan.id },
              data: { termWeights: weights },
            });
            // Revalidate both this page and dashboard
            revalidatePath(`/assessment-plans/${plan.id}`);
            revalidatePath("/dashboard");
          }}
        />
        <WeightAdjusterPanel planId={plan.id} assessments={plan.assessments} />
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Plan metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge variant={plan.status === "Locked" ? "default" : "secondary"}>{plan.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Terms</span>
              <span>{plan.termCount}</span>
            </div>
            {plan.template && (
              <div className="flex items-center justify-between">
                <span>Template</span>
                <span className="text-right">{plan.template.name}</span>
              </div>
            )}
            {plan.termWeights && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Term weights</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(plan.termWeights as Record<string, number>).map(([term, weight]) => (
                    <Badge key={term} variant="outline">
                      {term}: {weight}%
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {plan.submittedAt && (
              <p className="text-xs text-muted-foreground">Submitted {formatDateReadable(plan.submittedAt)}</p>
            )}
            {plan.approvedAt && (
              <p className="text-xs text-muted-foreground">Approved {formatDateReadable(plan.approvedAt)}</p>
            )}
            {plan.lockedAt && (
              <p className="text-xs text-muted-foreground">Locked {formatDateReadable(plan.lockedAt)}</p>
            )}
          </CardContent>
        </Card>
        <PlanDocuments planId={plan.id} documents={plan.documents} />
        <WeightChart assessments={plan.assessments} />
        <ModerationPanel planId={plan.id} threads={plan.moderationThreads} />
      </div>
    </div>
  );
}
