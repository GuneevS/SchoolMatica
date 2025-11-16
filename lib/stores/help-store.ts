import { create } from "zustand";

export type HelpContent = {
  title: string;
  description: string;
  sections: {
    heading: string;
    content: string;
    tips?: string[];
  }[];
  quickActions?: {
    label: string;
    action: string;
    icon?: string;
  }[];
};

type HelpStore = {
  isOpen: boolean;
  currentPage: string;
  content: HelpContent | null;
  setOpen: (open: boolean) => void;
  setPage: (page: string, content: HelpContent) => void;
  toggle: () => void;
};

export const useHelpStore = create<HelpStore>((set) => ({
  isOpen: false,
  currentPage: "",
  content: null,
  setOpen: (open) => set({ isOpen: open }),
  setPage: (page, content) => set({ currentPage: page, content }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));

