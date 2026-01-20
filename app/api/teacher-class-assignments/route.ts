import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

const createSchema = z.object({
  teacherId: z.string(),
  classGroupId: z.string(),
  role: z.string().optional(),
  subjectId: z.string().optional(),
  primary: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "class:manage");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const payload = await request.json();
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: parsed.data.classGroupId },
    select: { schoolId: true },
  });
  if (!classGroup) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  if (!hasSchoolAccess(auth, classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: parsed.data.teacherId },
    select: { schoolId: true },
  });
  if (!teacher || teacher.schoolId !== classGroup.schoolId) {
    return NextResponse.json({ error: "Teacher not found in this school" }, { status: 400 });
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
  const authResult = await authorizeWithSchool(request, "class:manage");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId");
  if (!assignmentId) {
    return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
  }

  const assignment = await prisma.classTeacherAssignment.findUnique({
    where: { id: assignmentId },
    include: { classGroup: { select: { schoolId: true } } },
  });
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
  if (!hasSchoolAccess(auth, assignment.classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  await prisma.classTeacherAssignment.delete({ where: { id: assignmentId } });
  return NextResponse.json({ success: true });
}
