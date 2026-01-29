import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Validation schema for updating submission status/grade
const updateSubmissionSchema = z.object({
  submissionId: z.string().optional(),
  studentId: z.string().optional(),
  status: z
    .enum(["Pending", "Submitted", "Late", "Missing", "Excused"])
    .optional(),
  grade: z.string().optional(),
  feedback: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

// Bulk update schema
const bulkUpdateSchema = z.object({
  updates: z.array(
    z.object({
      submissionId: z.string(),
      status: z
        .enum(["Pending", "Submitted", "Late", "Missing", "Excused"])
        .optional(),
      grade: z.string().optional(),
      feedback: z.string().optional(),
    })
  ),
});

interface RouteParams {
  params: Promise<{ homeworkId: string }>;
}

/**
 * GET /api/homework/[homeworkId]/submissions
 * Get all submissions for a homework assignment
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { homeworkId } = await params;
    
    const result = await authorizeWithSchool(request, "class:read");
    if ("error" in result) return result.error;
    const { auth } = result;

    // Verify homework exists and user has access
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      select: {
        id: true,
        title: true,
        schoolId: true,
        dueDate: true,
        status: true,
      },
    });

    if (!homework) {
      return NextResponse.json(
        { error: "Homework not found" },
        { status: 404 }
      );
    }

    if (!hasSchoolAccess(auth, homework.schoolId)) {
      return NextResponse.json(
        { error: "Unauthorized access to this homework" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const submissions = await prisma.homeworkSubmission.findMany({
      where: {
        homeworkId,
        ...(status && { status }),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            parents: {
              where: { primary: true },
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        student: {
          lastName: "asc",
        },
      },
    });

    // Transform submissions data
    const formattedSubmissions = submissions.map((sub) => ({
      id: sub.id,
      homeworkId: sub.homeworkId,
      studentId: sub.student.id,
      student: `${sub.student.firstName} ${sub.student.lastName}`,
      firstName: sub.student.firstName,
      lastName: sub.student.lastName,
      admissionNumber: sub.student.admissionNumber,
      status: sub.status,
      submittedAt: sub.submittedAt?.toISOString() || null,
      attachments: sub.attachments,
      grade: sub.grade,
      feedback: sub.feedback,
      checkedBy: sub.checkedBy,
      checkedAt: sub.checkedAt?.toISOString() || null,
      parentNotified: sub.parentNotified,
      parentContact: sub.student.parents[0] || null,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));

    // Calculate statistics
    const stats = {
      total: submissions.length,
      submitted: submissions.filter((s) => s.status === "Submitted").length,
      late: submissions.filter((s) => s.status === "Late").length,
      missing: submissions.filter(
        (s) => s.status === "Pending" || s.status === "Missing"
      ).length,
      excused: submissions.filter((s) => s.status === "Excused").length,
    };

    return NextResponse.json({
      homework: {
        id: homework.id,
        title: homework.title,
        dueDate: homework.dueDate.toISOString(),
        status: homework.status,
      },
      submissions: formattedSubmissions,
      statistics: stats,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/homework/[homeworkId]/submissions
 * Update submission status/grade (single or bulk)
 * 
 * Single update: { submissionId: "...", status: "Submitted", grade: "A" }
 * Bulk update: { updates: [{ submissionId: "...", status: "...", grade: "..." }, ...] }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { homeworkId } = await params;
    
    const result = await authorizeWithSchool(request, "class:update");
    if ("error" in result) return result.error;
    const { auth } = result;

    // Verify homework exists and user has access
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      select: {
        id: true,
        schoolId: true,
        dueDate: true,
      },
    });

    if (!homework) {
      return NextResponse.json(
        { error: "Homework not found" },
        { status: 404 }
      );
    }

    if (!hasSchoolAccess(auth, homework.schoolId)) {
      return NextResponse.json(
        { error: "Unauthorized access to this homework" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if this is a bulk update
    const bulkParsed = bulkUpdateSchema.safeParse(body);
    if (bulkParsed.success) {
      // Bulk update
      const results = await prisma.$transaction(
        bulkParsed.data.updates.map((update) =>
          prisma.homeworkSubmission.update({
            where: { id: update.submissionId },
            data: {
              ...(update.status && { status: update.status }),
              ...(update.grade !== undefined && { grade: update.grade }),
              ...(update.feedback !== undefined && {
                feedback: update.feedback,
              }),
              checkedBy: auth.user.displayName || auth.user.email || "Teacher",
              checkedAt: new Date(),
            },
          })
        )
      );

      return NextResponse.json({
        message: `${results.length} submissions updated`,
        count: results.length,
      });
    }

    // Single update
    const parsed = updateSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { submissionId, studentId, status, grade, feedback, attachments } =
      parsed.data;

    // Find the submission - either by submissionId or by homeworkId + studentId
    let whereClause: { id: string } | { homeworkId_studentId: { homeworkId: string; studentId: string } };
    
    if (submissionId) {
      whereClause = { id: submissionId };
    } else if (studentId) {
      whereClause = {
        homeworkId_studentId: {
          homeworkId,
          studentId,
        },
      };
    } else {
      return NextResponse.json(
        { error: "Either submissionId or studentId is required" },
        { status: 400 }
      );
    }

    // Determine if submission is late (submitted after due date)
    let effectiveStatus = status;
    if (status === "Submitted") {
      const now = new Date();
      if (now > homework.dueDate) {
        effectiveStatus = "Late";
      }
    }

    const updatedSubmission = await prisma.homeworkSubmission.update({
      where: whereClause,
      data: {
        ...(effectiveStatus && { status: effectiveStatus }),
        ...(status === "Submitted" || status === "Late"
          ? { submittedAt: new Date() }
          : {}),
        ...(grade !== undefined && { grade }),
        ...(feedback !== undefined && { feedback }),
        ...(attachments !== undefined && { attachments }),
        checkedBy: auth.user.displayName || auth.user.email || "Teacher",
        checkedAt: new Date(),
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      submission: {
        id: updatedSubmission.id,
        student: `${updatedSubmission.student.firstName} ${updatedSubmission.student.lastName}`,
        status: updatedSubmission.status,
        grade: updatedSubmission.grade,
        feedback: updatedSubmission.feedback,
        submittedAt: updatedSubmission.submittedAt?.toISOString() || null,
        checkedAt: updatedSubmission.checkedAt?.toISOString() || null,
      },
      message: "Submission updated successfully",
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    
    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}
