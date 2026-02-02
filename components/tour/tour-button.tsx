"use client";

import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTourStore, type TourStep } from "@/lib/stores/tour-store";
import { cn } from "@/lib/utils";

interface TourButtonProps {
  steps: TourStep[];
  className?: string;
}

export function TourButton({ steps, className }: TourButtonProps) {
  const { startTour } = useTourStore();

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => startTour(steps)}
      className={cn(
        "group border-2 border-primary bg-gradient-to-r from-primary/10 to-[hsl(var(--accent-violet))]/10 hover:from-primary/20 hover:to-[hsl(var(--accent-violet))]/20 hover:scale-105 transition-all duration-200 animate-pulse shadow-lg shadow-primary/20",
        className,
      )}
    >
      <Compass className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform duration-500 text-primary" />
      <span className="font-semibold">Take a Tour</span>
    </Button>
  );
}

