import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/navigation";
import { Search, Clock, Users, ChefHat, Loader2, Youtube, Sparkles, UtensilsCrossed } from "lucide-react";
import { generateRecipe, type RecipeData } from "@/lib/recipesApi";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Recipes() {
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <ChefHat className="w-10 h-10 text-orange-600 dark:text-orange-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
              AI Recipe Generator
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Search for any dish and get a complete recipe with ingredients, steps, and cooking tips
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8 shadow-lg border-orange-200 dark:border-slate-700">
          <CardHeader className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-slate-800 dark:to-slate-700 border-b">
            <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-300">
              <Sparkles className="w-5 h-5" />
              Search for a Recipe
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Dish Name */}
            <div className="space-y-2">
              <Label htmlFor="dish-name" className="text-sm font-semibold">
                Dish Name *
              </Label>
              <div className="relative">
                <UtensilsCrossed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="dish-name"
                  placeholder="e.g., Paneer butter masala, Chicken tikka, Pasta carbonara..."
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 text-lg"
                  data-testid="input-dish-name"
                />
              </div>
            </div>

            {/* Servings and Cuisine */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servings" className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Servings
                </Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  max="20"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value) || 4)}
                  data-testid="input-servings"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuisine" className="text-sm font-semibold">
                  Cuisine (Optional)
                </Label>
                <Select value={cuisine} onValueChange={setCuisine}>
                  <SelectTrigger data-testid="select-cuisine">
                    <SelectValue placeholder="Any cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dietary Preferences */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Dietary Preferences (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((pref) => (
                  <Badge
                    key={pref}
                    variant={dietaryPrefs.includes(pref) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      dietaryPrefs.includes(pref)
                        ? "bg-orange-600 hover:bg-orange-700 text-white"
                        : "hover:bg-orange-100 dark:hover:bg-slate-700"
                    }`}
                    onClick={() => toggleDietaryPref(pref)}
                    data-testid={`badge-dietary-${pref}`}
                  >
                    {pref}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Exclude Ingredients */}
            <div className="space-y-2">
              <Label htmlFor="exclude" className="text-sm font-semibold">
                Exclude Ingredients (Optional)
              </Label>
              <Textarea
                id="exclude"
                placeholder="e.g., cashew, dairy, eggs (comma-separated)"
                value={excludeIngredients}
                onChange={(e) => setExcludeIngredients(e.target.value)}
                rows={2}
                data-testid="textarea-exclude"
              />
              <p className="text-xs text-gray-500">
                Separate multiple ingredients with commas
              </p>
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={isGenerating || !dishName.trim()}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-lg py-6"
              data-testid="button-search-recipe"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Recipe...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Generate Recipe
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recipe Display */}
        {recipe && (
          <Card className="shadow-xl border-orange-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-amber-600 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-2" data-testid="text-recipe-title">
                    {recipe.title}
                  </CardTitle>
                  <p className="text-orange-50 text-sm leading-relaxed">
                    {recipe.summary}
                  </p>
                </div>
              </div>
              
              {/* Recipe Meta */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-orange-500">
                {recipe.prep_time_min && (
                  <div className="flex items-center gap-2 text-orange-50">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      Prep: {recipe.prep_time_min} min
                    </span>
                  </div>
                )}
                {recipe.cook_time_min && (
                  <div className="flex items-center gap-2 text-orange-50">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      Cook: {recipe.cook_time_min} min
                    </span>
                  </div>
                )}
                {recipe.total_time_min && (
                  <div className="flex items-center gap-2 text-orange-50">
                    <Clock className="w-4 h-4 font-bold" />
                    <span className="text-sm font-semibold">
                      Total: {recipe.total_time_min} min
                    </span>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex items-center gap-2 text-orange-50">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                      Serves: {recipe.servings}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {(recipe.diet_tags.length > 0 || recipe.cuisine) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {recipe.cuisine && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-900 border-orange-300">
                      {recipe.cuisine}
                    </Badge>
                  )}
                  {recipe.diet_tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-amber-100 text-amber-900 border-amber-300">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Ingredients */}
              <div>
                <h3 className="text-xl font-bold text-orange-900 dark:text-orange-400 mb-3 flex items-center gap-2">
                  <ChefHat className="w-5 h-5" />
                  Ingredients
                </h3>
                <div className="bg-orange-50 dark:bg-slate-800 rounded-lg p-4">
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                        data-testid={`ingredient-${index}`}
                      >
                        <span className="text-orange-600 dark:text-orange-400 font-bold mt-0.5">•</span>
                        <span>
                          <strong className="text-gray-900 dark:text-white">{ingredient.name}</strong>
                          {ingredient.qty_text && (
                            <span className="text-gray-600 dark:text-gray-400"> - {ingredient.qty_text}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Steps */}
              <div>
                <h3 className="text-xl font-bold text-orange-900 dark:text-orange-400 mb-3">
                  Instructions
                </h3>
                <ol className="space-y-3">
                  {recipe.steps.map((step, index) => (
                    <li
                      key={index}
                      className="flex gap-3"
                      data-testid={`step-${index}`}
                    >
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tips */}
              {recipe.tips.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-orange-900 dark:text-orange-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Pro Tips
                  </h3>
                  <div className="bg-amber-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
                    {recipe.tips.map((tip, index) => (
                      <p
                        key={index}
                        className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                        data-testid={`tip-${index}`}
                      >
                        <span className="text-amber-600 dark:text-amber-400 mt-0.5">💡</span>
                        {tip}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube Link */}
              {recipe.youtube_search_url && (
                <div className="pt-4 border-t">
                  <a
                    href={recipe.youtube_search_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                    data-testid="link-youtube"
                  >
                    <Youtube className="w-5 h-5" />
                    Watch Video Tutorial
                  </a>
                </div>
              )}

              {/* Source Attribution */}
              {recipe.source_attribution && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic border-t pt-4">
                  Style: {recipe.source_attribution}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!recipe && !isGenerating && (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Enter a dish name above to generate a recipe
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
