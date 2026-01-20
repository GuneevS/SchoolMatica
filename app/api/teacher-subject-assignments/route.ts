import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

const schema = z.object({
  teacherId: z.string(),
  subjectId: z.string(),
  grade: z.number().int().optional(),
});

export async function POST(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "teacher:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: parsed.data.teacherId },
    select: { schoolId: true },
  });
  const subject = await prisma.subject.findUnique({
    where: { id: parsed.data.subjectId },
    select: { schoolId: true },
  });

  if (!teacher || !subject) {
    return NextResponse.json({ error: "Teacher or subject not found" }, { status: 404 });
  }
  if (teacher.schoolId !== subject.schoolId || !hasSchoolAccess(auth, teacher.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const assignment = await prisma.teacherSubjectAssignment.create({
    data: parsed.data,
    include: { subject: true },
  });

  return NextResponse.json(assignment, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "teacher:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId");
  if (!assignmentId) {
    return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
  }

  const assignment = await prisma.teacherSubjectAssignment.findUnique({
    where: { id: assignmentId },
    include: { teacher: true, subject: true },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
  const schoolId = assignment.teacher.schoolId;
  if (!hasSchoolAccess(auth, schoolId) || assignment.subject.schoolId !== schoolId) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  await prisma.teacherSubjectAssignment.delete({ where: { id: assignmentId } });
  return NextResponse.json({ success: true });
}

