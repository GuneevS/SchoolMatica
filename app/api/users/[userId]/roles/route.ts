import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, isSystemAdmin, hasSchoolAccess } from "@/lib/auth";

interface Params {
  params: Promise<{ userId: string }>;
}

const assignRoleSchema = z.object({
  roleKey: z.string(),
  scopeSchoolId: z.string().optional(),
});

/**
 * POST /api/users/[userId]/roles - Assign a role to a user
 */
export async function POST(request: NextRequest, { params }: Params) {
  const authResult = await authorizeWithSchool(request, "role:assign");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { userId } = await params;

  // Check if target user exists
  const targetUser = await prisma.appUser.findUnique({
    where: { id: userId },
    include: {
      roleAssignments: {
        include: { role: true },
      },
    },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const json = await request.json();
  const parsed = assignRoleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { roleKey, scopeSchoolId } = parsed.data;

  // Validate school access for scoped assignment
  if (scopeSchoolId && !hasSchoolAccess(auth, scopeSchoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  // Only system admins can assign system_admin role
  if (roleKey === "system_admin" && !isSystemAdmin(auth)) {
    return NextResponse.json({ error: "Only system admins can assign the system_admin role" }, { status: 403 });
  }

  // Get the role
  const role = await prisma.roleDefinition.findUnique({
    where: { key: roleKey },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  // Check if user already has this role assignment
  const existingAssignment = targetUser.roleAssignments.find(
    (ra) => ra.role.key === roleKey && ra.scopeSchoolId === (scopeSchoolId ?? null)
  );

  if (existingAssignment) {
    return NextResponse.json({ error: "User already has this role assignment" }, { status: 409 });
  }

  // Create the role assignment
  const assignment = await prisma.userRoleAssignment.create({
    data: {
      userId,
      roleId: role.id,
      scopeSchoolId: scopeSchoolId ?? null,
    },
    include: {
      role: true,
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}

/**
 * GET /api/users/[userId]/roles - Get user's role assignments
 */
export async function GET(request: NextRequest, { params }: Params) {
  const authResult = await authorizeWithSchool(request, "role:read");
  if ("error" in authResult) {
    return authResult.error;
  }

  const { userId } = await params;

  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    include: {
      roleAssignments: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user.roleAssignments);
}
