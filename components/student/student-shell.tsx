"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  ClipboardList,
  Calendar,
  MessageSquare,
  CreditCard,
  FileText,
  Award,
  Clock,
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
import { SkipToContent } from "@/components/layout/skip-to-content";
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
  className?: string;
  gradeLabel?: string;
  branding?: SchoolBranding | null;
  unreadMessageCount?: number;
  homeworkCount?: {
    upcoming: number;
    overdue: number;
  };
  reportCount?: number;
}

function getNavItems(
  unreadMessageCount: number,
  homeworkCount?: { upcoming: number; overdue: number },
  reportCount?: number,
) {
  const homeworkBadge = homeworkCount && (homeworkCount.upcoming + homeworkCount.overdue) > 0
    ? homeworkCount.upcoming + homeworkCount.overdue
    : undefined;
  const homeworkBadgeVariant = homeworkCount && homeworkCount.overdue > 0 ? "destructive" : "default";

  return [
    { label: "Overview", href: "/student", icon: Home },
    { label: "Homework", href: "/student/homework", icon: BookOpen, badge: homeworkBadge, badgeVariant: homeworkBadgeVariant },
    { label: "Marks", href: "/student/marks", icon: ClipboardList },
    { label: "Timetable", href: "/student/timetable", icon: Clock },
    { label: "Messages", href: "/student/messages", icon: MessageSquare, badge: unreadMessageCount > 0 ? unreadMessageCount : undefined },
    { label: "Fees", href: "/student/fees", icon: CreditCard },
    { label: "Events", href: "/student/events", icon: Calendar },
    { label: "Reports", href: "/student/reports", icon: FileText, badge: reportCount && reportCount > 0 ? reportCount : undefined },
    { label: "Behaviour", href: "/student/behavior", icon: Award },
  ];
}

export function StudentShell({
  children,
  user,
  schoolName,
  className,
  gradeLabel,
  branding,
  unreadMessageCount = 0,
  homeworkCount,
  reportCount = 0,
}: Props) {
  const pathname = usePathname();
  const navItems = getNavItems(unreadMessageCount, homeworkCount, reportCount);
  const { setBranding } = useBranding();

  useEffect(() => {
    if (branding) {
      setBranding(branding);
    }
  // Only run on mount - branding prop is stable from server
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex min-h-screen bg-canvas text-foreground">
      <SkipToContent />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 20% 10%, var(--shell-glow-a), transparent 55%), radial-gradient(circle at 85% 0%, var(--shell-glow-b), transparent 60%), radial-gradient(circle at 70% 85%, var(--shell-glow-c), transparent 60%)",
        }}
        aria-hidden
      />

      <aside className="relative z-10 hidden w-64 flex-col border-r border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-strong))]/95 px-6 py-8 shadow-ambient-sm backdrop-blur lg:flex xl:w-72" aria-label="Student portal navigation">
        <Link href="/student" className="mb-8 flex items-center gap-3 hover:opacity-90 transition-opacity">
          <UnifiedLogo variant="icon" size="sm" colorScheme="gradient" />
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground/70">Student Portal</p>
            <p className="text-sm font-semibold text-foreground">{schoolName ?? "SchoolMatica"}</p>
          </div>
        </Link>

        <div className="rounded-3xl border border-[hsl(var(--border))/0.6] bg-muted/80 p-4 shadow-ambient-sm">
          <div className="flex items-center gap-3">
            <SchoolMark name={schoolName ?? "School"} logoUrl={branding?.logoUrl} size="sm" />
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground/70">
                Class
              </p>
              <p className="text-base font-semibold text-foreground">{className ?? "—"}</p>
              {gradeLabel && <p className="text-xs text-muted-foreground">{gradeLabel}</p>}
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
          {navItems.map((item) => {
            const isActive = item.href === "/student"
              ? pathname === "/student"
              : pathname?.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-200",
                  isActive
                    ? "bg-[hsl(var(--accent-iris))]/12 text-foreground shadow-ambient-sm"
                    : "hover:text-foreground hover:bg-muted/60",
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

        <div className="mt-auto space-y-4">
          {/* Sidebar profile card removed - using header UserProfileMenu */}
        </div>
      </aside>

      <div className="relative z-10 flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-[hsl(var(--border))/0.5] bg-[hsl(var(--surface-strong))]/90 px-6 py-4 backdrop-blur-xl">
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
                  <SheetContent side="left" className="bg-[hsl(var(--surface-strong))] w-72">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <UnifiedLogo variant="icon" size="sm" colorScheme="gradient" />
                        Student Portal
                      </SheetTitle>
                      <SheetDescription>Navigate your student dashboard</SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 flex flex-col gap-2 px-2">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.href === "/student"
                          ? pathname === "/student"
                          : pathname?.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-medium transition-all",
                              isActive
                                ? "bg-[hsl(var(--accent-iris))]/12 text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
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
              <SchoolMark
                name={schoolName ?? "School"}
                logoUrl={branding?.logoUrl}
                size="sm"
                className="hidden md:inline-flex"
              />
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-muted-foreground/70">
                  Student Portal · {schoolName ?? "SchoolMatica"}
                </p>
                <p className="text-xl font-semibold text-foreground">
                  Welcome, {user.displayName || "Student"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <ThemeToggle />
              <UserProfileMenu
                user={user}
                portalType="student"
                showSettings={true}
                showSwitchPortal={true}
              />
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="relative flex-1 overflow-y-auto px-6 py-8 md:px-10 focus:outline-none">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
