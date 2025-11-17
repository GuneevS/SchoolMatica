"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuSquareIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoleSwitcher } from "@/components/role-switcher";
import { HelpButton } from "@/components/help/help-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SchoolSwitcher } from "@/components/school-switcher";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Classes", href: "/classes" },
  { label: "Assessment Plans", href: "/assessment-plans" },
  { label: "Registrations", href: "/registrations" },
  { label: "Students", href: "/students" },
  { label: "Teachers", href: "/teachers" },
  { label: "Schools", href: "/schools" },
  { label: "Settings", href: "/settings/grading" },
];

interface Props {
  children: React.ReactNode;
  initialSchool: {
    id: string;
    name: string;
    shortCode?: string;
  } | null;
}

export function AppShell({ children, initialSchool }: Props) {
  const pathname = usePathname();
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
        <div className="mb-10 flex items-center gap-3 text-lg font-semibold">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--accent-iris))/0.15] text-primary">
            <MenuSquareIcon className="h-5 w-5" />
          </div>
          <div>
            <p>SchoolMatica</p>
            <p className="text-xs font-normal text-muted-foreground">Assessment Suite</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
          {navItems.map((item) => {
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
          })}
        </nav>
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
    </div>
  );
}
