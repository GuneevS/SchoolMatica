"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useHelpStore } from "@/lib/stores/help-store";

interface WelcomeBannerProps {
  title: string;
  description: string;
  tips?: string[];
}

export function WelcomeBanner({ title, description, tips }: WelcomeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { setOpen } = useHelpStore();

  if (isDismissed) return null;

  return (
    <Alert variant="info" className="relative animate-in slide-in-from-top-2 duration-500">
      <Sparkles className="h-4 w-4" />
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </button>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p className="mb-3">{description}</p>
        {tips && tips.length > 0 && (
          <ul className="mb-3 space-y-1 text-sm">
            {tips.map((tip, index) => (
              <li key={index}>• {tip}</li>
            ))}
          </ul>
        )}
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="mt-2">
          Learn more
        </Button>
      </AlertDescription>
    </Alert>
  );
}

