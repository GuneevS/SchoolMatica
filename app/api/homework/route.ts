import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess, getAuthContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Validation schema for creating homework
const createHomeworkSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  classGroupId: z.string().min(1, "Class is required"),
  dueDate: z.string().datetime({ message: "Valid due date is required" }),
  points: z.number().int().min(0).optional(),
  attachments: z.array(z.string()).optional(),
});

/**
 * GET /api/homework
 * List homework for a school/teacher
 * Query params:
 *   - schoolId: Filter by school (required for non-admin users)
 *   - classGroupId: Filter by class
 *   - teacherId: Filter by teacher
 *   - status: Filter by status (Active, Completed, Cancelled)
 *   - limit: Number of results (default 50)
 */
export async function GET(request: NextRequest) {
  try {
    const result = await authorizeWithSchool(request, "class:read");
    if ("error" in result) return result.error;
    const { auth } = result;

    const searchParams = request.nextUrl.searchParams;
    const schoolId = searchParams.get("schoolId") || auth.user.schoolId;
    const classGroupId = searchParams.get("classGroupId");
    const teacherId = searchParams.get("teacherId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!schoolId || !hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json(
        { error: "Unauthorized access to school" },
        { status: 403 }
      );
    }

    const homework = await prisma.homework.findMany({
      where: {
        schoolId,
        ...(classGroupId && { classGroupId }),
        ...(teacherId && { teacherId }),
        ...(status && { status }),
      },
      include: {
        classGroup: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        submissions: {
          select: {
            id: true,
            status: true,
            submittedAt: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { dueDate: "desc" },
      take: limit,
    });

    // Transform homework data to include submission statistics
    const homeworkWithStats = homework.map((hw) => {
      const submitted = hw.submissions.filter(
        (s) => s.status === "Submitted"
      ).length;
      const late = hw.submissions.filter((s) => s.status === "Late").length;
      const missing = hw.submissions.filter(
        (s) => s.status === "Pending" || s.status === "Missing"
      ).length;
      const excused = hw.submissions.filter(
        (s) => s.status === "Excused"
      ).length;

      return {
        id: hw.id,
        title: hw.title,
        description: hw.description,
        subject: hw.subject,
        class: hw.classGroup.name,
        classGroupId: hw.classGroup.id,
        grade: hw.classGroup.grade,
        teacher: `${hw.teacher.firstName} ${hw.teacher.lastName}`,
        teacherId: hw.teacher.id,
        assignedDate: hw.assignedDate.toISOString().split("T")[0],
        dueDate: hw.dueDate.toISOString().split("T")[0],
        status: hw.status,
        points: hw.points,
        attachments: hw.attachments,
        totalStudents: hw._count.submissions,
        submissions: {
          submitted,
          late,
          missing,
          excused,
        },
        createdAt: hw.createdAt,
        updatedAt: hw.updatedAt,
      };
    });

    return NextResponse.json({ homework: homeworkWithStats });
  } catch (error) {
    console.error("Error fetching homework:", error);
    return NextResponse.json(
      { error: "Failed to fetch homework" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/homework
 * Create new homework assignment
 * Auto-creates HomeworkSubmission records for all students in the class
 */
export async function POST(request: NextRequest) {
  try {
    const result = await authorizeWithSchool(request, "class:update");
    if ("error" in result) return result.error;
    const { auth } = result;

    const body = await request.json();
    const parsed = createHomeworkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { title, description, subject, classGroupId, dueDate, points, attachments } =
      parsed.data;

    // Get the class group and verify school access
    const classGroup = await prisma.classGroup.findUnique({
      where: { id: classGroupId },
      include: {
        students: {
          select: { id: true },
        },
        school: {
          select: { id: true },
        },
      },
    });

    if (!classGroup) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    if (!hasSchoolAccess(auth, classGroup.school.id)) {
      return NextResponse.json(
        { error: "Unauthorized access to this school" },
        { status: 403 }
      );
    }

    // Get the teacher ID from the user's linked teacher account
    let teacherId = auth.user.teacherId;

    // If user doesn't have a linked teacher record, check if they're the primary teacher
    if (!teacherId) {
      const primaryTeacher = await prisma.classGroup.findUnique({
        where: { id: classGroupId },
        select: { primaryTeacherId: true },
      });

      if (primaryTeacher?.primaryTeacherId) {
        teacherId = primaryTeacher.primaryTeacherId;
      } else {
        // Fall back to finding a teacher by email
        const teacherByEmail = await prisma.teacher.findFirst({
          where: {
            email: auth.user.email || undefined,
            schoolId: classGroup.school.id,
          },
        });

        if (teacherByEmail) {
          teacherId = teacherByEmail.id;
        }
      }
    }

    if (!teacherId) {
      return NextResponse.json(
        { error: "No teacher record found for this user" },
        { status: 400 }
      );
    }

    // Create homework with submissions for all students in a transaction
    const homework = await prisma.$transaction(async (tx) => {
      // Create the homework record
      const newHomework = await tx.homework.create({
        data: {
          title,
          description,
          subject,
          classGroupId,
          schoolId: classGroup.school.id,
          teacherId,
          dueDate: new Date(dueDate),
          points,
          attachments: attachments || [],
          status: "Active",
        },
        include: {
          classGroup: {
            select: { name: true },
          },
          teacher: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      // Create submission records for all students in the class
      if (classGroup.students.length > 0) {
        await tx.homeworkSubmission.createMany({
          data: classGroup.students.map((student) => ({
            homeworkId: newHomework.id,
            studentId: student.id,
            status: "Pending",
            parentNotified: false,
          })),
        });
      }

      return newHomework;
    });

    return NextResponse.json(
      {
        homework: {
          id: homework.id,
          title: homework.title,
          description: homework.description,
          subject: homework.subject,
          classGroupId: homework.classGroupId,
          class: homework.classGroup.name,
          teacher: `${homework.teacher.firstName} ${homework.teacher.lastName}`,
          dueDate: homework.dueDate.toISOString(),
          points: homework.points,
          attachments: homework.attachments,
          status: homework.status,
          totalStudents: classGroup.students.length,
        },
        message: `Homework created successfully with ${classGroup.students.length} student submissions`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating homework:", error);
    return NextResponse.json(
      { error: "Failed to create homework" },
      { status: 500 }
    );
  }
}
