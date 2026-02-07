"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type UserRole = 
  | "super_admin" 
  | "admin" 
  | "principal" 
  | "deputy" 
  | "hod" 
  | "smt"
  | "teacher" 
  | "parent" 
  | "student" 
  | "clerk"
  | "secretary"
  | "bursar"
  | "finance"
  | "default";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  role?: UserRole | string;
  size?: AvatarSize;
  showRing?: boolean;
  showStatus?: boolean;
  status?: "online" | "away" | "busy" | "offline";
  className?: string;
  ringClassName?: string;
  onClick?: () => void;
}

const sizeConfig: Record<AvatarSize, { avatar: string; text: string; ring: string; status: string }> = {
  xs: { avatar: "h-6 w-6", text: "text-[10px]", ring: "ring-[2px]", status: "h-1.5 w-1.5 ring-1" },
  sm: { avatar: "h-8 w-8", text: "text-xs", ring: "ring-[2px]", status: "h-2 w-2 ring-1" },
  md: { avatar: "h-10 w-10", text: "text-sm", ring: "ring-[3px]", status: "h-2.5 w-2.5 ring-2" },
  lg: { avatar: "h-12 w-12", text: "text-base", ring: "ring-[3px]", status: "h-3 w-3 ring-2" },
  xl: { avatar: "h-16 w-16", text: "text-lg", ring: "ring-4", status: "h-3.5 w-3.5 ring-2" },
  "2xl": { avatar: "h-24 w-24", text: "text-2xl", ring: "ring-4", status: "h-4 w-4 ring-2" },
};

const roleGradients: Record<string, string> = {
  super_admin: "from-violet-500 via-purple-500 to-fuchsia-500",
  admin: "from-blue-600 via-indigo-500 to-violet-500",
  principal: "from-blue-600 via-indigo-500 to-violet-500",
  deputy: "from-cyan-500 via-teal-500 to-emerald-500",
  hod: "from-teal-500 via-cyan-500 to-sky-500",
  smt: "from-emerald-500 via-green-500 to-teal-500",
  teacher: "from-green-500 via-emerald-500 to-teal-500",
  parent: "from-orange-500 via-amber-500 to-yellow-500",
  student: "from-pink-500 via-rose-500 to-red-400",
  clerk: "from-slate-500 via-gray-500 to-zinc-500",
  secretary: "from-slate-500 via-gray-500 to-zinc-500",
  bursar: "from-amber-600 via-orange-500 to-yellow-500",
  finance: "from-amber-600 via-orange-500 to-yellow-500",
  default: "from-[hsl(var(--accent-iris))] via-[hsl(var(--accent-violet))] to-[hsl(var(--accent-flamingo))]",
};

const roleBackgrounds: Record<string, string> = {
  super_admin: "bg-gradient-to-br from-violet-100 to-purple-100 text-violet-700",
  admin: "bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-700",
  principal: "bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-700",
  deputy: "bg-gradient-to-br from-cyan-100 to-teal-100 text-teal-700",
  hod: "bg-gradient-to-br from-teal-100 to-cyan-100 text-cyan-700",
  smt: "bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-700",
  teacher: "bg-gradient-to-br from-green-100 to-emerald-100 text-green-700",
  parent: "bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700",
  student: "bg-gradient-to-br from-pink-100 to-rose-100 text-pink-700",
  clerk: "bg-gradient-to-br from-slate-100 to-gray-100 text-slate-700",
  secretary: "bg-gradient-to-br from-slate-100 to-gray-100 text-slate-700",
  bursar: "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700",
  finance: "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700",
  default: "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600",
};

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-500",
  busy: "bg-red-500",
  offline: "bg-slate-400",
};

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return "?";
}

function normalizeRole(role?: string): string {
  if (!role) return "default";
  const normalized = role.toLowerCase().replace(/[^a-z_]/g, "_");
  return roleGradients[normalized] ? normalized : "default";
}

export function UserAvatar({
  src,
  name,
  email,
  role = "default",
  size = "md",
  showRing = true,
  showStatus = false,
  status = "offline",
  className,
  ringClassName,
  onClick,
}: UserAvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  const normalizedRole = normalizeRole(role);
  const config = sizeConfig[size];
  const initials = getInitials(name, email);
  const hasImage = src && !imageError;
  const gradient = roleGradients[normalizedRole];
  const background = roleBackgrounds[normalizedRole];

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Gradient ring container */}
      {showRing && (
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-gradient-to-br p-[2px]",
            gradient,
            "animate-pulse-subtle",
            ringClassName
          )}
          style={{
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "xor",
            WebkitMaskComposite: "xor",
          }}
        />
      )}

      {/* Avatar container */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden flex items-center justify-center font-semibold select-none",
          config.avatar,
          showRing && "m-[3px]",
          !hasImage && background
        )}
      >
        {hasImage ? (
          <img
            src={src}
            alt={name || "User avatar"}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className={cn(config.text, "font-bold tracking-tight")}>
            {initials}
          </span>
        )}
      </div>

      {/* Status indicator */}
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-white",
            config.status,
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}

export function UserAvatarGroup({
  users,
  max = 4,
  size = "sm",
  showRing = true,
  className,
}: {
  users: Array<{ src?: string | null; name?: string | null; role?: string }>;
  max?: number;
  size?: AvatarSize;
  showRing?: boolean;
  className?: string;
}) {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {displayUsers.map((user, index) => (
        <UserAvatar
          key={index}
          src={user.src}
          name={user.name}
          role={user.role}
          size={size}
          showRing={showRing}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-slate-200 text-slate-600 font-semibold ring-2 ring-white",
            sizeConfig[size].avatar,
            sizeConfig[size].text
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Administrator",
    principal: "Principal",
    deputy: "Deputy Principal",
    hod: "Head of Department",
    smt: "Senior Management",
    teacher: "Teacher",
    parent: "Parent",
    student: "Student",
    clerk: "Clerk",
    secretary: "Secretary",
    bursar: "Bursar",
    finance: "Finance",
  };
  return roleNames[role.toLowerCase()] || role;
}

export function getRoleColor(role: string): string {
  const normalized = normalizeRole(role);
  return roleGradients[normalized];
}
