import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CreatePlanDialog } from "@/components/plans/create-plan-dialog";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { ClipboardList } from "lucide-react";
import { HelpPanel } from "@/components/help/help-panel";
import { assessmentPlansHelp } from "@/lib/help-content";
import { getAuthorizedActiveSchool, getServerAuthContext } from "@/lib/auth-server";

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
        <Card>
          <CardHeader>
            <CardTitle>Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assessments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{plan.classGroup.name}</TableCell>
                    <TableCell>{plan.status}</TableCell>
                    <TableCell>{plan._count.assessments}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/assessment-plans/${plan.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
