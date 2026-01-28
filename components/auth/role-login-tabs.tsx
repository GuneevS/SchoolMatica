"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Building2, GraduationCap, Users, UserCircle } from "lucide-react";

export type LoginRole = "school" | "teacher" | "parent" | "student";

interface RoleOption {
  id: LoginRole;
  label: string;
  description: string;
  icon: React.ElementType;
  activeGradient: string;
  iconBg: string;
}

const roleOptions: RoleOption[] = [
  {
    id: "school",
    label: "School Admin",
    description: "Administrative access",
    icon: Building2,
    activeGradient: "from-[hsl(var(--accent-violet))] to-[hsl(var(--accent-iris))]",
    iconBg: "bg-[hsl(var(--accent-violet))]/10 text-[hsl(var(--accent-violet))]",
  },
  {
    id: "teacher",
    label: "Teacher",
    description: "Educator portal",
    icon: GraduationCap,
    activeGradient: "from-[hsl(var(--accent-cobalt))] to-[hsl(var(--accent-iris))]",
    iconBg: "bg-[hsl(var(--accent-cobalt))]/10 text-[hsl(var(--accent-cobalt))]",
  },
  {
    id: "parent",
    label: "Parent",
    description: "Guardian access",
    icon: Users,
    activeGradient: "from-[hsl(var(--accent-mint))] to-[hsl(var(--success))]",
    iconBg: "bg-[hsl(var(--accent-mint))]/10 text-[hsl(var(--accent-mint))]",
  },
  {
    id: "student",
    label: "Student",
    description: "Learner portal",
    icon: UserCircle,
    activeGradient: "from-[hsl(var(--accent-flamingo))] to-[hsl(var(--accent-gold))]",
    iconBg: "bg-[hsl(var(--accent-flamingo))]/10 text-[hsl(var(--accent-flamingo))]",
  },
];

interface RoleLoginTabsProps {
  value: LoginRole;
  onChange: (role: LoginRole) => void;
  className?: string;
}

export function RoleLoginTabs({ value, onChange, className }: RoleLoginTabsProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop tabs - SOLID BACKGROUND */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-2 p-2 rounded-2xl bg-[hsl(var(--surface-strong))] border border-[hsl(var(--border-strong))] shadow-lg">
        {roleOptions.map((role) => {
          const Icon = role.icon;
          const isActive = value === role.id;

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onChange(role.id)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-200",
                isActive
                  ? `bg-gradient-to-br ${role.activeGradient} text-white shadow-lg`
                  : "bg-[hsl(var(--surface-soft))] hover:bg-[hsl(var(--surface-soft))]/80 text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "drop-shadow-sm")} />
              <span className="text-xs font-semibold">{role.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile vertical selector - SOLID BACKGROUND */}
      <div className="sm:hidden space-y-2">
        {roleOptions.map((role) => {
          const Icon = role.icon;
          const isActive = value === role.id;

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onChange(role.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                isActive
                  ? `bg-gradient-to-r ${role.activeGradient} text-white shadow-lg`
                  : "bg-[hsl(var(--surface-strong))] border border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--surface-soft))]"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-lg",
                  isActive
                    ? "bg-white/20"
                    : role.iconBg
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <p className={cn(
                  "text-sm font-semibold",
                  !isActive && "text-foreground"
                )}>
                  {role.label}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    isActive ? "text-white/80" : "text-muted-foreground"
                  )}
                >
                  {role.description}
                </p>
              </div>
              {isActive && (
                <div className="h-2 w-2 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { roleOptions };
