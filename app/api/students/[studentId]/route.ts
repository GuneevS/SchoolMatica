import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateStudentSba, calculateTermPercentages, getBandsForPhase, mapPercentToLevel } from "@/lib/calculations";

interface Params {
  params: Promise<{ studentId: string }>;
}

export async function GET(_: Request, { params }: Params) {
  const { studentId } = await params;
  const student = await prisma.student.findUnique({
    where: { id: studentId },
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
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const plan = student.classGroup.assessmentPlans[0];
  const assessments = plan?.assessments ?? [];
  const bands = getBandsForPhase(student.classGroup.school?.gradingConfig ?? null, student.classGroup.subject.phase);
  const sba = calculateStudentSba({ assessments, studentId: student.id });
  const terms = calculateTermPercentages({ assessments, studentId: student.id });
  const level = mapPercentToLevel(sba.sbaPercent, bands);

  return NextResponse.json({
    student,
    assessmentPlan: plan,
    stats: {
      sbaPercent: sba.sbaPercent,
      componentBreakdown: sba.componentBreakdown,
      level,
      termPercents: terms,
    },
  });
}
