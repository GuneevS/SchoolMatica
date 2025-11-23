import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
  const bands = getBandsForPhase(student.classGroup.school?.gradingConfig ?? null, student.classGroup.subject?.phase ?? "FET");
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

const updateSchema = z.object({
  admissionNumber: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  gender: z.string().optional(),
  advisorTeacherId: z.string().optional(),
  classGroupId: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const json = await request.json();
  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const student = await prisma.student.update({
      where: { id: studentId },
      data: parsed.data,
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error("Failed to update student", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;

  try {
    // Transaction to ensure clean cleanup
    await prisma.$transaction(async (tx) => {
        // Delete marks
        await tx.mark.deleteMany({ where: { studentId } });
        
        // Delete snapshots
        await tx.markSnapshot.deleteMany({ where: { studentId } });

        // Delete parent contacts
        await tx.parentContact.deleteMany({ where: { studentId } });

        // Delete learner registrations
        await tx.learnerRegistration.deleteMany({ where: { studentId } });

        // Finally delete student
        await tx.student.delete({ where: { id: studentId } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete student error:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
