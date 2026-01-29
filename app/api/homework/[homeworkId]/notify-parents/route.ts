import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";
import { sendHomeworkMissingEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Validation schema for notification request
const notifyParentsSchema = z.object({
  studentIds: z.array(z.string()).min(1, "At least one student ID is required"),
  customMessage: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ homeworkId: string }>;
}

/**
 * POST /api/homework/[homeworkId]/notify-parents
 * Send notifications to parents of selected students about missing homework
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { homeworkId } = await params;
    
    const result = await authorizeWithSchool(request, "class:update");
    if ("error" in result) return result.error;
    const { auth } = result;

    const body = await request.json();
    const parsed = notifyParentsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { studentIds, customMessage } = parsed.data;

    // Get homework details
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        classGroup: {
          select: {
            name: true,
          },
        },
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
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

    if (!hasSchoolAccess(auth, homework.school.id)) {
      return NextResponse.json(
        { error: "Unauthorized access to this homework" },
        { status: 403 }
      );
    }

    // Get submissions with student and parent details
    const submissions = await prisma.homeworkSubmission.findMany({
      where: {
        homeworkId,
        studentId: { in: studentIds },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parents: {
              where: { primary: true },
              select: {
                id: true,
                fullName: true,
                email: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    // Track notification results
    const results: {
      studentId: string;
      studentName: string;
      success: boolean;
      error?: string;
      parentEmail?: string;
    }[] = [];

    // Send notifications to each parent
    for (const submission of submissions) {
      const student = submission.student;
      const parent = student.parents[0];

      if (!parent || !parent.email) {
        results.push({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          success: false,
          error: "No parent email address found",
        });
        continue;
      }

      try {
        await sendHomeworkMissingEmail(parent.email, {
          parentName: parent.fullName,
          studentName: `${student.firstName} ${student.lastName}`,
          homeworkTitle: homework.title,
          subject: homework.subject,
          className: homework.classGroup.name,
          dueDate: homework.dueDate.toLocaleDateString("en-ZA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          teacherName: `${homework.teacher.firstName} ${homework.teacher.lastName}`,
          teacherEmail: homework.teacher.email,
          schoolName: homework.school.name,
          customMessage,
        });

        // Mark submission as parent notified
        await prisma.homeworkSubmission.update({
          where: { id: submission.id },
          data: { parentNotified: true },
        });

        results.push({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          success: true,
          parentEmail: parent.email,
        });
      } catch (error) {
        console.error(
          `Failed to send notification for student ${student.id}:`,
          error
        );
        results.push({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to send email",
        });
      }
    }

    // Summary statistics
    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    // Also create in-app notifications for parents who have accounts
    try {
      const parentUserIds = await prisma.parentContact.findMany({
        where: {
          studentId: { in: studentIds },
          primary: true,
          parentUserId: { not: null },
        },
        select: {
          parentUser: {
            select: {
              userId: true,
            },
          },
          student: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (parentUserIds.length > 0) {
        await prisma.notification.createMany({
          data: parentUserIds
            .filter((p) => p.parentUser?.userId)
            .map((p) => ({
              userId: p.parentUser!.userId,
              schoolId: homework.school.id,
              type: "homework",
              title: "Missing Homework Alert",
              body: `${p.student.firstName} ${p.student.lastName} has not submitted "${homework.title}" which was due on ${homework.dueDate.toLocaleDateString("en-ZA")}.`,
              data: {
                homeworkId: homework.id,
                studentName: `${p.student.firstName} ${p.student.lastName}`,
              },
              actionUrl: `/parent/homework`,
            })),
        });
      }
    } catch (notifError) {
      // Log but don't fail if in-app notifications fail
      console.error("Failed to create in-app notifications:", notifError);
    }

    return NextResponse.json({
      message: `Sent ${successCount} notification(s), ${failedCount} failed`,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount,
      },
      results,
    });
  } catch (error) {
    console.error("Error sending parent notifications:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
