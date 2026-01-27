import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createStudentRecord } from "@/lib/domain/student-onboarding";
import { authorizeWithSchool, getUserSchoolIds, isSystemAdmin, hasSchoolAccess } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const result = await authorizeWithSchool(request, "student:read");
  if ("error" in result) {
    return result.error;
  }
  
  const { auth } = result;
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");
  
  // Build where clause based on user permissions
  let whereClause: Prisma.StudentWhereInput = {};
  
  if (classId) {
    // Verify the class belongs to an accessible school
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
    
    whereClause = { classGroupId: classId };
  } else if (!isSystemAdmin(auth)) {
    // Non-admins can only see students from classes in their schools
    const userSchoolIds = getUserSchoolIds(auth);
    whereClause = {
      classGroup: {
        schoolId: { in: userSchoolIds },
      },
    };
  }
  
  const students = await prisma.student.findMany({
    where: whereClause,
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
  advisorTeacherId: z.string().optional(),
  guardianName: z.string().optional(),
  guardianRelationship: z.string().optional(),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  guardianPhone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const result = await authorizeWithSchool(request, "student:create");
  if ("error" in result) {
    return result.error;
  }
  
  const { auth } = result;
  
  const json = await request.json();
  const parsed = studentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const classGroup = await prisma.classGroup.findUnique({ where: { id: parsed.data.classGroupId } });
  if (!classGroup) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  
  // Verify user has access to this school
  if (!hasSchoolAccess(auth, classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const guardian = parsed.data.guardianName
    ? {
        fullName: parsed.data.guardianName,
        relationship: parsed.data.guardianRelationship,
        email: parsed.data.guardianEmail || undefined,
        phone: parsed.data.guardianPhone || undefined,
        primary: true,
      }
    : null;

  const student = await createStudentRecord(
    {
      classGroupId: parsed.data.classGroupId,
      admissionNumber: parsed.data.admissionNumber,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      gender: parsed.data.gender,
      advisorTeacherId: parsed.data.advisorTeacherId,
      guardian,
    },
    prisma,
  );

  await prisma.learnerRegistration.create({
    data: {
      schoolId: classGroup.schoolId,
      classGroupId: classGroup.id,
      status: "Approved",
      learnerData: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        gender: parsed.data.gender,
        admissionNumber: parsed.data.admissionNumber,
      } as Prisma.JsonObject,
      guardianData: guardian
        ? ({
            guardianName: guardian.fullName,
            relationship: guardian.relationship ?? "Guardian",
            email: guardian.email,
            phone: guardian.phone,
          } as Prisma.JsonObject)
        : Prisma.JsonNull,
      supportingDocs: Prisma.JsonNull,
      studentId: student.id,
      submittedAt: new Date(),
      decidedAt: new Date(),
      decisionNote: "Auto-approved via markbook quick add",
    },
  });

  return NextResponse.json(student, { status: 201 });
}
