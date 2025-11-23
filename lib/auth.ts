import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const PERMISSION_KEYS = [
  "assessmentPlan:read",
  "assessmentPlan:create",
  "assessmentPlan:update",
  "assessmentPlan:advance",
  "assessmentPlan:approve",
  "assessmentDocument:upload",
  "assessmentDocument:decide",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

const userInclude = {
  roleAssignments: {
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  },
} satisfies Prisma.AppUserInclude;

type RawAuthUser = Prisma.AppUserGetPayload<{
  include: typeof userInclude;
}> | null;

type AppUserWithRoles = NonNullable<RawAuthUser>;

export interface AuthContext {
  user: AppUserWithRoles;
  permissions: Set<PermissionKey>;
}

const permissionSet = new Set<PermissionKey>(PERMISSION_KEYS);

function deriveEmail(request: NextRequest) {
  return request.headers.get("x-user-email") ?? process.env.DEFAULT_USER_EMAIL ?? null;
}

function isPermissionKey(value: string): value is PermissionKey {
  return permissionSet.has(value as PermissionKey);
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const resolvedEmail = deriveEmail(request);
  let user: AppUserWithRoles | null = null;
  if (resolvedEmail) {
    user = await prisma.appUser.findUnique({
      where: { email: resolvedEmail },
      include: {
        roleAssignments: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });
  }
  if (!user) {
    return null;
  }

  const permissions = new Set<PermissionKey>();
  for (const assignment of user.roleAssignments) {
    for (const grant of assignment.role.permissions) {
      const key = `${grant.permission.resource}:${grant.permission.action}`;
      if (isPermissionKey(key)) {
        permissions.add(key);
      }
    }
  }

  return { user, permissions };
}

export type AuthorizationResult = { auth: AuthContext } | { error: NextResponse };

export async function authorize(request: NextRequest, permission: PermissionKey): Promise<AuthorizationResult> {
  const auth = await getAuthContext(request);
  if (!auth || !auth.permissions.has(permission)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { auth };
}

export function getPrimaryRoleName(auth: AuthContext): string | null {
  if (!auth.user.roleAssignments.length) {
    return null;
  }
  const [highest] = [...auth.user.roleAssignments].sort((a, b) => b.role.priority - a.role.priority);
  return highest?.role.name ?? null;
}
