"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuSquareIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoleSwitcher } from "@/components/role-switcher";
import { HelpButton } from "@/components/help/help-button";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Classes", href: "/classes" },
  { label: "Assessment Plans", href: "/assessment-plans" },
  { label: "Registrations", href: "/registrations" },
  { label: "Students", href: "/students" },
  { label: "Settings", href: "/settings/grading" },
];

interface Props {
  children: React.ReactNode;
}

export function AppShell({ children }: Props) {
  const pathname = usePathname();
  return (
    <>
      {/* Temporarily disable buggy tour */}
      {/* <TourSpotlight /> */}
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <aside className="hidden w-64 border-r bg-white/90 backdrop-blur-sm p-6 lg:block shadow-sm">
        <div className="mb-8 flex items-center gap-3 text-lg font-semibold">
          <MenuSquareIcon className="h-5 w-5 text-primary" />
          <div>
            SchoolMatica
            <p className="text-xs font-normal text-muted-foreground">Assessment Suite</p>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                pathname?.startsWith(item.href)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white/80 px-6 py-4 backdrop-blur-md shadow-sm sticky top-0 z-10">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Active school</p>
            <p className="font-semibold">SchoolMatica High</p>
          </div>
          <RoleSwitcher />
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/20 p-6">{children}</main>
      </div>
      <HelpButton data-tour="help-button" />
    </div>
    </>
  );
}
