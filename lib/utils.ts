import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Animation variants for consistent micro-interactions
export const animations = {
  fadeIn: "animate-in fade-in-0 duration-300",
  fadeOut: "animate-out fade-out-0 duration-200",
  slideInFromTop: "animate-in slide-in-from-top-2 duration-300",
  slideInFromBottom: "animate-in slide-in-from-bottom-2 duration-300",
  slideInFromLeft: "animate-in slide-in-from-left-2 duration-300",
  slideInFromRight: "animate-in slide-in-from-right-2 duration-300",
  scaleIn: "animate-in zoom-in-95 duration-200",
  scaleOut: "animate-out zoom-out-95 duration-150",
};
