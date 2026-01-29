"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoleSwitcher } from "@/components/role-switcher";
import { HelpButton } from "@/components/help/help-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SchoolSwitcher } from "@/components/school-switcher";
import { SuperAdminOverlay } from "@/components/super-admin/super-admin-overlay";
import { UnifiedLogo } from "@/components/brand/unified-logo";
import { NotificationDropdown } from "@/components/notifications";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  hasPermission,
  hasAnyPermission,
  type ClientAuthContext,
} from "@/lib/permissions-client";

/**
 * Navigation item with permission requirements
 */
interface NavItem {
  label: string;
  href: string;
  /**
   * Permission check function - returns true if the user can see this nav item
   * If undefined, the item is visible to all authenticated users
   */
  canAccess?: (auth: ClientAuthContext | null) => boolean;
}

/**
 * Helper to check if user has a specific role key
 */
function hasRoleKey(auth: ClientAuthContext | null, roleKeys: string[]): boolean {
  if (!auth) return false;
  return auth.user.roleAssignments.some(ra => roleKeys.includes(ra.role.key));
}

/**
 * Navigation items with permission-based visibility rules
 */
const navItems: NavItem[] = [
  // Dashboard: Everyone authenticated
  { label: "Dashboard", href: "/dashboard" },
  
  // Classes: class:read permission
  {
    label: "Classes",
    href: "/classes",
    canAccess: (auth) => hasPermission(auth, "class:read"),
  },
  
  // Assessment Plans: assessmentPlan:read permission
  {
    label: "Assessment Plans",
    href: "/assessment-plans",
    canAccess: (auth) => hasPermission(auth, "assessmentPlan:read"),
  },
  
  // Markbook: mark:read permission
  {
    label: "Markbook",
    href: "/markbook",
    canAccess: (auth) => hasPermission(auth, "mark:read"),
  },
  
  // Behaviour: Teachers and above (staff with classroom responsibilities)
  {
    label: "Behaviour",
    href: "/behavior",
    canAccess: (auth) =>
      hasRoleKey(auth, ["teacher", "hod", "deputy", "principal", "admin", "smt"]) ||
      hasAnyPermission(auth, ["student:update", "class:manage"]),
  },
  
  // Communications: All school staff
  {
    label: "Communications",
    href: "/communications",
    canAccess: (auth) =>
      hasRoleKey(auth, ["teacher", "hod", "deputy", "principal", "admin", "smt", "clerk", "secretary"]) ||
      hasAnyPermission(auth, ["class:read", "student:read"]),
  },
  
  // Fees & Accounts: Admin roles only
  {
    label: "Fees & Accounts",
    href: "/fees",
    canAccess: (auth) =>
      hasRoleKey(auth, ["admin", "principal", "deputy", "bursar", "finance"]) ||
      auth?.isAdmin === true,
  },
  
  // Timetables: timetable:read permission
  {
    label: "Timetables",
    href: "/timetables",
    canAccess: (auth) => hasPermission(auth, "timetable:read"),
  },
  
  // Events: Visible to all authenticated users
  { label: "Events", href: "/events" },
  
  // Homework: Teachers and above
  {
    label: "Homework",
    href: "/homework",
    canAccess: (auth) =>
      hasRoleKey(auth, ["teacher", "hod", "deputy", "principal", "admin", "smt"]) ||
      hasPermission(auth, "class:manage"),
  },
  
  // Reports: report:read permission
  {
    label: "Reports",
    href: "/reports",
    canAccess: (auth) => hasPermission(auth, "report:read"),
  },
  
  // Registrations: registration:read permission
  {
    label: "Registrations",
    href: "/registrations",
    canAccess: (auth) => hasPermission(auth, "registration:read"),
  },
  
  // Students: student:read permission
  {
    label: "Students",
    href: "/students",
    canAccess: (auth) => hasPermission(auth, "student:read"),
  },
  
  // Teachers: teacher:read permission (SMT, HOD, Admin)
  {
    label: "Teachers",
    href: "/teachers",
    canAccess: (auth) => hasPermission(auth, "teacher:read"),
  },
  
  // Schools: school:manage permission (admin level)
  {
    label: "Schools",
    href: "/schools",
    canAccess: (auth) =>
      hasAnyPermission(auth, ["school:manage", "school:create", "system:admin"]) ||
      auth?.isAdmin === true,
  },
  
  // Settings: school:manage or grading:read permission
  {
    label: "Settings",
    href: "/settings/grading",
    canAccess: (auth) =>
      hasAnyPermission(auth, ["school:manage", "gradingConfig:read", "gradingConfig:update"]),
  },
];

/**
 * Filter navigation items based on user permissions
 */
function filterNavItems(items: NavItem[], auth: ClientAuthContext | null): NavItem[] {
  if (!auth) return [];
  
  return items.filter((item) => {
    // If no permission check defined, item is visible to all authenticated users
    if (!item.canAccess) return true;
    // Run the permission check
    return item.canAccess(auth);
  });
}

// Marketing/landing pages that should NOT show the app shell
const marketingPaths = ["/"];

// Auth pages that should NOT show the app shell
const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"];

// Super admin pages have their own shell
const superAdminPaths = ["/super-admin"];

// Parent portal has its own shell
const parentPortalPaths = ["/parent"];

