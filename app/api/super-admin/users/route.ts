/**
 * Super Admin Users API
 *
 * Provides user management capabilities across all schools for super administrators.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authorizeSuperAdmin } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  password: z.string().min(8),
  schoolId: z.string().optional().nullable(),
  roleKey: z.string().optional(),
});

/**
 * GET /api/super-admin/users
 * List all users across the platform with filtering
 */
export async function GET(request: NextRequest) {
  const result = await authorizeSuperAdmin(request);
  if ("error" in result) {
    return result.error;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const schoolId = searchParams.get("schoolId");
  const roleKey = searchParams.get("roleKey");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const where: Prisma.AppUserWhereInput = {};

  // Search filter
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { displayName: { contains: search, mode: "insensitive" } },
    ];
  }

  // School filter
  if (schoolId) {
    if (schoolId === "null") {
      where.schoolId = null;
    } else {
      where.schoolId = schoolId;
    }
  }

  // Role filter
  if (roleKey) {
    where.roleAssignments = {
      some: {
        role: { key: roleKey },
      },
    };
  }

  const [users, total] = await Promise.all([
    prisma.appUser.findMany({
      where,
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
        school: { select: { id: true, name: true, shortCode: true } },
        roleAssignments: {
          include: {
            role: { select: { key: true, name: true, priority: true } },
          },
        },
        teacher: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appUser.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      school: user.school,
      roles: user.roleAssignments.map((ra) => ({
        ...ra.role,
        scopeSchoolId: ra.scopeSchoolId,
      })),
      teacher: user.teacher,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

/**
 * POST /api/super-admin/users
 * Create a new user (platform-level)
 */
export async function POST(request: NextRequest) {
  const result = await authorizeSuperAdmin(request);
  if ("error" in result) {
    return result.error;
  }

  const json = await request.json();
  const parsed = createUserSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Check for existing user
  const existing = await prisma.appUser.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  // Verify school exists if provided
  if (parsed.data.schoolId) {
    const school = await prisma.school.findUnique({
      where: { id: parsed.data.schoolId },
    });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.appUser.create({
      data: {
        email: parsed.data.email,
        displayName: parsed.data.displayName,
        schoolId: parsed.data.schoolId ?? null,
        passwordHash,
      },
    });

    // Assign role if specified
    if (parsed.data.roleKey) {
      const role = await tx.roleDefinition.findUnique({
        where: { key: parsed.data.roleKey },
      });
      if (role) {
        await tx.userRoleAssignment.create({
          data: {
            userId: newUser.id,
            roleId: role.id,
            scopeSchoolId: parsed.data.schoolId ?? null,
          },
        });
      }
    }

    return newUser;
  });

  return NextResponse.json(
    {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      schoolId: user.schoolId,
    },
    { status: 201 }
  );
}
