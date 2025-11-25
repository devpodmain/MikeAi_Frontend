import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

type UserProfile = {
  height?: string | null;
  weight?: string | null;
  fitnessGoal?: string | null;
  activityLevel?: string | null;
  dietType?: string | null;
  mealsPerDay?: string | null;
  dailyCalorieGoal?: number | null;
  allergies?: string[] | null;
};

type ProfileStatus = {
  isComplete: boolean;
  missingFields: string[];
  isLoading: boolean;
};

const REQUIRED_FIELDS: Array<{ key: keyof UserProfile; label: string }> = [
  { key: "height", label: "Height" },
  { key: "weight", label: "Weight" },
  { key: "fitnessGoal", label: "Fitness Goal" },
  { key: "activityLevel", label: "Activity Level" },
  { key: "mealsPerDay", label: "Meals Per Day" },
];

const normalizeProfile = (raw: any): UserProfile => ({
  height: raw?.height ?? null,
  weight: raw?.weight ?? null,
  fitnessGoal: raw?.fitness_goal ?? raw?.fitnessGoal ?? null,
  activityLevel: raw?.activity_level ?? raw?.activityLevel ?? null,
  dietType: raw?.diet_type ?? raw?.dietType ?? null,
  mealsPerDay: raw?.meals_per_day ?? raw?.mealsPerDay ?? null,
  dailyCalorieGoal: raw?.daily_calorie_goal ?? raw?.dailyCalorieGoal ?? null,
  allergies: raw?.allergies ?? null,
});

export function useProfileStatus(): ProfileStatus {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isError } = useQuery<UserProfile>({
    queryKey: ["/api/db/get-profile"],
    enabled: isAuthenticated && !!user,
    queryFn: async () => {
      const response = await fetch("/api/db/get-profile", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      if (response.status === 304) {
        const cached = queryClient.getQueryData<UserProfile>(["/api/db/get-profile"]);
        if (cached) return cached;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const raw = await response.text();
      const parsed = raw ? JSON.parse(raw) : {};
      return normalizeProfile(parsed);
    },
  });

  if (!isAuthenticated) {
    return { isComplete: true, missingFields: [], isLoading: false };
  }

  if (isLoading) {
    return { isComplete: false, missingFields: [], isLoading: true };
  }

  if (isError || !profile) {
    return {
      isComplete: false,
      missingFields: ["Complete your profile to get AI recommendations"],
      isLoading: false,
    };
  }

  const missingFields = REQUIRED_FIELDS
    .filter(({ key }) => {
      const value = profile[key];
      return (
        value == null ||
        value === "" ||
        value === "none" ||
        (Array.isArray(value) && value.length === 0)
      );
    })
    .map(({ label }) => label);

  if (!profile.dailyCalorieGoal && !(profile.allergies && profile.allergies.length > 0)) {
    missingFields.push("Daily Calorie Goal or Allergies");
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    isLoading: false,
  };
}
