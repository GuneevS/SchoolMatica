"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Shield,
  ChevronDown,
  Building2,
  Users,
  Settings,
  Activity,
  LogOut,
  Eye,
  EyeOff,
  X,
  RefreshCw,
  Server,
  Database,
  Zap,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signOut } from "next-auth/react";

interface School {
  id: string;
  name: string;
  shortCode: string | null;
}

interface SuperAdminOverlayProps {
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
  activeSchoolId?: string | null;
  environment?: "development" | "staging" | "production";
}

export function SuperAdminOverlay({
  user,
  activeSchoolId,
  environment = "development",
}: SuperAdminOverlayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [schools, setSchools] = React.useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = React.useState<string | null>(
    activeSchoolId || null
  );
  const [isLoading, setIsLoading] = React.useState(false);

  // Environment colors
  const envConfig = {
    development: {
      color: "bg-emerald-500",
      textColor: "text-emerald-500",
      borderColor: "border-emerald-500/30",
      label: "DEV",
    },
    staging: {
      color: "bg-amber-500",
      textColor: "text-amber-500",
      borderColor: "border-amber-500/30",
      label: "STAGING",
    },
    production: {
      color: "bg-red-500",
      textColor: "text-red-500",
      borderColor: "border-red-500/30",
      label: "PROD",
    },
  };

  const env = envConfig[environment];

  // Fetch schools on mount
  React.useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch("/api/super-admin/schools?limit=100");
        if (response.ok) {
          const data = await response.json();
          setSchools(data.schools || []);
        }
      } catch (error) {
        console.error("Failed to fetch schools:", error);
      }
    };

    fetchSchools();
  }, []);

  // Handle school switch
  const handleSchoolSwitch = async (schoolId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/schools/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId }),
      });

      if (response.ok) {
        setSelectedSchool(schoolId);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to switch school:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick actions
  const quickActions = [
    {
      label: "View All Schools",
      icon: Building2,
      href: "/super-admin/schools",
    },
    {
      label: "Manage Users",
      icon: Users,
      href: "/super-admin/users",
    },
    {
      label: "System Health",
      icon: Activity,
      href: "/super-admin",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/super-admin/settings",
    },
  ];

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          "fixed bottom-4 right-4 z-50",
          "flex items-center justify-center",
          "h-12 w-12 rounded-full",
          "bg-[hsl(var(--accent-violet))] text-white shadow-lg shadow-[0_12px_24px_-12px_hsl(var(--accent-violet)/0.35)]",
          "hover:bg-[hsl(var(--accent-violet))/0.9] transition-all duration-200",
          "ring-2 ring-white/20"
        )}
        title="Expand Super Admin Panel"
      >
        <Shield className="h-5 w-5" />
        <span
          className={cn(
            "absolute -top-1 -right-1 h-3 w-3 rounded-full",
            env.color
          )}
        />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "transition-all duration-300 ease-in-out",
        isExpanded ? "w-80" : "w-auto"
      )}
    >
      {/* Main Panel */}
      <div
        className={cn(
          "bg-gray-900/95 backdrop-blur-xl rounded-2xl",
          "border border-white/10 shadow-2xl shadow-black/50",
          "overflow-hidden"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3",
            "border-b border-white/10 cursor-pointer",
            "hover:bg-white/5 transition-colors"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[hsl(var(--accent-violet))/0.2]">
            <Shield className="h-4 w-4 text-[hsl(var(--accent-violet))]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              Super Admin
            </p>
            <p className="text-[10px] text-gray-400 truncate">
              {user.displayName || user.email}
            </p>
          </div>
          {/* Environment Badge */}
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold",
              env.color,
              "text-white"
            )}
          >
            {env.label}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Minimize panel"
            aria-label="Minimize super admin panel"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* School Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Active School
              </label>
              <Select
                value={selectedSchool || ""}
                onValueChange={handleSchoolSwitch}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white h-10">
                  <SelectValue placeholder="Select a school to view..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-900/95 backdrop-blur-xl border-white/10">
                  <SelectItem value="" className="text-gray-300">
                    All Schools (Platform View)
                  </SelectItem>
                  {schools.map((school) => (
                    <SelectItem
                      key={school.id}
                      value={school.id}
                      className="text-gray-300"
                    >
                      {school.name}
                      {school.shortCode && (
                        <span className="ml-1 text-gray-500">
                          ({school.shortCode})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-white">{schools.length}</p>
                <p className="text-[10px] text-gray-400">Schools</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-emerald-400">●</p>
                <p className="text-[10px] text-gray-400">System</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-white">v1.0</p>
                <p className="text-[10px] text-gray-400">Version</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Quick Actions
              </label>
              <div className="space-y-1">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  const isActive = pathname === action.href;
                  return (
                    <button
                      key={action.href}
                      onClick={() => router.push(action.href)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg",
                        "text-sm text-left transition-colors",
                        isActive
                          ? "bg-[hsl(var(--accent-violet))/0.2] text-[hsl(var(--accent-violet))]"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {action.label}
                      <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Impersonation Warning */}
            {selectedSchool && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Eye className="h-4 w-4 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-300">
                      Viewing as School
                    </p>
                    <p className="text-[10px] text-amber-200/70 mt-0.5">
                      You are viewing the platform from this school&apos;s perspective.
                      Actions will be logged.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sign Out */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg",
                "bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors",
                "text-sm font-medium"
              )}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}

        {/* Collapsed Quick Actions */}
        {!isExpanded && (
          <div className="flex items-center gap-1 px-2 py-2">
            {quickActions.slice(0, 3).map((action) => {
              const Icon = action.icon;
              const isActive = pathname === action.href;
              return (
                <button
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-[hsl(var(--accent-violet))/0.2] text-[hsl(var(--accent-violet))]"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                  title={action.label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                  title="More actions"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-gray-900/95 backdrop-blur-xl border-white/10"
              >
                <DropdownMenuLabel className="text-gray-400">
                  Super Admin
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <DropdownMenuItem
                      key={action.href}
                      onClick={() => router.push(action.href)}
                      className="text-gray-300 focus:bg-white/10 focus:text-white cursor-pointer"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-red-400 focus:bg-red-500/20 focus:text-red-300 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
