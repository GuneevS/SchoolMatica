import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanEditor } from "@/components/plans/plan-editor";
import { ModerationPanel } from "@/components/plans/moderation-panel";
import { WeightChart } from "@/components/plans/weight-chart";
import { PlanDocuments } from "@/components/plans/plan-documents";

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

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{plan.name}</h1>
          <p className="text-muted-foreground">
            {plan.classGroup.name} · {plan.classGroup.subject.name}
          </p>
        </div>
        <PlanEditor key={plan.updatedAt.toISOString()} plan={plan} threads={plan.moderationThreads} />
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
              <p className="text-xs text-muted-foreground">Submitted {plan.submittedAt.toLocaleDateString()}</p>
            )}
            {plan.approvedAt && (
              <p className="text-xs text-muted-foreground">Approved {plan.approvedAt.toLocaleDateString()}</p>
            )}
            {plan.lockedAt && (
              <p className="text-xs text-muted-foreground">Locked {plan.lockedAt.toLocaleDateString()}</p>
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
