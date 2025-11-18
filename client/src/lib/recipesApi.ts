const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

class RecipesApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "RecipesApiError";
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

    throw new RecipesApiError(errorMessage, response.status);
  }

  return response.json();
}

export interface Ingredient {
  name: string;
  qty_text?: string;
}

export interface RecipeData {
  title: string;
  summary: string;
  cuisine?: string;
  diet_tags: string[];
  servings?: number;
  prep_time_min?: number;
  cook_time_min?: number;
  total_time_min?: number;
  ingredients: Ingredient[];
  steps: string[];
  tips: string[];
  image_url?: string;
  source_attribution?: string;
  youtube_search_url: string;
}

export interface RecipeResponse {
  recipe: RecipeData;
}

export interface RecipeRequest {
  dish_name: string;
  servings?: number;
  cuisine?: string;
  dietary_prefs?: string[];
  exclude_ingredients?: string[];
}

export async function generateRecipe(
  dishName: string,
  servings?: number,
  cuisine?: string,
  dietaryPrefs?: string[],
  excludeIngredients?: string[],
): Promise<RecipeResponse> {
  const requestBody: RecipeRequest = {
    dish_name: dishName,
    servings,
    cuisine,
    dietary_prefs: dietaryPrefs,
    exclude_ingredients: excludeIngredients,
  };

  console.log("=== CALLING RECIPES API ===");
  console.log("API_BASE:", API_BASE);
  console.log("Full URL:", `${API_BASE}/ai/recipes/generate`);
  console.log("Request Body:", JSON.stringify(requestBody, null, 2));

  try {
    const data = await fetchWithErrorHandling(
      `${API_BASE}/ai/recipes/generate`,
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      },
    );

    console.log("=== RECIPES API RESPONSE ===");
    console.log("Full response data:", JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error("=== RECIPES API ERROR ===", error);
    if (error instanceof RecipesApiError) {
      throw error;
    }
    throw new RecipesApiError("Network error while generating recipe");
  }
}
