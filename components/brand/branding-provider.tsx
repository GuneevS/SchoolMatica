"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
  const [branding, setBrandingState] = useState<SchoolBranding>({
    ...DEFAULT_BRANDING,
    ...(initialBranding ?? {}),
  });

  useEffect(() => {
    setBrandingState({
      ...DEFAULT_BRANDING,
      ...(initialBranding ?? {}),
    });
  }, [initialBranding]);

  useEffect(() => {
    applyBranding(branding);
  }, [branding]);

  const value = useMemo(
    () => ({
      branding,
      setBranding: (next: SchoolBranding) =>
        setBrandingState({ ...DEFAULT_BRANDING, ...(next ?? {}) }),
    }),
    [branding],
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
