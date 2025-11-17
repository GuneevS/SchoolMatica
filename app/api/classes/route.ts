import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId") ?? undefined;
  const classes = await prisma.classGroup.findMany({
    where: schoolId ? { schoolId } : undefined,
    include: {
      subject: true,
      _count: {
        select: { students: true, assessmentPlans: true },
      },
      assessmentPlans: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      primaryTeacher: true,
      teacherAssignments: {
        include: { teacher: true },
      },
    },
    orderBy: [{ grade: "asc" }, { name: "asc" }],
  });

  const payload = classes.map((classGroup) => ({
    id: classGroup.id,
    name: classGroup.name,
    grade: classGroup.grade,
    year: classGroup.year,
    subject: classGroup.subject,
    stats: classGroup._count,
    primaryTeacher: classGroup.primaryTeacher,
    latestPlanStatus: classGroup.assessmentPlans[0]?.status ?? "Draft",
  }));

  return NextResponse.json(payload);
}

const classSchema = z.object({
  name: z.string().min(3),
  grade: z.number().int(),
  year: z.number().int(),
  subjectId: z.string(),
  gradeLevelId: z.string().optional(),
  primaryTeacherId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = classSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const subject = await prisma.subject.findUnique({ where: { id: parsed.data.subjectId } });
  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  if (parsed.data.gradeLevelId) {
    const gradeLevelExists = await prisma.gradeLevel.findFirst({
      where: { id: parsed.data.gradeLevelId, schoolId: subject.schoolId },
    });
    if (!gradeLevelExists) {
      return NextResponse.json({ error: "Grade level not found for this school" }, { status: 404 });
    }
  }

  if (parsed.data.primaryTeacherId) {
    const teacherExists = await prisma.teacher.findFirst({
      where: { id: parsed.data.primaryTeacherId, schoolId: subject.schoolId },
    });
    if (!teacherExists) {
      return NextResponse.json({ error: "Teacher not found for this school" }, { status: 404 });
    }
  }

  const classGroup = await prisma.classGroup.create({
    data: {
      name: parsed.data.name,
      grade: parsed.data.grade,
      year: parsed.data.year,
      subjectId: subject.id,
      schoolId: subject.schoolId,
      gradeLevelId: parsed.data.gradeLevelId,
      primaryTeacherId: parsed.data.primaryTeacherId,
      teacherAssignments: parsed.data.primaryTeacherId
        ? {
            create: {
              teacherId: parsed.data.primaryTeacherId,
              role: "Lead",
              subjectId: subject.id,
            },
          }
        : undefined,
    },
    include: { subject: true },
  });

  return NextResponse.json(classGroup, { status: 201 });
}
