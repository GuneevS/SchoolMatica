import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  calculateStudentSba,
  calculateTermPercentages,
  getBandsForPhase,
  mapPercentToLevel,
} from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Force dynamic rendering - requires database
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ studentId: string }>;
}

export default async function StudentDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const student = await prisma.student.findUnique({
    where: { id: resolvedParams.studentId },
    include: {
      classGroup: {
        include: {
          subject: true,
          school: { include: { gradingConfig: true } },
          assessmentPlans: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { assessments: { include: { marks: true }, orderBy: { sequence: "asc" } } },
          },
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const plan = student.classGroup.assessmentPlans[0];
  const assessments = plan?.assessments ?? [];
  const bands = getBandsForPhase(student.classGroup.school?.gradingConfig ?? null, student.classGroup.subject?.phase ?? "FET");
  const sba = calculateStudentSba({ assessments, studentId: student.id });
  const terms = calculateTermPercentages({ assessments, studentId: student.id });
  const level = mapPercentToLevel(sba.sbaPercent, bands);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {student.firstName} {student.lastName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{student.classGroup.name}</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Stat label="SBA %" value={`${sba.sbaPercent.toFixed(1)}%`} />
          <Stat label="Level" value={`${level.level} · ${level.descriptor}`} />
          <Stat label="Admission" value={student.admissionNumber} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Mark</TableHead>
                <TableHead>Contribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((assessment) => {
                const mark = assessment.marks.find((m) => m.studentId === student.id);
                return (
                  <TableRow key={assessment.id}>
                    <TableCell>{assessment.taskName}</TableCell>
                    <TableCell>{assessment.term}</TableCell>
                    <TableCell>
                      {mark?.isAbsent ? "Absent" : `${mark?.rawMark ?? "-"}/${assessment.totalMark}`}
                    </TableCell>
                    <TableCell>{assessment.weightPercent.toFixed(1)}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Term performance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          {(["T1", "T2", "T3", "T4"] as const).map((term) => (
            <Stat key={term} label={term} value={`${(terms[term] ?? 0).toFixed(1)}%`} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
