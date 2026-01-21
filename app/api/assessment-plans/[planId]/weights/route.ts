import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recalculateWeightsForPlan } from "@/lib/assessment-service";
import { recordAuditLog } from "@/lib/domain/audit";
import { authorizeWithSchool, hasSchoolAccess, getPrimaryRoleKey } from "@/lib/auth";

const weightUpdateSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string(),
      rawWeight: z.number().min(0),
    })
  ),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  // Authorize user with required permission
  const authResult = await authorizeWithSchool(request, "assessmentPlan:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const resolvedParams = await params;
  const json = await request.json();
  const parsed = weightUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const plan = await prisma.assessmentPlan.findUnique({
    where: { id: resolvedParams.planId },
    include: { assessments: true, classGroup: true },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Verify school access
  if (!hasSchoolAccess(auth, plan.classGroup.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  if (plan.status === "Locked") {
    return NextResponse.json({ error: "Cannot modify locked plan" }, { status: 403 });
  }

  // Update raw weights
  await Promise.all(
    parsed.data.updates.map((update) =>
      prisma.assessment.update({
        where: { id: update.id },
        data: { rawWeight: update.rawWeight },
      })
    )
  );

  // Recalculate normalized weights
  await recalculateWeightsForPlan(resolvedParams.planId);

  // Record audit log
  await recordAuditLog({
    action: "UPDATE_WEIGHTS",
    entityType: "AssessmentPlan",
    entityId: resolvedParams.planId,
    schoolId: plan.classGroup.schoolId,
    actorRole: getPrimaryRoleKey(auth) || "unknown",
    actorName: auth.user.name || auth.user.email || "unknown",
    metadata: {
      updates: parsed.data.updates,
    },
  });

  const updatedPlan = await prisma.assessmentPlan.findUnique({
    where: { id: resolvedParams.planId },
    include: { assessments: { orderBy: { sequence: "asc" } } },
  });

  return NextResponse.json(updatedPlan);
}

