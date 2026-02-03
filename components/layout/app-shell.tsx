"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FilePlus,
  Flame,
  GraduationCap,
  LayoutGrid,
  MessageSquare,
  Menu,
  NotebookPen,
  Settings,
  Shield,
  UserSquare2,
  Users2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RoleSwitcher } from "@/components/role-switcher";
import { HelpButton } from "@/components/help/help-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SchoolSwitcher } from "@/components/school-switcher";
import { SuperAdminOverlay } from "@/components/super-admin/super-admin-overlay";
import { UnifiedLogo } from "@/components/brand/unified-logo";
import { SchoolMark } from "@/components/brand/school-mark";
import { useBranding } from "@/components/brand/branding-provider";
import { NotificationDropdown } from "@/components/notifications";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  icon: React.ComponentType<{ className?: string }>;
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
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  
  // Classes: class:read permission
  {
    label: "Classes",
    href: "/classes",
    icon: Users2,
    canAccess: (auth) => hasPermission(auth, "class:read"),
  },
  
  // Assessment Plans: assessmentPlan:read permission
  {
    label: "Assessment Plans",
    href: "/assessment-plans",
    icon: ClipboardList,
    canAccess: (auth) => hasPermission(auth, "assessmentPlan:read"),
  },
  
  // Markbook: mark:read permission
  {
    label: "Markbook",
    href: "/markbook",
    icon: BookOpenCheck,
    canAccess: (auth) => hasPermission(auth, "mark:read"),
  },
  
  // Behaviour: Teachers and above (staff with classroom responsibilities)
  {
    label: "Behaviour",
    href: "/behavior",
    icon: Flame,
    canAccess: (auth) =>
      hasRoleKey(auth, ["teacher", "hod", "deputy", "principal", "admin", "smt"]) ||
      hasAnyPermission(auth, ["student:update", "class:manage"]),
  },
  
  // Communications: All school staff
  {
    label: "Communications",
    href: "/communications",
    icon: MessageSquare,
    canAccess: (auth) =>
      hasRoleKey(auth, ["teacher", "hod", "deputy", "principal", "admin", "smt", "clerk", "secretary"]) ||
      hasAnyPermission(auth, ["class:read", "student:read"]),
  },
  
  // Fees & Accounts: Admin roles only
  {
    label: "Fees & Accounts",
    href: "/fees",
    icon: CreditCard,
    canAccess: (auth) =>
      hasRoleKey(auth, ["admin", "principal", "deputy", "bursar", "finance"]) ||
      auth?.isAdmin === true,
  },
  
  // Timetables: timetable:read permission
  {
    label: "Timetables",
    href: "/timetables",
    icon: CalendarClock,
    canAccess: (auth) => hasPermission(auth, "timetable:read"),
  },
  
  // Events: Visible to all authenticated users
  { label: "Events", href: "/events", icon: CalendarDays },
  
  // Homework: Teachers and above
  {
    label: "Homework",
    href: "/homework",
    icon: NotebookPen,
    canAccess: (auth) =>
      hasRoleKey(auth, ["teacher", "hod", "deputy", "principal", "admin", "smt"]) ||
      hasPermission(auth, "class:manage"),
  },
  
  // Reports: report:read permission
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    canAccess: (auth) => hasPermission(auth, "report:read"),
  },
  
  // Registrations: registration:read permission
  {
    label: "Registrations",
    href: "/registrations",
    icon: FilePlus,
    canAccess: (auth) => hasPermission(auth, "registration:read"),
  },
  
  // Students: student:read permission
  {
    label: "Students",
    href: "/students",
    icon: GraduationCap,
    canAccess: (auth) => hasPermission(auth, "student:read"),
  },
  
  // Teachers: teacher:read permission (SMT, HOD, Admin)
  {
    label: "Teachers",
    href: "/teachers",
    icon: UserSquare2,
    canAccess: (auth) => hasPermission(auth, "teacher:read"),
  },
  
  // Schools: school:manage permission (admin level)
  {
    label: "Schools",
    href: "/schools",
    icon: Building2,
    canAccess: (auth) =>
      hasAnyPermission(auth, ["school:manage", "school:create", "system:admin"]) ||
      auth?.isAdmin === true,
  },
  
  // Settings: school:manage or grading:read permission
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
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

