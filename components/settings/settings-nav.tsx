"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Branding", href: "/settings/branding" },
  { label: "Grading", href: "/settings/grading" },
];

export function SettingsNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {navItems.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition",
              isActive
                ? "border-transparent bg-[hsl(var(--brand-primary))] text-white shadow-ambient-sm"
                : "border-[hsl(var(--border))/0.6] bg-[hsl(var(--surface-strong))/0.8] text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
