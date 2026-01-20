import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/auth";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "view"
  | "approve"
  | "reject"
  | "advance"
  | "assign"
  | "remove"
  | "login"
  | "logout"
  | "switch_school"
  | "switch_role";

export type AuditResource =
  | "user"
  | "role"
  | "school"
  | "class"
  | "teacher"
  | "student"
  | "assessment_plan"
  | "assessment"
  | "mark"
  | "registration"
  | "timetable"
  | "template"
  | "document"
  | "moderation"
  | "report";

export interface AuditLogEntry {
  schoolId: string;
  entityType: AuditResource;
  entityId: string;
  action: AuditAction;
  actorRole: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
  diff?: Record<string, unknown>;
}

/**
 * Log an audit event to the database.
 * This function is non-blocking and won't throw errors to avoid disrupting operations.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        schoolId: entry.schoolId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        actorRole: entry.actorRole,
        actorName: entry.actorName ?? null,
        metadata: (entry.metadata as any) || undefined,
        diff: (entry.diff as any) || undefined,
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should not break operations
    console.error("Failed to log audit event:", error);
  }
}

/**
 * Get the highest priority role name from auth context.
 */
function getActorRole(auth: AuthContext): string {
  if (auth.user.roleAssignments.length === 0) return "Unknown";
  const sorted = [...auth.user.roleAssignments].sort(
    (a, b) => (b.role.priority ?? 0) - (a.role.priority ?? 0)
  );
  return sorted[0].role.name;
}

/**
 * Helper to create audit log from auth context.
 */
export async function auditFromAuth(
  auth: AuthContext,
  action: AuditAction,
  entityType: AuditResource,
  entityId: string,
  schoolId: string,
  options?: {
    metadata?: Record<string, unknown>;
    diff?: Record<string, unknown>;
  }
): Promise<void> {
  await logAuditEvent({
    schoolId,
    entityType,
    entityId,
    action,
    actorRole: getActorRole(auth),
    actorName: auth.user.displayName ?? auth.user.email,
    metadata: options?.metadata,
    diff: options?.diff,
  });
}

/**
 * Audit log for user creation.
 */
export async function auditUserCreate(
  auth: AuthContext,
  createdUserId: string,
  createdUserEmail: string,
  schoolId: string
): Promise<void> {
  await auditFromAuth(auth, "create", "user", createdUserId, schoolId, {
    metadata: { createdUserEmail },
  });
}

/**
 * Audit log for role assignment.
 */
export async function auditRoleAssign(
  auth: AuthContext,
  targetUserId: string,
  roleKey: string,
  schoolId: string
): Promise<void> {
  await auditFromAuth(auth, "assign", "role", targetUserId, schoolId, {
    metadata: { roleKey },
  });
}

/**
 * Audit log for mark entry/update.
 */
export async function auditMarkUpdate(
  auth: AuthContext,
  studentId: string,
  assessmentId: string,
  schoolId: string,
  oldValue?: number | null,
  newValue?: number | null
): Promise<void> {
  await auditFromAuth(auth, "update", "mark", studentId, schoolId, {
    metadata: { assessmentId },
    diff: { oldValue, newValue },
  });
}

/**
 * Audit log for assessment plan status change.
 */
export async function auditAssessmentPlanStatusChange(
  auth: AuthContext,
  planId: string,
  schoolId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  const action: AuditAction = newStatus === "Approved" || newStatus === "Locked"
    ? "approve"
    : newStatus === "Rejected"
      ? "reject"
      : "advance";

  await auditFromAuth(auth, action, "assessment_plan", planId, schoolId, {
    diff: { oldStatus, newStatus },
  });
}

/**
 * Audit log for registration decision.
 */
export async function auditRegistrationDecision(
  auth: AuthContext,
  registrationId: string,
  schoolId: string,
  decision: "Approved" | "Rejected"
): Promise<void> {
  await auditFromAuth(
    auth,
    decision === "Approved" ? "approve" : "reject",
    "registration",
    registrationId,
    schoolId
  );
}

/**
 * Audit log for school switching.
 */
export async function auditSchoolSwitch(
  auth: AuthContext,
  fromSchoolId: string | undefined,
  toSchoolId: string
): Promise<void> {
  await auditFromAuth(auth, "switch_school", "school", toSchoolId, toSchoolId, {
    metadata: { fromSchoolId },
  });
}

/**
 * Audit log for student data access (for POPIA compliance).
 */
export async function auditStudentAccess(
  auth: AuthContext,
  studentId: string,
  schoolId: string,
  accessType: "view" | "update" | "delete"
): Promise<void> {
  await auditFromAuth(auth, accessType, "student", studentId, schoolId);
}

/**
 * Audit log for report generation.
 */
export async function auditReportGeneration(
  auth: AuthContext,
  reportType: string,
  schoolId: string,
  filters?: Record<string, unknown>
): Promise<void> {
  await auditFromAuth(auth, "view", "report", reportType, schoolId, {
    metadata: { filters },
  });
}
