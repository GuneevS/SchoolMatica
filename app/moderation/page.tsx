import { redirect } from "next/navigation";
import {
  getAuthContext,
  isSuperAdmin,
  isSystemAdmin,
  hasAnyPermission,
} from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";
import { prisma } from "@/lib/prisma";
import { ModerationHubClient } from "./moderation-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Moderation Hub | SchoolMatica",
  description: "Manage assessment moderation workflows — review, approve, escalate, and track assessment quality assurance.",
};

// Roles that may access the Moderation Hub (mirrors the sidebar nav gate).
const MODERATION_ROLE_KEYS = ["hod", "deputy", "principal", "admin", "smt"];

export default async function ModerationPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");

  // Authorization gate — block signed-in users who lack moderation access.
  // Skipped in demo mode (everyone sees everything), matching the moderation
  // APIs (`authorizeWithSchool(..., "moderation:read")`) and the nav visibility.
  const canModerate =
    isSystemAdmin(auth) ||
    hasAnyPermission(auth, ["moderation:read", "moderation:create"]) ||
    auth.user.roleAssignments.some((ra) =>
      MODERATION_ROLE_KEYS.includes(ra.role.key),
    );
  if (!isDemoMode() && !canModerate) {
    redirect("/dashboard?error=forbidden");
  }

  let schoolId = auth.user.schoolId;
  if (!schoolId && isSuperAdmin(auth)) {
    const firstSchool = await prisma.school.findFirst({ orderBy: { createdAt: "desc" } });
    if (firstSchool) schoolId = firstSchool.id;
  }
  if (!schoolId) redirect("/dashboard?error=no_school");

  // Fetch all moderation threads for this school
  const threads = await prisma.moderationThread.findMany({
    where: {
      OR: [
        { assessmentPlan: { classGroup: { schoolId } } },
        { assessment: { assessmentPlan: { classGroup: { schoolId } } } },
      ],
    },
    include: {
      comments: {
        orderBy: { createdAt: "asc" },
      },
      documents: true,
      assessmentPlan: {
        include: {
          classGroup: {
            include: {
              gradeLevel: true,
              subject: true,
            },
          },
        },
      },
      assessment: {
        include: {
          assessmentPlan: {
            include: {
              classGroup: {
                include: {
                  gradeLevel: true,
                  subject: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform for client
  const transformedThreads = threads.map((thread) => {
    const plan = thread.assessmentPlan || thread.assessment?.assessmentPlan;
    const classGroup = plan?.classGroup;
    return {
      id: thread.id,
      title: thread.title || plan?.name || "Untitled Thread",
      kind: thread.kind || "plan",
      status: thread.status,
      createdByRole: thread.createdByRole,
      resolutionSummary: thread.resolutionSummary,
      escalationReason: thread.escalationReason,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      className: classGroup?.name || "Unknown",
      grade: classGroup?.gradeLevel?.name || `Grade ${classGroup?.grade || "?"}`,
      subject: classGroup?.subject?.name || plan?.name || "General",
      assessmentPlanId: thread.assessmentPlanId,
      assessmentId: thread.assessmentId,
      comments: thread.comments.map((c) => ({
        id: c.id,
        authorRole: c.authorRole,
        message: c.message,
        createdAt: c.createdAt.toISOString(),
      })),
      documentCount: thread.documents.length,
    };
  });

  // Stats
  const openCount = transformedThreads.filter((t) => t.status === "Open").length;
  const escalatedCount = transformedThreads.filter((t) => t.status === "Escalated").length;
  const resolvedCount = transformedThreads.filter((t) => t.status === "Resolved").length;

  const roleName = auth.user.roleAssignments[0]?.role.name || "Teacher";

  return (
    <ModerationHubClient
      threads={transformedThreads}
      stats={{ open: openCount, escalated: escalatedCount, resolved: resolvedCount, total: transformedThreads.length }}
      currentRole={roleName}
      schoolId={schoolId}
    />
  );
}
