import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Clock, 
  Utensils, 
  Plus, 
  CheckCircle, 
  Star,
  Bot,
  Flame,
  Target,
  ChefHat,
  Zap
} from "lucide-react";

export default function MealPlanCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [planDuration, setPlanDuration] = useState("7");

  const { data: mealPlans = [], refetch: refetchMealPlans, isLoading: mealPlansLoading } = useQuery({
    queryKey: ["/api/meal-plans"],
    retry: false,
  });

  console.log("DEBUG: Meal plans data:", mealPlans);

  const { data: todaysMealLogs = [] } = useQuery({
    queryKey: ["/api/meal-logs", { date: new Date().toISOString().split('T')[0] }],
    retry: false,
  });

  const { data: todayMealPlan = [], isLoading: todayMealPlanLoading } = useQuery({
    queryKey: ["/api/meal-plans/today"],
    retry: false,
  });

  const generateMealPlanMutation = useMutation({
    mutationFn: async (duration: number) => {
      const response = await apiRequest("POST", "/api/ai/meal-plan", {
        duration,
        preferences: {}
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Force immediate refetch of meal plans
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      queryClient.refetchQueries({ queryKey: ["/api/meal-plans"] });
      setIsCreatePlanOpen(false);
      toast({
        title: "AI Meal Plan Generated!",
        description: data.message || "Your personalized meal plan is ready to use.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error generating meal plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGeneratePlan = () => {
    const duration = parseInt(planDuration);
    if (duration > 0) {
      generateMealPlanMutation.mutate(duration);
    }
  };

  const logMealMutation = useMutation({
    mutationFn: async (data: { recipeId: number; mealType: string; servings: number }) => {
      return await apiRequest("POST", "/api/meal-logs", {
        ...data,
        logDate: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-logs"] });
      toast({
        title: "Meal logged!",
        description: "Your meal has been added to today's log.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error logging meal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const favoriteRecipeMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      return await apiRequest("POST", `/api/recipes/${recipeId}/favorite`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Recipe favorited!",
        description: "Added to your favorite recipes.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error favoriting recipe",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogMeal = (recipeId: number, mealType: string) => {
    logMealMutation.mutate({
      recipeId,
      mealType,
      servings: 1
    });
  };

  const handleFavoriteRecipe = (recipeId: number) => {
    favoriteRecipeMutation.mutate(recipeId);
  };

  // Use real meal plan data
  const todayMeals = Array.isArray(todayMealPlan) ? todayMealPlan.map((item: any) => ({
    id: item.id,
    recipeId: item.recipeId,
    name: item.recipe?.name || "Recipe",
    mealType: item.mealType,
    calories: item.recipe?.calories || 0,
    cookingTime: item.recipe?.cookingTime || 0,
    difficulty: item.recipe?.difficulty || "medium",
    isLogged: Array.isArray(todaysMealLogs) && todaysMealLogs.some((log: any) => 
      log.recipeId === item.recipeId && log.mealType === item.mealType
    )
  })) : [];

  const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const loggedMeals = Array.isArray(todaysMealLogs) ? todaysMealLogs.length : 0;
  const totalMeals = todayMeals.length || 3;
  const progressPercentage = totalMeals > 0 ? (loggedMeals / totalMeals) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Meal Plans</h2>
          <p className="text-gray-600">Plan and track your daily nutrition</p>
        </div>
        <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white hover:bg-primary/90">
              <Bot className="mr-2 h-4 w-4" />
              Generate AI Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate AI Meal Plan</DialogTitle>
              <DialogDescription>
                Create a personalized meal plan using AI based on your dietary preferences and goals.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="duration">Plan Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={planDuration}
                  onChange={(e) => setPlanDuration(e.target.value)}
                  min="1"
                  max="30"
                />
              </div>
              <Button
                onClick={handleGeneratePlan}
                disabled={generateMealPlanMutation.isPending}
                className="w-full bg-primary text-white hover:bg-primary/90"
              >
                {generateMealPlanMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  "Generate Meal Plan"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{loggedMeals}/{totalMeals}</div>
              <div className="text-sm text-gray-600">Meals Logged</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{totalCalories}</div>
              <div className="text-sm text-gray-600">Planned Calories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{Math.round(progressPercentage)}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Meal Plan Tabs */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="saved">Saved Plans</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Today's Meals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayMealPlanLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-gray-600 mt-2">Loading today's meal plan...</p>
                </div>
              ) : todayMeals.length === 0 ? (
                <div className="text-center py-8">
                  <Utensils className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No meals planned for today</h3>
                  <p className="text-gray-600 mb-4">
                    Add recipes to your meal plan to see them here
                  </p>
                  <Button
                    onClick={() => setIsCreatePlanOpen(true)}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    <Bot className="mr-2 h-4 w-4" />
                    Generate AI Plan
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayMeals.map((meal) => (
                  <div key={meal.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                      meal.mealType === 'breakfast' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                      meal.mealType === 'lunch' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                      'bg-gradient-to-br from-blue-400 to-blue-600'
                    }`}>
                      <Utensils className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{meal.name}</h4>
                      <p className="text-sm text-gray-600">
                        {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)} • {meal.calories} calories
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{meal.cookingTime} min</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {meal.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLogMeal(meal.recipeId, meal.mealType)}
                        disabled={logMealMutation.isPending}
                      >
                        {meal.isLogged ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleFavoriteRecipe(meal.recipeId)}
                        disabled={favoriteRecipeMutation.isPending}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="week">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Weekly Meal Plan</h3>
                <p className="text-gray-600 mb-4">
                  Plan your entire week's meals in advance
                </p>
                <Button 
                  onClick={() => setIsCreatePlanOpen(true)}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Weekly Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="saved">
          <div className="space-y-4">
            {mealPlansLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-600 mt-2">Loading meal plans...</p>
              </div>
            ) : !mealPlans || !Array.isArray(mealPlans) || mealPlans.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <ChefHat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Saved Plans</h3>
                    <p className="text-gray-600 mb-4">
                      Create your first meal plan to get started
                    </p>
                    <Button
                      onClick={() => setIsCreatePlanOpen(true)}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      Generate AI Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              (Array.isArray(mealPlans) ? mealPlans : []).map((plan: any) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      <Badge variant="outline">
                        {plan.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-2">{plan.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Duration: {plan.duration} days</span>
                      <span>Calories: {plan.totalCalories}</span>
                      <span>Created: {new Date(plan.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Plan Dialog */}
      <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create AI Meal Plan</DialogTitle>
            <DialogDescription>
              Generate a customized meal plan tailored to your nutritional needs and preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="duration">Plan Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                value={planDuration}
                onChange={(e) => setPlanDuration(e.target.value)}
                min="1"
                max="30"
                placeholder="7"
              />
            </div>
            <Button
              onClick={handleGeneratePlan}
              disabled={generateMealPlanMutation.isPending}
              className="w-full bg-primary text-white hover:bg-primary/90"
            >
              {generateMealPlanMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4" />
                  Generate AI Plan
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
