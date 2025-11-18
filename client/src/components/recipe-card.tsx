import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Users, 
  Star, 
  Heart, 
  Plus,
  Flame,
  ChefHat,
  Utensils
} from "lucide-react";

interface Recipe {
  id: number;
  name: string;
  description: string;
  cuisine: string;
  mealType: string;
  cookingTime: number;
  servings: number;
  calories: number;
  protein: string;
  carbs: string;
  fats: string;
  ingredients: any;
  instructions: string[];
  imageUrl?: string;
  tags: string[];
  difficulty: string;
  rating: string;
  createdBy?: string;
  createdAt?: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  onAddToMealPlan?: (recipe: Recipe) => void;
}

export default function RecipeCard({ recipe, onAddToMealPlan }: RecipeCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const addToMealPlanMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      // This would typically add to an active meal plan
      return await apiRequest("POST", "/api/meal-plans/current/items", {
        recipeId,
        day: 1, // or current day
        mealType: recipe.mealType,
        servings: 1
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to meal plan!",
        description: `${recipe.name} has been added to your meal plan.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding to meal plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddToMealPlan = () => {
    if (onAddToMealPlan) {
      onAddToMealPlan(recipe);
    } else if (recipe.id) {
      addToMealPlanMutation.mutate(recipe.id);
    } else {
      toast({
        title: "Error adding to meal plan",
        description: "Recipe ID is missing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleLike = () => {
    setIsLiked(!isLiked);
    // In a real app, this would make an API call
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? `${recipe.name} removed from favorites` : `${recipe.name} added to favorites`,
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-success text-white';
      case 'medium':
        return 'bg-warning text-white';
      case 'hard':
        return 'bg-error text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '🌞';
      case 'dinner':
        return '🌙';
      case 'snack':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        {recipe.imageUrl ? (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.name} 
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <ChefHat className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {/* Floating badges */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="bg-white/90 text-accent">
            {recipe.cuisine}
          </Badge>
        </div>
        
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          <div className="bg-white/90 rounded-full p-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
          </div>
          <span className="text-xs bg-white/90 px-2 py-1 rounded">
            {parseFloat(recipe.rating).toFixed(1)}
          </span>
        </div>

        {/* Meal type indicator */}
        <div className="absolute bottom-2 left-2">
          <div className="bg-white/90 rounded-full px-2 py-1 flex items-center space-x-1">
            <span className="text-sm">{getMealTypeIcon(recipe.mealType)}</span>
            <span className="text-xs font-medium capitalize">{recipe.mealType}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-800 text-lg leading-tight">
            {recipe.name}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleLike}
            className="p-1 h-8 w-8"
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </Button>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {recipe.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{recipe.cookingTime} min</span>
            </div>
            <div className="flex items-center space-x-1">
              <Flame className="h-4 w-4" />
              <span>{recipe.calories} cal</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{recipe.servings}</span>
            </div>
          </div>
          <Badge className={getDifficultyColor(recipe.difficulty)}>
            {recipe.difficulty}
          </Badge>
        </div>

        {/* Nutrition info */}
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-3">
          <div className="text-center">
            <div className="font-semibold text-accent">{recipe.protein}g</div>
            <div>Protein</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-primary">{recipe.carbs}g</div>
            <div>Carbs</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-warning">{recipe.fats}g</div>
            <div>Fats</div>
          </div>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {recipe.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{recipe.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleAddToMealPlan}
            disabled={addToMealPlanMutation.isPending}
            className="flex-1 bg-primary text-white hover:bg-primary/90"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add to Plan
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            size="sm"
          >
            <Utensils className="h-4 w-4" />
          </Button>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-2">Ingredients:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {recipe.ingredients?.items && recipe.ingredients.items.slice(0, 5).map((ingredient: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                      {ingredient}
                    </li>
                  ))}
                  {recipe.ingredients?.items && recipe.ingredients.items.length > 5 && (
                    <li className="text-xs text-gray-500">
                      ...and {recipe.ingredients.items.length - 5} more ingredients
                    </li>
                  )}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm mb-2">Instructions:</h4>
                <ol className="text-sm text-gray-600 space-y-1">
                  {recipe.instructions.slice(0, 3).map((step, index) => (
                    <li key={index} className="flex">
                      <span className="font-medium text-primary mr-2">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                  {recipe.instructions.length > 3 && (
                    <li className="text-xs text-gray-500 ml-6">
                      ...and {recipe.instructions.length - 3} more steps
                    </li>
                  )}
                </ol>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
