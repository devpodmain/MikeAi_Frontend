import { useState } from 'react';
import { Link } from 'wouter';
import { Sparkles, Calendar, AlertCircle, RefreshCw, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MealDay } from '@/components/MealDay';
import { useMealPlan } from '@/hooks/useMealPlan';
import { useAuth } from '@/hooks/useAuth';

export default function MealPlanDashboard() {
  const { user } = useAuth();
  const [selectedDays, setSelectedDays] = useState<7 | 14>(7);
  const [selectedMeals, setSelectedMeals] = useState<3 | 5>(5);
  
  const {
    plan,
    isLoading,
    isGenerating,
    isRegenerating,
    isDeleting,
    progress,
    error,
    generate,
    regenerate,
    toggleMealCompletion,
    clearPlan,
    deleteAllMealPlans,
    hasExistingPlan,
  } = useMealPlan(user?.id || '');

  const handleGenerate = () => {
    console.log('=== BUTTON CLICKED ===');
    console.log('Selected days:', selectedDays);
    console.log('Selected meals:', selectedMeals);
    console.log('User ID:', user?.id);
    console.log('Has existing plan:', hasExistingPlan);
    generate({ days: selectedDays, mealsPerDay: selectedMeals });
  };

  const handleOverwriteGenerate = () => {
    console.log('=== OVERWRITE BUTTON CLICKED ===');
    clearPlan();
    handleGenerate();
  };

  const completedMeals = plan?.days.reduce((total, day) => 
    total + day.meals.filter(meal => meal.completed).length, 0
  ) || 0;
  
  const totalMeals = plan?.days.reduce((total, day) => total + day.meals.length, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/user-home">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Meal Planner
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate personalized meal plans powered by AI based on your preferences and goals.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'An error occurred while processing your meal plan.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Generation Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Generate New Meal Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Plan Duration</label>
                  <Select value={selectedDays.toString()} onValueChange={(value) => setSelectedDays(parseInt(value) as 7 | 14)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="14">14 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Meals Per Day</label>
                  <Select value={selectedMeals.toString()} onValueChange={(value) => setSelectedMeals(parseInt(value) as 3 | 5)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Meals</SelectItem>
                      <SelectItem value="5">5 Meals (3 meals + 2 snacks)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                {hasExistingPlan ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={isGenerating} className="px-6">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Plan
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Overwrite Existing Plan?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You already have a meal plan. Generating a new one will replace your current plan and reset all completion progress.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleOverwriteGenerate}>
                          Generate New Plan
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button onClick={handleGenerate} disabled={isGenerating} className="px-6">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Plan'}
                  </Button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {isGenerating && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generating your personalized meal plan...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meal Plan Display */}
        {plan ? (
          <div className="space-y-6">
            {/* Plan Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Your Meal Plan
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {plan.days.length} days
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {completedMeals}/{totalMeals} completed
                    </Badge>
                    {plan.metadata.calorie_target && (
                      <Badge variant="outline">
                        Target: {plan.metadata.calorie_target} cal/day
                      </Badge>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={isDeleting}
                          data-testid="button-delete-all-meal-plans"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isDeleting ? 'Deleting...' : 'Delete Plan'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete All Meal Plans?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete ALL your meal plans from the database. 
                            This action cannot be undone and will remove all saved meal data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteAllMealPlans()}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{completedMeals}</div>
                    <div className="text-sm text-gray-500">Meals Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{totalMeals - completedMeals}</div>
                    <div className="text-sm text-gray-500">Meals Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-500">Progress</div>
                  </div>
                </div>
                
                <Progress value={(completedMeals / totalMeals) * 100} className="w-full" />
              </CardContent>
            </Card>

            {/* Days Accordion */}
            <Accordion type="multiple" className="space-y-4">
              {plan.days.map((dayPlan) => (
                <MealDay
                  key={dayPlan.date}
                  dayPlan={dayPlan}
                  onToggleMeal={toggleMealCompletion}
                  onRegenerateMeal={(day, slot, constraints) => regenerate({ day, slot, constraints })}
                  isRegenerating={isRegenerating}
                />
              ))}
            </Accordion>
          </div>
        ) : (
          /* Empty State */
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Meal Plan Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Generate your first AI-powered meal plan based on your dietary preferences, goals, and restrictions.
              </p>
              <Button onClick={handleGenerate} size="lg" disabled={isGenerating}>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Your First Plan
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}