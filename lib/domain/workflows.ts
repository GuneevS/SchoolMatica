import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/domain/audit";

const transitions: Record<string, string[]> = {
  Draft: ["PendingApproval"],
  PendingApproval: ["Draft", "Approved"],
  Approved: ["Locked", "Draft"],
  Locked: [],
};

function deriveTimestamps(targetStatus: string) {
  const now = new Date();
  switch (targetStatus) {
    case "PendingApproval":
      return { submittedAt: now, approvedAt: null, lockedAt: null };
    case "Approved":
      return { approvedAt: now };
    case "Locked":
      return { lockedAt: now };
    case "Draft":
      return { submittedAt: null, approvedAt: null, lockedAt: null };
    default:
      return {};
  }
}

export async function transitionAssessmentPlanStatus(args: {
  planId: string;
  targetStatus: "Draft" | "PendingApproval" | "Approved" | "Locked";
  actorRole: "Teacher" | "HOD" | "SMT";
  actorName?: string;
}) {
  const { planId, targetStatus, actorRole, actorName } = args;
  const plan = await prisma.assessmentPlan.findUnique({
    where: { id: planId },
    include: {
      classGroup: { select: { schoolId: true } },
    },
  });
  if (!plan) {
    throw new Error("Plan not found");
  }
  const allowed = transitions[plan.status] ?? [];
  if (!allowed.includes(targetStatus)) {
    throw new Error(`Cannot transition plan from ${plan.status} to ${targetStatus}`);
  }

  const timestampPatch = deriveTimestamps(targetStatus);
  const updated = await prisma.assessmentPlan.update({
    where: { id: planId },
    data: {
      status: targetStatus,
      submittedByRole: targetStatus === "PendingApproval" ? actorRole : plan.submittedByRole,
      approvedByRole: targetStatus === "Approved" ? actorRole : plan.approvedByRole,
      ...timestampPatch,
    },
  });

  await recordAuditLog({
    schoolId: plan.classGroup.schoolId,
    entityType: "AssessmentPlan",
    entityId: plan.id,
    action: `PLAN_STATUS_${targetStatus.toUpperCase()}`,
    actorRole,
    actorName,
    metadata: {
      from: plan.status,
      to: targetStatus,
    },
  });

  return updated;
}

