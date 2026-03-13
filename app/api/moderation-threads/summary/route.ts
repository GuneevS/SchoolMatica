import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, getUserSchoolIds, isSystemAdmin } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// GET - Moderation summary/dashboard stats
export async function GET(request: NextRequest) {
  const authResult = await authorizeWithSchool(request, "moderation:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  // Scope to user's schools unless admin
  const schoolFilter: Prisma.ModerationThreadWhereInput = isSystemAdmin(auth)
    ? {}
    : {
        OR: [
          { assessmentPlan: { classGroup: { schoolId: { in: getUserSchoolIds(auth) } } } },
          { assessment: { assessmentPlan: { classGroup: { schoolId: { in: getUserSchoolIds(auth) } } } } },
        ],
      };

  const now = new Date();
  const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [byStatus, escalated, recentlyResolved, stale] = await Promise.all([
    // Count by status
    prisma.moderationThread.groupBy({
      by: ["status"],
      where: schoolFilter,
      _count: { id: true },
    }),
    // Escalated threads
    prisma.moderationThread.count({
      where: { ...schoolFilter, status: "Escalated" },
    }),
    // Resolved in last 7 days
    prisma.moderationThread.count({
      where: { ...schoolFilter, status: "Resolved", resolvedAt: { gte: day7 } },
    }),
    // Open threads older than 30 days (stale)
    prisma.moderationThread.count({
      where: { ...schoolFilter, status: "Open", createdAt: { lt: day30 } },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of byStatus) {
    statusMap[row.status] = row._count.id;
  }

  return NextResponse.json({
    generatedAt: now.toISOString(),
    summary: {
      open: statusMap["Open"] ?? 0,
      resolved: statusMap["Resolved"] ?? 0,
      escalated,
      total: Object.values(statusMap).reduce((sum, n) => sum + n, 0),
    },
    insights: {
      recentlyResolved,
      staleThreads: stale,
    },
  });
}
