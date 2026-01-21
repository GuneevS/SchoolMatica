"use client";

import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useInView } from "@/lib/hooks/use-in-view";

const benefits = [
  "30-day free trial",
  "No credit card required",
  "Free setup & training",
  "Cancel anytime",
];

export function CTASection() {
  const { ref: sectionRef, isVisible } = useInView<HTMLElement>({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section
      ref={sectionRef}
      id="cta"
      aria-label="Call to action section"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--accent-violet))]/5 to-[hsl(var(--accent-iris))]/10" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] opacity-30"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--accent-iris)) 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "float 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] opacity-20"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--accent-violet)) 0%, transparent 70%)",
            filter: "blur(100px)",
            animation: "float 25s ease-in-out infinite reverse",
          }}
        />
      </div>

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

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "max-w-4xl mx-auto transition-all duration-1000",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          )}
        >
          {/* Main CTA card */}
          <div className="aurora-panel rounded-3xl p-8 lg:p-16 text-center relative overflow-hidden">
            {/* Decorative sparkles */}
            <div className="absolute top-6 left-6 lg:top-10 lg:left-10">
              <Sparkles className="w-8 h-8 text-[hsl(var(--accent-iris))]/30" aria-hidden="true" />
            </div>
            <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10">
              <Sparkles className="w-6 h-6 text-[hsl(var(--accent-violet))]/30" aria-hidden="true" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-6">
                Ready to Transform Your
                <br />
                <span className="gradient-text">Assessment Workflow?</span>
              </h2>

              <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                Join hundreds of South African schools already saving time and
                improving accuracy with SchoolMatica. Start your free trial
                today.
              </p>

              {/* Benefits */}
              <div
                className={cn(
                  "flex flex-wrap justify-center gap-4 lg:gap-6 mb-10 transition-all duration-700 delay-200",
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6"
                )}
                role="list"
              >
                {benefits.map((benefit) => (
                  <span
                    key={benefit}
                    role="listitem"
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle className="w-4 h-4 text-[hsl(var(--accent-mint))]" aria-hidden="true" />
                    {benefit}
                  </span>
                ))}
              </div>

              {/* CTA buttons */}
              <div
                className={cn(
                  "flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-300",
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6"
                )}
              >
                <Button size="lg" className="text-base px-8" aria-label="Start your free 30-day trial">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8"
                  aria-label="Schedule a demo with our team"
                >
                  Schedule Demo
                </Button>
              </div>

              {/* Social proof */}
              <div
                className={cn(
                  "mt-10 pt-8 border-t border-[hsl(var(--border-soft))] transition-all duration-700 delay-400",
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6"
                )}
              >
                <p className="text-sm text-muted-foreground mb-4">
                  Trusted by leading schools across South Africa
                </p>
                <div className="flex flex-wrap justify-center items-center gap-6 lg:gap-10">
                  {/* Avatar stack */}
                  <div className="flex -space-x-3">
                    {["MN", "TB", "JV", "ND", "SB"].map((initials, i) => (
                      <div
                        key={initials}
                        className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] flex items-center justify-center text-white text-xs font-medium"
                        style={{ zIndex: 5 - i }}
                      >
                        {initials}
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-background bg-[hsl(var(--surface-soft))] flex items-center justify-center text-xs font-medium text-muted-foreground">
                      +50
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          className="w-4 h-4 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      4.9/5 from 120+ reviews
                    </span>
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

export default CTASection;
