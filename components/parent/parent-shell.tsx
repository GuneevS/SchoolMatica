"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  MessageSquare,
  FileText,
  Award,
  Settings,
  CreditCard,
  Calendar,
  BookOpen,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationDropdown } from "@/components/notifications";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserProfileMenu } from "@/components/ui/user-profile-menu";
import { UnifiedLogo } from "@/components/brand/unified-logo";
import { SchoolMark } from "@/components/brand/school-mark";
import { useBranding } from "@/components/brand/branding-provider";
import { type SchoolBranding } from "@/lib/branding";
import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    profilePictureUrl?: string | null;
    image?: string | null;
  };
  schoolName?: string;
  branding?: SchoolBranding | null;
  unreadMessageCount?: number;
  homeworkCount?: {
    upcoming: number;
    overdue: number;
  };
  childNames?: string[];
}

function getNavItems(unreadMessageCount: number, homeworkCount?: { upcoming: number; overdue: number }) {
  const homeworkBadge = homeworkCount && (homeworkCount.upcoming + homeworkCount.overdue) > 0
    ? homeworkCount.upcoming + homeworkCount.overdue
    : undefined;
  const homeworkBadgeVariant = homeworkCount && homeworkCount.overdue > 0 ? "destructive" : "default";
  
  return [
    { label: "Dashboard", href: "/parent", icon: Home },
    { label: "My Children", href: "/parent/children", icon: Users },
    { label: "Homework", href: "/parent/homework", icon: BookOpen, badge: homeworkBadge, badgeVariant: homeworkBadgeVariant },
    { label: "Messages", href: "/parent/messages", icon: MessageSquare, badge: unreadMessageCount > 0 ? unreadMessageCount : undefined },
    { label: "Fees & Payments", href: "/parent/fees", icon: CreditCard },
    { label: "Events", href: "/parent/events", icon: Calendar },
    { label: "Reports", href: "/parent/reports", icon: FileText },
    { label: "Behaviour", href: "/parent/behavior", icon: Award },
  ];
}

export function ParentShell({
  children,
  user,
  schoolName,
  branding,
  unreadMessageCount = 0,
  homeworkCount,
  childNames = [],
}: Props) {
  const pathname = usePathname();
  const navItems = getNavItems(unreadMessageCount, homeworkCount);
  const { setBranding } = useBranding();

  // Set branding once on mount only - empty deps to prevent loops
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (branding) {
      setBranding(branding);
    }
  }, []);

  return (
    <div className="relative flex min-h-screen bg-canvas text-foreground">
      {/* Gradient background */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 20% 10%, var(--shell-glow-a), transparent 55%), radial-gradient(circle at 85% 0%, var(--shell-glow-b), transparent 60%), radial-gradient(circle at 70% 85%, var(--shell-glow-c), transparent 60%)",
        }}
        aria-hidden
      />

      {/* Sidebar */}
      <aside className="relative z-10 hidden w-64 flex-col border-r border-slate-200/60 bg-white/95 px-6 py-8 shadow-ambient-sm backdrop-blur lg:flex xl:w-72">
        {/* Logo */}
        <Link href="/parent" className="mb-8 flex items-center gap-3 hover:opacity-90 transition-opacity">
          <UnifiedLogo variant="icon" size="sm" colorScheme="gradient" />
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/70">Parent Portal</p>
            <p className="text-sm font-semibold text-foreground">{schoolName ?? "SchoolMatica"}</p>
          </div>
        </Link>

        <div className="rounded-3xl border border-slate-200/60 bg-slate-50/80 p-4 shadow-ambient-sm">
          <div className="flex items-center gap-3">
            <SchoolMark name={schoolName ?? "School"} logoUrl={branding?.logoUrl} size="sm" />
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground/70">
                School
              </p>
              <p className="text-base font-semibold text-foreground">{schoolName ?? "SchoolMatica"}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
          {navItems.map((item) => {
            const isActive = item.href === "/parent"
              ? pathname === "/parent"
              : pathname?.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-200",
                  isActive
                    ? "bg-slate-100/80 text-slate-900 shadow-ambient-sm"
                    : "hover:text-slate-900 hover:bg-slate-100/60",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
                {item.badge && (
                  <Badge 
                    className={cn(
                      "text-white text-xs h-5 min-w-5 flex items-center justify-center",
                      item.badgeVariant === "destructive" 
                        ? "bg-red-500" 
                        : "bg-[hsl(var(--accent-iris))]"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto space-y-4">
          {childNames.length > 0 && (
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/80 p-4">
              <p className="text-xs font-medium text-muted-foreground">Children</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {childNames.map((name) => (
                  <Badge
                    key={name}
                    variant="outline"
                    className="border-[hsl(var(--accent-iris))/0.35] text-[hsl(var(--accent-iris))]"
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-[hsl(var(--border))/0.5] bg-[hsl(var(--surface-strong))/0.85] px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Open navigation</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="bg-white w-72">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <UnifiedLogo variant="icon" size="sm" colorScheme="gradient" />
                        Parent Portal
                      </SheetTitle>
                      <SheetDescription>Navigate your parent dashboard</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 flex flex-col gap-2 px-2">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.href === "/parent"
                          ? pathname === "/parent"
                          : pathname?.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-medium transition-all",
                              isActive
                                ? "bg-slate-100/80 text-slate-900"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </div>
                            {item.badge && (
                              <Badge className="text-white text-xs h-5 min-w-5 flex items-center justify-center bg-[hsl(var(--accent-iris))]">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <SchoolMark name={schoolName ?? "School"} logoUrl={branding?.logoUrl} size="sm" className="hidden md:inline-flex" />
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-muted-foreground/70">
                  Parent Portal · {schoolName ?? "SchoolMatica"}
                </p>
                <p className="text-xl font-semibold text-foreground">
                  Welcome, {user.displayName || "Parent"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <ThemeToggle />
              <UserProfileMenu
                user={user}
                portalType="parent"
                showSettings={true}
                showSwitchPortal={true}
              />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="relative flex-1 overflow-y-auto px-6 py-8 md:px-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
