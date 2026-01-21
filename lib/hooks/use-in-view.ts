"use client";

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions extends IntersectionObserverInit {
  /**
   * Whether to trigger visibility only once (disconnect after first intersection)
   * @default true
   */
  triggerOnce?: boolean;
  /**
   * Force visibility to true (useful for server-side rendering or testing)
   * @default false
   */
  forceVisible?: boolean;
}

interface UseInViewReturn<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  isVisible: boolean;
}

/**
 * Custom hook to detect when an element enters the viewport
 * with automatic support for prefers-reduced-motion.
 *
 * Automatically respects user's motion preferences:
 * - If user prefers reduced motion, element is immediately visible
 * - Otherwise, uses IntersectionObserver to detect visibility
 *
 * @param options - IntersectionObserver options + custom options
 * @returns Object with ref to attach to element and visibility state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { ref, isVisible } = useInView<HTMLDivElement>({ threshold: 0.2 });
 *
 *   return (
 *     <div
 *       ref={ref}
 *       className={isVisible ? 'animate-fade-in' : 'opacity-0'}
 *     >
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
): UseInViewReturn<T> {
  const {
    threshold = 0.2,
    triggerOnce = true,
    forceVisible = false,
    ...observerOptions
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    // If forceVisible is true, set visible immediately
    if (forceVisible) {
      setIsVisible(true);
      return;
    }

    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // If user prefers reduced motion, skip animations
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    // If IntersectionObserver is not supported, make visible
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    // Create IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;

        if (isIntersecting) {
          setIsVisible(true);

          // Disconnect observer if triggerOnce is true
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          // If not triggerOnce, allow toggling visibility
          setIsVisible(false);
        }
      },
      {
        threshold,
        ...observerOptions,
      }
    );

    observer.observe(element);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [threshold, triggerOnce, forceVisible, observerOptions]);

  return { ref, isVisible };
}

/**
 * Hook to check if user prefers reduced motion
 *
 * @returns boolean indicating if user prefers reduced motion
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const prefersReducedMotion = usePrefersReducedMotion();
 *
 *   return (
 *     <div className={prefersReducedMotion ? '' : 'animate-bounce'}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
