import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-config"; // Import from new config
import type { Prisma } from "@prisma/client";

export const PERMISSION_KEYS = [
  // Assessment Plans
  "assessmentPlan:read",
  "assessmentPlan:create",
  "assessmentPlan:update",
  "assessmentPlan:delete",
  "assessmentPlan:advance",
  "assessmentPlan:approve",

  // Assessment Documents
  "assessmentDocument:read",
  "assessmentDocument:upload",
  "assessmentDocument:decide",
  "assessmentDocument:delete",

  // Assessments
  "assessment:read",
  "assessment:create",
  "assessment:update",
  "assessment:delete",

  // Marks
  "mark:read",
  "mark:create",
  "mark:update",
  "mark:delete",

  // Classes
  "class:read",
  "class:create",
  "class:update",
  "class:delete",
  "class:manage",

  // Students
  "student:read",
  "student:create",
  "student:update",
  "student:delete",

  // Teachers
  "teacher:read",
  "teacher:create",
  "teacher:update",
  "teacher:delete",

  // Schools
  "school:read",
  "school:create",
  "school:update",
  "school:delete",
  "school:manage",

  // Subjects
  "subject:read",
  "subject:create",
  "subject:update",
  "subject:delete",

  // Reports
  "report:read",
  "report:generate",
  "report:publish",

  // Registrations
  "registration:read",
  "registration:create",
  "registration:update",
  "registration:decide",

  // Audit Logs
  "audit:read",

  // Moderation
  "moderation:read",
  "moderation:create",
  "moderation:update",
  "moderation:resolve",

  // Timetables
  "timetable:read",
  "timetable:create",
  "timetable:update",
  "timetable:delete",

  // Curriculum Templates
  "template:read",
  "template:create",
  "template:update",
  "template:delete",

  // Grade Levels
  "gradeLevel:read",
  "gradeLevel:create",
  "gradeLevel:update",
  "gradeLevel:delete",

  // Grading Configuration
  "gradingConfig:read",
  "gradingConfig:update",

  // User Management
  "user:read",
  "user:create",
  "user:update",
  "user:delete",
  "role:read",
  "role:assign",
  "role:remove",

  // System Admin - cross-school access
  "system:admin",

  // Super Admin - platform-level management
  "superadmin:access",         // Access super admin dashboard
  "superadmin:schools",        // Create, configure, and manage all schools
  "superadmin:users",          // Manage all users across all schools
  "superadmin:provision",      // Provision new schools with initial admin
  "superadmin:impersonate",    // Impersonate any user (for debugging)
  "superadmin:settings",       // Platform-wide settings
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

function isPermissionKey(value: string): value is PermissionKey {
  return permissionSet.has(value as PermissionKey);
}

export async function getAuthContext(request?: NextRequest): Promise<AuthContext | null> {
  const session = await auth();

  if (!session || !session.user?.email) {
    return null;
  }

  const user = await prisma.appUser.findUnique({
    where: { email: session.user.email },
    include: userInclude,
  });

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
  if (!auth) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!auth.permissions.has(permission) && !isSystemAdmin(auth) && !isSuperAdmin(auth)) {
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

export function getPrimaryRoleKey(auth: AuthContext): string | null {
  if (!auth.user.roleAssignments.length) {
    return null;
  }
  const [highest] = [...auth.user.roleAssignments].sort((a, b) => b.role.priority - a.role.priority);
  return highest?.role.key ?? null;
}

/**
 * Check if user is a system admin with cross-school access
 */
export function isSystemAdmin(auth: AuthContext): boolean {
  return auth.permissions.has("system:admin") || isSuperAdmin(auth);
}

/**
 * Check if user is a super admin with full platform access
 * Super admins have unrestricted access to all functionality
 */
export function isSuperAdmin(auth: AuthContext): boolean {
  return auth.permissions.has("superadmin:access");
}

/**
 * Get the school IDs that the user has access to
 */
export function getUserSchoolIds(auth: AuthContext): string[] {
  if (isSystemAdmin(auth)) {
    return []; // Empty array means all schools
  }

  const schoolIds = new Set<string>();
  for (const assignment of auth.user.roleAssignments) {
    if (assignment.scopeSchoolId) {
      schoolIds.add(assignment.scopeSchoolId);
    }
  }

  // Fallback to user's primary school
  if (schoolIds.size === 0 && auth.user.schoolId) {
    schoolIds.add(auth.user.schoolId);
  }

  return Array.from(schoolIds);
}

/**
 * Check if user has access to a specific school
 */
export function hasSchoolAccess(auth: AuthContext, schoolId: string): boolean {
  if (isSystemAdmin(auth)) {
    return true;
  }

  const schoolIds = getUserSchoolIds(auth);
  return schoolIds.includes(schoolId);
}

/**
 * Validate that a schoolId is accessible by the user
 * Returns error response if not authorized
 */
export function validateSchoolAccess(auth: AuthContext, schoolId: string | null | undefined): { error: NextResponse } | { schoolId: string } {
  if (!schoolId) {
    return { error: NextResponse.json({ error: "School ID is required" }, { status: 400 }) };
  }

  if (!hasSchoolAccess(auth, schoolId)) {
    return { error: NextResponse.json({ error: "Access denied to this school" }, { status: 403 }) };
  }

  return { schoolId };
}

/**
 * Get the primary school for the user (for creating new resources)
 */
export function getPrimarySchoolId(auth: AuthContext): string | null {
  if (isSystemAdmin(auth)) {
    return null; // Admin must specify school
  }

  return auth.user.schoolId;
}

/**
 * Enhanced authorization that checks both permission and school access
 */
export async function authorizeWithSchool(
  request: NextRequest,
  permission: PermissionKey,
  schoolId?: string
): Promise<{ auth: AuthContext; schoolId?: string } | { error: NextResponse }> {
  const auth = await getAuthContext(request);

  if (!auth) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!auth.permissions.has(permission) && !isSystemAdmin(auth) && !isSuperAdmin(auth)) {
    return { error: NextResponse.json({ error: "Forbidden - insufficient permissions" }, { status: 403 }) };
  }

  // If schoolId is provided, validate access
  if (schoolId) {
    if (!hasSchoolAccess(auth, schoolId)) {
      return { error: NextResponse.json({ error: "Access denied to this school" }, { status: 403 }) };
    }
    return { auth, schoolId };
  }

  return { auth };
}

/**
 * Check multiple permissions at once
 */
export function hasAnyPermission(auth: AuthContext, permissions: PermissionKey[]): boolean {
  return permissions.some(p => auth.permissions.has(p));
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(auth: AuthContext, permissions: PermissionKey[]): boolean {
  return permissions.every(p => auth.permissions.has(p));
}

/**
 * Authorization for super admin only routes
 * Returns error if user is not a super admin
 */
export async function authorizeSuperAdmin(
  request: NextRequest
): Promise<{ auth: AuthContext } | { error: NextResponse }> {
  const authContext = await getAuthContext(request);

  if (!authContext) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!isSuperAdmin(authContext)) {
    return { error: NextResponse.json({ error: "Super admin access required" }, { status: 403 }) };
  }

  return { auth: authContext };
}

/**
 * Get the current school context for the user
 * Super admins can switch between schools using a cookie
 * Regular users are bound to their assigned schools
 */
export function getCurrentSchoolContext(auth: AuthContext, request: NextRequest): string | null {
  // Super admins can have a selected school context from cookie
  if (isSuperAdmin(auth)) {
    const schoolCookie = request.cookies.get("sm-school-id");
    if (schoolCookie?.value) {
      return schoolCookie.value;
    }
    // Super admin without selected school - return null (all schools view)
    return null;
  }

  // Regular users use their primary school
  return auth.user.schoolId ?? null;
}
