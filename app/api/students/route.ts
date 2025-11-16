import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  const students = await prisma.student.findMany({
    where: classId ? { classGroupId: classId } : undefined,
    include: { classGroup: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return NextResponse.json(students);
}

const studentSchema = z.object({
  classGroupId: z.string(),
  admissionNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = studentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const classGroup = await prisma.classGroup.findUnique({ where: { id: parsed.data.classGroupId } });
  if (!classGroup) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  const student = await prisma.student.create({
    data: {
      classGroupId: parsed.data.classGroupId,
      admissionNumber: parsed.data.admissionNumber,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      gender: parsed.data.gender ?? "",
    },
  });

  return NextResponse.json(student, { status: 201 });
}
