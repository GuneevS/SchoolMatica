"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, Play, Shield, CheckCircle2, School, Users, Award, BookOpen, MessageSquare, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useInView } from "@/lib/hooks/use-in-view";
import { AnimatedCounter } from "@/components/ui/animated-counter";

// Trust badges data - South African focused
const trustBadges = [
  { icon: Shield, label: "CAPS Aligned", description: "DBE curriculum compliant" },
  { icon: School, label: "SA Schools", description: "Built for local educators" },
  { icon: CheckCircle2, label: "POPIA Secure", description: "Data protection assured" },
];

// Key metrics - Updated for comprehensive platform
const metrics = [
  { value: "500+", label: "SA Schools" },
  { value: "25K+", label: "Educators" },
  { value: "100K+", label: "Learners" },
];

// Platform features showcase
const platformFeatures = [
  { icon: BookOpen, label: "Academics", color: "text-blue-500" },
  { icon: Users, label: "Administration", color: "text-violet-500" },
  { icon: Award, label: "Behaviour", color: "text-emerald-500" },
  { icon: MessageSquare, label: "Communication", color: "text-amber-500" },
];

// Hook for parallax scroll effect
function useParallax() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    // Throttle scroll handler for performance
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  
  return scrollY;
}

// Sparkle animation component for CTA button
function SparkleEffect({ className }: { className?: string }) {
  return (
    <span className={cn("absolute pointer-events-none", className)}>
      <Sparkles className="h-3 w-3 text-white/80 animate-pulse" />
    </span>
  );
}

