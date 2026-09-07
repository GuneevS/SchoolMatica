"use client";

import type { PermissionKey } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";

/**
 * Client-side permissions helpers.
 *
 * Used by the navigation, page guards, action buttons, and similar UI
 * surfaces to hide controls a user cannot use. Backed by the same
 * `NEXT_PUBLIC_DEMO_MODE` flag as the server-side `authorize` helpers:
 *
 *   - Demo mode ON (default)  → all UI is visible to any signed-in user.
 *   - Demo mode OFF           → real permission set / role checks apply.
 *
 * Note: these helpers are advisory. The authoritative checks live in API
 * route handlers — never trust a client-side gate for security.
 */

export interface ClientAuthContext {
  user: {
    id: string;
    email: string;
    displayName: string;
    schoolId: string;
    roleAssignments: Array<{
      role: {
        name: string;
        key: string;
        priority: number;
      };
      scopeSchoolId: string | null;
    }>;
  };
  permissions: string[];
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  schoolIds: string[];
}

function permissionsSet(auth: ClientAuthContext): Set<string> {
  return new Set(auth.permissions);
}

function isSuperOrSystemAdmin(auth: ClientAuthContext): boolean {
  if (auth.isSuperAdmin) return true;
  if (auth.isAdmin) return true;
  const perms = permissionsSet(auth);
  return perms.has("superadmin:access") || perms.has("system:admin");
}

/**
 * Check whether the current user has a specific permission.
 */
export function hasPermission(
  auth: ClientAuthContext | null,
  permission: PermissionKey,
): boolean {
  if (!auth) return false;
  if (isDemoMode()) return true;
  if (isSuperOrSystemAdmin(auth)) return true;
  return permissionsSet(auth).has(permission);
}

/** True if the user has *any* of the supplied permissions. */
export function hasAnyPermission(
  auth: ClientAuthContext | null,
  permissions: PermissionKey[],
): boolean {
  if (!auth) return false;
  if (isDemoMode()) return true;
  if (isSuperOrSystemAdmin(auth)) return true;
  const perms = permissionsSet(auth);
  return permissions.some((p) => perms.has(p));
}

/** True if the user has *all* of the supplied permissions. */
export function hasAllPermissions(
  auth: ClientAuthContext | null,
  permissions: PermissionKey[],
): boolean {
  if (!auth) return false;
  if (isDemoMode()) return true;
  if (isSuperOrSystemAdmin(auth)) return true;
  const perms = permissionsSet(auth);
  return permissions.every((p) => perms.has(p));
}

/**
 * Check whether the user is a system admin (cross-school access).
 */
export function isSystemAdmin(auth: ClientAuthContext | null): boolean {
  if (!auth) return false;
  if (isDemoMode()) return true;
  return isSuperOrSystemAdmin(auth);
}

/** Check whether the user has access to a specific school. */
export function hasSchoolAccess(
  auth: ClientAuthContext | null,
  schoolId: string,
): boolean {
  if (!auth) return false;
  if (isDemoMode()) return true;
  if (isSuperOrSystemAdmin(auth)) return true;
  return auth.schoolIds.includes(schoolId);
}

/**
 * Get the primary role name (highest priority) for the user.
 */
export function getPrimaryRole(auth: ClientAuthContext | null): string | null {
  if (!auth || !auth.user.roleAssignments.length) return null;
  const sorted = [...auth.user.roleAssignments].sort(
    (a, b) => b.role.priority - a.role.priority,
  );
  return sorted[0]?.role.name ?? null;
}

// ---------------------------------------------------------------------------
// Permission-based UI helpers
// ---------------------------------------------------------------------------

export interface PermissionGate {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/** Get permission gates for a specific CRUD resource. */
export function getResourcePermissions(
  auth: ClientAuthContext | null,
  resource: string,
): PermissionGate {
  return {
    canRead: hasPermission(auth, `${resource}:read` as PermissionKey),
    canCreate: hasPermission(auth, `${resource}:create` as PermissionKey),
    canUpdate: hasPermission(auth, `${resource}:update` as PermissionKey),
    canDelete: hasPermission(auth, `${resource}:delete` as PermissionKey),
  };
}

// ---------------------------------------------------------------------------
// Feature-based access
// ---------------------------------------------------------------------------

export interface FeatureAccess {
  canManageSchools: boolean;
  canManageUsers: boolean;
  canViewAllSchools: boolean;
  canApproveAssessments: boolean;
  canPublishReports: boolean;
  canViewAuditLogs: boolean;
  canManageTemplates: boolean;
}

const FALSE_FEATURES: FeatureAccess = {
  canManageSchools: false,
  canManageUsers: false,
  canViewAllSchools: false,
  canApproveAssessments: false,
  canPublishReports: false,
  canViewAuditLogs: false,
  canManageTemplates: false,
};

/** Map a user's permissions to high-level feature flags. */
export function getFeatureAccess(auth: ClientAuthContext | null): FeatureAccess {
  if (!auth) return FALSE_FEATURES;
  if (isDemoMode() || isSuperOrSystemAdmin(auth)) {
    return {
      canManageSchools: true,
      canManageUsers: true,
      canViewAllSchools: true,
      canApproveAssessments: true,
      canPublishReports: true,
      canViewAuditLogs: true,
      canManageTemplates: true,
    };
  }
  const perms = permissionsSet(auth);
  return {
    canManageSchools: perms.has("school:manage"),
    canManageUsers: perms.has("user:create") || perms.has("user:update"),
    canViewAllSchools: false,
    canApproveAssessments:
      perms.has("moderation:resolve") || perms.has("moderation:update"),
    canPublishReports: perms.has("report:publish"),
    canViewAuditLogs: perms.has("audit:read"),
    canManageTemplates:
      perms.has("template:create") || perms.has("template:update"),
  };
}

/** Get user's accessible school IDs. */
export function getAccessibleSchoolIds(auth: ClientAuthContext | null): string[] {
  if (!auth) return [];
  return auth.schoolIds;
}

/**
 * Filter items by the user's school access. In demo mode and for admins this
 * is a no-op; otherwise unscoped items are removed.
 */
export function filterBySchoolAccess<T extends { schoolId: string }>(
  auth: ClientAuthContext | null,
  items: T[],
): T[] {
  if (!auth) return [];
  if (isDemoMode() || isSuperOrSystemAdmin(auth)) return items;
  const accessible = new Set(auth.schoolIds);
  return items.filter((item) => accessible.has(item.schoolId));
}
