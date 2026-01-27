/**
 * Super Admin School Admin Provisioning API
 *
 * Creates an initial administrator account for a school.
 * This is the key workflow for onboarding new schools.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authorizeSuperAdmin } from "@/lib/auth";
import { randomBytes } from "crypto";

const provisionAdminSchema = z.object({
  email: z.string().email("Invalid email address"),
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  roleKey: z.enum(["admin", "smt"]).default("admin"),
  sendInvitation: z.boolean().default(false),
});

interface RouteParams {
  params: Promise<{ schoolId: string }>;
}

/**
 * POST /api/super-admin/schools/:schoolId/provision-admin
 * Create an administrator account for a school
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const result = await authorizeSuperAdmin(request);
  if ("error" in result) {
    return result.error;
  }

  const { schoolId } = await params;

  const json = await request.json();
  const parsed = provisionAdminSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Verify school exists
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });
  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  // Check if user already exists
  const existingUser = await prisma.appUser.findUnique({
    where: { email: parsed.data.email },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  // Get the role
  const role = await prisma.roleDefinition.findUnique({
    where: { key: parsed.data.roleKey },
  });
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 400 });
  }

  // Generate password if not provided
  const password = parsed.data.password ?? generateSecurePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  // Create admin user with role assignment in transaction
  const newAdmin = await prisma.$transaction(async (tx) => {
    // Create the user
    const user = await tx.appUser.create({
      data: {
        email: parsed.data.email,
        displayName: parsed.data.displayName,
        schoolId: schoolId,
        passwordHash,
      },
    });

    // Assign the admin role scoped to this school
    await tx.userRoleAssignment.create({
      data: {
        userId: user.id,
        roleId: role.id,
        scopeSchoolId: schoolId,
      },
    });

    // Create audit log entry
    await tx.auditLog.create({
      data: {
        schoolId: schoolId,
        entityType: "AppUser",
        entityId: user.id,
        action: "ADMIN_PROVISIONED",
        actorRole: "SuperAdmin",
        actorName: result.auth.user.displayName,
        metadata: {
          email: parsed.data.email,
          roleKey: parsed.data.roleKey,
          provisionedBy: result.auth.user.email,
        },
      },
    });

    return user;
  });

  // Prepare response
  const response: {
    success: boolean;
    user: {
      id: string;
      email: string | null;
      displayName: string;
      schoolId: string;
      role: string;
    };
    credentials?: {
      email: string | null;
      temporaryPassword: string;
    };
  } = {
    success: true,
    user: {
      id: newAdmin.id,
      email: newAdmin.email,
      displayName: newAdmin.displayName,
      schoolId: schoolId,
      role: parsed.data.roleKey,
    },
  };

  // If password was auto-generated, include it in response (one-time display)
  if (!parsed.data.password) {
    response.credentials = {
      email: newAdmin.email,
      temporaryPassword: password,
    };
  }

  return NextResponse.json(response, { status: 201 });
}

/**
 * GET /api/super-admin/schools/:schoolId/provision-admin
 * List all administrators for a school
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const result = await authorizeSuperAdmin(request);
  if ("error" in result) {
    return result.error;
  }

  const { schoolId } = await params;

  // Verify school exists
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });
  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  // Get all users with admin-level roles for this school
  const admins = await prisma.appUser.findMany({
    where: {
      roleAssignments: {
        some: {
          scopeSchoolId: schoolId,
          role: { key: { in: ["admin", "smt", "hod"] } },
        },
      },
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      updatedAt: true,
      roleAssignments: {
        where: { scopeSchoolId: schoolId },
        include: {
          role: {
            select: {
              key: true,
              name: true,
              priority: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(admins);
}

/**
 * Generate a secure temporary password
 */
function generateSecurePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  let password = "";
  for (const byte of bytes) {
    password += chars[byte % chars.length];
  }
  return password;
}
