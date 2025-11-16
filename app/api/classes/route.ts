import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const classes = await prisma.classGroup.findMany({
    include: {
      subject: true,
      _count: {
        select: { students: true, assessmentPlans: true },
      },
      assessmentPlans: {
        take: 1,
        orderBy: { createdAt: "desc" },
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
    latestPlanStatus: classGroup.assessmentPlans[0]?.status ?? "Draft",
  }));

  return NextResponse.json(payload);
}

const classSchema = z.object({
  name: z.string().min(3),
  grade: z.number().int(),
  year: z.number().int(),
  subjectId: z.string(),
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

  const classGroup = await prisma.classGroup.create({
    data: {
      name: parsed.data.name,
      grade: parsed.data.grade,
      year: parsed.data.year,
      subjectId: subject.id,
      schoolId: subject.schoolId,
    },
    include: { subject: true },
  });

  return NextResponse.json(classGroup, { status: 201 });
}
