import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, getUserSchoolIds, isSystemAdmin, hasSchoolAccess } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  const result = await authorizeWithSchool(request, "class:read");
  if ("error" in result) {
    return result.error;
  }

  try {
    
    const { auth } = result;
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId") ?? undefined;
    
    // Validate school access if schoolId is provided
    if (schoolId && !hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }
    
    // Build where clause based on user permissions
    let whereClause: Prisma.ClassGroupWhereInput = {};
    if (isSystemAdmin(auth)) {
      // Admin can see all classes, optionally filtered by schoolId
      if (schoolId) {
        whereClause = { schoolId };
      }
    } else {
      // Non-admins can only see classes from their schools
      const userSchoolIds = getUserSchoolIds(auth);
      // BUG FIX: Was incorrectly using `id: { in: userSchoolIds }` which filtered class IDs by school IDs
      whereClause = schoolId 
        ? { schoolId }  // schoolId already validated above via hasSchoolAccess
        : { schoolId: { in: userSchoolIds } };
    }
    
    const classes = await prisma.classGroup.findMany({
      where: whereClause,
      include: {
        subject: true,
        _count: {
          select: { students: true, assessmentPlans: true },
        },
        assessmentPlans: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        primaryTeacher: true,
        teacherAssignments: {
          include: { teacher: true },
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
      primaryTeacher: classGroup.primaryTeacher,
      latestPlanStatus: classGroup.assessmentPlans[0]?.status ?? "Draft",
    }));

    return NextResponse.json(payload);

  } catch (error) {
    return handleApiError("GET classes", error);
  }
}

const classSchema = z.object({
  name: z.string().min(3),
  grade: z.number().int(),
  year: z.number().int(),
  classType: z.enum(["Homeroom", "Subject"]).default("Subject"),
  subjectId: z.string().optional(),
  gradeLevelId: z.string().optional(),
  primaryTeacherId: z.string().optional(),
}).refine((data) => {
  // Subject is required only for Subject-type classes
  if (data.classType === "Subject" && !data.subjectId) {
    return false;
  }
  return true;
}, {
  message: "Subject is required for subject-specific classes",
  path: ["subjectId"],
});

export async function POST(request: NextRequest) {
  const result = await authorizeWithSchool(request, "class:create");
  if ("error" in result) {
    return result.error;
  }

  try {
    
    const { auth } = result;
    
    const json = await request.json();
    const parsed = classSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { classType, subjectId, gradeLevelId, primaryTeacherId } = parsed.data;
    
    // Determine schoolId from either subject or gradeLevel
    let schoolId: string | null = null;
    let subject = null;
    
    if (classType === "Subject" && subjectId) {
      // Subject-specific class - get schoolId from subject
      subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 });
      }
      schoolId = subject.schoolId;
    } else if (gradeLevelId) {
      // Homeroom class - get schoolId from gradeLevel
      const gradeLevel = await prisma.gradeLevel.findUnique({ where: { id: gradeLevelId } });
      if (!gradeLevel) {
        return NextResponse.json({ error: "Grade level not found" }, { status: 404 });
      }
      schoolId = gradeLevel.schoolId;
    } else if (primaryTeacherId) {
      // Fallback - get schoolId from teacher
      const teacher = await prisma.teacher.findUnique({ where: { id: primaryTeacherId } });
      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
      }
      schoolId = teacher.schoolId;
    }
    
    if (!schoolId) {
      // Last resort - use user's school
      const userSchoolIds = getUserSchoolIds(auth);
      if (userSchoolIds.length === 0) {
        return NextResponse.json({ error: "No school context available. Please provide a grade level or subject." }, { status: 400 });
      }
      schoolId = userSchoolIds[0];
    }
    
    // Verify user has access to this school
    if (!hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    // Validate gradeLevel belongs to the school
    if (gradeLevelId) {
      const gradeLevelExists = await prisma.gradeLevel.findFirst({
        where: { id: gradeLevelId, schoolId },
      });
      if (!gradeLevelExists) {
        return NextResponse.json({ error: "Grade level not found for this school" }, { status: 404 });
      }
    }

    // Validate teacher belongs to the school
    if (primaryTeacherId) {
      const teacherExists = await prisma.teacher.findFirst({
        where: { id: primaryTeacherId, schoolId },
      });
      if (!teacherExists) {
        return NextResponse.json({ error: "Teacher not found for this school" }, { status: 404 });
      }
    }

    const classGroup = await prisma.classGroup.create({
      data: {
        name: parsed.data.name,
        grade: parsed.data.grade,
        year: parsed.data.year,
        classType: classType,
        subjectId: subject?.id ?? null,
        schoolId: schoolId,
        gradeLevelId: gradeLevelId,
        primaryTeacherId: primaryTeacherId,
        teacherAssignments: primaryTeacherId
          ? {
              create: {
                teacherId: primaryTeacherId,
                role: "Lead",
                subjectId: subject?.id ?? null,
              },
            }
          : undefined,
      },
      include: { subject: true, gradeLevel: true, primaryTeacher: true },
    });

    return NextResponse.json(classGroup, { status: 201 });

  } catch (error) {
    return handleApiError("POST classes", error);
  }
}
