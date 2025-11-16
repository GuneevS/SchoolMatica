"use client";

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTourStore } from "@/lib/stores/tour-store";
import { cn } from "@/lib/utils";

export function TourSpotlight() {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTour } = useTourStore();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const step = steps[currentStep];

  useEffect(() => {
    if (!isActive || !step) return;

    const updatePosition = () => {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isActive, step, currentStep]);

  if (!isActive || !step || !targetRect) return null;

  const placement = step.placement || "bottom";
  const cardPosition = getCardPosition(targetRect, placement);

  return (
    <>
      {/* Backdrop with spotlight effect */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
            className="animate-in fade-in duration-300"
          />
        </svg>

        {/* Animated border around target - VERY VISIBLE */}
        <div
          className="absolute border-[6px] border-primary rounded-xl animate-pulse pointer-events-none"
          style={{
            left: targetRect.left - 12,
            top: targetRect.top - 12,
            width: targetRect.width + 24,
            height: targetRect.height + 24,
            boxShadow: "0 0 0 8px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.6), inset 0 0 20px rgba(59, 130, 246, 0.4)",
            background: "linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.1), transparent)",
          }}
        />
      </div>

      {/* Tour card */}
      <div className="fixed z-[101] pointer-events-auto" style={cardPosition}>
        <Card className="w-96 shadow-2xl border-2 border-primary/20 animate-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={skipTour} className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{step.content}</p>
            {step.action && (
              <Button
                variant="outline"
                size="sm"
                onClick={step.action.onClick}
                className="mt-4 w-full border-primary/20 hover:bg-primary/5"
              >
                {step.action.label}
              </Button>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t pt-4">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    index === currentStep
                      ? "w-8 bg-primary"
                      : index < currentStep
                        ? "w-1.5 bg-primary/50"
                        : "w-1.5 bg-muted",
                  )}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={prevStep} disabled={currentStep === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                size="sm"
                onClick={nextStep}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
                {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

function getCardPosition(targetRect: DOMRect, placement: "top" | "bottom" | "left" | "right") {
  const padding = 20;
  const cardWidth = 384; // w-96
  const cardHeight = 300; // approximate

  switch (placement) {
    case "top":
      return {
        left: Math.max(padding, targetRect.left + targetRect.width / 2 - cardWidth / 2),
        top: Math.max(padding, targetRect.top - cardHeight - padding),
      };
    case "bottom":
      return {
        left: Math.max(padding, targetRect.left + targetRect.width / 2 - cardWidth / 2),
        top: targetRect.bottom + padding,
      };
    case "left":
      return {
        left: Math.max(padding, targetRect.left - cardWidth - padding),
        top: Math.max(padding, targetRect.top + targetRect.height / 2 - cardHeight / 2),
      };
    case "right":
      return {
        left: targetRect.right + padding,
        top: Math.max(padding, targetRect.top + targetRect.height / 2 - cardHeight / 2),
      };
    default:
      return {
        left: Math.max(padding, targetRect.left + targetRect.width / 2 - cardWidth / 2),
        top: targetRect.bottom + padding,
      };
  }
}

