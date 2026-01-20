import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { transitionAssessmentPlanStatus } from "@/lib/domain/workflows";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ planId: string }>;
}

const schema = z.object({
  targetStatus: z.enum(["Draft", "PendingApproval", "Approved", "Locked"]),
  actorRole: z.enum(["Teacher", "HOD", "SMT"]),
  actorName: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const { planId } = await params;

  // Load plan for school scoping
  const plan = await prisma.assessmentPlan.findUnique({
    where: { id: planId },
    select: { classGroup: { select: { schoolId: true } }, status: true },
  });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Determine permission requirement
  const targetStatus = parsed.data.targetStatus;
  const permission =
    targetStatus === "Approved" || targetStatus === "Locked"
      ? "assessmentPlan:approve"
      : "assessmentPlan:advance";

  const authResult = await authorizeWithSchool(request, permission);
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  if (!hasSchoolAccess(auth, plan.classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  try {
    const updated = await transitionAssessmentPlanStatus({
      planId,
      targetStatus: parsed.data.targetStatus,
      actorRole: parsed.data.actorRole,
      actorName: parsed.data.actorName,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

