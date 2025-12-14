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

async function getSchoolIdForThread(threadId: string): Promise<string | null> {
  const thread = await prisma.moderationThread.findUnique({
    where: { id: threadId },
    select: {
      assessmentPlanId: true,
      assessmentId: true,
    },
  });
  if (!thread) return null;

  if (thread.assessmentPlanId) {
    const plan = await prisma.assessmentPlan.findUnique({
      where: { id: thread.assessmentPlanId },
      select: { classGroup: { select: { schoolId: true } } },
    });
    return plan?.classGroup.schoolId ?? null;
  }

  if (thread.assessmentId) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: thread.assessmentId },
      select: { assessmentPlan: { select: { classGroup: { select: { schoolId: true } } } } },
    });
    return assessment?.assessmentPlan.classGroup.schoolId ?? null;
  }

  return null;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { threadId } = await params;

  const authResult = await authorizeWithSchool(request, "moderation:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const schoolId = await getSchoolIdForThread(threadId);
  if (!schoolId) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }
  if (!hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

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

  return NextResponse.json(thread);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { threadId } = await params;
  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const permission = parsed.data.status === "Resolved" ? "moderation:resolve" : "moderation:update";
  const authResult = await authorizeWithSchool(request, permission);
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const schoolId = await getSchoolIdForThread(threadId);
  if (!schoolId) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }
  if (!hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const thread = await prisma.moderationThread.update({
    where: { id: threadId },
    data: parsed.data,
  });

  return NextResponse.json(thread);
}
