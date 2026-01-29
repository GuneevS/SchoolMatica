import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Validation schema for updating homework
const updateHomeworkSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  subject: z.string().min(1).optional(),
  dueDate: z.string().datetime().optional(),
  points: z.number().int().min(0).optional(),
  attachments: z.array(z.string()).optional(),
  status: z.enum(["Active", "Completed", "Cancelled"]).optional(),
});

interface RouteParams {
  params: Promise<{ homeworkId: string }>;
}

/**
 * GET /api/homework/[homeworkId]
 * Get a single homework assignment with all submissions
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { homeworkId } = await params;
    
    const result = await authorizeWithSchool(request, "class:read");
    if ("error" in result) return result.error;
    const { auth } = result;

    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
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
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                admissionNumber: true,
              },
            },
          },
          orderBy: {
            student: {
              lastName: "asc",
            },
          },
        },
      },
    });

    if (!homework) {
      return NextResponse.json(
        { error: "Homework not found" },
        { status: 404 }
      );
    }

    // Verify school access
    if (!hasSchoolAccess(auth, homework.school.id)) {
      return NextResponse.json(
        { error: "Unauthorized access to this homework" },
        { status: 403 }
      );
    }

    // Calculate submission statistics
    const submitted = homework.submissions.filter(
      (s) => s.status === "Submitted"
    ).length;
    const late = homework.submissions.filter((s) => s.status === "Late").length;
    const missing = homework.submissions.filter(
      (s) => s.status === "Pending" || s.status === "Missing"
    ).length;
    const excused = homework.submissions.filter(
      (s) => s.status === "Excused"
    ).length;

    // Transform submissions data
    const formattedSubmissions = homework.submissions.map((sub) => ({
      id: sub.id,
      homeworkId: sub.homeworkId,
      studentId: sub.student.id,
      student: `${sub.student.firstName} ${sub.student.lastName}`,
      admissionNumber: sub.student.admissionNumber,
      status: sub.status,
      submittedAt: sub.submittedAt?.toISOString() || null,
      attachments: sub.attachments,
      grade: sub.grade,
      feedback: sub.feedback,
      checkedBy: sub.checkedBy,
      checkedAt: sub.checkedAt?.toISOString() || null,
      parentNotified: sub.parentNotified,
    }));

    return NextResponse.json({
      homework: {
        id: homework.id,
        title: homework.title,
        description: homework.description,
        subject: homework.subject,
        classGroupId: homework.classGroup.id,
        class: homework.classGroup.name,
        grade: homework.classGroup.grade,
        teacherId: homework.teacher.id,
        teacher: `${homework.teacher.firstName} ${homework.teacher.lastName}`,
        schoolId: homework.school.id,
        schoolName: homework.school.name,
        assignedDate: homework.assignedDate.toISOString(),
        dueDate: homework.dueDate.toISOString(),
        points: homework.points,
        attachments: homework.attachments,
        status: homework.status,
        totalStudents: homework.submissions.length,
        statistics: {
          submitted,
          late,
          missing,
          excused,
          completionRate:
            homework.submissions.length > 0
              ? Math.round((submitted / homework.submissions.length) * 100)
              : 0,
        },
        createdAt: homework.createdAt,
        updatedAt: homework.updatedAt,
      },
      submissions: formattedSubmissions,
    });
  } catch (error) {
    console.error("Error fetching homework:", error);
    return NextResponse.json(
      { error: "Failed to fetch homework" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/homework/[homeworkId]
 * Update a homework assignment
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { homeworkId } = await params;
    
    const result = await authorizeWithSchool(request, "class:update");
    if ("error" in result) return result.error;
    const { auth } = result;

    const body = await request.json();
    const parsed = updateHomeworkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Get existing homework to verify access
    const existingHomework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      select: {
        schoolId: true,
        teacherId: true,
        status: true,
      },
    });

    if (!existingHomework) {
      return NextResponse.json(
        { error: "Homework not found" },
        { status: 404 }
      );
    }

    if (!hasSchoolAccess(auth, existingHomework.schoolId)) {
      return NextResponse.json(
        { error: "Unauthorized access to this homework" },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.description !== undefined)
      updateData.description = parsed.data.description;
    if (parsed.data.subject !== undefined)
      updateData.subject = parsed.data.subject;
    if (parsed.data.dueDate !== undefined)
      updateData.dueDate = new Date(parsed.data.dueDate);
    if (parsed.data.points !== undefined) updateData.points = parsed.data.points;
    if (parsed.data.attachments !== undefined)
      updateData.attachments = parsed.data.attachments;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

    // When marking homework as complete, update all pending submissions to "Missing"
    if (parsed.data.status === "Completed") {
      await prisma.homeworkSubmission.updateMany({
        where: {
          homeworkId,
          status: "Pending",
        },
        data: {
          status: "Missing",
        },
      });
    }

    const updatedHomework = await prisma.homework.update({
      where: { id: homeworkId },
      data: updateData,
      include: {
        classGroup: {
          select: { name: true },
        },
        teacher: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({
      homework: {
        id: updatedHomework.id,
        title: updatedHomework.title,
        description: updatedHomework.description,
        subject: updatedHomework.subject,
        class: updatedHomework.classGroup.name,
        teacher: `${updatedHomework.teacher.firstName} ${updatedHomework.teacher.lastName}`,
        dueDate: updatedHomework.dueDate.toISOString(),
        points: updatedHomework.points,
        attachments: updatedHomework.attachments,
        status: updatedHomework.status,
        updatedAt: updatedHomework.updatedAt,
      },
      message: "Homework updated successfully",
    });
  } catch (error) {
    console.error("Error updating homework:", error);
    return NextResponse.json(
      { error: "Failed to update homework" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/homework/[homeworkId]
 * Delete a homework assignment and all associated submissions
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { homeworkId } = await params;
    
    const result = await authorizeWithSchool(request, "class:update");
    if ("error" in result) return result.error;
    const { auth } = result;

    // Get existing homework to verify access
    const existingHomework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      select: {
        schoolId: true,
        teacherId: true,
        title: true,
      },
    });

    if (!existingHomework) {
      return NextResponse.json(
        { error: "Homework not found" },
        { status: 404 }
      );
    }

    if (!hasSchoolAccess(auth, existingHomework.schoolId)) {
      return NextResponse.json(
        { error: "Unauthorized access to this homework" },
        { status: 403 }
      );
    }

    // Delete in transaction - submissions first, then homework
    await prisma.$transaction(async (tx) => {
      // Delete all submissions for this homework
      await tx.homeworkSubmission.deleteMany({
        where: { homeworkId },
      });

      // Delete the homework
      await tx.homework.delete({
        where: { id: homeworkId },
      });
    });

    return NextResponse.json({
      message: `Homework "${existingHomework.title}" deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting homework:", error);
    return NextResponse.json(
      { error: "Failed to delete homework" },
      { status: 500 }
    );
  }
}
