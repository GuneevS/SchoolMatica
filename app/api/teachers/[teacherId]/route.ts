import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

const updateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  bio: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> },
) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "teacher:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { teacherId } = await params;
  
  // Get teacher to verify school access
  const existingTeacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { schoolId: true },
  });
  
  if (!existingTeacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }
  
  // Verify user has access to this school
  if (!hasSchoolAccess(auth, existingTeacher.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  const teacher = await prisma.teacher.update({
    where: { id: teacherId },
    data: parsed.data,
  });
  return NextResponse.json(teacher);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> },
) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "teacher:delete");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { teacherId } = await params;
  
  // Get teacher to verify school access
  const existingTeacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { schoolId: true },
  });
  
  if (!existingTeacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }
  
  // Verify user has access to this school
  if (!hasSchoolAccess(auth, existingTeacher.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  await prisma.teacher.delete({ where: { id: teacherId } });
  return NextResponse.json({ success: true });
}