export function HeroSection() {
  const { ref: heroRef, isVisible } = useInView<HTMLElement>({
    threshold: 0.1,
    triggerOnce: true,
  });
  
  const scrollY = useParallax();
  const parallaxOffset = scrollY * 0.3;

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24"
      aria-label="Hero section"
    >
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main aurora gradient */}
        <div
          className={cn(
            "absolute -top-1/2 -left-1/2 w-[200%] h-[200%]",
            "bg-[radial-gradient(ellipse_at_20%_20%,rgba(93,95,239,0.25),transparent_50%)]",
            "animate-[gradient-shift_15s_ease_infinite]"
          )}
        />
        <div
          className={cn(
            "absolute -top-1/2 -right-1/2 w-[200%] h-[200%]",
            "bg-[radial-gradient(ellipse_at_80%_20%,rgba(176,100,255,0.2),transparent_50%)]",
            "animate-[gradient-shift_20s_ease_infinite_reverse]"
          )}
        />
        <div
          className={cn(
            "absolute -bottom-1/2 left-1/4 w-[150%] h-[150%]",
            "bg-[radial-gradient(ellipse_at_50%_80%,rgba(255,139,125,0.15),transparent_50%)]",
            "animate-[gradient-shift_18s_ease_infinite]"
          )}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating decorative elements with parallax */}
        <div 
          className="absolute top-1/4 left-[10%] w-64 h-64 rounded-full bg-[hsl(var(--accent-iris))] opacity-[0.08] blur-3xl animate-float transition-transform duration-100 ease-out" 
          style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
        />
        <div 
          className="absolute bottom-1/4 right-[15%] w-80 h-80 rounded-full bg-[hsl(var(--accent-violet))] opacity-[0.06] blur-3xl animate-float [animation-delay:2s] transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${-parallaxOffset * 0.3}px)` }}
        />
        <div 
          className="absolute top-1/2 right-[25%] w-48 h-48 rounded-full bg-[hsl(var(--accent-mint))] opacity-[0.05] blur-3xl animate-float [animation-delay:1s] transition-transform duration-100 ease-out"
          style={{ transform: `translateY(${parallaxOffset * 0.4}px)` }}
        />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content Column */}
          <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            {/* Eyebrow badge */}
            <div
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6",
                "bg-[hsl(var(--accent-iris))]/10 border border-[hsl(var(--accent-iris))]/20",
                "text-sm font-medium text-[hsl(var(--accent-iris))]",
                "transition-all duration-700",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--accent-iris))] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--accent-iris))]" />
              </span>
              Trusted by 500+ South African Schools
            </div>

            {/* Main headline - Updated messaging */}
            <h1
              className={cn(
                "text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6",
                "transition-all duration-700 delay-100",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
            >
              The Complete{" "}
              <span className="gradient-text">School Management</span>{" "}
              Platform for South Africa
            </h1>

            {/* Subtitle - Updated for comprehensive platform */}
            <p
              className={cn(
                "text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8",
                "transition-all duration-700 delay-200",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
            >
              Academics, administration, behaviour tracking, and parent communication—all 
              in one powerful platform. Built for South African schools with CAPS alignment, 
              DBE compliance, and world-class design.
            </p>

            {/* Platform Features Pills */}
            <div
              className={cn(
                "flex flex-wrap justify-center lg:justify-start gap-2 mb-8",
                "transition-all duration-700 delay-250",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
            >
              {platformFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-white/20 text-sm"
                  >
                    <Icon className={cn("h-4 w-4", feature.color)} />
                    <span className="font-medium">{feature.label}</span>
                  </div>
                );
              })}
            </div>

            {/* CTA Buttons */}
            <div
              className={cn(
                "flex flex-col sm:flex-row items-center gap-4 mb-10",
                "transition-all duration-700 delay-300",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
            >
              <Button
                size="lg"
                className="w-full sm:w-auto group relative overflow-hidden bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300"
                asChild
              >
                <Link
                  href="/register"
                  aria-label="Start your free 14-day trial of SchoolMatica"
                >
                  {/* Sparkle effects */}
                  <SparkleEffect className="top-1 left-2 animate-[pulse_2s_ease-in-out_infinite]" />
                  <SparkleEffect className="bottom-1 right-3 animate-[pulse_2s_ease-in-out_infinite_0.5s]" />
                  <SparkleEffect className="top-2 right-8 animate-[pulse_2s_ease-in-out_infinite_1s]" />
                  
                  {/* Shine effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  
                  <span className="relative z-10 flex items-center">
                    Start Free Trial
                    <ArrowRight
                      className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto group hover:bg-[hsl(var(--accent-iris))]/10 hover:border-[hsl(var(--accent-iris))]/30 transition-all duration-300"
                asChild
              >
                <Link
                  href="#demo"
                  aria-label="Watch SchoolMatica product demonstration video"
                >
                  <Play
                    className="mr-2 h-4 w-4 fill-current transition-transform group-hover:scale-110"
                    aria-hidden="true"
                  />
                  Watch Demo
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div
              className={cn(
                "flex flex-wrap justify-center lg:justify-start gap-6",
                "transition-all duration-700 delay-400",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
              role="list"
              aria-label="Platform trust badges and certifications"
            >
              {trustBadges.map((badge, index) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                  style={{ transitionDelay: `${500 + index * 100}ms` }}
                  role="listitem"
                  aria-label={`${badge.label}: ${badge.description}`}
                >
                  <badge.icon
                    className="h-5 w-5 text-[hsl(var(--accent-mint))]"
                    aria-hidden="true"
                  />
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Column - Enhanced App Mockup */}
          <div
            className={cn(
              "relative lg:pl-8",
              "transition-all duration-1000 delay-300",
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            )}
          >
            {/* Main mockup container */}
            <div className="relative">
              {/* Glow effect behind mockup */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[hsl(var(--accent-iris))] via-[hsl(var(--accent-violet))] to-[hsl(var(--accent-flamingo))] rounded-3xl opacity-20 blur-2xl" />

              {/* Browser mockup */}
              <div className="relative rounded-2xl overflow-hidden shadow-ambient aurora-panel">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[hsl(var(--surface-soft))] border-b border-[hsl(var(--border-strong))/0.3]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-6 bg-[hsl(var(--surface-strong))] rounded-lg flex items-center px-3">
                      <span className="text-xs text-muted-foreground">app.schoolmatica.co.za</span>
                    </div>
                  </div>
                </div>

                {/* App preview content - Dashboard mockup */}
                <div className="aspect-[16/10] bg-gradient-to-br from-[hsl(var(--canvas))] to-[hsl(var(--surface-soft))] p-4">
                  {/* Dashboard mockup */}
                  <div className="h-full flex flex-col gap-3">
                    {/* Top bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))]" />
                        <div className="h-4 w-32 bg-[hsl(var(--muted))] rounded" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 w-8 bg-[hsl(var(--muted))] rounded-lg" />
                        <div className="h-8 w-8 bg-[hsl(var(--muted))] rounded-lg" />
                      </div>
                    </div>

                    {/* Content area */}
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      {/* Stats cards - representing different modules */}
                      <div className="col-span-3 grid grid-cols-4 gap-2">
                        {[
                          { label: "Classes", color: "from-blue-500 to-cyan-500" },
                          { label: "Students", color: "from-violet-500 to-purple-500" },
                          { label: "Merits", color: "from-emerald-500 to-green-500" },
                          { label: "Messages", color: "from-amber-500 to-orange-500" },
                        ].map((stat, i) => (
                          <div
                            key={stat.label}
                            className="glass-panel rounded-xl p-2 flex flex-col"
                          >
                            <div className="h-2 w-12 bg-[hsl(var(--muted))] rounded mb-1.5" />
                            <div className={cn("h-5 w-10 rounded bg-gradient-to-r", stat.color)} />
                          </div>
                        ))}
                      </div>

                      {/* Main content area - Performance chart */}
                      <div className="col-span-2 glass-panel rounded-xl p-3">
                        <div className="h-3 w-24 bg-[hsl(var(--muted))] rounded mb-3" />
                        <div className="flex items-end gap-1 h-16">
                          {[65, 80, 55, 90, 70, 85, 75].map((h, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-gradient-to-t from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] rounded-t opacity-70"
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Side panel - Recent activity */}
                      <div className="glass-panel rounded-xl p-3">
                        <div className="h-3 w-16 bg-[hsl(var(--muted))] rounded mb-3" />
                        <div className="space-y-2">
                          {[
                            { color: "bg-emerald-500" },
                            { color: "bg-amber-500" },
                            { color: "bg-blue-500" },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", item.color)} />
                              <div className="h-3 flex-1 bg-[hsl(var(--muted))]/50 rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating metric cards - Updated for comprehensive platform with parallax */}
              <div 
                className="absolute -left-4 top-1/4 glass-panel rounded-xl p-3 shadow-ambient-sm animate-float hidden lg:block hover:scale-105 transition-all duration-300"
                style={{ transform: `translateY(${parallaxOffset * 0.2}px)` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--accent-mint))]/20 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-[hsl(var(--accent-mint))]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Analytics</p>
                    <p className="text-sm font-semibold">Real-time insights</p>
                  </div>
                </div>
              </div>

              <div 
                className="absolute -right-4 bottom-1/4 glass-panel rounded-xl p-3 shadow-ambient-sm animate-float [animation-delay:1.5s] hidden lg:block hover:scale-105 transition-all duration-300"
                style={{ transform: `translateY(${-parallaxOffset * 0.15}px)` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--accent-iris))]/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-[hsl(var(--accent-iris))]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Communication</p>
                    <p className="text-sm font-semibold">Parent portal</p>
                  </div>
                </div>
              </div>

              <div 
                className="absolute -left-2 bottom-1/3 glass-panel rounded-xl p-3 shadow-ambient-sm animate-float [animation-delay:3s] hidden lg:block hover:scale-105 transition-all duration-300"
                style={{ transform: `translateY(${parallaxOffset * 0.1}px)` }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--accent-violet))]/20 flex items-center justify-center">
                    <Award className="w-4 h-4 text-[hsl(var(--accent-violet))]" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Behaviour</p>
                    <p className="text-sm font-semibold">Merit tracking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom metrics bar */}
        <div
          className={cn(
            "mt-16 lg:mt-24 grid grid-cols-3 gap-8 max-w-2xl mx-auto",
            "transition-all duration-700 delay-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
          role="list"
          aria-label="Platform usage statistics"
        >
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className="text-center group"
              style={{ transitionDelay: `${600 + index * 100}ms` }}
              role="listitem"
              aria-label={`${metric.value} ${metric.label}`}
            >
              <p className="text-3xl sm:text-4xl font-bold gradient-text group-hover:scale-105 transition-transform duration-300">
                <AnimatedCounter 
                  value={metric.value} 
                  duration={2000} 
                  delay={index * 200}
                />
              </p>
              <p className="text-sm text-muted-foreground mt-1">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 text-muted-foreground">
        <span className="text-xs">Scroll to explore</span>
        <div className="w-6 h-10 border-2 border-current rounded-full p-1">
          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce mx-auto" />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
