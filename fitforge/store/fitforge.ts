import { create } from "zustand";

interface User {
  id: string;
  email: string;
  display_name: string;
}

interface FitnessProfile {
  fitness_level: string;
  goals: string[];
  equipment: string[];
  days_per_week: number;
  age?: number;
  weight_kg?: number;
}

interface WorkoutPlan {
  id: string;
  name: string;
  days_per_week: number;
  plan_json: any;
  is_active: boolean;
}

interface PR {
  id: string;
  exercise_name: string;
  exercise_id: string;
  weight_kg: number;
  reps: number;
  one_rep_max: number;
  is_pr: boolean;
  recorded_at: string;
}

interface FitForgeState {
  user: User | null;
  profile: FitnessProfile | null;
  activePlan: WorkoutPlan | null;
  prs: PR[];
  hasCompletedOnboarding: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: FitnessProfile | null) => void;
  setActivePlan: (plan: WorkoutPlan | null) => void;
  setPRs: (prs: PR[]) => void;
  addPR: (pr: PR) => void;
  setOnboarded: (v: boolean) => void;
}

export const useFitForgeStore = create<FitForgeState>((set) => ({
  user: null,
  profile: null,
  activePlan: null,
  prs: [],
  hasCompletedOnboarding: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setActivePlan: (plan) => set({ activePlan: plan }),
  setPRs: (prs) => set({ prs }),
  addPR: (pr) => set((state) => ({ prs: [pr, ...state.prs] })),
  setOnboarded: (v) => set({ hasCompletedOnboarding: v }),
}));
