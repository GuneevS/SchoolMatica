/**
 * Super Admin User Role Assignment API
 *
 * Manages individual role assignments.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeSuperAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

interface RouteParams {
  params: Promise<{ userId: string; assignmentId: string }>;
}

/**
 * DELETE /api/super-admin/users/:userId/roles/:assignmentId
 * Remove a role assignment from a user
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const result = await authorizeSuperAdmin(request);
  if ("error" in result) {
    return result.error;
  }

  try {
    const { userId, assignmentId } = await params;

    const assignment = await prisma.userRoleAssignment.findFirst({
      where: { id: assignmentId, userId },
      include: { role: { select: { key: true, name: true } } },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Role assignment not found" }, { status: 404 });
    }

    if (assignment.role.key === "super_admin") {
      return NextResponse.json({ error: "Cannot remove super admin role through this endpoint" }, { status: 403 });
    }

    await prisma.userRoleAssignment.delete({ where: { id: assignmentId } });

    if (assignment.scopeSchoolId) {
      await prisma.auditLog.create({
        data: {
          schoolId: assignment.scopeSchoolId,
          entityType: "UserRoleAssignment",
          entityId: assignmentId,
          action: "ROLE_REMOVED",
          actorRole: "SuperAdmin",
          actorName: result.auth.user.displayName,
          metadata: { userId, roleKey: assignment.role.key, scopeSchoolId: assignment.scopeSchoolId, removedBy: result.auth.user.email },
        },
      });
    }

    return NextResponse.json({ success: true, deleted: assignmentId });
  } catch (error) {
    return handleApiError("DELETE super-admin/users/[userId]/roles/[assignmentId]", error);
  }
}
