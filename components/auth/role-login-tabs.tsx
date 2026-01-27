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
    activeGradient: "from-violet-500 to-purple-600",
    iconBg: "bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400",
  },
  {
    id: "teacher",
    label: "Teacher",
    description: "Educator portal",
    icon: GraduationCap,
    activeGradient: "from-blue-500 to-cyan-600",
    iconBg: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
  },
  {
    id: "parent",
    label: "Parent",
    description: "Guardian access",
    icon: Users,
    activeGradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "student",
    label: "Student",
    description: "Learner portal",
    icon: UserCircle,
    activeGradient: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400",
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
      <div className="hidden sm:grid sm:grid-cols-4 gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg">
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
                  : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
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
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
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
                  !isActive && "text-slate-900 dark:text-white"
                )}>
                  {role.label}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    isActive ? "text-white/80" : "text-slate-500 dark:text-slate-400"
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
