/**
 * Landing Page Animation Utilities
 * 
 * Provides reusable animation classes and utilities for the landing page
 * following the established design system patterns.
 */

// Intersection Observer animation trigger classes
export const fadeInUpClass = "opacity-0 translate-y-8 transition-all duration-700 ease-out";
export const fadeInUpActiveClass = "opacity-100 translate-y-0";

export const fadeInClass = "opacity-0 transition-opacity duration-500 ease-out";
export const fadeInActiveClass = "opacity-100";

export const scaleInClass = "opacity-0 scale-95 transition-all duration-500 ease-out";
export const scaleInActiveClass = "opacity-100 scale-100";

// Stagger delay utilities
export const staggerDelays = {
  fast: [0, 100, 200, 300, 400, 500] as const,
  medium: [0, 150, 300, 450, 600, 750] as const,
  slow: [0, 200, 400, 600, 800, 1000] as const,
};

export function getStaggerDelay(index: number, speed: keyof typeof staggerDelays = "medium"): string {
  const delays = staggerDelays[speed];
  const delay = delays[Math.min(index, delays.length - 1)];
  return `${delay}ms`;
}

// Animation keyframes for inline styles
export const floatAnimation = {
  animation: "float 6s ease-in-out infinite",
  "@keyframes float": {
    "0%, 100%": { transform: "translateY(0px)" },
    "50%": { transform: "translateY(-20px)" },
  },
};

export const pulseGlowAnimation = {
  animation: "pulse-glow 3s ease-in-out infinite",
  "@keyframes pulse-glow": {
    "0%, 100%": { opacity: 0.5, transform: "scale(1)" },
    "50%": { opacity: 0.8, transform: "scale(1.05)" },
  },
};

// Utility function to create intersection observer for animations
export function createScrollAnimationObserver(
  threshold = 0.1,
  rootMargin = "0px 0px -50px 0px"
): IntersectionObserver | null {
  if (typeof window === "undefined") return null;

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
          entry.target.classList.remove("opacity-0", "translate-y-8", "scale-95");
        }
      });
    },
    { threshold, rootMargin }
  );
}

// Smooth scroll utility
export function scrollToSection(sectionId: string): void {
  const element = document.getElementById(sectionId);
  if (element) {
    const offset = 80; // Account for fixed navbar
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: elementPosition - offset,
      behavior: "smooth",
    });
  }
}

// Parallax utility for background elements
export function getParallaxOffset(scrollY: number, speed = 0.5): number {
  return scrollY * speed;
}

// Animation variants for different section types
export const sectionAnimations = {
  hero: {
    container: "animate-in fade-in-0 slide-in-from-bottom-4 duration-1000",
    title: "animate-in fade-in-0 slide-in-from-bottom-6 duration-700 delay-200",
    subtitle: "animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-400",
    cta: "animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-600",
    visual: "animate-in fade-in-0 slide-in-from-right-8 duration-1000 delay-400",
  },
  feature: {
    card: "hover:scale-[1.02] transition-all duration-300",
    icon: "group-hover:scale-110 transition-transform duration-300",
    title: "group-hover:text-foreground transition-colors duration-200",
  },
  pricing: {
    card: "hover:shadow-ambient transition-all duration-300",
    popular: "relative scale-105 shadow-ambient",
    badge: "animate-pulse",
  },
} as const;

// Gradient animation for hero text
export const gradientTextStyle = {
  backgroundImage: "linear-gradient(120deg, hsl(250 74% 60%) 0%, hsl(266 81% 68%) 50%, hsl(17 87% 66%) 100%)",
  backgroundSize: "200% 200%",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  animation: "gradient-shift 6s ease infinite",
} as const;

// Number counter animation utility
export function animateValue(
  start: number,
  end: number,
  duration: number,
  callback: (value: number) => void
): void {
  const startTime = performance.now();

  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-out cubic
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (end - start) * easeOut);

    callback(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// Type-safe animation delay helper
export function createAnimationDelay(ms: number): React.CSSProperties {
  return {
    animationDelay: `${ms}ms`,
    animationFillMode: "both",
  };
}
