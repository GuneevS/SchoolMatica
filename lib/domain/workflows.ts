import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/domain/audit";
import { createNotification, createBulkNotifications } from "@/lib/notifications";

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

  // Send notifications based on status change
  try {
    switch (targetStatus) {
      case "PendingApproval": {
        // Notify HOD and SMT that a plan needs approval
        const approvers = await prisma.appUser.findMany({
          where: {
            schoolId: plan.classGroup.schoolId,
            roleAssignments: {
              some: {
                role: {
                  key: { in: ["hod", "smt"] },
                },
                scopeSchoolId: plan.classGroup.schoolId,
              },
            },
          },
        });

        await createBulkNotifications({
          userIds: approvers.map(u => u.id),
          schoolId: plan.classGroup.schoolId,
          type: "system",
          title: "Assessment Plan Needs Approval",
          body: `${plan.name} has been submitted by ${actorName || actorRole} and requires your approval`,
          actionUrl: `/assessment-plans/${plan.id}`,
          data: { planId: plan.id, status: targetStatus, previousStatus: plan.status },
        });
        break;
      }

      case "Approved": {
        // Notify the teacher who created the plan
        const planWithDetails = await prisma.assessmentPlan.findUnique({
          where: { id: planId },
          include: {
            classGroup: {
              include: {
                primaryTeacher: {
                  include: {
                    account: true,
                  },
                },
              },
            },
          },
        });

        if (planWithDetails?.classGroup?.primaryTeacher?.account) {
          await createNotification({
            userId: planWithDetails.classGroup.primaryTeacher.account.id,
            schoolId: plan.classGroup.schoolId,
            type: "system",
            title: "Assessment Plan Approved",
            body: `Your plan "${plan.name}" has been approved by ${actorName || actorRole}`,
            actionUrl: `/assessment-plans/${plan.id}`,
            data: { planId: plan.id, status: targetStatus, approvedBy: actorName || actorRole },
          });
        }
        break;
      }

      case "Draft": {
        // Plan was rejected - notify the teacher
        if (plan.status === "PendingApproval" || plan.status === "Approved") {
          const planWithDetails = await prisma.assessmentPlan.findUnique({
            where: { id: planId },
            include: {
              classGroup: {
                include: {
                  primaryTeacher: {
                    include: {
                      account: true,
                    },
                  },
                },
              },
            },
          });

          if (planWithDetails?.classGroup?.primaryTeacher?.account) {
            await createNotification({
              userId: planWithDetails.classGroup.primaryTeacher.account.id,
              schoolId: plan.classGroup.schoolId,
              type: "system",
              title: "Assessment Plan Returned",
              body: `Your plan "${plan.name}" has been returned to Draft by ${actorName || actorRole}. Please review and resubmit.`,
              actionUrl: `/assessment-plans/${plan.id}`,
              data: { planId: plan.id, status: targetStatus, returnedBy: actorName || actorRole },
            });
          }
        }
        break;
      }

      case "Locked": {
        // Plan has been locked - notify teacher
        const planWithDetails = await prisma.assessmentPlan.findUnique({
          where: { id: planId },
          include: {
            classGroup: {
              include: {
                primaryTeacher: {
                  include: {
                    account: true,
                  },
                },
              },
            },
          },
        });

        if (planWithDetails?.classGroup?.primaryTeacher?.account) {
          await createNotification({
            userId: planWithDetails.classGroup.primaryTeacher.account.id,
            schoolId: plan.classGroup.schoolId,
            type: "system",
            title: "Assessment Plan Locked",
            body: `Your plan "${plan.name}" has been locked by ${actorName || actorRole}. No further changes can be made.`,
            actionUrl: `/assessment-plans/${plan.id}`,
            data: { planId: plan.id, status: targetStatus, lockedBy: actorName || actorRole },
          });
        }
        break;
      }
    }
  } catch (notificationError) {
    // Log error but don't fail the workflow transition
    console.error("Failed to send workflow notifications:", notificationError);
  }

  return updated;
}

