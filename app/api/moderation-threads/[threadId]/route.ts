import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

interface Params {
  params: Promise<{ threadId: string }>;
}

const updateSchema = z.object({
  status: z.enum(["Open", "Resolved", "Escalated"]),
  resolutionSummary: z.string().min(3).optional(),
  escalationReason: z.string().min(3).optional(),
}).refine(
  (data) => {
    if (data.status === "Resolved" && !data.resolutionSummary) return false;
    if (data.status === "Escalated" && !data.escalationReason) return false;
    return true;
  },
  {
    message: "resolutionSummary is required when resolving; escalationReason is required when escalating",
    path: ["status"],
  }
);

export async function GET(request: NextRequest, { params }: Params) {
  // Authorize user with required permission
  const authResult = await authorizeWithSchool(request, "moderation:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { threadId } = await params;

  const thread = await prisma.moderationThread.findUnique({
    where: { id: threadId },
    include: {
      comments: {
        orderBy: { createdAt: "asc" },
      },
      documents: true,
      events: {
        orderBy: { createdAt: "asc" },
      },
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

  return NextResponse.json(thread);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  // Authorize user with required permission
  const authResult = await authorizeWithSchool(request, "moderation:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { threadId } = await params;

  // Fetch thread first to verify school access
  const existingThread = await prisma.moderationThread.findUnique({
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

  if (!existingThread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // Determine the schoolId from the thread's related entities
  const schoolId = existingThread.assessmentPlan?.classGroup.schoolId ||
                   existingThread.assessment?.assessmentPlan.classGroup.schoolId;

  if (!schoolId) {
    return NextResponse.json({ error: "Unable to determine school context" }, { status: 500 });
  }

  // Verify school access
  if (!hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const actorRole = auth.user.roleAssignments[0]?.role.name ?? "Unknown";
  const actorId = auth.user.id;
  const fromStatus = existingThread.status;
  const toStatus = parsed.data.status;

  // Require 2+ distinct commenter roles before resolution
  if (toStatus === "Resolved") {
    const distinctRoles = await prisma.moderationComment.findMany({
      where: { threadId },
      select: { authorRole: true },
      distinct: ["authorRole"],
    });
    if (distinctRoles.length < 2) {
      return NextResponse.json(
        { error: "At least two distinct roles must participate before resolving a thread" },
        { status: 400 }
      );
    }
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    status: toStatus,
  };

  if (toStatus === "Resolved") {
    updateData.resolvedAt = new Date();
    updateData.resolvedBy = actorId;
    updateData.resolutionSummary = parsed.data.resolutionSummary;
  } else if (toStatus === "Escalated") {
    updateData.escalatedAt = new Date();
    updateData.escalatedBy = actorId;
    updateData.escalationReason = parsed.data.escalationReason;
  } else if (toStatus === "Open") {
    // Reopening — clear resolution fields
    updateData.resolvedAt = null;
    updateData.resolvedBy = null;
    updateData.resolutionSummary = null;
  }

  const [thread] = await prisma.$transaction([
    prisma.moderationThread.update({
      where: { id: threadId },
      data: updateData,
      include: { events: { orderBy: { createdAt: "desc" }, take: 5 } },
    }),
    prisma.moderationThreadEvent.create({
      data: {
        threadId,
        eventType: toStatus === "Resolved" ? "resolution"
          : toStatus === "Escalated" ? "escalation"
          : "reopen",
        fromStatus,
        toStatus,
        actorRole,
        actorId,
        note: parsed.data.resolutionSummary || parsed.data.escalationReason || null,
      },
    }),
  ]);

  return NextResponse.json(thread);
}
