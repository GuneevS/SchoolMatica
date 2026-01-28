"use client";

import { cn } from "@/lib/utils";

interface UnifiedLogoProps {
  variant?: "full" | "icon" | "wordmark" | "stacked";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  colorScheme?: "gradient" | "dark" | "light" | "mono";
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const sizeConfig = {
  xs: { icon: "h-6 w-6", text: "text-sm", gap: "gap-1.5" },
  sm: { icon: "h-8 w-8", text: "text-lg", gap: "gap-2" },
  md: { icon: "h-10 w-10", text: "text-xl", gap: "gap-2.5" },
  lg: { icon: "h-12 w-12", text: "text-2xl", gap: "gap-3" },
  xl: { icon: "h-16 w-16", text: "text-3xl", gap: "gap-4" },
};

/**
 * UnifiedLogo - SchoolMatica Brand Logo
 * 
 * A minimalistic, modern logo that combines:
 * - Stylized "S" lettermark with graduation cap motif
 * - Clean geometric design representing structure and education
 * - Gradient colors from the brand palette
 * 
 * Usage:
 * - Landing page: variant="full" colorScheme="gradient"
 * - Auth pages: variant="full" colorScheme="gradient" or "dark"
 * - App header: variant="full" size="sm"
 * - Favicon: variant="icon"
 */
export function UnifiedLogo({
  variant = "full",
  size = "md",
  colorScheme = "gradient",
  className,
  iconClassName,
  textClassName,
}: UnifiedLogoProps) {
  const config = sizeConfig[size];

  // Logo icon - Stylized "S" with graduation cap element
  const LogoIcon = () => (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(config.icon, iconClassName)}
      aria-hidden="true"
    >
      <defs>
        {/* Primary gradient */}
        <linearGradient id="sm-gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        
        {/* Secondary gradient for depth */}
        <linearGradient id="sm-gradient-secondary" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>

        {/* Subtle shadow filter */}
        <filter id="sm-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.15"/>
        </filter>
      </defs>

      {/* Background rounded square */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="14"
        fill={colorScheme === "mono" ? "currentColor" : "url(#sm-gradient-primary)"}
        filter="url(#sm-shadow)"
      />

      {/* Graduation cap top - abstract triangle */}
      <path
        d="M24 8L36 16L24 20L12 16L24 8Z"
        fill="white"
        fillOpacity="0.95"
      />
      
      {/* Cap tassel - elegant curved line */}
      <path
        d="M24 20V26"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="24" cy="27" r="2" fill="white" opacity="0.9" />

      {/* Stylized "S" letterform - modern serif inspired */}
      <path
        d="M18 28C18 26 20 24.5 24 24.5C28 24.5 30 26 30 28C30 30 28 31.5 24 31.5C20 31.5 18 33 18 35C18 37 20 38.5 24 38.5C28 38.5 30 37 30 35"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  // Logo text with gradient or solid color
  const LogoText = () => {
    const textColorClass = {
      gradient: "bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent",
      dark: "text-slate-900 dark:text-white",
      light: "text-white",
      mono: "text-current",
    }[colorScheme];

    return (
      <span
        className={cn(
          "font-bold tracking-tight",
          config.text,
          textColorClass,
          textClassName
        )}
      >
        School<span className="font-extrabold">Matica</span>
      </span>
    );
  };

  // Render based on variant
  if (variant === "icon") {
    return (
      <div className={cn("inline-flex", className)}>
        <LogoIcon />
      </div>
    );
  }

  if (variant === "wordmark") {
    return (
      <div className={cn("inline-flex", className)}>
        <LogoText />
      </div>
    );
  }

  if (variant === "stacked") {
    return (
      <div className={cn("inline-flex flex-col items-center gap-2", className)}>
        <LogoIcon />
        <LogoText />
      </div>
    );
  }

  // Full variant (default) - horizontal layout
  return (
    <div className={cn("inline-flex items-center", config.gap, className)}>
      <LogoIcon />
      <LogoText />
    </div>
  );
}

/**
 * Favicon component for use in metadata
 * Renders just the icon mark as a simple SVG
 */
export function LogoFavicon() {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="favicon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#favicon-gradient)" />
      <path d="M24 8L36 16L24 20L12 16L24 8Z" fill="white" fillOpacity="0.95" />
      <path d="M24 20V26" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      <circle cx="24" cy="27" r="2" fill="white" opacity="0.9" />
      <path
        d="M18 28C18 26 20 24.5 24 24.5C28 24.5 30 26 30 28C30 30 28 31.5 24 31.5C20 31.5 18 33 18 35C18 37 20 38.5 24 38.5C28 38.5 30 37 30 35"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default UnifiedLogo;
