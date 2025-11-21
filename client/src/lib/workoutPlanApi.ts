import type { WorkoutPlan } from "@/types/workoutPlan";
import type { Profile as MealProfile } from "@/types/mealPlan";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export class WorkoutPlanApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "WorkoutPlanApiError";
  }
}

async function fetchWithErrorHandling(url: string, options: RequestInit = {}) {
  console.log(`[WorkoutAPI] ${options.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body as string) : '');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json();
  console.log(`[WorkoutAPI] Response:`, data);

  if (!response.ok) {
    let msg = `HTTP ${response.status}: ${response.statusText}`;
    try {
      msg = data.detail || data.message || msg;
    } catch {}
    throw new WorkoutPlanApiError(msg, response.status);
  }
  return data;
}

/** Map DB profile -> workout profile expected by FastAPI */
export function mapDbProfileToWorkout(profile: any) {
  const height_cm = profile.height ?? profile.height_cm ?? undefined;
  const weight_kg = profile.weight ?? profile.weight_kg ?? undefined;

  return {
    user_id: profile.userId ?? profile.user_id,
    sex: profile.gender ?? profile.sex ?? undefined,
    age: profile.age ?? undefined,
    height_cm: height_cm !== undefined ? Number(height_cm) : undefined,
    weight_kg: weight_kg !== undefined ? Number(weight_kg) : undefined,
    activity_level: profile.activityLevel ?? profile.activity_level ?? undefined,
    training_age_months: profile.trainingAgeMonths ?? profile.training_age_months !== undefined ? Number(profile.trainingAgeMonths ?? profile.training_age_months) : 6
  };
}

export type WorkoutPrefs = {
  goal: "hypertrophy" | "strength" | "fat_loss" | "general_fitness";
  days_per_week: number;
  workouts_per_day?: number;
  session_minutes?: number;
  equipment?: string[];
  injuries?: string;
  desired_split?: "auto" | "full-body" | "upper/lower" | "push/pull/legs";
};

/** Generate a workout plan via FastAPI */
export async function generateWorkoutPlan(
  dbProfile: any,
  prefs: WorkoutPrefs,
  weeks: number = 8
): Promise<WorkoutPlan> {
  // Build prefs payload with only provided optionals
  const prefsPayload: any = {
    goal: prefs.goal,
    days_per_week: prefs.days_per_week,
  };
  if (prefs.workouts_per_day !== undefined) prefsPayload.workouts_per_day = prefs.workouts_per_day;
  if (prefs.session_minutes !== undefined) prefsPayload.session_minutes = prefs.session_minutes;
  if (prefs.equipment !== undefined) prefsPayload.equipment = prefs.equipment;
  if (prefs.injuries) prefsPayload.injuries = prefs.injuries;
  if (prefs.desired_split) prefsPayload.desired_split = prefs.desired_split;

  const body = {
    profile: mapDbProfileToWorkout(dbProfile),
    prefs: prefsPayload,
    weeks
  };

  try {
    const data = await fetchWithErrorHandling(`${API_BASE}/ai/workouts/generate`, {
      method: "POST",
      body: JSON.stringify(body)
    });
    if (!data?.success || !data?.data) {
      throw new WorkoutPlanApiError("Failed to generate workout plan");
    }
    return data.data as WorkoutPlan;
  } catch (e) {
    if (e instanceof WorkoutPlanApiError) throw e;
    throw new WorkoutPlanApiError("Network error while generating workout plan");
  }
}

/** Generate a workout plan preview (without saving to database) */
export async function generateWorkoutPlanPreview(
  dbProfile: any,
  prefs: WorkoutPrefs,
  weeks: number = 8
): Promise<WorkoutPlan> {
  // Build prefs payload with only provided optionals
  const prefsPayload: any = {
    goal: prefs.goal,
    days_per_week: prefs.days_per_week,
  };
  if (prefs.workouts_per_day !== undefined) prefsPayload.workouts_per_day = prefs.workouts_per_day;
  if (prefs.session_minutes !== undefined) prefsPayload.session_minutes = prefs.session_minutes;
  if (prefs.equipment !== undefined) prefsPayload.equipment = prefs.equipment;
  if (prefs.injuries) prefsPayload.injuries = prefs.injuries;
  if (prefs.desired_split) prefsPayload.desired_split = prefs.desired_split;

  const body = {
    profile: mapDbProfileToWorkout(dbProfile),
    prefs: prefsPayload,
    weeks
  };

  console.log("=== CALLING WORKOUT PLAN PREVIEW API ===");
  console.log("Request Body:", JSON.stringify(body, null, 2));

  try {
    const response = await fetch("/api/workout-plans/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Use default error message if JSON parsing fails
      }
      throw new WorkoutPlanApiError(errorMessage, response.status);
    }

    const data = await response.json();

    console.log("=== WORKOUT PLAN PREVIEW API RESPONSE ===");
    console.log("Response:", data);

    if (!data.success || !data.data) {
      throw new WorkoutPlanApiError("Failed to generate workout plan preview");
    }

    return data.data as WorkoutPlan;
  } catch (error) {
    console.error("=== WORKOUT PLAN PREVIEW API ERROR ===", error);
    if (error instanceof WorkoutPlanApiError) {
      throw error;
    }
    throw new WorkoutPlanApiError("Network error while generating workout plan preview");
  }
}

/** Get user profile from database */
export async function getUserProfile(userId?: string): Promise<any> {
  try {
    const response = await fetch('/api/db/get-profile');
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/** Database persistence */
export async function persistWorkoutPlan(userId: string, plan: WorkoutPlan): Promise<void> {
  try {
    const response = await fetch('/api/workout-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        name: plan.name,
        goal: plan.goal,
        weeks: plan.weeks,
        daysPerWeek: plan.days_per_week,
        split: plan.split,
        planData: plan,
        progressionNotes: plan.progression_notes,
        warmupNotes: plan.warmup_notes,
        deloadNotes: plan.deload,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new WorkoutPlanApiError(errorData.message || "Failed to save workout plan to database");
    }
  } catch (error) {
    console.error('Error saving workout plan:', error);
    if (error instanceof WorkoutPlanApiError) {
      throw error;
    }
    throw new WorkoutPlanApiError("Failed to persist workout plan");
  }
}

export async function loadExistingWorkoutPlan(userId: string): Promise<WorkoutPlan | null> {
  try {
    const response = await fetch(`/api/workout-plans/${userId}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new WorkoutPlanApiError('Failed to load workout plan from database');
    }
    
    const data = await response.json();
    return data.planData as WorkoutPlan;
  } catch (error) {
    console.error('Error loading workout plan from database:', error);
    if (error instanceof WorkoutPlanApiError) {
      throw error;
    }
    return null;
  }
}

export async function deleteWorkoutPlan(userId: string): Promise<void> {
  try {
    const response = await fetch(`/api/workout-plans/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new WorkoutPlanApiError(errorData.message || "Failed to delete workout plan from database");
    }
  } catch (error) {
    console.error('Error deleting workout plan:', error);
    if (error instanceof WorkoutPlanApiError) {
      throw error;
    }
    throw new WorkoutPlanApiError("Failed to delete workout plan");
  }
}