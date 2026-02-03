"use client";

import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import { applyBranding, DEFAULT_BRANDING, type SchoolBranding } from "@/lib/branding";

type BrandingContextValue = {
  branding: SchoolBranding;
  setBranding: (branding: SchoolBranding) => void;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

export function BrandingProvider({
  children,
  initialBranding,
}: {
  children: React.ReactNode;
  initialBranding?: SchoolBranding | null;
}) {
  const [branding, setBrandingState] = useState<SchoolBranding>(() => ({
    ...DEFAULT_BRANDING,
    ...(initialBranding ?? {}),
  }));

  // Apply branding CSS variables when branding changes
  useEffect(() => {
    applyBranding(branding);
  }, [branding]);

  // Stable setBranding function that doesn't change on every render
  const setBranding = useCallback((next: SchoolBranding) => {
    setBrandingState({ ...DEFAULT_BRANDING, ...(next ?? {}) });
  }, []);

  const value = useMemo(
    () => ({
      branding,
      setBranding,
    }),
    [branding, setBranding],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within BrandingProvider");
  }
  return context;
}
