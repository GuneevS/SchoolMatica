"use client";

import { lazy, Suspense, useState, useRef, useCallback, useEffect } from "react";
import { Play, ChevronRight, BarChart3, ClipboardList, MessageSquare, Grid3x3, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useInView } from "@/lib/hooks/use-in-view";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load demo components for performance
const InteractiveMarkbookDemo = lazy(() =>
  import("./interactive-demos/interactive-markbook-demo").then((mod) => ({
    default: mod.InteractiveMarkbookDemo,
  }))
);

const InteractiveAssessmentPlannerDemo = lazy(() =>
  import("./interactive-demos/interactive-assessment-planner-demo").then((mod) => ({
    default: mod.InteractiveAssessmentPlannerDemo,
  }))
);

const InteractiveModerationDemo = lazy(() =>
  import("./interactive-demos/interactive-moderation-demo").then((mod) => ({
    default: mod.InteractiveModerationDemo,
  }))
);

const InteractiveDashboardDemo = lazy(() =>
  import("./interactive-demos/interactive-dashboard-demo").then((mod) => ({
    default: mod.InteractiveDashboardDemo,
  }))
);

interface DemoTab {
  id: string;
  label: string;
  role: string;
  icon: React.ElementType;
  description: string;
  features: string[];
}

const demoTabs: DemoTab[] = [
  {
    id: "markbook",
    label: "Smart Markbook",
    role: "Teacher Experience",
    icon: Grid3x3,
    description: "Experience spreadsheet-speed mark entry with intelligent calculations",
    features: [
      "Click any cell to edit marks instantly",
      "Toggle heat map for visual performance insights",
      "Filter by term to focus on specific periods",
      "Automatic weighted average calculations",
    ],
  },
  {
    id: "planner",
    label: "Assessment Planner",
    role: "CAPS Compliance",
    icon: ClipboardList,
    description: "Plan assessments with real-time CAPS compliance validation",
    features: [
      "Adjust term weights with interactive sliders",
      "Real-time pie chart visualization",
      "CAPS compliance indicators (must sum to 100%)",
      "Switch between terms to plan all 4 terms",
    ],
  },
  {
    id: "moderation",
    label: "Moderation Workflow",
    role: "Multi-Role Collaboration",
    icon: MessageSquare,
    description: "Collaborate seamlessly across Teacher → HOD → SMT workflow",
    features: [
      "Switch between Teacher, HOD, and SMT perspectives",
      "Add comments and request changes",
      "Approve or reject assessment plans",
      "Track workflow timeline and history",
    ],
  },
  {
    id: "dashboard",
    label: "Analytics Dashboard",
    role: "Performance Insights",
    icon: BarChart3,
    description: "Monitor class performance with interactive charts and insights",
    features: [
      "Class performance bar charts with tooltips",
      "Real-time stats cards (excellent, at-risk, averages)",
      "Detailed breakdown table with pass rates",
      "Filter by class to drill down into data",
    ],
  },
];

// Loading skeleton for demos
function DemoSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

// Hook for touch swipe detection
function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  }, []);
  
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  }, []);
  
  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = Math.abs(touchStart.current.y - touchEnd.current.y);
    
    // Only trigger if horizontal swipe is more prominent than vertical
    if (Math.abs(distanceX) > minSwipeDistance && Math.abs(distanceX) > distanceY) {
      if (distanceX > 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }
  }, [onSwipeLeft, onSwipeRight]);
  
  return { onTouchStart, onTouchMove, onTouchEnd };
}

