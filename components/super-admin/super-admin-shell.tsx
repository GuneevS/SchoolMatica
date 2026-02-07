"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Users,
  Settings,
  Shield,
  ChevronRight,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserProfileMenu } from "@/components/ui/user-profile-menu";
import { UnifiedLogo } from "@/components/brand/unified-logo";

const navItems = [
  { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
  { label: "Schools", href: "/super-admin/schools", icon: Building2 },
  { label: "Users", href: "/super-admin/users", icon: Users },
  { label: "Settings", href: "/super-admin/settings", icon: Settings },
];

interface Props {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    profilePictureUrl?: string | null;
    image?: string | null;
  };
}

export function SuperAdminShell({ children, user }: Props) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen bg-canvas text-foreground">
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 20% 10%, var(--shell-glow-a), transparent 55%), radial-gradient(circle at 85% 0%, var(--shell-glow-b), transparent 60%), radial-gradient(circle at 70% 85%, var(--shell-glow-c), transparent 60%)",
        }}
        aria-hidden
      />

      {/* Sidebar */}
      <aside className="relative z-10 hidden w-64 flex-col border-r border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))/0.9] px-6 py-8 shadow-ambient-sm backdrop-blur lg:flex xl:w-72">
        <div className="mb-8 flex items-center gap-3">
          <UnifiedLogo variant="icon" size="sm" colorScheme="gradient" />
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/70">SchoolMatica</p>
            <p className="text-sm font-semibold text-foreground">Super Admin</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 text-sm font-semibold text-muted-foreground">
          {navItems.map((item) => {
            const isActive = item.href === "/super-admin"
              ? pathname === "/super-admin"
              : pathname?.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-200",
                  isActive
                    ? "bg-[hsl(var(--accent-iris))/0.12] text-foreground shadow-ambient-sm"
                    : "hover:text-foreground hover:bg-[hsl(var(--surface-soft))]",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-2xl",
                    isActive
                      ? "bg-[hsl(var(--accent-iris))/0.12] text-[hsl(var(--accent-iris))]"
                      : "bg-[hsl(var(--surface-strong))] text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
            <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {user.displayName || user.email}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-[hsl(var(--surface-soft))] hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Mobile navigation drawer */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white shadow-md">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-white w-72">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <UnifiedLogo variant="icon" size="sm" colorScheme="gradient" />
                Super Admin
              </SheetTitle>
              <SheetDescription>Platform management</SheetDescription>
            </SheetHeader>
            <div className="mt-4 flex flex-col gap-2 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === "/super-admin"
                  ? pathname === "/super-admin"
                  : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-[hsl(var(--accent-iris))]/12 text-foreground"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-6 px-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-slate-100/80 hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-[hsl(var(--border))/0.5] bg-[hsl(var(--surface-strong))/0.85] px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--accent-iris))/0.12]">
                <Shield className="h-4 w-4 text-[hsl(var(--accent-iris))]" />
              </div>
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-muted-foreground/70">
                  Super Admin
                </p>
                <p className="text-lg font-semibold text-foreground">
                  Platform Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserProfileMenu
                user={user}
                portalType="super-admin"
                isSuperAdmin={true}
                showSettings={true}
                showSwitchPortal={true}
              />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="relative flex-1 overflow-y-auto px-6 py-8 md:px-10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
