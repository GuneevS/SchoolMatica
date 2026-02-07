"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  ArrowLeftRight,
  Shield,
  Users,
  GraduationCap,
  Check,
} from "lucide-react";
import { UserAvatar, getRoleDisplayName, type UserRole } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";

export interface RoleAssignment {
  role: {
    name: string;
    key: string;
    priority: number;
  };
  scopeSchoolId: string | null;
}

export interface UserProfileMenuProps {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    profilePictureUrl?: string | null;
    image?: string | null;
  };
  roleAssignments?: RoleAssignment[];
  activeRoleKey?: string | null;
  onRoleChange?: (roleKey: string) => void;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  portalType?: "staff" | "parent" | "student" | "super-admin";
  showSettings?: boolean;
  showSwitchPortal?: boolean;
  className?: string;
}

const portalConfig = {
  staff: {
    settingsPath: "/settings/profile",
    dashboardPath: "/dashboard",
    icon: Users,
  },
  parent: {
    settingsPath: "/parent/settings",
    dashboardPath: "/parent",
    icon: Users,
  },
  student: {
    settingsPath: "/student/settings",
    dashboardPath: "/student",
    icon: GraduationCap,
  },
  "super-admin": {
    settingsPath: "/super-admin/settings",
    dashboardPath: "/super-admin",
    icon: Shield,
  },
};

export function UserProfileMenu({
  user,
  roleAssignments = [],
  activeRoleKey,
  onRoleChange,
  isAdmin = false,
  isSuperAdmin = false,
  portalType = "staff",
  showSettings = true,
  showSwitchPortal = true,
  className,
}: UserProfileMenuProps) {
  const profilePicture = user.profilePictureUrl || user.image;
  const displayName = user.displayName || user.email.split("@")[0];
  
  // Get primary role for display
  const primaryRole = React.useMemo(() => {
    if (activeRoleKey) {
      const assignment = roleAssignments.find((ra) => ra.role.key === activeRoleKey);
      if (assignment) return assignment.role;
    }
    if (roleAssignments.length > 0) {
      const sorted = [...roleAssignments].sort((a, b) => a.role.priority - b.role.priority);
      return sorted[0].role;
    }
    return null;
  }, [roleAssignments, activeRoleKey]);

  const roleKey = primaryRole?.key || (isSuperAdmin ? "super_admin" : isAdmin ? "admin" : "default");
  const config = portalConfig[portalType];
  const hasMultipleRoles = roleAssignments.length > 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 h-auto hover:bg-slate-100/60 rounded-2xl transition-all",
            className
          )}
        >
          <UserAvatar
            src={profilePicture}
            name={displayName}
            email={user.email}
            role={roleKey as UserRole}
            size="sm"
            showRing={true}
          />
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
              {displayName}
            </span>
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              {primaryRole ? getRoleDisplayName(primaryRole.key) : "User"}
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 bg-white border shadow-lg rounded-xl p-1">
        {/* User info header */}
        <div className="px-3 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={profilePicture}
              name={displayName}
              email={user.email}
              role={roleKey as UserRole}
              size="lg"
              showRing={true}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
              {primaryRole && (
                <Badge 
                  variant="secondary" 
                  className="mt-1 text-[10px] px-1.5 py-0"
                >
                  {getRoleDisplayName(primaryRole.key)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Role switcher (if multiple roles) */}
        {hasMultipleRoles && onRoleChange && (
          <>
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 pt-2">
              Switch Role
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {roleAssignments
                .sort((a, b) => a.role.priority - b.role.priority)
                .map((assignment) => (
                  <DropdownMenuItem
                    key={assignment.role.key}
                    onClick={() => onRoleChange(assignment.role.key)}
                    className="flex items-center justify-between px-3 py-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        name={displayName}
                        role={assignment.role.key as UserRole}
                        size="xs"
                        showRing={true}
                      />
                      <span className="text-sm">{getRoleDisplayName(assignment.role.key)}</span>
                    </div>
                    {activeRoleKey === assignment.role.key && (
                      <Check className="h-4 w-4 text-emerald-500" />
                    )}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Quick actions */}
        <DropdownMenuGroup>
          {showSettings && (
            <DropdownMenuItem asChild>
              <Link
                href={config.settingsPath}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>Profile Settings</span>
              </Link>
            </DropdownMenuItem>
          )}

          {portalType === "staff" && (
            <DropdownMenuItem asChild>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 cursor-pointer"
              >
                <Settings className="h-4 w-4" />
                <span>System Settings</span>
              </Link>
            </DropdownMenuItem>
          )}

          {isSuperAdmin && portalType !== "super-admin" && (
            <DropdownMenuItem asChild>
              <Link
                href="/super-admin"
                className="flex items-center gap-2 px-3 py-2 text-violet-600 cursor-pointer"
              >
                <Shield className="h-4 w-4" />
                <span>Super Admin</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Portal switching and logout */}
        <DropdownMenuGroup>
          {showSwitchPortal && (
            <DropdownMenuItem asChild>
              <Link
                href="/login"
                className="flex items-center gap-2 px-3 py-2 cursor-pointer"
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span>Switch Account</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 px-3 py-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
