import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CreatePlanDialog } from "@/components/plans/create-plan-dialog";
import { HelpPanel } from "@/components/help/help-panel";
import { assessmentPlansHelp } from "@/lib/help-content";

export default async function AssessmentPlansPage() {
  const [plans, classes, templates] = await Promise.all([
    prisma.assessmentPlan.findMany({
      include: {
        classGroup: { include: { subject: true } },
        _count: { select: { assessments: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.classGroup.findMany({
      include: { subject: true },
      orderBy: { name: "asc" },
    }),
    prisma.curriculumTemplate.findMany({
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <>
      <HelpPanel page="assessment-plans" content={assessmentPlansHelp} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assessment plans</h1>
          <p className="text-muted-foreground">Configure weighting per class and subject.</p>
        </div>
        <CreatePlanDialog
          classes={classes.map((item) => ({ id: item.id, name: `${item.name} · ${item.subject.name}` }))}
          templates={templates.map((template) => ({
            id: template.id,
            name: template.name,
            grade: template.grade,
            subjectName: template.subjectName,
          }))}
        />
      </div>
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
