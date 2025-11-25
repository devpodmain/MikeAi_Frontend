import { Profile, Plan, Meal, RegenerateMealArgs } from "@/types/mealPlan";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "https://mikeai.co/fastapi";

class MealPlanApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "MealPlanApiError";
  }
}

async function fetchWithErrorHandling(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // Use default error message if JSON parsing fails
    }

    throw new MealPlanApiError(errorMessage, response.status);
  }

  return response.json();
}

export async function generatePlan(
  profile: Profile,
  days: number = 7,
  mealsPerDay: number = 5,
): Promise<Plan> {
  const requestBody = {
    profile,
    days,
    mealsPerDay,
    provider: "openai",
    model: "gpt-4.1-mini",
  };

  console.log("=== CALLING MEAL PLAN API ===");
  console.log("API_BASE:", API_BASE);
  console.log("Full URL:", `${API_BASE}/ai/meals/generate`);
  console.log("Request Body:", JSON.stringify(requestBody, null, 2));

  try {
    const data = await fetchWithErrorHandling(
      `${API_BASE}/ai/meal-plans/generate`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      },
    );

    console.log("=== MEAL PLAN API RESPONSE ===");
    console.log("Response:", data);

    if (!data.success) {
      throw new MealPlanApiError("Failed to generate meal plan");
    }

    return data.plan;
  } catch (error) {
    console.error("=== MEAL PLAN API ERROR ===", error);
    if (error instanceof MealPlanApiError) {
      throw error;
    }
    throw new MealPlanApiError("Network error while generating meal plan");
  }
}

export async function generatePlanPreview(
  profile: Profile,
  days: number = 7,
  mealsPerDay: number = 5,
): Promise<Plan> {
  const requestBody = {
    profile,
    days,
    mealsPerDay,
  };

  console.log("=== CALLING MEAL PLAN PREVIEW API ===");
  console.log("Request Body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch("/api/meal-plans/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Use default error message if JSON parsing fails
      }
      throw new MealPlanApiError(errorMessage, response.status);
    }

    const data = await response.json();

    console.log("=== MEAL PLAN PREVIEW API RESPONSE ===");
    console.log("Response:", data);

    if (!data.success || !data.plan) {
      throw new MealPlanApiError("Failed to generate meal plan preview");
    }

    return data.plan;
  } catch (error) {
    console.error("=== MEAL PLAN PREVIEW API ERROR ===", error);
    if (error instanceof MealPlanApiError) {
      throw error;
    }
    throw new MealPlanApiError("Network error while generating meal plan preview");
  }
}

export async function regenerateMeal(args: RegenerateMealArgs): Promise<Meal> {
  const requestBody = {
    profile: args.profile,
    provider: "openai",
    model: "gpt-4.1-mini",
    day: args.day,
    slot: args.slot,
    constraints: args.constraints || {},
    context_meals_for_that_day: args.contextMeals,
  };

  try {
    const data = await fetchWithErrorHandling(
      `${API_BASE}/ai/meal-plans/regenerate`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      },
    );

    if (!data.success) {
      throw new MealPlanApiError("Failed to regenerate meal");
    }

    return data.meal;
  } catch (error) {
    if (error instanceof MealPlanApiError) {
      throw error;
    }
    throw new MealPlanApiError("Network error while regenerating meal");
  }
}

// Stub implementations for data persistence
export async function getUserProfile(userId: string): Promise<Profile> {
  console.log("getUserProfile: Fetching from /api/db/get-profile");
  try {
    const response = await fetch("/api/db/get-profile", {
      method: "GET",
      credentials: "include",
    });

    console.log("getUserProfile: Response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const dbProfile = await response.json();
    console.log("getUserProfile: DB Profile fetched:", dbProfile);

    // Transform database profile to API format
    const profile: Profile = {
      user_id: userId,
      full_name: dbProfile.full_name || undefined,
      date_of_birth: dbProfile.date_of_birth || undefined,
      gender: dbProfile.gender || undefined,
      height: dbProfile.height ? parseFloat(dbProfile.height) : undefined,
      weight: dbProfile.weight ? parseFloat(dbProfile.weight) : undefined,
      activity_level: dbProfile.activity_level || undefined,
      fitness_goal: dbProfile.fitness_goal || undefined,
      target_weight: dbProfile.target_weight
        ? parseFloat(dbProfile.target_weight)
        : undefined,
      daily_calorie_goal: dbProfile.daily_calorie_goal || undefined,
      diet_type: dbProfile.diet_type || "none",
      allergies: Array.isArray(dbProfile.allergies) ? dbProfile.allergies : [],
      disliked_foods: dbProfile.disliked_foods || undefined,
      preferred_cuisines: Array.isArray(dbProfile.preferred_cuisines)
        ? dbProfile.preferred_cuisines
        : [],
      meals_per_day: dbProfile.meals_per_day || undefined,
      intermittent_fasting: dbProfile.intermittent_fasting || false,
      breakfast_time: dbProfile.breakfast_time || undefined,
      lunch_time: dbProfile.lunch_time || undefined,
      dinner_time: dbProfile.dinner_time || undefined,
      chronic_conditions: Array.isArray(dbProfile.chronic_conditions)
        ? dbProfile.chronic_conditions
        : [],
      supplements_taken: dbProfile.supplements_taken || undefined,
      stress_level: dbProfile.stress_level || undefined,
      sleep_duration: dbProfile.sleep_duration
        ? parseFloat(dbProfile.sleep_duration)
        : undefined,
      water_intake_goal: dbProfile.water_intake_goal
        ? parseFloat(dbProfile.water_intake_goal)
        : undefined,
    };

    console.log("getUserProfile: Transformed profile:", profile);
    return profile;
  } catch (error: any) {
    console.error("getUserProfile: Error:", error);
    throw new MealPlanApiError(
      `Failed to fetch user profile: ${error.message}`,
    );
  }
}

export async function persistPlan(userId: string, plan: Plan): Promise<void> {
  try {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + (plan.days?.length || 7));

    const totalCalories = plan.metadata?.calorie_target || plan.days?.reduce((sum, day) => 
      sum + (day.total_calories || 0), 0) || 0;

    const response = await fetch('/api/meal-plans', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        name: 'AI Generated Meal Plan',
        description: `${plan.metadata?.diet || 'Personalized'} meal plan with ${plan.metadata?.meals_per_day || 3} meals per day`,
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        totalCalories: totalCalories,
        planData: plan,
        isActive: true,
      }),
    });

    if (!response.ok) {
      throw new MealPlanApiError("Failed to save meal plan to database");
    }
    
    console.log("Meal plan persisted for user:", userId);
  } catch (error) {
    console.error('Error saving meal plan:', error);
    throw new MealPlanApiError("Failed to persist meal plan");
  }
}

export async function loadExistingPlan(userId: string): Promise<Plan | null> {
  try {
    const response = await fetch('/api/meal-plans', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch meal plans');
    }

    const plans = await response.json();
    
    if (plans && plans.length > 0) {
      const activePlan = plans.find((p: any) => p.isActive) || plans[0];
      // Return plan data with database id attached for deletion
      const planData = activePlan.planData as Plan;
      return { ...planData, id: activePlan.id } as Plan & { id: number };
    }
    
    return null;
  } catch (error) {
    console.warn("Failed to load existing meal plan:", error);
    return null;
  }
}
