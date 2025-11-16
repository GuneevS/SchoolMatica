"use client";

import { useRoleStore, type UserRole } from "@/lib/stores/role-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const roles: UserRole[] = ["Teacher", "HOD", "SMT"];

export function RoleSwitcher() {
  const { role, setRole } = useRoleStore();
  return (
    <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
