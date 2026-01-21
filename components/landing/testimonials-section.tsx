"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Quote, Star, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useInView } from "@/lib/hooks/use-in-view";

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string;
  school: string;
  location: string;
  rating: number;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "SchoolMatica has transformed how we manage assessments. What used to take our teachers entire weekends now takes just a few hours. The CAPS compliance features alone have saved us from countless headaches.",
    author: "Thandi Molefe",
    role: "Deputy Principal",
    school: "Pretoria High School for Girls",
    location: "Gauteng",
    rating: 5,
    avatar: "TM",
  },
  {
    id: 2,
    quote:
      "As an HOD, I finally have visibility into my department's progress without chasing teachers for spreadsheets. The moderation workflow is brilliant—everything is tracked and nothing falls through the cracks.",
    author: "Johan van der Berg",
    role: "Head of Mathematics",
    school: "Hoërskool Wonderboom",
    location: "Gauteng",
    rating: 5,
    avatar: "JB",
  },
  {
    id: 3,
    quote:
      "We've tried other systems before, but SchoolMatica actually understands South African schools. The CAPS integration and SA-SAMS exports work perfectly. Our admin staff love it.",
    author: "Nomvula Dlamini",
    role: "School Administrator",
    school: "Vulindlela Secondary School",
    location: "KwaZulu-Natal",
    rating: 5,
    avatar: "ND",
  },
  {
    id: 4,
    quote:
      "The markbook feels so familiar—like Excel but smarter. I was worried about learning new software, but within a day I was faster than I ever was with spreadsheets.",
    author: "Sarah Botha",
    role: "Grade 10 Teacher",
    school: "Stellenbosch High School",
    location: "Western Cape",
    rating: 5,
    avatar: "SB",
  },
  {
    id: 5,
    quote:
      "Report card generation that used to take our school two weeks now happens in an afternoon. The time savings are real, and the accuracy is so much better.",
    author: "Michael Naidoo",
    role: "Principal",
    school: "Phoenix Secondary School",
    location: "KwaZulu-Natal",
    rating: 5,
    avatar: "MN",
  },
];

const stats = [
  { value: "50+", label: "Schools Using SchoolMatica" },
  { value: "2,000+", label: "Teachers Onboarded" },
  { value: "320hrs", label: "Average Time Saved Per Year" },
  { value: "99.9%", label: "System Uptime" },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { ref: sectionRef, isVisible } = useInView<HTMLElement>({
    threshold: 0.2,
    triggerOnce: true,
  });

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const goToPrev = useCallback(() => {
    setActiveIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && isVisible) {
      intervalRef.current = setInterval(goToNext, 6000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, isVisible, goToNext]);


  const handleManualNavigation = (direction: "prev" | "next") => {
    setIsAutoPlaying(false);
    if (direction === "prev") {
      goToPrev();
    } else {
      goToNext();
    }
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      aria-label="Testimonials section"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--accent-iris))]/3 to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div
          className={cn(
            "text-center max-w-3xl mx-auto mb-16 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--accent-flamingo))]/10 border border-[hsl(var(--accent-flamingo))]/20 text-[hsl(var(--accent-flamingo))] text-sm font-medium mb-6">
            <Quote className="h-4 w-4" aria-hidden="true" />
            What Educators Say
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Trusted by Schools{" "}
            <span className="gradient-text">Across South Africa</span>
          </h2>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Join hundreds of educators who&apos;ve transformed their assessment
            workflows with SchoolMatica.
          </p>
        </div>

        {/* Stats bar */}
        <div
          className={cn(
            "grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16 transition-all duration-700 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
          role="list"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              role="listitem"
              className="text-center p-6 rounded-2xl aurora-panel"
            >
              <div className="text-3xl lg:text-4xl font-bold gradient-text mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials carousel */}
        <div
          className={cn(
            "relative max-w-4xl mx-auto transition-all duration-700 delay-300",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {/* Main testimonial card */}
          <div className="aurora-panel rounded-3xl p-8 lg:p-12 relative overflow-hidden">
            {/* Decorative quote */}
            <div className="absolute top-6 right-6 lg:top-8 lg:right-8">
              <Quote className="h-16 w-16 lg:h-24 lg:w-24 text-[hsl(var(--accent-iris))]/10" aria-hidden="true" />
            </div>

            {/* Content */}
            <div className="relative">
              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonials[activeIndex].rating }).map(
                  (_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]"
                    />
                  )
                )}
              </div>

              {/* Quote */}
              <blockquote className="text-xl lg:text-2xl font-medium leading-relaxed mb-8">
                &ldquo;{testimonials[activeIndex].quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--accent-iris))] to-[hsl(var(--accent-violet))] flex items-center justify-center text-white font-semibold text-lg">
                  {testimonials[activeIndex].avatar}
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-lg">
                    {testimonials[activeIndex].author}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonials[activeIndex].role}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                    <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {testimonials[activeIndex].school},{" "}
                    {testimonials[activeIndex].location}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleManualNavigation("prev")}
              className="h-10 w-10 rounded-full"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous testimonial</span>
            </Button>

            {/* Indicators */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveIndex(index);
                    setIsAutoPlaying(false);
                    setTimeout(() => setIsAutoPlaying(true), 10000);
                  }}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === activeIndex
                      ? "w-8 bg-[hsl(var(--accent-iris))]"
                      : "w-2 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted-foreground))]"
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handleManualNavigation("next")}
              className="h-10 w-10 rounded-full"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next testimonial</span>
            </Button>
          </div>
        </div>

        {/* Logos / social proof */}
        <div
          className={cn(
            "mt-20 text-center transition-all duration-700 delay-400",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <p className="text-sm text-muted-foreground mb-8">
            Empowering schools across all 9 provinces
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 opacity-60">
            {[
              "Gauteng DoE",
              "Western Cape ED",
              "KZN DoE",
              "Free State DoE",
              "Mpumalanga DoE",
            ].map((name) => (
              <div
                key={name}
                className="text-sm font-medium tracking-wide text-muted-foreground"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
