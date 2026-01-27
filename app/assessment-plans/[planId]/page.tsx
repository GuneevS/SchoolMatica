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
import { getServerAuthContext, hasServerSchoolAccess } from "@/lib/auth-server";

// Force dynamic rendering - requires auth and database
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ planId: string }>;
}

export default async function PlanDetailPage({ params }: Props) {
  const resolvedParams = await params;

  const auth = await getServerAuthContext();
  if (!auth) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Please sign in to view this assessment plan.</p>
      </div>
    );
  }

  const plan = await prisma.assessmentPlan.findUnique({
    where: { id: resolvedParams.planId },
    include: {
      classGroup: { include: { subject: true, school: true } },
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

  if (!(await hasServerSchoolAccess(plan.classGroup.schoolId))) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Access denied to this school.</p>
      </div>
    );
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
        {/* Approval History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Approval History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.createdAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                    <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium">Plan Created</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateReadable(plan.createdAt)}
                    </p>
                  </div>
                </div>
              )}
              
              {plan.submittedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium">Submitted for Approval</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateReadable(plan.submittedAt)}
                      {plan.submittedByRole && ` • by ${plan.submittedByRole}`}
                    </p>
                  </div>
                </div>
              )}
              
              {plan.approvedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium">Approved</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateReadable(plan.approvedAt)}
                      {plan.approvedByRole && ` • by ${plan.approvedByRole}`}
                    </p>
                  </div>
                </div>
              )}
              
              {plan.lockedAt && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Locked</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateReadable(plan.lockedAt)} • Plan finalized
                    </p>
                  </div>
                </div>
              )}
              
              {!plan.submittedAt && plan.status === "Draft" && (
                <p className="text-sm text-muted-foreground italic">
                  Not yet submitted for approval
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <PlanDocuments planId={plan.id} documents={plan.documents} />
        <ModerationPanel planId={plan.id} threads={plan.moderationThreads} />
      </div>
    </div>
  );
}
