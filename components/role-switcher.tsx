"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Shield, LogOut, ChevronDown, User } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export function RoleSwitcher() {
  const { user, activeRoleKey, setActiveRole, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="w-[160px] h-9 rounded-md border border-input bg-background animate-pulse" />
    );
  }

  if (!user) {
    return null;
  }

  // Get unique roles from assignments
  const uniqueRoles = Array.from(
    new Map(
      user.roleAssignments.map((ra) => [ra.role.key, ra.role])
    ).values()
  ).sort((a, b) => a.priority - b.priority);

  // If user has no roles or only one role, show dropdown with user options
  if (uniqueRoles.length <= 1) {
    const roleName = uniqueRoles[0]?.name ?? "No Role";
    const hasNoRole = uniqueRoles.length === 0;
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 h-auto">
            <Shield className="h-3.5 w-3.5" />
            <span>{roleName}</span>
            {isAdmin && <span className="text-xs text-muted-foreground">(Admin)</span>}
            <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user.displayName || user.email}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          {hasNoRole && (
            <>
              <div className="px-2 py-1.5 text-xs text-amber-600 bg-amber-50 rounded mx-1 mb-1">
                No role assigned. Contact admin for access.
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem asChild>
            <Link href="/login" className="flex items-center gap-2 cursor-pointer">
              <User className="h-4 w-4" />
              Switch Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Select value={activeRoleKey ?? undefined} onValueChange={setActiveRole}>
      <SelectTrigger className="w-[160px]">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Select role" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {uniqueRoles.map((role) => (
          <SelectItem key={role.key} value={role.key}>
            <div className="flex items-center gap-2">
              <span>{role.name}</span>
              {role.key === "system_admin" && (
                <Badge variant="secondary" className="text-xs">Admin</Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
