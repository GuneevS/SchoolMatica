import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, getUserSchoolIds, isSystemAdmin, hasSchoolAccess } from "@/lib/auth";

const teacherSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.string().optional(),
  bio: z.string().optional(),
  schoolId: z.string(),
});

export async function GET(request: NextRequest) {
  const result = await authorizeWithSchool(request, "teacher:read");
  if ("error" in result) {
    return result.error;
  }
  
  const { auth } = result;
  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId") ?? undefined;
  
  // Validate school access if schoolId is provided
  if (schoolId && !hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }
  
  // Build where clause based on user permissions
  let whereClause: Prisma.TeacherWhereInput = {};
  if (isSystemAdmin(auth)) {
    // Admin can see all teachers
    if (schoolId) {
      whereClause = { schoolId };
    }
  } else {
    // Non-admins can only see teachers from their schools
    const userSchoolIds = getUserSchoolIds(auth);
    // BUG FIX: Was incorrectly using `id: { in: userSchoolIds }` which filtered teacher IDs by school IDs
    whereClause = schoolId 
      ? { schoolId }  // schoolId already validated above via hasSchoolAccess
      : { schoolId: { in: userSchoolIds } };
  }
  
  const teachers = await prisma.teacher.findMany({
    where: whereClause,
    include: {
      classAssignments: {
        include: { classGroup: true, subject: true },
        orderBy: { createdAt: "desc" },
      },
      subjectAssignments: {
        include: { subject: true },
        orderBy: { createdAt: "desc" },
      },
      primaryClasses: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return NextResponse.json(teachers);
}

export async function POST(request: NextRequest) {
  const result = await authorizeWithSchool(request, "teacher:create");
  if ("error" in result) {
    return result.error;
  }
  
  const { auth } = result;
  
  const payload = await request.json();
  const parsed = teacherSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }
  
  // Verify user has access to this school
  if (!hasSchoolAccess(auth, parsed.data.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }
  
  const schoolExists = await prisma.school.count({ where: { id: parsed.data.schoolId } });
  if (!schoolExists) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }
  const teacher = await prisma.teacher.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      role: parsed.data.role ?? "Teacher",
      bio: parsed.data.bio,
      schoolId: parsed.data.schoolId,
    },
  });
  return NextResponse.json(teacher, { status: 201 });
}

