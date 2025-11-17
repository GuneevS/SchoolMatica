"use client";

import { create } from "zustand";

export type ThemeMode = "light" | "dark";

type ThemeStore = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: "light",
  setMode: (mode) => set({ mode }),
  toggle: () => set({ mode: get().mode === "light" ? "dark" : "light" }),
}));

