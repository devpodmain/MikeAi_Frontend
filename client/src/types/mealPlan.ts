export type Profile = {
  user_id: string;
  full_name?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  height?: number; // cm
  weight?: number; // kg
  activity_level?: 'sedentary' | 'lightly_active' | 'active' | 'very_active';
  fitness_goal?: 'lose_weight' | 'maintain' | 'build_muscle';
  target_weight?: number;
  daily_calorie_goal?: number;
  diet_type?: 'none' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean';
  allergies?: string[];
  disliked_foods?: string;
  preferred_cuisines?: string[];
  meals_per_day?: '3_meals' | '3_meals_2_snacks';
  intermittent_fasting?: boolean;
  breakfast_time?: string;
  lunch_time?: string;
  dinner_time?: string;
  chronic_conditions?: string[];
  supplements_taken?: string;
  stress_level?: 'low' | 'medium' | 'high';
  sleep_duration?: number;
  water_intake_goal?: number;
  // legacy fields can exist but not required by UI
};

export type Meal = {
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2';
  title: string;
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
  ingredients: string[];
  instructions: string;
  allergen_flags?: string[];
  cuisine?: string;
  prep_time_min?: number;
  completed?: boolean; // Frontend state for completed meals
};

export type DayPlan = {
  date: string;
  meals: Meal[];
  total_calories?: number;
};

export type Plan = {
  days: DayPlan[];
  metadata: {
    diet?: string;
    calorie_target?: number;
    meals_per_day: 3 | 5;
    provider: string;
    model: string;
  };
};

export type RegenerateMealArgs = {
  profile: Profile;
  day: string;
  slot: Meal['slot'];
  constraints?: {
    calorie_range?: { min?: number; max?: number };
    keep_cuisine?: string;
    avoid?: string;
    prep_time_max_min?: number;
  };
  contextMeals: Meal[];
};