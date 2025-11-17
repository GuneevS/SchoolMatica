import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CreateClassDialog } from "@/components/classes/create-class-dialog";
import { AuroraHero, HeroMetricPanel } from "@/components/layout/aurora-hero";
import { Users } from "lucide-react";

export default async function ClassesPage() {
  const [classes, subjects] = await Promise.all([
    prisma.classGroup.findMany({
      include: {
        subject: true,
        _count: { select: { students: true } },
        assessmentPlans: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: [{ grade: "asc" }, { name: "asc" }],
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalLearners = classes.reduce((sum, classGroup) => sum + classGroup._count.students, 0);
  const configuredPlans = classes.filter((classGroup) => classGroup.assessmentPlans.length > 0).length;
  const averageRoster = classes.length === 0 ? 0 : Math.round(totalLearners / classes.length);

  return (
    <div className="space-y-8">
      <AuroraHero
        eyebrow="Workspace"
        title={
          <>
            <span className="gradient-text">Classes</span> overview
          </>
        }
        description="Align grade groups with subjects, confirm learner counts, and jump straight into the markbook with a single click."
        badges={[
          { label: `${classes.length} active classes`, color: "hsl(var(--accent-iris))" },
          { label: `${subjects.length} subjects`, color: "hsl(var(--accent-mint))" },
          { label: `${configuredPlans} plans configured`, color: "hsl(var(--accent-gold))" },
        ]}
        actions={<CreateClassDialog subjects={subjects} />}
        aside={
          <HeroMetricPanel
            title="Roster insights"
            icon={<Users className="h-4 w-4" />}
            metrics={[
              { label: "Average roster", value: `${averageRoster} learners`, helper: "per class", accent: "highlight" },
              { label: "Learners tracked", value: totalLearners.toString() },
              { label: "Plans ready", value: configuredPlans.toString(), helper: "classes with plans" },
            ]}
          />
        }
      />

      <Card className="rounded-[28px] border border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))] shadow-ambient">
        <CardHeader className="border-b border-[hsl(var(--border))/0.6] pb-4">
          <CardTitle>Class inventory</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Learners</TableHead>
                <TableHead>Current plan</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classGroup) => (
                <TableRow key={classGroup.id} className="last:border-b-0">
                  <TableCell className="font-semibold">{classGroup.name}</TableCell>
                  <TableCell className="text-muted-foreground">{classGroup.subject.name}</TableCell>
                  <TableCell>{classGroup._count.students}</TableCell>
                  <TableCell>{classGroup.assessmentPlans[0]?.name ?? "Not created"}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/classes/${classGroup.id}`}>Open markbook</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
