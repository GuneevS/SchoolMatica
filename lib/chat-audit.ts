import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/auth";

export type MessageAuditAction =
  | "read_thread"
  | "send_message"
  | "edit_message"
  | "delete_message"
  | "create_thread"
  | "archive_thread"
  | "add_participant"
  | "remove_participant"
  | "export_messages";

export interface MessageAuditEntry {
  schoolId: string;
  threadId: string;
  action: MessageAuditAction;
  actorId: string;
  actorRole: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
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
 * Log a message/chat audit event to the database.
 * This creates an audit trail for school compliance and POPIA requirements.
 * Non-blocking - won't throw errors to avoid disrupting operations.
 */
export async function logMessageAuditEvent(entry: MessageAuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        schoolId: entry.schoolId,
        entityType: "message",
        entityId: entry.threadId,
        action: entry.action,
        actorRole: entry.actorRole,
        actorName: entry.actorName ?? null,
        metadata: {
          ...entry.metadata,
          actorId: entry.actorId,
          auditType: "messaging",
        } as Record<string, unknown>,
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should not break operations
    console.error("Failed to log message audit event:", error);
  }
}

/**
 * Helper to create message audit log from auth context.
 */
export async function auditMessageAction(
  auth: AuthContext,
  action: MessageAuditAction,
  threadId: string,
  schoolId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logMessageAuditEvent({
    schoolId,
    threadId,
    action,
    actorId: auth.user.id,
    actorRole: getActorRole(auth),
    actorName: auth.user.displayName ?? auth.user.email ?? undefined,
    metadata,
  });
}

/**
 * Audit log for thread creation.
 */
export async function auditThreadCreate(
  auth: AuthContext,
  threadId: string,
  schoolId: string,
  threadType: string,
  participantCount: number
): Promise<void> {
  await auditMessageAction(auth, "create_thread", threadId, schoolId, {
    threadType,
    participantCount,
  });
}

/**
 * Audit log for message sent.
 */
export async function auditMessageSent(
  auth: AuthContext,
  threadId: string,
  messageId: string,
  schoolId: string,
  contentLength: number,
  hasAttachments: boolean
): Promise<void> {
  await auditMessageAction(auth, "send_message", threadId, schoolId, {
    messageId,
    contentLength,
    hasAttachments,
  });
}

/**
 * Audit log for message deletion.
 */
export async function auditMessageDelete(
  auth: AuthContext,
  threadId: string,
  messageId: string,
  schoolId: string,
  deletedByAdmin: boolean
): Promise<void> {
  await auditMessageAction(auth, "delete_message", threadId, schoolId, {
    messageId,
    deletedByAdmin,
  });
}

/**
 * Audit log for thread archival.
 */
export async function auditThreadArchive(
  auth: AuthContext,
  threadId: string,
  schoolId: string
): Promise<void> {
  await auditMessageAction(auth, "archive_thread", threadId, schoolId);
}

/**
 * Audit log for message export (for compliance requests).
 */
export async function auditMessageExport(
  auth: AuthContext,
  threadId: string,
  schoolId: string,
  messageCount: number,
  exportReason?: string
): Promise<void> {
  await auditMessageAction(auth, "export_messages", threadId, schoolId, {
    messageCount,
    exportReason,
  });
}
