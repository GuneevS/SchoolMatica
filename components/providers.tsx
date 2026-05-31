"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { BrandingProvider } from "@/components/brand/branding-provider";
import { type SchoolBranding } from "@/lib/branding";
import { AuthProvider } from "@/lib/hooks/use-auth";
import { Toaster } from "sonner";

export function Providers({
  children,
  initialBranding,
}: {
  children: React.ReactNode;
  initialBranding?: SchoolBranding | null;
}) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrandingProvider initialBranding={initialBranding}>
          <TooltipProvider>
            {children}
            <Toaster 
              position="top-right" 
              richColors 
              closeButton
              toastOptions={{
                className: "font-sans",
              }}
            />
          </TooltipProvider>
        </BrandingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
