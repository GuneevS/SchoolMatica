import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CreateClassDialog } from "@/components/classes/create-class-dialog";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Classes</h1>
          <p className="text-muted-foreground">Manage grade groups and allocate subjects.</p>
        </div>
        <CreateClassDialog subjects={subjects} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Learners</TableHead>
                <TableHead>Current plan</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classGroup) => (
                <TableRow key={classGroup.id}>
                  <TableCell className="font-medium">{classGroup.name}</TableCell>
                  <TableCell>{classGroup.subject.name}</TableCell>
                  <TableCell>{classGroup._count.students}</TableCell>
                  <TableCell>{classGroup.assessmentPlans[0]?.name ?? "Not created"}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm">
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
