"use client";

import { useEffect, useRef, useState } from "react";
import { Play, ChevronRight, GraduationCap, Building2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
    id: "teacher",
    label: "Teacher View",
    role: "Teacher",
    icon: GraduationCap,
    description: "Manage your classes with spreadsheet-speed efficiency",
    features: [
      "Multi-cell selection & bulk entry",
      "Drag-fill for quick data entry",
      "Auto-calculating totals & averages",
      "Assessment plan templates",
    ],
  },
  {
    id: "hod",
    label: "HOD Dashboard",
    role: "Head of Department",
    icon: Building2,
    description: "Oversee your department with complete visibility",
    features: [
      "Department-wide progress tracking",
      "Moderation workflow management",
      "Cross-teacher analytics",
      "Policy compliance monitoring",
    ],
  },
  {
    id: "admin",
    label: "Admin Panel",
    role: "School Administrator",
    icon: Shield,
    description: "Full school oversight with powerful reporting",
    features: [
      "School-wide dashboards",
      "Mark schedule generation",
      "User management & permissions",
      "SA-SAMS export integration",
    ],
  },
];

export function DemoSection() {
  const [activeTab, setActiveTab] = useState(demoTabs[0].id);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const activeTabData = demoTabs.find((tab) => tab.id === activeTab)!;

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
          {/* Tab navigation */}
          <div className="flex justify-center mb-8">
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
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.role.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Demo content */}
          <div className="grid lg:grid-cols-5 gap-8 items-center">
            {/* Info panel */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="space-y-6">
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

                <ul className="space-y-3">
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

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button className="group">
                    Try Interactive Demo
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                  <Button variant="outline">
                    Watch Video Tour
                    <Play className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Visual mockup */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[hsl(var(--accent-iris))] via-[hsl(var(--accent-violet))] to-[hsl(var(--accent-flamingo))] rounded-3xl opacity-15 blur-2xl" />

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
                        <span className="text-xs text-muted-foreground">
                          app.schoolmatica.co.za/{activeTab}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* App content - role-specific mockup */}
                  <div className="aspect-[16/10] bg-gradient-to-br from-[hsl(var(--canvas))] to-[hsl(var(--surface-soft))] p-4">
                    {/* Dynamic content based on active tab */}
                    {activeTab === "teacher" && <TeacherViewMockup />}
                    {activeTab === "hod" && <HODViewMockup />}
                    {activeTab === "admin" && <AdminViewMockup />}
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

// Teacher view mockup component
function TeacherViewMockup() {
  return (
    <div className="h-full flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 w-24 bg-[hsl(var(--muted))] rounded" />
          <div className="h-4 w-16 bg-[hsl(var(--muted))]/50 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-[hsl(var(--accent-iris))]/20 rounded-lg" />
          <div className="h-8 w-8 bg-[hsl(var(--muted))] rounded-lg" />
        </div>
      </div>

      {/* Markbook grid */}
      <div className="flex-1 glass-panel rounded-xl p-3 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header row */}
          <div className="grid grid-cols-6 gap-2 mb-2">
            <div className="h-6 bg-[hsl(var(--muted))] rounded" />
            <div className="h-6 bg-[hsl(var(--accent-iris))]/20 rounded" />
            <div className="h-6 bg-[hsl(var(--accent-iris))]/20 rounded" />
            <div className="h-6 bg-[hsl(var(--accent-iris))]/20 rounded" />
            <div className="h-6 bg-[hsl(var(--accent-violet))]/20 rounded" />
            <div className="h-6 bg-[hsl(var(--accent-mint))]/30 rounded" />
          </div>
          {/* Data rows */}
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="grid grid-cols-6 gap-2 mb-1.5">
              <div className="h-5 bg-[hsl(var(--muted))]/60 rounded" />
              <div className={cn(
                "h-5 rounded",
                row === 2 ? "bg-[hsl(var(--accent-iris))]/30 ring-2 ring-[hsl(var(--accent-iris))]" : "bg-[hsl(var(--muted))]/30"
              )} />
              <div className="h-5 bg-[hsl(var(--muted))]/30 rounded" />
              <div className="h-5 bg-[hsl(var(--muted))]/30 rounded" />
              <div className="h-5 bg-[hsl(var(--muted))]/30 rounded" />
              <div className="h-5 bg-[hsl(var(--accent-mint))]/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// HOD view mockup component
function HODViewMockup() {
  return (
    <div className="h-full flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-[hsl(var(--muted))] rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-6 bg-[hsl(var(--accent-flamingo))]/30 rounded-full" />
          <div className="h-6 w-6 bg-[hsl(var(--accent-mint))]/30 rounded-full" />
        </div>
      </div>

      {/* Dashboard grid */}
      <div className="flex-1 grid grid-cols-3 gap-3">
        {/* Stats panel */}
        <div className="col-span-2 glass-panel rounded-xl p-3">
          <div className="h-3 w-20 bg-[hsl(var(--muted))] rounded mb-3" />
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[hsl(var(--surface-strong))] rounded-lg p-2">
                <div className="h-6 w-8 bg-gradient-to-r from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] rounded mb-1" />
                <div className="h-2 w-12 bg-[hsl(var(--muted))]/50 rounded" />
              </div>
            ))}
          </div>
          {/* Chart placeholder */}
          <div className="h-20 flex items-end gap-1">
            {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] rounded-t opacity-70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Moderation queue */}
        <div className="glass-panel rounded-xl p-3">
          <div className="h-3 w-16 bg-[hsl(var(--muted))] rounded mb-3" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-[hsl(var(--surface-strong))] rounded-lg">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--warning))]" />
                <div className="flex-1 h-2 bg-[hsl(var(--muted))]/50 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Admin view mockup component
function AdminViewMockup() {
  return (
    <div className="h-full flex flex-col gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-4 w-28 bg-[hsl(var(--muted))] rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-[hsl(var(--accent-mint))]/20 rounded-lg" />
          <div className="h-8 w-24 bg-[hsl(var(--accent-iris))]/20 rounded-lg" />
        </div>
      </div>

      {/* Admin panels */}
      <div className="flex-1 grid grid-cols-4 gap-3">
        {/* Sidebar */}
        <div className="glass-panel rounded-xl p-3">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-6 rounded-lg flex items-center px-2 gap-2",
                  i === 1 ? "bg-[hsl(var(--accent-iris))]/20" : "bg-transparent"
                )}
              >
                <div className={cn(
                  "w-3 h-3 rounded",
                  i === 1 ? "bg-[hsl(var(--accent-iris))]" : "bg-[hsl(var(--muted))]"
                )} />
                <div className="h-2 flex-1 bg-[hsl(var(--muted))]/50 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="col-span-3 glass-panel rounded-xl p-3">
          <div className="h-3 w-32 bg-[hsl(var(--muted))] rounded mb-3" />
          {/* Table */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-5 bg-[hsl(var(--muted))] rounded" />
              ))}
            </div>
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="grid grid-cols-5 gap-2">
                <div className="h-5 bg-[hsl(var(--muted))]/40 rounded" />
                <div className="h-5 bg-[hsl(var(--muted))]/30 rounded" />
                <div className="h-5 bg-[hsl(var(--muted))]/30 rounded" />
                <div className="h-5 bg-[hsl(var(--accent-mint))]/20 rounded" />
                <div className="h-5 bg-[hsl(var(--muted))]/20 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoSection;
