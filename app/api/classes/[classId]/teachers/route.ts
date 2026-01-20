import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const authResult = await authorizeWithSchool(request, "class:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { classId } = await params;
  const classGroup = await prisma.classGroup.findUnique({
    where: { id: classId },
    select: { schoolId: true },
  });
  if (!classGroup) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  if (!hasSchoolAccess(auth, classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const assignments = await prisma.classTeacherAssignment.findMany({
    where: { classGroupId: classId },
    include: { teacher: true },
  });
  return NextResponse.json(assignments);
}

const assignSchema = z.object({
  teacherId: z.string(),
  role: z.string().default("Support"),
  subjectId: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const authResult = await authorizeWithSchool(request, "class:manage");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { classId } = await params;
  const json = await request.json();
  const parsed = assignSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: classId },
    select: { schoolId: true },
  });
  if (!classGroup) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  if (!hasSchoolAccess(auth, classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  // Validate teacher belongs to same school
  const teacher = await prisma.teacher.findUnique({
    where: { id: parsed.data.teacherId },
    select: { schoolId: true },
  });
  if (!teacher || teacher.schoolId !== classGroup.schoolId) {
    return NextResponse.json({ error: "Teacher not found in this school" }, { status: 400 });
  }

  // Check if assignment already exists
  const existing = await prisma.classTeacherAssignment.findUnique({
    where: {
      classGroupId_teacherId: {
        classGroupId: classId,
        teacherId: parsed.data.teacherId,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Teacher already assigned to this class" },
      { status: 409 }
    );
  }

  const assignment = await prisma.classTeacherAssignment.create({
    data: {
      classGroupId: classId,
      teacherId: parsed.data.teacherId,
      role: parsed.data.role,
      subjectId: parsed.data.subjectId,
    },
    include: { teacher: true },
  });

  return NextResponse.json(assignment, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const authResult = await authorizeWithSchool(request, "class:manage");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { classId } = await params;
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get("teacherId");

  if (!teacherId) {
    return NextResponse.json({ error: "Teacher ID required" }, { status: 400 });
  }

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: classId },
    select: { schoolId: true },
  });
  if (!classGroup) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  if (!hasSchoolAccess(auth, classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  try {
    await prisma.classTeacherAssignment.delete({
      where: {
        classGroupId_teacherId: {
          classGroupId: classId,
          teacherId,
        },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete teacher assignment", error);
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
}
