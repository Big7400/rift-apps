import { create } from "zustand";

interface User {
  id: string;
  email: string;
  display_name: string;
}

interface Puppy {
  id: string;
  name: string;
  breed: string;
  color: string;
  accessories: string[];
  background: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
}

interface Goal {
  id: string;
  title: string;
  category: string;
  is_custom: boolean;
  xp_reward: number;
}

interface SelfCareState {
  user: User | null;
  puppy: Puppy | null;
  goals: Goal[];
  completedTodayIds: string[];
  checkedInToday: boolean;
  todayMood: number | null;
  setUser: (user: User | null) => void;
  setPuppy: (puppy: Puppy | null) => void;
  setGoals: (goals: Goal[]) => void;
  setCompletedToday: (ids: string[]) => void;
  addCompletedGoal: (id: string) => void;
  setCheckedIn: (checked: boolean, mood?: number) => void;
  updatePuppyXP: (newXp: number, newLevel: number) => void;
}

export const useSelfCareStore = create<SelfCareState>((set) => ({
  user: null,
  puppy: null,
  goals: [],
  completedTodayIds: [],
  checkedInToday: false,
  todayMood: null,
  setUser: (user) => set({ user }),
  setPuppy: (puppy) => set({ puppy }),
  setGoals: (goals) => set({ goals }),
  setCompletedToday: (ids) => set({ completedTodayIds: ids }),
  addCompletedGoal: (id) =>
    set((state) => ({ completedTodayIds: [...state.completedTodayIds, id] })),
  setCheckedIn: (checked, mood) =>
    set({ checkedInToday: checked, todayMood: mood ?? null }),
  updatePuppyXP: (newXp, newLevel) =>
    set((state) => ({
      puppy: state.puppy ? { ...state.puppy, xp: newXp, level: newLevel } : null,
    })),
}));
