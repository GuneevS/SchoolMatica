"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FilePlus,
  Flame,
  FolderOpen,
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
import { UserProfileMenu } from "@/components/ui/user-profile-menu";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  canAccess?: (auth: ClientAuthContext | null) => boolean;
}

interface NavGroup {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasRoleKey(auth: ClientAuthContext | null, roleKeys: string[]): boolean {
  if (!auth) return false;
  return auth.user.roleAssignments.some(ra => roleKeys.includes(ra.role.key));
}

// ---------------------------------------------------------------------------
// Navigation structure — grouped into logical sections
// ---------------------------------------------------------------------------

const navGroups: NavGroup[] = [
  {
    key: "overview",
    label: "Overview",
    icon: LayoutGrid,
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    ],
  },
  {
    key: "academic",
    label: "Academic",
    icon: BookOpenCheck,
    items: [
      {
        label: "Classes",
        href: "/classes",
        icon: Users2,
        canAccess: (auth) => hasPermission(auth, "class:read"),
      },
      {
        label: "Assessment Plans",
        href: "/assessment-plans",
        icon: ClipboardList,
        canAccess: (auth) => hasPermission(auth, "assessmentPlan:read"),
      },
      {
        label: "Markbook",
        href: "/markbook",
        icon: BookOpenCheck,
        canAccess: (auth) => hasPermission(auth, "mark:read"),
      },
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        canAccess: (auth) => hasPermission(auth, "report:read"),
      },
      {
        label: "Moderation",
        href: "/moderation",
        icon: Shield,
        canAccess: (auth) =>
          hasRoleKey(auth, ["hod", "deputy", "principal", "admin", "smt"]) ||
          hasAnyPermission(auth, ["moderation:read", "moderation:create"]),
      },
    ],
  },
  {
    key: "student-life",
    label: "Student Life",
    icon: GraduationCap,
    items: [
      {
        label: "Behaviour",
        href: "/behavior",
        icon: Flame,
        canAccess: (auth) =>
          hasRoleKey(auth, ["teacher", "hod", "deputy", "principal", "admin", "smt"]) ||
          hasAnyPermission(auth, ["student:update", "class:manage"]),
      },
      { label: "Events", href: "/events", icon: CalendarDays },
      {
        label: "Homework",
        href: "/homework",
        icon: NotebookPen,
        canAccess: (auth) =>
          hasRoleKey(auth, ["teacher", "hod", "deputy", "principal", "admin", "smt"]) ||
          hasPermission(auth, "class:manage"),
      },
      {
        label: "Timetables",
        href: "/timetables",
        icon: CalendarClock,
        canAccess: (auth) => hasPermission(auth, "timetable:read"),
      },
    ],
  },
  {
    key: "communication",
    label: "Communication",
    icon: MessageSquare,
    items: [
      {
        label: "Communications",
        href: "/communications",
        icon: MessageSquare,
        canAccess: (auth) =>
          hasRoleKey(auth, ["teacher", "hod", "deputy", "principal", "admin", "smt", "clerk", "secretary"]) ||
          hasAnyPermission(auth, ["class:read", "student:read"]),
      },
    ],
  },
  {
    key: "administration",
    label: "Administration",
    icon: FolderOpen,
    items: [
      {
        label: "Fees & Accounts",
        href: "/fees",
        icon: CreditCard,
        canAccess: (auth) =>
          hasRoleKey(auth, ["admin", "principal", "deputy", "bursar", "finance"]) ||
          auth?.isAdmin === true,
      },
      {
        label: "Registrations",
        href: "/registrations",
        icon: FilePlus,
        canAccess: (auth) => hasPermission(auth, "registration:read"),
      },
      {
        label: "Students",
        href: "/students",
        icon: GraduationCap,
        canAccess: (auth) => hasPermission(auth, "student:read"),
      },
      {
        label: "Teachers",
        href: "/teachers",
        icon: UserSquare2,
        canAccess: (auth) => hasPermission(auth, "teacher:read"),
      },
      {
        label: "Schools",
        href: "/schools",
        icon: Building2,
        canAccess: (auth) =>
          hasAnyPermission(auth, ["school:manage", "school:create", "system:admin"]) ||
          auth?.isAdmin === true,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        canAccess: (auth) =>
          hasAnyPermission(auth, ["school:manage", "gradingConfig:read", "gradingConfig:update"]),
      },
    ],
  },
];

