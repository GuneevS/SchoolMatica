/**
 * Super Admin User Roles API
 *
 * Manages role assignments for users.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeSuperAdmin } from "@/lib/auth";

const addRoleSchema = z.object({
  roleKey: z.string().min(1, "Role key is required"),
  scopeSchoolId: z.string().nullable().optional(),
});

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/super-admin/users/:userId/roles
 * Get all role assignments for a user
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const result = await authorizeSuperAdmin(request);
  if ("error" in result) {
    return result.error;
  }

  const { userId } = await params;

  const assignments = await prisma.userRoleAssignment.findMany({
    where: { userId },
    include: {
      role: { select: { key: true, name: true, priority: true } },
      scopeSchool: { select: { id: true, name: true, shortCode: true } },
    },
    orderBy: { role: { priority: "desc" } },
  });

  return NextResponse.json(assignments);
}

/**
 * POST /api/super-admin/users/:userId/roles
 * Add a role assignment to a user
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const result = await authorizeSuperAdmin(request);
  if ("error" in result) {
    return result.error;
  }

  const { userId } = await params;

  const json = await request.json();
  const parsed = addRoleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Verify user exists
  const user = await prisma.appUser.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get the role
  const role = await prisma.roleDefinition.findUnique({
    where: { key: parsed.data.roleKey },
  });
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  // Prevent adding super_admin role through this endpoint
  if (role.key === "super_admin") {
    return NextResponse.json(
      { error: "Cannot assign super admin role through this endpoint" },
      { status: 403 }
    );
  }

  // Verify school exists if scoped
  if (parsed.data.scopeSchoolId) {
    const school = await prisma.school.findUnique({
      where: { id: parsed.data.scopeSchoolId },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
  }

  // Check if assignment already exists
  const existing = await prisma.userRoleAssignment.findFirst({
    where: {
      userId,
      roleId: role.id,
      scopeSchoolId: parsed.data.scopeSchoolId ?? null,
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "User already has this role assignment" },
      { status: 409 }
    );
  }

  // Create the assignment
  const assignment = await prisma.userRoleAssignment.create({
    data: {
      userId,
      roleId: role.id,
      scopeSchoolId: parsed.data.scopeSchoolId ?? null,
    },
    include: {
      role: { select: { key: true, name: true, priority: true } },
      scopeSchool: { select: { id: true, name: true, shortCode: true } },
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      schoolId: parsed.data.scopeSchoolId ?? null,
      entityType: "UserRoleAssignment",
      entityId: assignment.id,
      action: "ROLE_ASSIGNED",
      actorRole: "SuperAdmin",
      actorName: result.auth.user.displayName,
      metadata: {
        userId,
        roleKey: role.key,
        scopeSchoolId: parsed.data.scopeSchoolId,
        assignedBy: result.auth.user.email,
      },
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}
