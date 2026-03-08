import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export interface ServerAuthContext {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    schoolId: string | null;
  };
  permissions: Set<string>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  schoolIds: string[];
  roleAssignments: Array<{
    role: {
      name: string;
      key: string;
      priority: number;
    };
    scopeSchoolId: string | null;
  }>;
}

/**
 * Get the current user's auth context on the server side.
 * This is cached per request using React's cache() function.
 */
export const getServerAuthContext = cache(async (): Promise<ServerAuthContext | null> => {
  try {
    // Use NextAuth session instead of headers
    const { auth } = await import("@/lib/auth-config");
    const session = await auth();

    if (!session?.user?.email) {
      return null;
    }

    const userEmail = session.user.email;

    const user = await prisma.appUser.findUnique({
      where: { email: userEmail },
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

    if (!user) {
      return null;
    }

    // Collect all permissions from all role assignments
    const permissions = new Set<string>();
    const schoolIds = new Set<string>();

    for (const assignment of user.roleAssignments) {
      // Add permissions from this role
      for (const rp of assignment.role.permissions) {
        permissions.add(rp.permission.key);
      }
      // Track school access from scoped assignments
      if (assignment.scopeSchoolId) {
        schoolIds.add(assignment.scopeSchoolId);
      }
    }

    // Add user's primary school if set
    if (user.schoolId) {
      schoolIds.add(user.schoolId);
    }

    // Check if user is a super admin (platform-level access)
    const isSuperAdmin =
      user.roleAssignments.some((ra) => ra.role.key === "super_admin") ||
      permissions.has("superadmin:access");
    // Check if user is a system admin (super admins inherit admin access)
    const isAdmin =
      isSuperAdmin ||
      user.roleAssignments.some((ra) => ra.role.key === "system_admin" || ra.role.key === "admin") ||
      user.roleAssignments.some((ra) =>
        ra.role.permissions.some((rp) => rp.permission.key === "system:admin")
      );

    return {
      user: {
        id: user.id,
        email: user.email || "",
        displayName: user.displayName,
        schoolId: user.schoolId,
      },
      permissions,
      isAdmin,
      isSuperAdmin,
      schoolIds: Array.from(schoolIds),
      roleAssignments: user.roleAssignments.map((ra) => ({
        role: {
          name: ra.role.name,
          key: ra.role.key,
          priority: ra.role.priority,
        },
        scopeSchoolId: ra.scopeSchoolId,
      })),
    };
  } catch (error) {
    console.error("Error getting server auth context:", error);
    return null;
  }
});

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const auth = await getServerAuthContext();
  if (!auth) return false;
  return auth.permissions.has(permission);
}

/**
 * Check if the current user has access to a specific school
 */
export async function hasServerSchoolAccess(schoolId: string): Promise<boolean> {
  const auth = await getServerAuthContext();
  if (!auth) return false;
  if (auth.isAdmin || auth.isSuperAdmin) return true;
  return auth.schoolIds.includes(schoolId);
}

/**
 * Get the active school for the current user, with auth validation.
 * Returns null if user doesn't have access to the requested school.
 */
export async function getAuthorizedActiveSchool() {
  const auth = await getServerAuthContext();
  if (!auth) {
    return null;
  }

  // Get school ID from cookie
  const cookieStore = await cookies();
  const schoolIdFromCookie = cookieStore.get("sm-school-id")?.value;

  // If cookie has a school ID, validate access
  if (schoolIdFromCookie) {
    if (auth.isAdmin || auth.isSuperAdmin || auth.schoolIds.includes(schoolIdFromCookie)) {
      const school = await prisma.school.findUnique({
        where: { id: schoolIdFromCookie },
        include: { gradingConfig: true },
      });
      return school;
    }
  }

  // Fallback to first accessible school
  if (auth.schoolIds.length > 0) {
    const school = await prisma.school.findUnique({
      where: { id: auth.schoolIds[0] },
      include: { gradingConfig: true },
    });
    return school;
  }

  // For admins/super admins with no specific assignments, get first school
  if (auth.isAdmin || auth.isSuperAdmin) {
    const school = await prisma.school.findFirst({
      include: { gradingConfig: true },
      orderBy: { createdAt: "desc" },
    });
    return school;
  }

  return null;
}

/**
 * Require authentication for a page. Throws if not authenticated.
 */
export async function requireAuth(): Promise<ServerAuthContext> {
  const auth = await getServerAuthContext();
  if (!auth) {
    throw new Error("Authentication required");
  }
  return auth;
}

/**
 * Require a specific permission for a page. Throws if not authorized.
 */
export async function requirePermission(permission: string): Promise<ServerAuthContext> {
  const auth = await requireAuth();
  // Admin and super admin bypass permission checks (consistent with authorize() in lib/auth.ts)
  if (auth.isAdmin || auth.isSuperAdmin) {
    return auth;
  }
  if (!auth.permissions.has(permission)) {
    throw new Error(`Permission required: ${permission}`);
  }
  return auth;
}

/**
 * Require access to a specific school. Throws if not authorized.
 */
export async function requireSchoolAccess(schoolId: string): Promise<ServerAuthContext> {
  const auth = await requireAuth();
  if (!auth.isAdmin && !auth.isSuperAdmin && !auth.schoolIds.includes(schoolId)) {
    throw new Error("Access denied to this school");
  }
  return auth;
}

/**
 * Require super admin access. Throws if not a super admin.
 */
export async function requireSuperAdmin(): Promise<ServerAuthContext> {
  const auth = await requireAuth();
  if (!auth.isSuperAdmin) {
    throw new Error("Super admin access required");
  }
  return auth;
}

/**
 * Check if current user is a super admin
 */
export async function isSuperAdminUser(): Promise<boolean> {
  const auth = await getServerAuthContext();
  return auth?.isSuperAdmin ?? false;
}
