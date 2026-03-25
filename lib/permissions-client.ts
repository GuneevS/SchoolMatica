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
  isSuperAdmin?: boolean;
  schoolIds: string[];
}

/**
 * Check if user has a specific permission
 * DEMO BYPASS: Always return true so all UI is visible
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function hasPermission(auth: ClientAuthContext | null, permission: PermissionKey): boolean {
  if (!auth) return false;
  return true;
}

/**
 * Check if user has any of the specified permissions
 * DEMO BYPASS: Always return true
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function hasAnyPermission(auth: ClientAuthContext | null, permissions: PermissionKey[]): boolean {
  if (!auth) return false;
  return true;
}

/**
 * Check if user has all of the specified permissions
 * DEMO BYPASS: Always return true
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function hasAllPermissions(auth: ClientAuthContext | null, permissions: PermissionKey[]): boolean {
  if (!auth) return false;
  return true;
}

/**
 * Check if user is a system admin
 * DEMO BYPASS: Return true so admin panels are visible
 */
export function isSystemAdmin(auth: ClientAuthContext | null): boolean {
  if (!auth) return false;
  return true;
}

/**
 * Check if user has access to a specific school
 * DEMO BYPASS: For demo purposes, allow access to view everything, but usually this remains mapped to user.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function hasSchoolAccess(auth: ClientAuthContext | null, schoolId: string): boolean {
  if (!auth) return false;
  return true;
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

  // DEMO BYPASS: Enable all features
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

/**
 * Get user's accessible school IDs
 */
export function getAccessibleSchoolIds(auth: ClientAuthContext | null): string[] {
  if (!auth) return [];
  return auth.schoolIds;
}

/**
 * Filter items by school access
 * DEMO BYPASS: Don't restrict viewing logic (all items accessible)
 */
export function filterBySchoolAccess<T extends { schoolId: string }>(
  auth: ClientAuthContext | null,
  items: T[]
): T[] {
  if (!auth) return [];
  return items;
}
