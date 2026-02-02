"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon" | "stacked";
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

interface LogoMarkProps {
  className?: string;
}

interface LogoWordProps {
  className?: string;
}

/**
 * SchoolMatica Logo Component
 * 
 * A bespoke SVG logo combining:
 * - Abstract grid pattern representing assessment/markbook structure
 * - Ascending checkmark motif symbolizing student progress
 * - Gradient colors from the design system (iris → violet → flamingo)
 * - Clean, geometric shapes for modern SaaS aesthetic
 */
function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-10", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--brand-primary))" />
          <stop offset="50%" stopColor="hsl(var(--brand-secondary))" />
          <stop offset="100%" stopColor="hsl(var(--brand-accent))" />
        </linearGradient>
        <linearGradient id="logo-gradient-secondary" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--accent-cobalt))" />
          <stop offset="100%" stopColor="hsl(var(--brand-primary))" />
        </linearGradient>
        <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="url(#logo-gradient-primary)"
        filter="url(#logo-glow)"
      />

      <g opacity="0.2" stroke="white" strokeWidth="1">
        <line x1="10" y1="16" x2="38" y2="16" />
        <line x1="10" y1="24" x2="38" y2="24" />
        <line x1="10" y1="32" x2="38" y2="32" />
        <line x1="18" y1="10" x2="18" y2="38" />
        <line x1="28" y1="10" x2="28" y2="38" />
      </g>

      <g fill="white">
        <path
          d="M12 29 L16 33 L24 23"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 21 L25 24 L31 16"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
        <path
          d="M30 14 L32 16 L36 11"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
      </g>

      <path
        d="M10 18 Q14 8 28 8"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        opacity="0.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoWord({ className }: LogoWordProps) {
  return (
    <span
      className={cn(
        "font-bold tracking-tight",
        "bg-gradient-to-r from-[hsl(var(--brand-primary))] via-[hsl(var(--brand-secondary))] to-[hsl(var(--brand-accent))]",
        "bg-clip-text text-transparent",
        "text-2xl",
        className,
      )}
    >
      School<span className="font-extrabold">Matica</span>
    </span>
  );
}

export function Logo({
  variant = "full",
  className,
  iconClassName,
  textClassName,
}: LogoProps) {

  // Icon only variant
  if (variant === "icon") {
    return (
      <div className={cn("inline-flex", className)}>
        <LogoMark className={iconClassName} />
      </div>
    );
  }

  // Stacked variant (icon above text)
  if (variant === "stacked") {
    return (
      <div className={cn("inline-flex flex-col items-center gap-2", className)}>
        <LogoMark className={iconClassName} />
        <LogoWord className={textClassName} />
      </div>
    );
  }

  // Full horizontal variant (default)
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark className={iconClassName} />
      <LogoWord className={textClassName} />
    </div>
  );
}

/**
 * Simplified monochrome logo for use on colored backgrounds
 */
export function LogoMono({
  variant = "full",
  className,
  color = "white",
}: {
  variant?: "full" | "icon";
  className?: string;
  color?: "white" | "dark";
}) {
  const fillColor = color === "white" ? "#ffffff" : "hsl(226 47% 10%)";

  const IconMark = (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-10 w-10"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill={fillColor}
        fillOpacity="0.1"
        stroke={fillColor}
        strokeWidth="2"
      />
      <g opacity="0.4" stroke={fillColor} strokeWidth="1">
        <line x1="10" y1="16" x2="38" y2="16" />
        <line x1="10" y1="24" x2="38" y2="24" />
        <line x1="10" y1="32" x2="38" y2="32" />
        <line x1="18" y1="10" x2="18" y2="38" />
        <line x1="28" y1="10" x2="28" y2="38" />
      </g>
      <g stroke={fillColor} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 29 L16 33 L24 23" strokeWidth="2.5" />
        <path d="M22 21 L25 24 L31 16" strokeWidth="2" opacity="0.8" />
        <path d="M30 14 L32 16 L36 11" strokeWidth="1.5" opacity="0.6" />
      </g>
    </svg>
  );

  if (variant === "icon") {
    return (
      <div className={cn("inline-flex", className)}>
        {IconMark}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      {IconMark}
      <span
        className="font-bold tracking-tight text-2xl"
        style={{ color: fillColor }}
      >
        School<span className="font-extrabold">Matica</span>
      </span>
    </div>
  );
}

export default Logo;
