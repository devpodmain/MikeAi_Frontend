export type WorkoutItem = {
  exercise: string;
  equipment?: string;
  sets: number;
  reps: string;
  rir?: string;
  restSec?: number;
  notes?: string;
  video_url?: string;
};

export type WorkoutDay = {
  dayIndex: number;
  name: string;
  items: WorkoutItem[];
};

export type WorkoutPlan = {
  name: string;
  goal: "hypertrophy" | "strength" | "fat_loss" | "general_fitness" | string;
  weeks: number;
  days_per_week: number;
  split: string;
  days: WorkoutDay[];
  progression_notes?: string;
  warmup_notes?: string;
  deload?: string;
};