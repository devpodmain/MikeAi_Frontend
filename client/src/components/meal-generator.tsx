import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, Users, ChefHat, Loader2, Youtube, Sparkles, UtensilsCrossed } from "lucide-react";
import { generateRecipe, type RecipeData } from "@/lib/recipesApi";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function MealGenerator() {
  const [dishName, setDishName] = useState("");
  const [servings, setServings] = useState<number>(4);
  const [cuisine, setCuisine] = useState("");
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [excludeIngredients, setExcludeIngredients] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const { toast } = useToast();

  const dietaryOptions = [
    "vegetarian",
    "vegan",
    "gluten-free",
    "dairy-free",
    "keto",
    "paleo",
    "low-carb",
    "high-protein",
  ];

  const cuisineOptions = [
    "Italian",
    "Indian",
    "Chinese",
    "Mexican",
    "Thai",
    "Japanese",
    "French",
    "Mediterranean",
    "American",
    "Korean",
    "Middle Eastern",
    "Vietnamese",
  ];

  const toggleDietaryPref = (pref: string) => {
    setDietaryPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleSearch = async () => {
    if (!dishName.trim()) {
      toast({
        title: "Dish name required",
        description: "Please enter a dish name to search for a recipe.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setRecipe(null);

    try {
      const excludedList = excludeIngredients
        .split(",")
        .map((i) => i.trim())
        .filter((i) => i.length > 0);

      const response = await generateRecipe(
        dishName,
        servings,
        cuisine || undefined,
        dietaryPrefs.length > 0 ? dietaryPrefs : undefined,
        excludedList.length > 0 ? excludedList : undefined
      );

      setRecipe(response.recipe);
      toast({
        title: "Recipe generated!",
        description: `Found a great recipe for ${response.recipe.title}`,
      });
    } catch (error) {
      console.error("Recipe generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Could not generate recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <ChefHat className="mr-3 h-6 w-6 text-orange-600" />
            AI Meal Generator
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            Get personalized recipes with step-by-step instructions
          </p>
        </CardHeader>
        <CardContent>
          {/* Search Form */}
          <div className="space-y-4 mb-8 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 p-6 rounded-lg">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dish">What would you like to cook? *</Label>
                <Input
                  id="dish"
                  type="text"
                  placeholder="e.g., Chicken Tikka Masala"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="mt-1"
                  data-testid="input-dish-name"
                />
              </div>

              <div>
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  max="20"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value) || 4)}
                  className="mt-1"
                  data-testid="input-servings"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cuisine">Cuisine Style (optional)</Label>
              <Select value={cuisine} onValueChange={setCuisine}>
                <SelectTrigger id="cuisine" className="mt-1" data-testid="select-cuisine">
                  <SelectValue placeholder="Any cuisine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any cuisine</SelectItem>
                  {cuisineOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Dietary Preferences</Label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((pref) => (
                  <Badge
                    key={pref}
                    variant={dietaryPrefs.includes(pref) ? "default" : "outline"}
                    className="cursor-pointer hover:scale-105 transition-transform bg-orange-600 hover:bg-orange-700"
                    onClick={() => toggleDietaryPref(pref)}
                    data-testid={`badge-dietary-${pref}`}
                  >
                    {pref}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="exclude">Exclude Ingredients (comma-separated)</Label>
              <Textarea
                id="exclude"
                placeholder="e.g., peanuts, shellfish"
                value={excludeIngredients}
                onChange={(e) => setExcludeIngredients(e.target.value)}
                rows={2}
                className="mt-1"
                data-testid="textarea-exclude-ingredients"
              />
            </div>

            <Button
              onClick={handleSearch}
              disabled={isGenerating || !dishName.trim()}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg py-6"
              data-testid="button-generate-recipe"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating recipe...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Recipe
                </>
              )}
            </Button>
          </div>

          {/* Recipe Display */}
          {recipe && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 rounded-lg shadow-lg">
                <h2 className="text-3xl font-bold mb-2" data-testid="text-recipe-title">{recipe.title}</h2>
                <p className="text-orange-100" data-testid="text-recipe-summary">{recipe.summary}</p>
                
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Prep: {recipe.prep_time_minutes} min</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Cook: {recipe.cook_time_minutes} min</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>{recipe.servings} servings</span>
                  </div>
                </div>

                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {recipe.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="bg-white text-orange-600">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Ingredients */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-orange-600">Ingredients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ingredient, i) => (
                        <li key={i} className="flex items-start" data-testid={`text-ingredient-${i}`}>
                          <span className="text-orange-500 mr-2">•</span>
                          <span>{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-orange-600">Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {recipe.instructions.map((step, i) => (
                        <li key={i} className="flex" data-testid={`text-instruction-${i}`}>
                          <span className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 rounded-full flex items-center justify-center font-semibold mr-3">
                            {i + 1}
                          </span>
                          <span className="pt-1">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </div>

              {/* Pro Tips */}
              {recipe.pro_tips && recipe.pro_tips.length > 0 && (
                <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-amber-700 dark:text-amber-300">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Pro Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recipe.pro_tips.map((tip, i) => (
                        <li key={i} className="flex items-start text-amber-800 dark:text-amber-200" data-testid={`text-tip-${i}`}>
                          <span className="mr-2">💡</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Video Link */}
              {recipe.video_url && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => window.open(recipe.video_url, "_blank")}
                    variant="outline"
                    className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                    data-testid="button-video-tutorial"
                  >
                    <Youtube className="mr-2 h-5 w-5" />
                    Watch Video Tutorial
                  </Button>
                </div>
              )}
            </div>
          )}

          {!recipe && !isGenerating && (
            <div className="text-center py-12 text-gray-400">
              <UtensilsCrossed className="mx-auto h-16 w-16 mb-4 opacity-50" />
              <p>Enter a dish name above to generate a personalized recipe</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
