import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  teacherId: z.string(),
  subjectId: z.string(),
  grade: z.number().int().optional(),
});

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const assignment = await prisma.teacherSubjectAssignment.create({
    data: parsed.data,
    include: { subject: true },
  });

  return NextResponse.json(assignment, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId");
  if (!assignmentId) {
    return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
  }
  await prisma.teacherSubjectAssignment.delete({ where: { id: assignmentId } });
  return NextResponse.json({ success: true });
}