export function DemoSection() {
  const [activeTab, setActiveTab] = useState(demoTabs[0].id);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { ref: sectionRef, isVisible } = useInView<HTMLElement>({ threshold: 0.2, triggerOnce: true });

  const activeTabData = demoTabs.find((tab) => tab.id === activeTab)!;
  const activeTabIndex = demoTabs.findIndex((tab) => tab.id === activeTab);

  const handleInteraction = () => {
    setHasInteracted(true);
  };
  
  // Navigate to next/previous tab
  const goToNextTab = useCallback(() => {
    const nextIndex = (activeTabIndex + 1) % demoTabs.length;
    setActiveTab(demoTabs[nextIndex].id);
  }, [activeTabIndex]);
  
  const goToPrevTab = useCallback(() => {
    const prevIndex = (activeTabIndex - 1 + demoTabs.length) % demoTabs.length;
    setActiveTab(demoTabs[prevIndex].id);
  }, [activeTabIndex]);
  
  // Touch swipe handlers
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe(goToNextTab, goToPrevTab);

  return (
    <section
      ref={sectionRef}
      id="demo"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[hsl(var(--surface-soft))]" />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div
          className={cn(
            "text-center max-w-3xl mx-auto mb-12 lg:mb-16 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--accent-violet))]/10 border border-[hsl(var(--accent-violet))]/20 text-[hsl(var(--accent-violet))] text-sm font-medium mb-6">
            <Play className="h-4 w-4" />
            See It In Action
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Designed for{" "}
            <span className="gradient-text">Every Role</span>
          </h2>

          <p className="text-lg text-muted-foreground leading-relaxed">
            From classroom teachers to school administrators, SchoolMatica
            provides tailored experiences for every role in your school.
          </p>
        </div>

        {/* Demo viewer */}
        <div
          className={cn(
            "transition-all duration-700 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          )}
        >
          {/* Tab navigation - Desktop */}
          <div className="hidden md:flex justify-center mb-8">
            <div className="inline-flex items-center p-1.5 rounded-xl bg-[hsl(var(--surface-strong))] border border-[hsl(var(--border-strong))/0.3]">
              {demoTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab navigation - Mobile with swipe indicator */}
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevTab}
                className="h-10 w-10 shrink-0"
                aria-label="Previous demo"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <activeTabData.icon className="h-5 w-5 text-[hsl(var(--accent-violet))]" />
                  <span className="font-semibold">{activeTabData.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{activeTabData.role}</span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextTab}
                className="h-10 w-10 shrink-0"
                aria-label="Next demo"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Tab indicators */}
            <div className="flex justify-center gap-1.5">
              {demoTabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    activeTab === tab.id
                      ? "w-6 bg-[hsl(var(--accent-violet))]"
                      : "w-1.5 bg-[hsl(var(--border-strong))]"
                  )}
                  aria-label={`Go to ${tab.label}`}
                />
              ))}
            </div>
            
            {/* Swipe hint */}
            <p className="text-center text-xs text-muted-foreground mt-2">
              Swipe left or right to navigate
            </p>
          </div>

          {/* Demo content */}
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Info panel */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="space-y-6 lg:sticky lg:top-8">
                <div>
                  <span className="text-sm text-[hsl(var(--accent-violet))] font-medium">
                    {activeTabData.role}
                  </span>
                  <h3 className="text-2xl font-bold mt-2 mb-3">
                    {activeTabData.label}
                  </h3>
                  <p className="text-muted-foreground">
                    {activeTabData.description}
                  </p>
                </div>

                <ul className="space-y-3" role="list" aria-label="Demo features">
                  {activeTabData.features.map((feature, index) => (
                    <li
                      key={feature}
                      className={cn(
                        "flex items-center gap-3 transition-all duration-300",
                        isVisible
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-4"
                      )}
                      style={{ transitionDelay: `${400 + index * 100}ms` }}
                    >
                      <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent-mint))]/20 flex items-center justify-center flex-shrink-0">
                        <ChevronRight className="w-3 h-3 text-[hsl(var(--accent-mint))]" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {hasInteracted && (
                  <div
                    className="p-4 rounded-lg bg-[hsl(var(--accent-mint))]/10 border border-[hsl(var(--accent-mint))]/20 animate-in fade-in slide-in-from-bottom-2 duration-500"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent-mint))] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Play className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--accent-mint))]">
                          Great! You&apos;re exploring the demo
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          All interactions are running real production code with demo data
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button className="group" asChild>
                    <a href="/register" aria-label="Start your free trial of SchoolMatica">
                      Start Free Trial
                      <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/login" aria-label="Log in to SchoolMatica">
                      Go to Login
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Interactive Demo Area */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <div 
                className="relative"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {/* Glow effect - hidden on mobile for performance */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[hsl(var(--accent-iris))] via-[hsl(var(--accent-violet))] to-[hsl(var(--accent-flamingo))] rounded-3xl opacity-15 blur-2xl hidden md:block" />

                {/* Interactive Demo Container */}
                <div className="relative rounded-2xl overflow-hidden shadow-ambient md:aurora-panel bg-background md:bg-transparent">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-[hsl(var(--surface-soft))] border-b border-[hsl(var(--border-strong))/0.3]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-6 bg-[hsl(var(--surface-strong))] rounded-lg flex items-center px-3">
                        <span className="text-xs text-muted-foreground">
                          app.schoolmatica.co.za/demo/{activeTab}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* App content - actual interactive demos */}
                  <div className="bg-gradient-to-br from-[hsl(var(--canvas))] to-[hsl(var(--surface-soft))] min-h-[600px]">
                    <Suspense fallback={<DemoSkeleton />}>
                      {activeTab === "markbook" && (
                        <InteractiveMarkbookDemo onInteraction={handleInteraction} />
                      )}
                      {activeTab === "planner" && (
                        <InteractiveAssessmentPlannerDemo onInteraction={handleInteraction} />
                      )}
                      {activeTab === "moderation" && (
                        <InteractiveModerationDemo onInteraction={handleInteraction} />
                      )}
                      {activeTab === "dashboard" && (
                        <InteractiveDashboardDemo onInteraction={handleInteraction} />
                      )}
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DemoSection;