// Flatten for permission filtering
const allNavItems = navGroups.flatMap(g => g.items);

function filterNavItems(items: NavItem[], auth: ClientAuthContext | null): NavItem[] {
  if (!auth) return [];
  return items.filter((item) => {
    if (!item.canAccess) return true;
    return item.canAccess(auth);
  });
}

/** Filter groups so each group only contains visible items. Groups with zero visible items are excluded. */
function filterNavGroups(groups: NavGroup[], auth: ClientAuthContext | null, isSuperAdmin: boolean): NavGroup[] {
  return groups
    .map((g) => ({
      ...g,
      items: isSuperAdmin ? g.items : filterNavItems(g.items, auth),
    }))
    .filter((g) => g.items.length > 0);
}

// localStorage key for persisting open sections
const SIDEBAR_STATE_KEY = "schoolmatica:sidebar-open";

function loadOpenSections(): string[] {
  if (typeof window === "undefined") return navGroups.map(g => g.key);
  try {
    const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return navGroups.map(g => g.key); // default all open
}

function saveOpenSections(keys: string[]) {
  try {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(keys));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Page-exit paths (these render children directly without the shell)
// ---------------------------------------------------------------------------

const marketingPaths = ["/"];
const authPaths = ["/login", "/register", "/forgot-password", "/reset-password"];
const superAdminPaths = ["/super-admin"];
const parentPortalPaths = ["/parent"];
const studentPortalPaths = ["/student"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
    profilePictureUrl?: string | null;
    image?: string | null;
  } | null;
}

export function AppShell({ children, initialSchool, isSuperAdmin: isSuperAdminProp = false, user }: Props) {
  const pathname = usePathname();
  const { user: authUser, permissions, isAdmin, isSuperAdmin: isSuperAdminFromHook, schoolIds, isLoading, activeRoleKey, setActiveRole } = useAuth();
  const { branding } = useBranding();

  // Collapsible sidebar state — persisted via localStorage
  const [openSections, setOpenSections] = useState<string[]>(() => loadOpenSections());

  // Persist whenever it changes
  useEffect(() => {
    saveOpenSections(openSections);
  }, [openSections]);

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  // Client auth context for permission checks
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

  const hasSuperAdminAccess = useMemo(
    () => hasPermission(clientAuth, "superadmin:access") || isSuperAdminFromHook || isSuperAdminProp,
    [clientAuth, isSuperAdminFromHook, isSuperAdminProp]
  );

  const visibleGroups = useMemo(
    () => filterNavGroups(navGroups, clientAuth, hasSuperAdminAccess),
    [clientAuth, hasSuperAdminAccess]
  );

  // Also keep a flat list for the fallback case (no role assignments)
  const fallbackGroups = useMemo(() => {
    if (authUser && authUser.roleAssignments.length === 0) {
      // Show only items without canAccess (Dashboard, Events)
      return navGroups
        .map(g => ({ ...g, items: g.items.filter(i => !i.canAccess) }))
        .filter(g => g.items.length > 0);
    }
    return null;
  }, [authUser]);

  const groupsToRender = fallbackGroups ?? visibleGroups;

  // Auto-expand the section containing the active page
  useEffect(() => {
    if (!pathname) return;
    for (const g of navGroups) {
      if (g.items.some(i => pathname.startsWith(i.href))) {
        setOpenSections(prev => prev.includes(g.key) ? prev : [...prev, g.key]);
        break;
      }
    }
  }, [pathname]);

  // ---- Shell bypass for special page types ----
  const isMarketingPage = pathname && marketingPaths.includes(pathname);
  if (isMarketingPage) return <>{children}</>;

  const isAuthPage = pathname && authPaths.some(p => pathname.startsWith(p));
  if (isAuthPage) return <>{children}</>;

  const isSuperAdminPage = pathname && superAdminPaths.some(p => pathname.startsWith(p));
  if (isSuperAdminPage) return <>{children}</>;

  const isParentPortal = pathname && parentPortalPaths.some(p => pathname.startsWith(p));
  if (isParentPortal) return <>{children}</>;

  const isStudentPortal = pathname && studentPortalPaths.some(p => pathname.startsWith(p));
  if (isStudentPortal) return <>{children}</>;

  // ---- Shared nav-link renderer ----
  const renderNavLink = (item: NavItem, compact = false) => {
    const isActive = pathname?.startsWith(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-all duration-200",
          compact ? "font-semibold" : "font-medium pl-11",
          isActive
            ? "bg-indigo-50 text-slate-900 shadow-ambient-sm"
            : "text-muted-foreground hover:text-slate-900 hover:bg-slate-100/60",
        )}
      >
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-xl border border-transparent",
            isActive
              ? "bg-indigo-100 text-indigo-700"
              : "bg-white text-slate-400 group-hover:text-slate-600",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span>{item.label}</span>
      </Link>
    );
  };

  // ---- Shared group renderer ----
  const renderGroup = (group: NavGroup, mode: "sidebar" | "drawer") => {
    // Single-item groups (like Overview) render the item directly without a collapsible header
    if (group.items.length === 1) {
      return (
        <div key={group.key} className={mode === "sidebar" ? "" : "px-1"}>
          {renderNavLink(group.items[0], true)}
        </div>
      );
    }

    const isOpen = openSections.includes(group.key);
    const GroupIcon = group.icon;
    const hasActiveChild = group.items.some(i => pathname?.startsWith(i.href));

    return (
      <div key={group.key}>
        <button
          onClick={() => toggleSection(group.key)}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition-all duration-200",
            hasActiveChild
              ? "text-slate-900"
              : "text-muted-foreground hover:text-slate-900 hover:bg-slate-100/60",
          )}
        >
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-xl border border-transparent",
              hasActiveChild
                ? "bg-indigo-100 text-indigo-700"
                : "bg-white text-slate-400",
            )}
          >
            <GroupIcon className="h-3.5 w-3.5" />
          </span>
          <span className="flex-1 text-left">{group.label}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200",
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="mt-0.5 flex flex-col gap-0.5">
              {group.items.map((item) => renderNavLink(item))}
            </div>
          </div>
        </div>
      </div>
    );
  };

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

      {/* ---- Desktop Sidebar ---- */}
      <aside className="relative z-10 hidden w-72 flex-col border-r border-slate-200/60 bg-white/95 px-5 py-8 shadow-ambient-sm backdrop-blur lg:flex">
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

        {/* Grouped navigation */}
        <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto text-sm">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-10 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            groupsToRender.map((group) => renderGroup(group, "sidebar"))
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

      {/* ---- Main content area ---- */}
      <div className="relative z-10 flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200/50 bg-white/90 px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Open navigation</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="bg-white overflow-y-auto">
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
                    {/* Mobile grouped navigation */}
                    <div className="flex flex-col gap-1 px-3 py-2">
                      {groupsToRender.map((group) => renderGroup(group, "drawer"))}
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
              <UserProfileMenu
                user={{
                  id: authUser?.id || user?.id || "",
                  email: authUser?.email || user?.email || "",
                  displayName: authUser?.displayName || user?.displayName || null,
                  profilePictureUrl: (user as { profilePictureUrl?: string })?.profilePictureUrl,
                  image: (user as { image?: string })?.image,
                }}
                roleAssignments={authUser?.roleAssignments || []}
                activeRoleKey={activeRoleKey}
                onRoleChange={setActiveRole}
                isAdmin={isAdmin}
                isSuperAdmin={isSuperAdminFromHook || isSuperAdminProp}
                portalType="staff"
              />
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
