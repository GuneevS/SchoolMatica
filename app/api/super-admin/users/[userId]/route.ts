/**
 * Super Admin Single User API
 *
 * Provides user management for specific users across all schools.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authorizeSuperAdmin } from "@/lib/auth";

const updateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  schoolId: z.string().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ userId: string }>;
}

/**
 * GET /api/super-admin/users/:userId
 * Get detailed user information
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const result = await authorizeSuperAdmin(request);
  if ("error" in result) {
    return result.error;
  }

  const { userId } = await params;

  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      updatedAt: true,
      emailVerified: true,
      failedLoginAttempts: true,
      accountLockedUntil: true,
      school: { select: { id: true, name: true, shortCode: true } },
      roleAssignments: {
        include: {
          role: { select: { key: true, name: true, priority: true } },
        },
      },
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          bio: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    roles: user.roleAssignments.map((ra) => ({
      ...ra.role,
      scopeSchoolId: ra.scopeSchoolId,
      scopeClassId: ra.scopeClassId,
      assignedAt: ra.createdAt,
    })),
  });
}

/**
 * PATCH /api/super-admin/users/:userId
 * Update user information
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const result = await authorizeSuperAdmin(request);
  if ("error" in result) {
    return result.error;
  }

  const { userId } = await params;

  const json = await request.json();
  const parsed = updateUserSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Check if user exists
  const existing = await prisma.appUser.findUnique({
    where: { id: userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check for email conflict if changing email
  if (parsed.data.email && parsed.data.email !== existing.email) {
    const emailConflict = await prisma.appUser.findUnique({
      where: { email: parsed.data.email },
    });
    if (emailConflict) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }
  }

  // Build update data
  const updateData: {
    displayName?: string;
    email?: string;
    passwordHash?: string;
    schoolId?: string | null;
  } = {};

  if (parsed.data.displayName) updateData.displayName = parsed.data.displayName;
  if (parsed.data.email) updateData.email = parsed.data.email;
  if (parsed.data.password) {
    updateData.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }
  if (parsed.data.schoolId !== undefined) {
    updateData.schoolId = parsed.data.schoolId;
  }

  const user = await prisma.appUser.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      displayName: true,
      schoolId: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(user);
}

/**
 * DELETE /api/super-admin/users/:userId
 * Delete a user
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const result = await authorizeSuperAdmin(request);
  if ("error" in result) {
    return result.error;
  }

  const { userId } = await params;

  // Check if user exists with role information
  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    include: {
      roleAssignments: {
        include: { role: { select: { key: true } } },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent deletion of super admins through this endpoint
  const hasSuperAdminRole = user.roleAssignments.some(
    (ra) => ra.role.key === "super_admin"
  );

  if (hasSuperAdminRole) {
    return NextResponse.json(
      { error: "Cannot delete super admin users through this endpoint" },
      { status: 403 }
    );
  }

  // Delete user and related data in transaction
  await prisma.$transaction(async (tx) => {
    // Delete role assignments
    await tx.userRoleAssignment.deleteMany({ where: { userId } });

    // Delete sessions
    await tx.session.deleteMany({ where: { userId } });

    // Delete accounts (OAuth)
    await tx.account.deleteMany({ where: { userId } });

    // Delete the user
    await tx.appUser.delete({ where: { id: userId } });
  });

  return NextResponse.json({ success: true, deleted: userId });
}
