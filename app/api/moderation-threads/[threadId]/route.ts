import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

interface Params {
  params: Promise<{ threadId: string }>;
}

const updateSchema = z.object({
  status: z.enum(["Open", "Resolved", "Escalated"]),
});

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

  const thread = await prisma.moderationThread.update({
    where: { id: threadId },
    data: parsed.data,
  });

  return NextResponse.json(thread);
}
