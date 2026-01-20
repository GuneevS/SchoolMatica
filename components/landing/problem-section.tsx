"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileSpreadsheet,
  Clock,
  AlertTriangle,
  Users,
  FileX,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PainPoint {
  icon: React.ElementType;
  title: string;
  description: string;
  stat: string;
  statLabel: string;
}

const painPoints: PainPoint[] = [
  {
    icon: FileSpreadsheet,
    title: "Scattered Spreadsheets",
    description:
      "Teachers maintain separate Excel files for each class, creating data silos and version control nightmares.",
    stat: "15+",
    statLabel: "spreadsheets per teacher",
  },
  {
    icon: Clock,
    title: "Hours of Manual Work",
    description:
      "Manual calculations, reformatting, and report generation consume valuable teaching time every term.",
    stat: "8hrs",
    statLabel: "lost per week",
  },
  {
    icon: AlertTriangle,
    title: "Calculation Errors",
    description:
      "Formula mistakes in spreadsheets go unnoticed until report cards reveal incorrect grades.",
    stat: "23%",
    statLabel: "of schools report errors",
  },
  {
    icon: FileX,
    title: "Policy Non-Compliance",
    description:
      "CAPS weighting rules and assessment types are hard to enforce consistently across departments.",
    stat: "40%",
    statLabel: "compliance gap",
  },
  {
    icon: Users,
    title: "No Collaboration",
    description:
      "HODs can't easily review or moderate work without email chains and file sharing confusion.",
    stat: "72hrs",
    statLabel: "moderation delays",
  },
  {
    icon: Calculator,
    title: "Report Generation Pain",
    description:
      "Consolidating data from multiple sources for report cards takes entire weekends.",
    stat: "2 days",
    statLabel: "per reporting cycle",
  },
];

export function ProblemSection() {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const sectionRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    itemRefs.current.forEach((ref, index) => {
      if (ref) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setVisibleItems((prev) => new Set([...prev, index]));
              }
            });
          },
          { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
        );
        observer.observe(ref);
        observers.push(observer);
      }
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  return (
    <section
      ref={sectionRef}
      id="problem"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[hsl(var(--surface-soft))]" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium mb-6">
            <AlertTriangle className="h-4 w-4" />
            The Problem
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Spreadsheets Were Never Meant for{" "}
            <span className="text-red-500">Assessment Management</span>
          </h2>

          <p className="text-lg text-muted-foreground leading-relaxed">
            South African educators waste countless hours fighting Excel when they
            should be teaching. The daily reality of managing assessments with
            spreadsheets creates frustration, errors, and compliance risks.
          </p>
        </div>

        {/* Pain points grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {painPoints.map((point, index) => (
            <div
              key={point.title}
              ref={(el) => { itemRefs.current[index] = el; }}
              className={cn(
                "group relative p-6 rounded-2xl transition-all duration-500",
                "bg-background border border-[hsl(var(--border-strong))/0.3]",
                "hover:shadow-ambient hover:border-[hsl(var(--border-strong))/0.5]",
                "hover:-translate-y-1",
                visibleItems.has(index)
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className="mb-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    "bg-red-500/10 text-red-500",
                    "group-hover:scale-110 transition-transform duration-300"
                  )}
                >
                  <point.icon className="w-6 h-6" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2 group-hover:text-foreground transition-colors">
                {point.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {point.description}
              </p>

              {/* Stat badge */}
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-500">
                  {point.stat}
                </span>
                <span className="text-xs text-muted-foreground">
                  {point.statLabel}
                </span>
              </div>

              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-2xl">
                <div className="absolute -top-8 -right-8 w-16 h-16 bg-red-500/5 rotate-45 group-hover:bg-red-500/10 transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* Impact summary */}
        <div className="relative max-w-4xl mx-auto">
          <div className="aurora-panel rounded-2xl p-8 lg:p-10">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">
                  The Cost of Spreadsheet Chaos
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Schools lose an average of{" "}
                  <strong className="text-foreground">320 hours per year</strong> to
                  manual assessment administration. That&apos;s time that could be spent
                  on what matters most—student learning.
                </p>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 text-[hsl(var(--accent-iris))] font-medium hover:underline group"
                >
                  See how SchoolMatica solves this
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>

              {/* Visual representation */}
              <div className="relative">
                <div className="grid grid-cols-3 gap-3">
                  {/* Time lost visualization */}
                  <div className="col-span-3 grid grid-cols-12 gap-1">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-8 rounded-sm transition-all duration-300",
                          i < 4
                            ? "bg-red-500/80"
                            : "bg-[hsl(var(--muted))]/30"
                        )}
                        style={{ transitionDelay: `${i * 50}ms` }}
                      />
                    ))}
                  </div>
                  <div className="col-span-3 flex justify-between text-xs text-muted-foreground pt-2">
                    <span>Admin Work (33%)</span>
                    <span>Available Teaching Time</span>
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

export default ProblemSection;
