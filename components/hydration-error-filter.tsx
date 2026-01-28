"use client";

import { useEffect } from "react";

/**
 * Filter out known hydration warnings from:
 * 1. Radix UI components - random ID generation in aria-controls attributes
 * 2. Browser extensions - password managers like NordPass, 1Password, etc.
 *    that inject data-* attributes after SSR
 * 
 * These warnings don't affect functionality and are safe to suppress.
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

      // Filter out browser extension attribute mismatches (NordPass, 1Password, etc.)
      // These extensions add data-np-*, data-1p-*, data-lpignore, etc. after SSR
      if (
        errorMessage.includes("Hydration") &&
        (errorMessage.includes("data-np-") ||
         errorMessage.includes("data-1p-") ||
         errorMessage.includes("data-lp") ||
         errorMessage.includes("data-bitwarden") ||
         errorMessage.includes("data-dashlane") ||
         errorMessage.includes("data-lastpass") ||
         errorMessage.includes("autofill"))
      ) {
        return; // Suppress browser extension hydration errors
      }

      // Filter out hydration mismatches on form elements (common with browser autofill)
      if (
        errorMessage.includes("Hydration") &&
        (errorMessage.includes("<input") ||
         errorMessage.includes("<form") ||
         errorMessage.includes("autofill-form-type") ||
         errorMessage.includes("autofill-field-type"))
      ) {
        return; // Suppress form-related hydration errors
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
