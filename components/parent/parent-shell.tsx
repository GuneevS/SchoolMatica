"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  MessageSquare,
  FileText,
  Award,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "next-auth/react";

const navItems = [
  { label: "Dashboard", href: "/parent", icon: Home },
  { label: "My Children", href: "/parent/children", icon: Users },
  { label: "Messages", href: "/parent/messages", icon: MessageSquare, badge: 3 },
  { label: "Reports", href: "/parent/reports", icon: FileText },
  { label: "Behaviour", href: "/parent/behavior", icon: Award },
];

interface Props {
  children: React.ReactNode;
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
}

export function ParentShell({ children, user }: Props) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen bg-canvas text-foreground">
      {/* Gradient background */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-0 w-2/3 translate-x-1/4 opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, hsl(var(--accent-iris) / 0.2), transparent 55%), radial-gradient(circle at 80% 0%, hsl(var(--accent-mint) / 0.15), transparent 60%), radial-gradient(circle at 60% 80%, hsl(var(--accent-violet) / 0.2), transparent 60%)",
        }}
        aria-hidden
      />

      {/* Sidebar */}
      <aside className="relative z-10 hidden w-64 flex-col border-r border-[hsl(var(--border-strong))/0.6] bg-[hsl(var(--surface-strong))/0.9] px-6 py-8 shadow-ambient-sm backdrop-blur lg:flex xl:w-72">
        {/* Logo */}
        <div className="mb-10 flex items-center gap-3 text-lg font-semibold">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--accent-mint))]/15 text-[hsl(var(--accent-mint))]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p>SchoolMatica</p>
            <p className="text-xs font-normal text-muted-foreground">Parent Portal</p>
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
                    ? "bg-[hsl(var(--accent-mint))]/12 text-foreground shadow-ambient-sm"
                    : "hover:text-foreground hover:bg-[hsl(var(--surface-soft))]",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
                {item.badge && (
                  <Badge className="bg-[hsl(var(--accent-iris))] text-white text-xs h-5 min-w-5 flex items-center justify-center">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto space-y-4">
          <div className="rounded-2xl border border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-soft))] p-4">
            <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {user.displayName || "Parent"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-[hsl(var(--surface-soft))] hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-[hsl(var(--border))/0.5] bg-[hsl(var(--surface-strong))/0.85] px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6">
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.4em] text-muted-foreground/70">
                Parent Portal
              </p>
              <p className="text-xl font-semibold text-foreground">
                Welcome, {user.displayName || "Parent"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[hsl(var(--accent-iris))] text-[10px] font-bold text-white flex items-center justify-center">
                  5
                </span>
              </Button>
              <ThemeToggle />
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
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
