import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreatePlanDialog } from "@/components/plans/create-plan-dialog";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { ClipboardList } from "lucide-react";
import { HelpPanel } from "@/components/help/help-panel";
import { assessmentPlansHelp } from "@/lib/help-content";
import { getAuthorizedActiveSchool, getServerAuthContext } from "@/lib/auth-server";
import { StatusBadge } from "@/components/ui/status-badge";

// Force dynamic rendering - requires auth and database
export const dynamic = "force-dynamic";

export default async function AssessmentPlansPage() {
  const [auth, school] = await Promise.all([
    getServerAuthContext(),
    getAuthorizedActiveSchool(),
  ]);

  if (!auth) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>Please sign in to access assessment plans.</p>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        <p>No accessible schools found. Select or create a school to continue.</p>
      </div>
    );
  }

  const [plans, classes, templates] = await Promise.all([
    prisma.assessmentPlan.findMany({
      where: { classGroup: { schoolId: school.id } },
      include: {
        classGroup: { include: { subject: true } },
        _count: { select: { assessments: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.classGroup.findMany({
      where: { schoolId: school.id },
      include: { subject: true },
      orderBy: { name: "asc" },
    }),
    prisma.curriculumTemplate.findMany({
      where: { OR: [{ schoolId: school.id }, { schoolId: null }] },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
  ]);

  const planStatusCounts: Record<string, number> = {};
  plans.forEach((plan) => {
    planStatusCounts[plan.status] = (planStatusCounts[plan.status] ?? 0) + 1;
  });
  const pendingApproval = (planStatusCounts.Submitted ?? 0) + (planStatusCounts.InReview ?? 0);
  const lockedPlans = planStatusCounts.Locked ?? 0;
  const totalAssessments = plans.reduce((sum, plan) => sum + plan._count.assessments, 0);

  return (
    <>
      <HelpPanel page="assessment-plans" content={assessmentPlansHelp} />
      <div className="space-y-6">
        <AuroraHero
          eyebrow="Workflow"
          title={
            <>
              <span className="gradient-text">Assessment plans</span>
            </>
          }
          description="Configure weighting per class and subject, keep templates aligned, and lock plans with full moderation context."
          badges={[
            { label: `${classes.length} classes covered`, color: "hsl(var(--accent-iris))" },
            { label: `${templates.length} templates ready`, color: "hsl(var(--accent-mint))" },
          ]}
          actions={
            <CreatePlanDialog
              classes={classes.map((item) => ({ id: item.id, name: `${item.name} · ${item.subject?.name ?? "No Subject"}` }))}
              templates={templates.map((template) => ({
                id: template.id,
                name: template.name,
                grade: template.grade,
                subjectName: template.subjectName,
              }))}
            />
          }
          aside={
            <HeroMetricPanel
              title="Plan status"
              icon={<ClipboardList className="h-4 w-4" />}
              metrics={[
                { label: "Active", value: plans.length.toString(), helper: `${lockedPlans} locked`, accent: "highlight" },
                { label: "Pending review", value: pendingApproval.toString() },
                { label: "Drafts", value: (planStatusCounts.Draft ?? 0).toString() },
                { label: "Assessments tracked", value: totalAssessments.toString() },
              ]}
            />
          }
        />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Plans</h2>
            <p className="text-sm text-muted-foreground">{plans.length} total</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 stagger-grid">
            {plans.map((plan) => (
              <Card key={plan.id} className="rounded-[24px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient-sm">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {plan.classGroup.name} · {plan.classGroup.subject?.name ?? "No subject"}
                      </p>
                    </div>
                    <StatusBadge status={plan.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{plan._count.assessments} assessments</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                    <span>{plan.year}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Last updated {plan.updatedAt.toLocaleDateString()}</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/assessment-plans/${plan.id}`}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
            {plans.length === 0 && (
              <Card className="rounded-[24px] border border-dashed border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-strong))] p-6 text-center text-sm text-muted-foreground">
                No assessment plans yet. Create one to get started.
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
