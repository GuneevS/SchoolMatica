"use client";

import {
  LayoutGrid,
  Calculator,
  Shield,
  Users,
  FileBarChart,
  GitBranch,
  Zap,
  Lock,
  Settings2,
  MessageSquare,
  Download,
  CheckCircle2,
  CreditCard,
  Calendar,
  BookOpen,
  Award,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInView } from "@/lib/hooks/use-in-view";

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  color: "iris" | "violet" | "cobalt" | "flamingo" | "mint";
  highlights?: string[];
}

const features: Feature[] = [
  {
    icon: LayoutGrid,
    title: "Intuitive Markbook Grid",
    description:
      "A spreadsheet-familiar interface with intelligent features. Multi-select cells, bulk entry, drag-fill, and keyboard shortcuts—everything you love, nothing you don't.",
    color: "iris",
    highlights: ["Multi-select editing", "Drag-fill values", "Keyboard shortcuts"],
  },
  {
    icon: MessageSquare,
    title: "Parent Communications",
    description:
      "Real-time messaging with parents, bulk personalized communications, and automated notifications. Keep everyone informed with chatbot-like workflows.",
    color: "violet",
    highlights: ["Real-time chat", "Bulk messaging", "Auto-notifications"],
  },
  {
    icon: CreditCard,
    title: "Fees & Accounting",
    description:
      "Complete fee management with invoicing, payment tracking, and reconciliation. Supports EFT, card, Apple Pay, Google Pay, and SA payment gateways.",
    color: "mint",
    highlights: ["Multi-payment support", "Auto-invoicing", "Account recons"],
  },
  {
    icon: Award,
    title: "Merit/Demerit System",
    description:
      "Track student behavior with running totals, automatic parent notifications, and comprehensive audit trails. Reward excellence, address concerns.",
    color: "flamingo",
    highlights: ["Running totals", "Parent alerts", "Full audit trail"],
  },
  {
    icon: Calendar,
    title: "Events Calendar",
    description:
      "School-wide events with smart filtering by grade, class, or role. Sync to personal calendars and never miss an important date.",
    color: "cobalt",
    highlights: ["Smart filtering", "Calendar sync", "Role-based views"],
  },
  {
    icon: BookOpen,
    title: "Homework Tracking",
    description:
      "Assign homework, track submissions, and automatically notify parents when assignments are missing. Streamlined workflow for busy teachers.",
    color: "iris",
    highlights: ["Easy assignment", "Submission tracking", "Parent alerts"],
  },
];

const additionalFeatures = [
  { icon: Zap, label: "Real-time Sync" },
  { icon: Lock, label: "Data Security" },
  { icon: Shield, label: "CAPS Compliance" },
  { icon: FileBarChart, label: "SA-SAMS Ready" },
  { icon: Users, label: "Role-Based Access" },
  { icon: Bell, label: "Smart Notifications" },
];

const colorClasses = {
  iris: {
    bg: "bg-[hsl(var(--accent-iris))]/10",
    text: "text-[hsl(var(--accent-iris))]",
    border: "border-[hsl(var(--accent-iris))]/20",
    gradient: "from-[hsl(var(--accent-iris))]/20 to-transparent",
  },
  violet: {
    bg: "bg-[hsl(var(--accent-violet))]/10",
    text: "text-[hsl(var(--accent-violet))]",
    border: "border-[hsl(var(--accent-violet))]/20",
    gradient: "from-[hsl(var(--accent-violet))]/20 to-transparent",
  },
  cobalt: {
    bg: "bg-[hsl(var(--accent-cobalt))]/10",
    text: "text-[hsl(var(--accent-cobalt))]",
    border: "border-[hsl(var(--accent-cobalt))]/20",
    gradient: "from-[hsl(var(--accent-cobalt))]/20 to-transparent",
  },
  flamingo: {
    bg: "bg-[hsl(var(--accent-flamingo))]/10",
    text: "text-[hsl(var(--accent-flamingo))]",
    border: "border-[hsl(var(--accent-flamingo))]/20",
    gradient: "from-[hsl(var(--accent-flamingo))]/20 to-transparent",
  },
  mint: {
    bg: "bg-[hsl(var(--accent-mint))]/10",
    text: "text-[hsl(var(--accent-mint))]",
    border: "border-[hsl(var(--accent-mint))]/20",
    gradient: "from-[hsl(var(--accent-mint))]/20 to-transparent",
  },
};

export function FeaturesSection() {
  const { ref: sectionRef, isVisible } = useInView<HTMLElement>({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section
      ref={sectionRef}
      id="features"
      aria-label="Features section"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[hsl(var(--accent-iris))] opacity-[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[hsl(var(--accent-violet))] opacity-[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div
          className={cn(
            "text-center max-w-3xl mx-auto mb-16 lg:mb-20 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--accent-iris))]/10 border border-[hsl(var(--accent-iris))]/20 text-[hsl(var(--accent-iris))] text-sm font-medium mb-6">
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            Features
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Everything You Need,{" "}
            <span className="gradient-text">Nothing You Don&apos;t</span>
          </h2>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Purpose-built for South African schools. Every feature designed to save
            time, ensure compliance, and make assessment management effortless.
          </p>
        </div>

        {/* Main features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16" role="list">
          {features.map((feature, index) => {
            const colors = colorClasses[feature.color];
            return (
              <div
                key={feature.title}
                role="listitem"
                className={cn(
                  "group relative p-6 lg:p-8 rounded-2xl transition-all duration-500",
                  "bg-background/50 backdrop-blur-sm",
                  "border border-[hsl(var(--border-strong))/0.3]",
                  "hover:shadow-ambient hover:border-[hsl(var(--border-strong))/0.5]",
                  "hover:-translate-y-1",
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Gradient overlay on hover */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    colors.gradient
                  )}
                />

                {/* Content */}
                <div className="relative">
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center mb-5",
                      colors.bg,
                      "group-hover:scale-110 transition-transform duration-300"
                    )}
                  >
                    <feature.icon className={cn("w-7 h-7", colors.text)} aria-hidden="true" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-foreground transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  {feature.highlights && (
                    <div className="flex flex-wrap gap-2">
                      {feature.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                            colors.bg,
                            colors.text
                          )}
                        >
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                          {highlight}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional features bar */}
        <div className="aurora-panel rounded-2xl p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-lg font-semibold mb-1">Plus Many More</h3>
              <p className="text-sm text-muted-foreground">
                Built with educators, for educators
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 lg:gap-4">
              {additionalFeatures.map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl",
                    "bg-background/50 border border-[hsl(var(--border-strong))/0.3]",
                    "text-sm font-medium text-muted-foreground",
                    "hover:text-foreground hover:border-[hsl(var(--border-strong))/0.5]",
                    "transition-all duration-200"
                  )}
                >
                  <item.icon className="w-4 h-4 text-[hsl(var(--accent-iris))]" aria-hidden="true" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
