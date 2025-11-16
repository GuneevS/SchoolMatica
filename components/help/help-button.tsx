"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHelpStore } from "@/lib/stores/help-store";
import { cn } from "@/lib/utils";

interface HelpButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function HelpButton({ className, variant = "outline", size = "icon" }: HelpButtonProps) {
  const { toggle, isOpen } = useHelpStore();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggle}
      className={cn(
        "fixed bottom-6 right-6 z-50 shadow-lg transition-all duration-300 hover:scale-110",
        isOpen && "rotate-90",
        className,
      )}
      aria-label="Toggle help panel"
    >
      <HelpCircle className="h-5 w-5" />
      {size !== "icon" && <span className="ml-2">Help</span>}
    </Button>
  );
}

