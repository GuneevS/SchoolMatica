"use client";

import { useEffect } from "react";

/**
 * Filter out known hydration warnings from Radix UI components.
 * These warnings are caused by random ID generation in aria-controls attributes
 * and don't affect functionality.
 */
export function HydrationErrorFilter() {
  useEffect(() => {
    // Store original console.error
    const originalError = console.error;

    // Override console.error to filter out specific hydration warnings
    console.error = (...args) => {
      const errorMessage = args[0]?.toString() || "";
      
      // Filter out Radix UI aria-controls hydration mismatches
      if (
        errorMessage.includes("aria-controls") &&
        errorMessage.includes("did not match")
      ) {
        return; // Suppress this error
      }
      
      // Filter out generic hydration warnings for aria attributes
      if (
        errorMessage.includes("Hydration") &&
        errorMessage.includes("aria-")
      ) {
        return; // Suppress this error
      }

      // Pass through all other errors
      originalError(...args);
    };

    // Cleanup on unmount
    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}
