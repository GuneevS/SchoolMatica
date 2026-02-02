"use client";

import { cn } from "@/lib/utils";
import { UnifiedLogo } from "@/components/brand/unified-logo";

const sizeMap = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export function SchoolMark({
  name,
  logoUrl,
  size = "md",
  className,
}: {
  name: string;
  logoUrl?: string | null;
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className={cn("rounded-2xl object-cover shadow-ambient-sm", sizeMap[size], className)}
      />
    );
  }

  return <UnifiedLogo variant="icon" size={size === "sm" ? "xs" : size === "lg" ? "lg" : "md"} className={className} />;
}
