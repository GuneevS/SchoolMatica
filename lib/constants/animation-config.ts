/**
 * Centralized Animation Configuration
 *
 * Defines consistent animation durations, delays, and thresholds
 * used across the landing page and interactive demos.
 *
 * All values follow WCAG 2.1 AA guidelines and respect
 * prefers-reduced-motion preferences via useInView hook.
 */

/**
 * Animation duration constants (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  /** Quick transitions for hover effects and micro-interactions */
  fast: 200,
  /** Standard transitions for most UI elements */
  normal: 300,
  /** Slower transitions for emphasis and attention */
  slow: 500,
  /** Fade-in animations for scroll-triggered content */
  fadeIn: 700,
  /** Complex entrance animations */
  entrance: 1000,
} as const;

/**
 * Animation delay constants (in milliseconds)
 * Used for staggered animations and sequential reveals
 */
export const ANIMATION_DELAYS = {
  /** Delay between staggered items (cards, list items) */
  stagger: 100,
  /** Delay between section reveals */
  section: 200,
  /** Delay for hero content sequence */
  heroSequence: {
    title: 0,
    subtitle: 200,
    description: 400,
    cta: 600,
    visual: 400,
  },
} as const;

/**
 * IntersectionObserver threshold values
 * Determines when scroll animations trigger
 */
export const ANIMATION_THRESHOLDS = {
  /** Trigger when 20% of element is visible (default) */
  visibility: 0.2,
  /** Trigger when 50% of element is visible */
  halfVisible: 0.5,
  /** Trigger when 80% of element is visible */
  fullVisibility: 0.8,
  /** Trigger as soon as element enters viewport */
  immediate: 0.01,
} as const;

/**
 * IntersectionObserver root margin values
 * Allows triggering before element enters viewport
 */
export const ANIMATION_ROOT_MARGINS = {
  /** No offset (default) */
  none: "0px",
  /** Trigger 50px before element enters viewport */
  small: "0px 0px -50px 0px",
  /** Trigger 100px before element enters viewport */
  medium: "0px 0px -100px 0px",
  /** Trigger 200px before element enters viewport */
  large: "0px 0px -200px 0px",
} as const;

/**
 * Easing functions for smooth animations
 * CSS easing function strings
 */
export const ANIMATION_EASINGS = {
  /** Standard ease-out for natural deceleration */
  easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  /** Bounce effect for playful animations */
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  /** Sharp ease-out for quick attention */
  sharp: "cubic-bezier(0.4, 0, 0.2, 1)",
  /** Smooth ease-in-out for balanced motion */
  smooth: "cubic-bezier(0.4, 0, 0.6, 1)",
} as const;

/**
 * Interactive demo animation config
 * Specific settings for demo component interactions
 */
export const DEMO_ANIMATION_CONFIG = {
  /** Tab switch transition duration */
  tabSwitch: ANIMATION_DURATIONS.normal,
  /** Demo reset animation duration */
  reset: ANIMATION_DURATIONS.slow,
  /** Cell selection highlight duration */
  cellHighlight: ANIMATION_DURATIONS.fast,
  /** Tooltip fade duration */
  tooltip: ANIMATION_DURATIONS.fast,
  /** Chart update animation duration */
  chartUpdate: ANIMATION_DURATIONS.slow,
} as const;

/**
 * Stagger animation helper
 * Calculates delay for nth item in a staggered sequence
 *
 * @param index - Zero-based index of item
 * @param baseDelay - Base delay between items (default: ANIMATION_DELAYS.stagger)
 * @returns Delay in milliseconds
 *
 * @example
 * ```tsx
 * {items.map((item, index) => (
 *   <div
 *     key={item.id}
 *     style={{ animationDelay: `${getStaggerDelay(index)}ms` }}
 *   >
 *     {item.content}
 *   </div>
 * ))}
 * ```
 */
export function getStaggerDelay(
  index: number,
  baseDelay: number = ANIMATION_DELAYS.stagger
): number {
  return index * baseDelay;
}

/**
 * CSS custom properties for animations
 * Use with inline styles or CSS modules
 *
 * @example
 * ```tsx
 * <div style={getAnimationStyles({ duration: 'slow', delay: 200 })}>
 *   Animated content
 * </div>
 * ```
 */
export function getAnimationStyles(options: {
  duration?: keyof typeof ANIMATION_DURATIONS;
  delay?: number;
  easing?: keyof typeof ANIMATION_EASINGS;
}): React.CSSProperties {
  const {
    duration = "normal",
    delay = 0,
    easing = "easeOut",
  } = options;

  return {
    transitionDuration: `${ANIMATION_DURATIONS[duration]}ms`,
    transitionDelay: `${delay}ms`,
    transitionTimingFunction: ANIMATION_EASINGS[easing],
  };
}

/**
 * Pre-configured animation variants for common patterns
 */
export const ANIMATION_VARIANTS = {
  /** Fade in from bottom with upward slide */
  fadeInUp: {
    initial: "opacity-0 translate-y-8",
    animate: "opacity-100 translate-y-0",
    duration: ANIMATION_DURATIONS.fadeIn,
  },
  /** Simple fade in */
  fadeIn: {
    initial: "opacity-0",
    animate: "opacity-100",
    duration: ANIMATION_DURATIONS.fadeIn,
  },
  /** Scale and fade in */
  scaleIn: {
    initial: "opacity-0 scale-95",
    animate: "opacity-100 scale-100",
    duration: ANIMATION_DURATIONS.normal,
  },
  /** Slide in from left */
  slideInLeft: {
    initial: "opacity-0 -translate-x-8",
    animate: "opacity-100 translate-x-0",
    duration: ANIMATION_DURATIONS.fadeIn,
  },
  /** Slide in from right */
  slideInRight: {
    initial: "opacity-0 translate-x-8",
    animate: "opacity-100 translate-x-0",
    duration: ANIMATION_DURATIONS.fadeIn,
  },
} as const;

/**
 * Type exports for type-safe usage
 */
export type AnimationDuration = keyof typeof ANIMATION_DURATIONS;
export type AnimationEasing = keyof typeof ANIMATION_EASINGS;
export type AnimationThreshold = keyof typeof ANIMATION_THRESHOLDS;
export type AnimationVariant = keyof typeof ANIMATION_VARIANTS;
