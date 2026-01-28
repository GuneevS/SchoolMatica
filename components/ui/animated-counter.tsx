"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: string;
  className?: string;
  duration?: number;
  delay?: number;
}

// Parse numeric value from string like "500+", "25K+", "100K+"
const parseValue = (value: string): { num: number; suffix: string; prefix: string } => {
  const match = value.match(/^([^\d]*)(\d+)(.*)$/);
  if (!match) return { num: 0, suffix: value, prefix: "" };
  
  const prefix = match[1];
  let num = parseInt(match[2], 10);
  let suffix = match[3];
  
  // Handle K suffix (thousands)
  if (suffix.toLowerCase().startsWith("k")) {
    num = num * 1000;
    suffix = suffix.slice(1);
  }
  
  return { num, suffix, prefix };
};

// Format number back to display string
const formatValue = (num: number, originalValue: string): string => {
  const parsed = parseValue(originalValue);
  
  // If original had K, format with K
  if (originalValue.toLowerCase().includes("k")) {
    if (num >= 1000) {
      return `${parsed.prefix}${Math.floor(num / 1000)}K${parsed.suffix}`;
    }
  }
  
  return `${parsed.prefix}${Math.floor(num)}${parsed.suffix}`;
};

// Easing function for smooth deceleration
const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

export function AnimatedCounter({
  value,
  className,
  duration = 2000,
  delay = 0,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState("0");
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Intersection observer to trigger animation when in view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const { num: targetNum } = parseValue(value);
    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (startTime === null) {
        startTime = currentTime + delay;
      }

      const elapsed = currentTime - startTime;
      
      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const currentValue = Math.floor(easedProgress * targetNum);

      setDisplayValue(formatValue(currentValue, value));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value); // Ensure final value is exact
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [hasStarted, value, duration, delay]);

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    if (mediaQuery.matches) {
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <span
      ref={elementRef}
      className={cn("tabular-nums", className)}
    >
      {prefersReducedMotion ? value : displayValue}
    </span>
  );
}

export default AnimatedCounter;
