"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export interface RoleAssignment {
  role: {
    name: string;
    key: string;
    priority: number;
  };
  scopeSchoolId: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  schoolId: string | null;
  roleAssignments: RoleAssignment[];
}

export interface AuthContextData {
  user: AuthUser | null;
  permissions: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  schoolIds: string[];
  activeRoleKey: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setActiveRole: (roleKey: string) => void;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

const ACTIVE_ROLE_COOKIE = "sm-active-role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [schoolIds, setSchoolIds] = useState<string[]>([]);
  const [activeRoleKey, setActiveRoleKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          setPermissions([]);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setSchoolIds([]);
          return;
        }
        throw new Error("Failed to fetch auth context");
      }

      const data = await response.json();
      setUser(data.user);
      setPermissions(data.permissions);
      setIsAdmin(data.isAdmin);
      setIsSuperAdmin(data.isSuperAdmin ?? false);
      setSchoolIds(data.schoolIds);

      // Set active role from cookie or default to highest priority role
      const savedRole = getCookie(ACTIVE_ROLE_COOKIE);
      const validRoleKeys = data.user.roleAssignments.map((ra: RoleAssignment) => ra.role.key);

      if (savedRole && validRoleKeys.includes(savedRole)) {
        setActiveRoleKey(savedRole);
      } else if (data.user.roleAssignments.length > 0) {
        // Default to highest priority role (lowest priority number)
        const sortedRoles = [...data.user.roleAssignments].sort(
          (a: RoleAssignment, b: RoleAssignment) => a.role.priority - b.role.priority
        );
        const defaultRole = sortedRoles[0].role.key;
        setActiveRoleKey(defaultRole);
        setCookie(ACTIVE_ROLE_COOKIE, defaultRole);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuth();
  }, [fetchAuth]);

  const setActiveRole = useCallback((roleKey: string) => {
    if (user) {
      const validRoleKeys = user.roleAssignments.map((ra) => ra.role.key);
      if (validRoleKeys.includes(roleKey)) {
        setActiveRoleKey(roleKey);
        setCookie(ACTIVE_ROLE_COOKIE, roleKey);
      }
    }
  }, [user]);

  // Using AuthContext directly for React 19 compatibility
  const contextValue = {
    user,
    permissions,
    isAdmin,
    isSuperAdmin,
    schoolIds,
    activeRoleKey,
    isLoading,
    error,
    refetch: fetchAuth,
    setActiveRole,
  };

  return (
    <AuthContext value= { contextValue } >
    { children }
    </AuthContext>
  );
}

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper to check if user has a specific permission
export function useHasPermission(permission: string): boolean {
  const { permissions } = useAuth();
  return permissions.includes(permission);
}

// Helper to check if user has access to a specific school
export function useHasSchoolAccess(schoolId: string): boolean {
  const { schoolIds, isAdmin } = useAuth();
  return isAdmin || schoolIds.includes(schoolId);
}

// Helper to get user's role for current school
export function useCurrentRole(): RoleAssignment | null {
  const { user, activeRoleKey } = useAuth();
  if (!user || !activeRoleKey) return null;
  return user.roleAssignments.find((ra) => ra.role.key === activeRoleKey) ?? null;
}

// Cookie helpers
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() ?? null;
  }
  return null;
}

function setCookie(name: string, value: string, days = 30): void {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const secure = process.env.NODE_ENV === "production" ? ";Secure" : "";
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax${secure}`;
}
