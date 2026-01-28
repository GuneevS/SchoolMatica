import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";
import { createBulkNotifications } from "@/lib/notifications";

interface Params {
  params: Promise<{ threadId: string }>;
}

const commentSchema = z.object({
  authorRole: z.enum(["Teacher", "HOD", "SMT"]),
  message: z.string().min(2),
  attachmentUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  // Authorize user with required permission
  const authResult = await authorizeWithSchool(request, "moderation:create");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { threadId } = await params;

  // Fetch thread to verify it exists and get school context
  const thread = await prisma.moderationThread.findUnique({
    where: { id: threadId },
    include: {
      assessmentPlan: {
        include: {
          classGroup: true,
        },
      },
      assessment: {
        include: {
          assessmentPlan: {
            include: {
              classGroup: true,
            },
          },
        },
      },
    },
  });

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // Determine the schoolId from the thread's related entities
  const schoolId = thread.assessmentPlan?.classGroup.schoolId ||
                   thread.assessment?.assessmentPlan.classGroup.schoolId;

  if (!schoolId) {
    return NextResponse.json({ error: "Unable to determine school context" }, { status: 500 });
  }

  // Verify school access
  if (!hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = commentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const comment = await prisma.moderationComment.create({
    data: {
      threadId,
      authorRole: parsed.data.authorRole,
      message: parsed.data.message,
      attachmentUrl: parsed.data.attachmentUrl ?? null,
    },
  });

  // Notify other participants in the thread (except the commenter)
  try {
    // Get all unique roles that have commented on this thread
    const participantRoles = await prisma.moderationComment.findMany({
      where: { threadId },
      select: { authorRole: true },
      distinct: ["authorRole"],
    });

    // Get plan details for context
    const planId = thread.assessmentPlan?.id || thread.assessment?.assessmentPlanId;
    const planName = thread.assessmentPlan?.name || thread.title || "Assessment Plan";

    // Find users with those roles (excluding the commenter's role)
    const roleKeys = participantRoles
      .map(p => p.authorRole.toLowerCase())
      .filter(role => role !== parsed.data.authorRole.toLowerCase());

    if (roleKeys.length > 0) {
      const participants = await prisma.appUser.findMany({
        where: {
          schoolId,
          roleAssignments: {
            some: {
              role: {
                key: { in: roleKeys },
              },
              scopeSchoolId: schoolId,
            },
          },
        },
      });

      if (participants.length > 0) {
        await createBulkNotifications({
          prisma,
          schoolId,
          userIds: participants.map(p => p.id),
          type: "system",
          title: "New Moderation Comment",
          body: `${parsed.data.authorRole} added a comment to the moderation discussion for "${planName}"`,
          actionUrl: `/assessment-plans/${planId}`,
          data: { 
            threadId, 
            commentId: comment.id,
            authorRole: parsed.data.authorRole,
            planId,
          },
        });
      }
    }
  } catch (notificationError) {
    // Log error but don't fail the comment creation
    console.error("Failed to send moderation comment notifications:", notificationError);
  }

  return NextResponse.json(comment, { status: 201 });
}