// Student portal has its own shell
const studentPortalPaths = ["/student"];

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
  const { branding } = useBranding();

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

  const navItemsToRender = useMemo(() => {
    if (filteredNavItems.length === 0 && hasSuperAdminAccess) {
      return navItems;
    }
    return filteredNavItems;
  }, [filteredNavItems, hasSuperAdminAccess]);

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

  // Student portal pages have their own shell
  const isStudentPortal = pathname && studentPortalPaths.some(p => pathname.startsWith(p));
  if (isStudentPortal) {
    return <>{children}</>;
  }
  return (
    <div className="relative flex min-h-screen bg-canvas text-foreground">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 20% 10%, var(--shell-glow-a), transparent 55%), radial-gradient(circle at 85% 0%, var(--shell-glow-b), transparent 60%), radial-gradient(circle at 70% 85%, var(--shell-glow-c), transparent 60%)",
        }}
        aria-hidden
      />
      <aside className="relative z-10 hidden w-72 flex-col border-r border-slate-200/60 bg-white/95 px-6 py-8 shadow-ambient-sm backdrop-blur lg:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-3 transition-opacity hover:opacity-90">
          <UnifiedLogo variant="icon" size="sm" colorScheme="gradient" />
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/70">SchoolMatica</p>
            <p className="text-sm font-semibold text-foreground">Assessment Studio</p>
          </div>
        </Link>

        <div className="rounded-3xl border border-slate-200/60 bg-slate-50/80 p-4 shadow-ambient-sm">
          <div className="flex items-center gap-3">
            <SchoolMark
              name={initialSchool?.name ?? "School"}
              logoUrl={branding.logoUrl}
              size="sm"
              className="shadow-ambient-sm"
            />
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground/70">
                Active school
              </p>
              <p className="text-base font-semibold text-foreground">
                {initialSchool?.name ?? "No school configured"}
              </p>
              {initialSchool?.shortCode && (
                <p className="text-xs text-muted-foreground">{initialSchool.shortCode}</p>
              )}
            </div>
          </div>
        </div>

        <nav className="mt-6 flex flex-col gap-1.5 text-sm font-semibold text-muted-foreground">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-10 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            navItemsToRender.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-200",
                    isActive
                      ? "bg-[hsl(240, 100%, 95%)] text-slate-900 shadow-ambient-sm"
                      : "hover:text-slate-900 hover:bg-slate-100/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-2xl border border-transparent",
                      isActive
                        ? "bg-[hsl(240, 100%, 95%)] text-slate-900"
                        : "bg-white text-slate-500 group-hover:text-slate-900",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })
          )}
        </nav>

        {hasSuperAdminAccess && (
          <div className="mt-auto pt-6">
            <Link
              href="/super-admin"
              className="flex items-center gap-2 rounded-2xl border border-[hsl(var(--accent-violet))/0.3] px-4 py-2 text-sm font-medium text-[hsl(var(--accent-violet))] transition-all duration-200 hover:bg-[hsl(var(--accent-violet))/0.12]"
            >
              <Shield className="h-4 w-4" />
              Super Admin
            </Link>
          </div>
        )}
      </aside>
      <div className="relative z-10 flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200/50 bg-white/90 px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Open navigation</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="bg-white">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <UnifiedLogo variant="icon" size="sm" colorScheme="gradient" />
                        SchoolMatica
                      </SheetTitle>
                      <SheetDescription>Navigate your workspace</SheetDescription>
                    </SheetHeader>
                    <div className="px-4">
                      <SchoolSwitcher initialSchool={initialSchool} className="w-full" />
                    </div>
                    <div className="flex flex-col gap-2 px-4">
                      {navItemsToRender.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-2xl border border-slate-200/60 px-3 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900 hover:bg-slate-100/60",
                              pathname?.startsWith(item.href) && "bg-[hsl(var(--accent-iris))/0.12] text-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        );
                      })}
                      {hasSuperAdminAccess && (
                        <Link
                          href="/super-admin"
                          className="flex items-center gap-2 rounded-2xl border border-[hsl(var(--accent-violet))/0.3] px-3 py-2 text-sm font-semibold text-[hsl(var(--accent-violet))] transition hover:bg-[hsl(var(--accent-violet))/0.12]"
                        >
                          <Shield className="h-4 w-4" />
                          Super Admin
                        </Link>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <SchoolMark
                name={initialSchool?.name ?? "School"}
                logoUrl={branding.logoUrl}
                size="sm"
                className="hidden md:inline-flex"
              />
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground/70">
                  Active school
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {initialSchool?.name ?? "No school configured"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <SchoolSwitcher initialSchool={initialSchool} className="hidden md:flex" />
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
