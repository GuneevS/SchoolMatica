"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from "@/lib/hooks/use-auth";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
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
      </AuthProvider>
    </ThemeProvider>
  );
}
