"use client";

import type { PermissionKey } from "@/lib/auth";

/**
 * Client-side permissions helper
 * This should be used with data fetched from a /api/auth/me endpoint
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
  schoolIds: string[];
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(auth: ClientAuthContext | null, permission: PermissionKey): boolean {
  if (!auth) return false;
  return auth.permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(auth: ClientAuthContext | null, permissions: PermissionKey[]): boolean {
  if (!auth) return false;
  return permissions.some(p => auth.permissions.includes(p));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(auth: ClientAuthContext | null, permissions: PermissionKey[]): boolean {
  if (!auth) return false;
  return permissions.every(p => auth.permissions.includes(p));
}

/**
 * Check if user is a system admin
 */
export function isSystemAdmin(auth: ClientAuthContext | null): boolean {
  if (!auth) return false;
  return auth.isAdmin;
}

/**
 * Check if user has access to a specific school
 */
export function hasSchoolAccess(auth: ClientAuthContext | null, schoolId: string): boolean {
  if (!auth) return false;
  if (auth.isAdmin) return true;
  return auth.schoolIds.includes(schoolId);
}

/**
 * Get the primary role name
 */
export function getPrimaryRole(auth: ClientAuthContext | null): string | null {
  if (!auth || !auth.user.roleAssignments.length) return null;
  const sorted = [...auth.user.roleAssignments].sort((a, b) => b.role.priority - a.role.priority);
  return sorted[0]?.role.name ?? null;
}

/**
 * Permission-based UI helpers
 */

export interface PermissionGate {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/**
 * Get permission gates for a specific resource
 */
export function getResourcePermissions(
  auth: ClientAuthContext | null,
  resource: string
): PermissionGate {
  return {
    canRead: hasPermission(auth, `${resource}:read` as PermissionKey),
    canCreate: hasPermission(auth, `${resource}:create` as PermissionKey),
    canUpdate: hasPermission(auth, `${resource}:update` as PermissionKey),
    canDelete: hasPermission(auth, `${resource}:delete` as PermissionKey),
  };
}

/**
 * Role-based feature access
 */

export interface FeatureAccess {
  canManageSchools: boolean;
  canManageUsers: boolean;
  canViewAllSchools: boolean;
  canApproveAssessments: boolean;
  canPublishReports: boolean;
  canViewAuditLogs: boolean;
  canManageTemplates: boolean;
}

/**
 * Get feature access based on user's role and permissions
 */
export function getFeatureAccess(auth: ClientAuthContext | null): FeatureAccess {
  if (!auth) {
    return {
      canManageSchools: false,
      canManageUsers: false,
      canViewAllSchools: false,
      canApproveAssessments: false,
      canPublishReports: false,
      canViewAuditLogs: false,
      canManageTemplates: false,
    };
  }

  return {
    canManageSchools: hasAnyPermission(auth, ["school:create", "school:delete", "system:admin"]),
    canManageUsers: isSystemAdmin(auth),
    canViewAllSchools: isSystemAdmin(auth),
    canApproveAssessments: hasPermission(auth, "assessmentPlan:approve"),
    canPublishReports: hasPermission(auth, "report:publish"),
    canViewAuditLogs: hasPermission(auth, "audit:read"),
    canManageTemplates: hasAnyPermission(auth, ["template:create", "template:update", "template:delete"]),
  };
}

/**
 * Get user's accessible school IDs
 */
export function getAccessibleSchoolIds(auth: ClientAuthContext | null): string[] {
  if (!auth) return [];
  return auth.schoolIds;
}

/**
 * Filter items by school access
 */
export function filterBySchoolAccess<T extends { schoolId: string }>(
  auth: ClientAuthContext | null,
  items: T[]
): T[] {
  if (!auth) return [];
  if (isSystemAdmin(auth)) return items;
  
  const schoolIds = getAccessibleSchoolIds(auth);
  return items.filter(item => schoolIds.includes(item.schoolId));
}
