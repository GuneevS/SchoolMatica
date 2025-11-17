import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  teacherId: z.string(),
  classGroupId: z.string(),
  role: z.string().optional(),
  subjectId: z.string().optional(),
  primary: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const assignment = await prisma.classTeacherAssignment.create({
    data: {
      teacherId: parsed.data.teacherId,
      classGroupId: parsed.data.classGroupId,
      role: parsed.data.role ?? "Support",
      subjectId: parsed.data.subjectId,
    },
    include: { classGroup: true, teacher: true },
  });

  if (parsed.data.primary) {
    await prisma.classGroup.update({
      where: { id: parsed.data.classGroupId },
      data: { primaryTeacherId: parsed.data.teacherId },
    });
  }

  return NextResponse.json(assignment, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId");
  if (!assignmentId) {
    return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
  }
  await prisma.classTeacherAssignment.delete({ where: { id: assignmentId } });
  return NextResponse.json({ success: true });
}

