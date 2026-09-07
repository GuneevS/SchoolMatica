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
import { handleApiError } from "@/lib/api-error-handler";

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

  try {
    const { userId } = await params;

    const user = await prisma.appUser.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, displayName: true, createdAt: true, updatedAt: true,
        emailVerified: true, failedLoginAttempts: true, accountLockedUntil: true,
        school: { select: { id: true, name: true, shortCode: true } },
        roleAssignments: { include: { role: { select: { key: true, name: true, priority: true } } } },
        teacher: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, bio: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      roles: user.roleAssignments.map((ra) => ({
        ...ra.role, scopeSchoolId: ra.scopeSchoolId, scopeClassId: ra.scopeClassId, assignedAt: ra.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError("GET super-admin/users/[userId]", error);
  }
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

  try {
    const { userId } = await params;
    const json = await request.json();
    const parsed = updateUserSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const existing = await prisma.appUser.findUnique({ where: { id: userId } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (parsed.data.email && parsed.data.email !== existing.email) {
      const emailConflict = await prisma.appUser.findUnique({ where: { email: parsed.data.email } });
      if (emailConflict) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
      }
    }

    const updateData: { displayName?: string; email?: string; passwordHash?: string; schoolId?: string | null } = {};
    if (parsed.data.displayName) updateData.displayName = parsed.data.displayName;
    if (parsed.data.email) updateData.email = parsed.data.email;
    if (parsed.data.password) updateData.passwordHash = await bcrypt.hash(parsed.data.password, 10);
    if (parsed.data.schoolId !== undefined) updateData.schoolId = parsed.data.schoolId;

    const user = await prisma.appUser.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, displayName: true, schoolId: true, updatedAt: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError("PATCH super-admin/users/[userId]", error);
  }
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

  try {
    const { userId } = await params;

    const user = await prisma.appUser.findUnique({
      where: { id: userId },
      include: { roleAssignments: { include: { role: { select: { key: true } } } } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.roleAssignments.some((ra) => ra.role.key === "super_admin")) {
      return NextResponse.json({ error: "Cannot delete super admin users through this endpoint" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.userRoleAssignment.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.appUser.delete({ where: { id: userId } });
    });

    return NextResponse.json({ success: true, deleted: userId });
  } catch (error) {
    return handleApiError("DELETE super-admin/users/[userId]", error);
  }
}
