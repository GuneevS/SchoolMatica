"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

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

  // If user has only one role, show it as a badge instead of dropdown
  if (uniqueRoles.length <= 1) {
    const roleName = uniqueRoles[0]?.name ?? "No Role";
    return (
      <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
        <Shield className="h-3.5 w-3.5" />
        <span>{roleName}</span>
        {isAdmin && <span className="text-xs text-muted-foreground">(Admin)</span>}
      </Badge>
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
