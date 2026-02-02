"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
  speed: number;
  noiseOffset: number;
}

interface InteractiveBackgroundProps {
  className?: string;
  intensity?: "subtle" | "medium" | "vibrant";
}

// Simplex-like noise function for organic movement
const noise = (x: number, y: number, t: number): number => {
  const sin1 = Math.sin(x * 0.01 + t);
  const sin2 = Math.sin(y * 0.01 + t * 0.8);
  const sin3 = Math.sin((x + y) * 0.005 + t * 1.2);
  return (sin1 + sin2 + sin3) / 3;
};

// Smooth easing function
const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

// Color palette matching design system
const orbColors = {
  subtle: [
    "rgba(99, 102, 241, 0.15)",   // iris
    "rgba(139, 92, 246, 0.12)",   // violet
    "rgba(16, 185, 129, 0.10)",   // mint
    "rgba(244, 114, 182, 0.08)", // pink
  ],
  medium: [
    "rgba(99, 102, 241, 0.22)",
    "rgba(139, 92, 246, 0.18)",
    "rgba(16, 185, 129, 0.15)",
    "rgba(244, 114, 182, 0.12)",
    "rgba(251, 146, 60, 0.10)",  // orange
  ],
  vibrant: [
    "rgba(99, 102, 241, 0.30)",
    "rgba(139, 92, 246, 0.25)",
    "rgba(16, 185, 129, 0.20)",
    "rgba(244, 114, 182, 0.18)",
    "rgba(251, 146, 60, 0.15)",
  ],
};

export function InteractiveBackground({ 
  className,
  intensity = "subtle" 
}: InteractiveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbsRef = useRef<Orb[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Initialize orbs
  const initOrbs = useCallback((width: number, height: number) => {
    const colors = orbColors[intensity];
    const numOrbs = intensity === "subtle" ? 4 : intensity === "medium" ? 5 : 6;
    
    orbsRef.current = Array.from({ length: numOrbs }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      targetX: Math.random() * width,
      targetY: Math.random() * height,
      radius: 150 + Math.random() * 200,
      baseRadius: 150 + Math.random() * 200,
      color: colors[i % colors.length],
      alpha: 1,
      speed: 0.02 + Math.random() * 0.03, // Different speeds for each orb
      noiseOffset: Math.random() * 1000,
    }));
  }, [intensity]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { width, height } = canvas;
    timeRef.current += 0.008;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Update and draw orbs
    orbsRef.current.forEach((orb, index) => {
      // Calculate noise-based movement
      const noiseX = noise(orb.x, orb.y, timeRef.current + orb.noiseOffset) * 50;
      const noiseY = noise(orb.y, orb.x, timeRef.current * 0.7 + orb.noiseOffset) * 50;

      // Update target based on mouse or idle movement
      if (mouseRef.current.active) {
        // Move toward mouse with different attraction levels per orb
        const attraction = 0.3 + (index * 0.15); // Staggered attraction
        const dx = mouseRef.current.x - orb.x;
        const dy = mouseRef.current.y - orb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Repel if too close, attract if far
        if (distance < 200) {
          orb.targetX = orb.x - dx * 0.5;
          orb.targetY = orb.y - dy * 0.5;
        } else {
          orb.targetX = mouseRef.current.x + noiseX * (1 - attraction);
          orb.targetY = mouseRef.current.y + noiseY * (1 - attraction);
        }
        
        // Pulse effect when mouse is active
        orb.radius = lerp(orb.radius, orb.baseRadius * (1.1 + index * 0.05), 0.05);
      } else {
        // Idle: organic drift with noise
        orb.targetX += noiseX * 0.1;
        orb.targetY += noiseY * 0.1;
        
        // Keep within bounds with soft bounce
        if (orb.targetX < -100) orb.targetX = width + 100;
        if (orb.targetX > width + 100) orb.targetX = -100;
        if (orb.targetY < -100) orb.targetY = height + 100;
        if (orb.targetY > height + 100) orb.targetY = -100;
        
        orb.radius = lerp(orb.radius, orb.baseRadius, 0.02);
      }

      // Smooth position interpolation
      orb.x = lerp(orb.x, orb.targetX, orb.speed);
      orb.y = lerp(orb.y, orb.targetY, orb.speed);

      // Draw orb with radial gradient
      const gradient = ctx.createRadialGradient(
        orb.x, orb.y, 0,
        orb.x, orb.y, orb.radius
      );
      gradient.addColorStop(0, orb.color);
      gradient.addColorStop(0.5, orb.color.replace(/[\d.]+\)$/, "0.5)").replace(/0\.\d+\)$/, m => {
        const val = parseFloat(m) * 0.3;
        return val.toFixed(2) + ")";
      }));
      gradient.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  // Setup canvas and event listeners
  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      
      initOrbs(rect.width, rect.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Mouse tracking with throttling
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        const rect = container.getBoundingClientRect();
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          active: true,
        };
        throttleTimer = null;
      }, 16); // ~60fps throttle
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleMouseEnter = () => {
      mouseRef.current.active = true;
    };

    // Touch support for mobile
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        const touch = e.touches[0];
        mouseRef.current = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
          active: true,
        };
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current.active = false;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [prefersReducedMotion, animate, initOrbs]);

  // Reduced motion fallback - static gradient
  if (prefersReducedMotion) {
    return (
      <div
        className={cn(
          "absolute inset-0 pointer-events-none",
          "bg-gradient-to-br from-[hsl(var(--accent-violet))/0.1] via-transparent to-emerald-500/10",
          className
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden pointer-events-auto", className)}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ filter: "blur(60px)" }}
      />
    </div>
  );
}

export default InteractiveBackground;
