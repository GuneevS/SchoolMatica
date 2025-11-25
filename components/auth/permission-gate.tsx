"use client";

import { useAuth, useHasPermission, useHasSchoolAccess } from "@/lib/hooks/use-auth";
import { ReactNode } from "react";

interface PermissionGateProps {
  /** Permission key required to render children */
  permission?: string;
  /** Multiple permissions - user must have ALL of them */
  permissions?: string[];
  /** Multiple permissions - user must have ANY of them */
  anyPermission?: string[];
  /** School ID to check access for */
  schoolId?: string;
  /** Only show for admin users */
  adminOnly?: boolean;
  /** Content to render if permission check fails */
  fallback?: ReactNode;
  /** Children to render if permission check passes */
  children: ReactNode;
}

/**
 * Permission gate component for conditional rendering based on user permissions.
 * 
 * @example
 * // Single permission
 * <PermissionGate permission="teacher:create">
 *   <CreateTeacherButton />
 * </PermissionGate>
 * 
 * @example
 * // Multiple permissions (all required)
 * <PermissionGate permissions={["class:read", "student:read"]}>
 *   <ClassStudentView />
 * </PermissionGate>
 * 
 * @example
 * // Any of the permissions
 * <PermissionGate anyPermission={["assessmentPlan:approve", "system:admin"]}>
 *   <ApproveButton />
 * </PermissionGate>
 * 
 * @example
 * // School-specific access
 * <PermissionGate permission="class:read" schoolId={classGroup.schoolId}>
 *   <ClassDetails />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  permissions,
  anyPermission,
  schoolId,
  adminOnly,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { permissions: userPermissions, isAdmin, schoolIds, isLoading } = useAuth();

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // Admin check
  if (adminOnly && !isAdmin) {
    return <>{fallback}</>;
  }

  // School access check
  if (schoolId) {
    const hasAccess = isAdmin || schoolIds.includes(schoolId);
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  // Single permission check
  if (permission && !userPermissions.includes(permission)) {
    return <>{fallback}</>;
  }

  // All permissions check
  if (permissions && permissions.length > 0) {
    const hasAll = permissions.every((p) => userPermissions.includes(p));
    if (!hasAll) {
      return <>{fallback}</>;
    }
  }

  // Any permission check
  if (anyPermission && anyPermission.length > 0) {
    const hasAny = anyPermission.some((p) => userPermissions.includes(p));
    if (!hasAny) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Hook-based permission check for more complex scenarios.
 * Returns true if the user has the specified permission.
 */
export function usePermissionCheck(permission: string): boolean {
  const { permissions } = useAuth();
  return permissions.includes(permission);
}

/**
 * Hook to check multiple permissions at once.
 */
export function usePermissionsCheck(requiredPermissions: string[]): {
  hasAll: boolean;
  hasAny: boolean;
  missing: string[];
} {
  const { permissions } = useAuth();
  
  const hasAll = requiredPermissions.every((p) => permissions.includes(p));
  const hasAny = requiredPermissions.some((p) => permissions.includes(p));
  const missing = requiredPermissions.filter((p) => !permissions.includes(p));
  
  return { hasAll, hasAny, missing };
}

/**
 * Admin-only gate - simpler version for admin checks.
 */
export function AdminGate({
  fallback = null,
  children,
}: {
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * School access gate - checks if user has access to a specific school.
 */
export function SchoolAccessGate({
  schoolId,
  fallback = null,
  children,
}: {
  schoolId: string;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { schoolIds, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  const hasAccess = isAdmin || schoolIds.includes(schoolId);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
