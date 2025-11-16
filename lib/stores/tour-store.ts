import { create } from "zustand";

export type TourStep = {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  action?: {
    label: string;
    onClick: () => void;
  };
};

type TourStore = {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: (steps: TourStep[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  skipTour: () => void;
};

export const useTourStore = create<TourStore>((set, get) => ({
  isActive: false,
  currentStep: 0,
  steps: [],
  startTour: (steps) => set({ isActive: true, currentStep: 0, steps }),
  nextStep: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    } else {
      get().endTour();
    }
  },
  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },
  endTour: () => set({ isActive: false, currentStep: 0, steps: [] }),
  skipTour: () => set({ isActive: false, currentStep: 0, steps: [] }),
}));

