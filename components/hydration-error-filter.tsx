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
      // Convert all args to string for comprehensive checking
      const fullErrorString = args.map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg?.toString) return arg.toString();
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }).join(' ');
      
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

      // Filter out browser extension attribute mismatches (comprehensive check)
      // Norton, NordPass, 1Password, LastPass, Bitwarden, Dashlane, etc.
      if (
        (errorMessage.includes("Hydration") || errorMessage.includes("hydrated")) &&
        (fullErrorString.includes("data-np-") ||
         fullErrorString.includes("data-1p-") ||
         fullErrorString.includes("data-lp") ||
         fullErrorString.includes("data-bitwarden") ||
         fullErrorString.includes("data-dashlane") ||
         fullErrorString.includes("data-lastpass") ||
         fullErrorString.includes("autofill-form-type") ||
         fullErrorString.includes("autofill-field-type") ||
         fullErrorString.includes("data-np-mark") ||
         fullErrorString.includes("data-np-checked") ||
         fullErrorString.includes("data-np-autofill"))
      ) {
        return; // Suppress browser extension hydration errors
      }

      // Filter out hydration mismatches on form elements (common with browser autofill)
      if (
        (errorMessage.includes("Hydration") || errorMessage.includes("hydrated")) &&
        (errorMessage.includes("<input") ||
         errorMessage.includes("<form") ||
         errorMessage.includes("Input") ||
         errorMessage.includes("autofill"))
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
