import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditLogInput = {
  schoolId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorRole: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
  diff?: Record<string, unknown>;
};

export async function recordAuditLog(input: AuditLogInput) {
  await prisma.auditLog.create({
    data: {
      schoolId: input.schoolId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorRole: input.actorRole,
      actorName: input.actorName ?? null,
      metadata: (input.metadata as Prisma.JsonObject | undefined) ?? undefined,
      diff: (input.diff as Prisma.JsonObject | undefined) ?? undefined,
    },
  });
}

export async function recordAuditBatch(entries: AuditLogInput[]) {
  if (!entries.length) return;
  await prisma.auditLog.createMany({
    data: entries.map((entry) => ({
      schoolId: entry.schoolId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      actorRole: entry.actorRole,
      actorName: entry.actorName ?? null,
      metadata: (entry.metadata as Prisma.JsonObject | undefined) ?? undefined,
      diff: (entry.diff as Prisma.JsonObject | undefined) ?? undefined,
    })),
  });
}