interface Props {
  children: React.ReactNode;
  initialSchool: {
    id: string;
    name: string;
    shortCode?: string;
  } | null;
  isSuperAdmin?: boolean;
  user?: {
    id: string;
    email: string;
    displayName: string | null;
  } | null;
}

export function AppShell({ children, initialSchool, isSuperAdmin: isSuperAdminProp = false, user }: Props) {
  const pathname = usePathname();
  const { user: authUser, permissions, isAdmin, isSuperAdmin: isSuperAdminFromHook, schoolIds, isLoading } = useAuth();

  // Build the client auth context for permission checks
  const clientAuth: ClientAuthContext | null = useMemo(() => {
    if (!authUser) return null;
    return {
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName ?? "",
        schoolId: authUser.schoolId ?? "",
        roleAssignments: authUser.roleAssignments,
      },
      permissions,
      isAdmin,
      isSuperAdmin: isSuperAdminFromHook || isSuperAdminProp,
      schoolIds,
    };
  }, [authUser, permissions, isAdmin, isSuperAdminFromHook, isSuperAdminProp, schoolIds]);

  // Filter navigation items based on user permissions
  const filteredNavItems = useMemo(
    () => filterNavItems(navItems, clientAuth),
    [clientAuth]
  );

  // Check if user has super admin access
  const hasSuperAdminAccess = useMemo(
    () => hasPermission(clientAuth, "superadmin:access") || isSuperAdminFromHook || isSuperAdminProp,
    [clientAuth, isSuperAdminFromHook, isSuperAdminProp]
  );

  // For marketing pages, render children directly without the app shell chrome
  const isMarketingPage = pathname && marketingPaths.includes(pathname);
  if (isMarketingPage) {
    return <>{children}</>;
  }

  // Auth pages (login, register, etc.) have their own layout
  const isAuthPage = pathname && authPaths.some(p => pathname.startsWith(p));
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Super admin pages have their own dedicated shell
  const isSuperAdminPage = pathname && superAdminPaths.some(p => pathname.startsWith(p));
  if (isSuperAdminPage) {
    return <>{children}</>;
  }

  // Parent portal pages have their own shell
  const isParentPortal = pathname && parentPortalPaths.some(p => pathname.startsWith(p));
  if (isParentPortal) {
    return <>{children}</>;
  }
  return (
    <div className="relative flex min-h-screen bg-canvas text-foreground">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-0 w-2/3 translate-x-1/4 opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, var(--shell-glow-a), transparent 55%), radial-gradient(circle at 80% 0%, var(--shell-glow-b), transparent 60%), radial-gradient(circle at 60% 80%, var(--shell-glow-c), transparent 60%)",
        }}
        aria-hidden
      />
      <aside className="relative z-10 hidden w-64 flex-col border-r border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))/0.9] px-6 py-8 shadow-ambient-sm backdrop-blur lg:flex xl:w-72">
        <Link href="/dashboard" className="mb-10 block hover:opacity-90 transition-opacity">
          <UnifiedLogo variant="full" size="sm" colorScheme="gradient" />
          <p className="text-xs font-normal text-muted-foreground mt-1 ml-[52px]">Assessment Suite</p>
        </Link>
        <nav className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
          {isLoading ? (
            // Show skeleton loading state while permissions are being fetched
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-9 rounded-2xl bg-[hsl(var(--surface-soft))] animate-pulse"
                />
              ))}
            </div>
          ) : (
            filteredNavItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-2xl px-4 py-2 transition-all duration-200",
                    isActive
                      ? "bg-[hsl(var(--accent-iris))/0.12] text-foreground shadow-ambient-sm"
                      : "hover:text-foreground hover:bg-[hsl(var(--surface-soft))]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })
          )}
        </nav>

        {/* Super Admin Link - ONLY visible to users with superadmin:access permission */}
        {hasSuperAdminAccess && (
          <div className="mt-auto pt-4 border-t border-[hsl(var(--border))/0.5]">
            <Link
              href="/super-admin"
              className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-[hsl(var(--accent-violet))] transition-all duration-200 hover:bg-[hsl(var(--accent-violet))/0.12]"
            >
              <Shield className="h-4 w-4" />
              Super Admin
            </Link>
          </div>
        )}
      </aside>
      <div className="relative z-10 flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[hsl(var(--border))/0.5] bg-[hsl(var(--surface-strong))/0.85] px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6">
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-muted-foreground/70">
                Active school
              </p>
              <p className="text-xl font-semibold text-foreground">
                {initialSchool?.name ?? "No school configured"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <SchoolSwitcher initialSchool={initialSchool} />
              <ThemeToggle />
              <RoleSwitcher />
            </div>
          </div>
        </header>
        <main className="relative flex-1 overflow-y-auto px-6 py-8 md:px-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">{children}</div>
        </main>
      </div>
      <HelpButton
        data-tour="help-button"
        className="border border-[hsl(var(--border-strong))/0.55] bg-[hsl(var(--surface-strong))/0.95] text-foreground shadow-ambient-sm backdrop-blur hover:shadow-ambient"
      />

      {/* Super Admin Overlay - only visible to users with superadmin:access permission */}
      {hasSuperAdminAccess && user && (
        <SuperAdminOverlay
          user={user}
          activeSchoolId={initialSchool?.id}
          environment={
            process.env.NODE_ENV === "production"
              ? "production"
              : process.env.NODE_ENV === "development"
              ? "development"
              : "staging"
          }
        />
      )}
    </div>
  );
}
