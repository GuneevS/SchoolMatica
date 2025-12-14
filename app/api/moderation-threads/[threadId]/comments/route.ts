import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess, getPrimaryRoleName } from "@/lib/auth";

interface Params {
  params: Promise<{ threadId: string }>;
}

const commentSchema = z.object({
  authorRole: z.enum(["Teacher", "HOD", "SMT"]).optional(),
  message: z.string().min(2),
  attachmentUrl: z.string().url().optional(),
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

export async function POST(request: NextRequest, { params }: Params) {
  const { threadId } = await params;

  const authResult = await authorizeWithSchool(request, "moderation:create");
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

  const json = await request.json();
  const parsed = commentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const authorRole = getPrimaryRoleName(auth) ?? parsed.data.authorRole ?? "Teacher";

  const comment = await prisma.moderationComment.create({
    data: {
      threadId,
      authorRole,
      message: parsed.data.message,
      attachmentUrl: parsed.data.attachmentUrl ?? null,
    },
  });
  return NextResponse.json(comment, { status: 201 });
}
