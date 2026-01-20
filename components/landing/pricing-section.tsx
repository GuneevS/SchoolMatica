"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  X,
  Sparkles,
  Building2,
  GraduationCap,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  monthlyPrice: number;
  yearlyPrice: number;
  features: { text: string; included: boolean }[];
  popular?: boolean;
  cta: string;
}

const plans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For small schools getting started with digital assessment",
    icon: GraduationCap,
    monthlyPrice: 1499,
    yearlyPrice: 14990,
    features: [
      { text: "Up to 500 learners", included: true },
      { text: "Up to 30 teachers", included: true },
      { text: "Full markbook functionality", included: true },
      { text: "CAPS compliance engine", included: true },
      { text: "Basic reports & exports", included: true },
      { text: "Email support", included: true },
      { text: "Moderation workflows", included: false },
      { text: "SA-SAMS integration", included: false },
      { text: "Custom branding", included: false },
      { text: "API access", included: false },
    ],
    cta: "Start Free Trial",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Complete solution for high schools and growing institutions",
    icon: Building2,
    monthlyPrice: 2999,
    yearlyPrice: 29990,
    popular: true,
    features: [
      { text: "Up to 1,500 learners", included: true },
      { text: "Unlimited teachers", included: true },
      { text: "Full markbook functionality", included: true },
      { text: "CAPS compliance engine", included: true },
      { text: "Advanced reports & analytics", included: true },
      { text: "Priority email & chat support", included: true },
      { text: "Moderation workflows", included: true },
      { text: "SA-SAMS integration", included: true },
      { text: "Custom branding", included: false },
      { text: "API access", included: false },
    ],
    cta: "Start Free Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large schools and multi-campus institutions",
    icon: Crown,
    monthlyPrice: 4999,
    yearlyPrice: 49990,
    features: [
      { text: "Unlimited learners", included: true },
      { text: "Unlimited teachers", included: true },
      { text: "Full markbook functionality", included: true },
      { text: "CAPS compliance engine", included: true },
      { text: "Custom reports & dashboards", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Advanced moderation workflows", included: true },
      { text: "SA-SAMS integration", included: true },
      { text: "Custom branding", included: true },
      { text: "API access", included: true },
    ],
    cta: "Contact Sales",
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[hsl(var(--surface-soft))]" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div
          className={cn(
            "text-center max-w-3xl mx-auto mb-12 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--accent-mint))]/10 border border-[hsl(var(--accent-mint))]/20 text-[hsl(var(--accent-mint))] text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Simple Pricing
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Invest in Your School&apos;s{" "}
            <span className="gradient-text">Efficiency</span>
          </h2>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Transparent per-school pricing with no hidden fees. All plans include
            setup support and training.
          </p>
        </div>

        {/* Billing toggle */}
        <div
          className={cn(
            "flex items-center justify-center gap-4 mb-12 transition-all duration-700 delay-100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              !isAnnual ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={cn(
              "relative w-14 h-7 rounded-full transition-colors duration-200",
              isAnnual
                ? "bg-[hsl(var(--accent-iris))]"
                : "bg-[hsl(var(--muted))]"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200",
                isAnnual ? "translate-x-7" : "translate-x-0"
              )}
            />
          </button>
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              isAnnual ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Annual
          </span>
          {isAnnual && (
            <span className="px-2 py-1 text-xs font-medium bg-[hsl(var(--accent-mint))]/10 text-[hsl(var(--accent-mint))] rounded-full">
              Save 17%
            </span>
          )}
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl transition-all duration-500",
                "hover:-translate-y-1 hover:shadow-ambient",
                plan.popular
                  ? "aurora-panel border-2 border-[hsl(var(--accent-iris))]/50"
                  : "bg-background border border-[hsl(var(--border-strong))/0.3]",
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              )}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] text-white text-sm font-medium rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6 lg:p-8">
                {/* Plan header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      plan.popular
                        ? "bg-[hsl(var(--accent-iris))]/20 text-[hsl(var(--accent-iris))]"
                        : "bg-[hsl(var(--muted))] text-muted-foreground"
                    )}
                  >
                    <plan.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl lg:text-5xl font-bold">
                      {formatPrice(isAnnual ? plan.yearlyPrice / 12 : plan.monthlyPrice)}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatPrice(plan.yearlyPrice)} billed annually
                    </p>
                  )}
                </div>

                {/* CTA */}
                <Button
                  className={cn(
                    "w-full mb-6",
                    plan.popular
                      ? ""
                      : "bg-background border border-[hsl(var(--border-strong))] text-foreground hover:bg-[hsl(var(--surface-soft))]"
                  )}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature.text}
                      className="flex items-start gap-3"
                    >
                      {feature.included ? (
                        <Check className="w-5 h-5 text-[hsl(var(--accent-mint))] flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={cn(
                          "text-sm",
                          feature.included
                            ? "text-foreground"
                            : "text-muted-foreground/60"
                        )}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional info */}
        <div
          className={cn(
            "mt-12 text-center transition-all duration-700 delay-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <p className="text-sm text-muted-foreground mb-4">
            All plans include a 30-day free trial. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[hsl(var(--accent-mint))]" />
              Free setup & onboarding
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[hsl(var(--accent-mint))]" />
              Staff training included
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[hsl(var(--accent-mint))]" />
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
