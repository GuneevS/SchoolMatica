import { create } from "zustand";

export type UserRole = "Teacher" | "HOD" | "SMT";

interface RoleState {
  role: UserRole;
  setRole: (role: UserRole) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  role: "Teacher",
  setRole: (role) => set({ role }),
}));
