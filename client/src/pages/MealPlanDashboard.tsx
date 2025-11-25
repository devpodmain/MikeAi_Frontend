import { useState } from 'react';
import { Link } from 'wouter';
import { Sparkles, Calendar, AlertCircle, RefreshCw, ArrowLeft, Trash2, CheckCircle, X, Loader2 } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MealDay } from '@/components/MealDay';
import { useMealPlan } from '@/hooks/useMealPlan';
import { useAuth } from '@/hooks/useAuth';
import { ProfileCompletionAlert } from '@/components/ProfileCompletionAlert';
import { generatePlanPreview, getUserProfile, persistPlan } from '@/lib/mealPlanApi';
import { queryClient } from '@/lib/queryClient';

export default function MealPlanDashboard() {
  const { user } = useAuth();
  const [selectedDays, setSelectedDays] = useState<7 | 14>(7);
  const [selectedMeals, setSelectedMeals] = useState<3 | 5>(5);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<any>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewSettings, setPreviewSettings] = useState<{days: 7 | 14, meals: 3 | 5} | null>(null);
  
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

  const handlePreviewGenerate = async () => {
    if (!user?.id) return;
    
    setIsPreviewing(true);
    setPreviewError(null);
    setPreviewPlan(null);
    
    // Scroll to top so user can see the loading overlay on the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    try {
      const profile = await getUserProfile(user.id);
      const preview = await generatePlanPreview(profile, selectedDays, selectedMeals);
      setPreviewPlan(preview);
      setPreviewSettings({ days: selectedDays, meals: selectedMeals });
      // Only open the dialog AFTER data is successfully fetched
      setPreviewModalOpen(true);
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to generate preview');
      // Still open the modal to show the error
      setPreviewModalOpen(true);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleAcceptPreview = async () => {
    if (!user?.id || !previewPlan) return;
    
    setIsSavingPreview(true);
    setPreviewError(null);
    
    let didPersist = false;
    try {
      await persistPlan(user.id, previewPlan);
      didPersist = true;
      await queryClient.invalidateQueries({ queryKey: ['/api/meal-plans', user.id] });
    } catch (err: any) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setIsSavingPreview(false);
      if (didPersist) {
        setPreviewPlan(null);
        setPreviewModalOpen(false);
      }
    }
  };

  const handleCancelPreview = () => {
    setPreviewModalOpen(false);
    if (!previewError) {
      setPreviewPlan(null);
    }
    setPreviewError(null);
  };

  const handleGenerate = () => {
    console.log('=== BUTTON CLICKED ===');
    console.log('Selected days:', selectedDays);
    console.log('Selected meals:', selectedMeals);
    console.log('User ID:', user?.id);
    console.log('Has existing plan:', hasExistingPlan);
    
    const settingsChanged = previewSettings && (
      previewSettings.days !== selectedDays || 
      previewSettings.meals !== selectedMeals
    );
    
    if (previewPlan && !settingsChanged) {
      // We already have a cached preview, just open the dialog
      setPreviewModalOpen(true);
    } else {
      handlePreviewGenerate();
    }
  };

  const handleOverwriteGenerate = () => {
    console.log('=== OVERWRITE BUTTON CLICKED ===');
    clearPlan();
    
    const settingsChanged = previewSettings && (
      previewSettings.days !== selectedDays || 
      previewSettings.meals !== selectedMeals
    );
    
    if (previewPlan && !settingsChanged) {
      // We already have a cached preview, just open the dialog
      setPreviewModalOpen(true);
    } else {
      handlePreviewGenerate();
    }
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
        <ProfileCompletionAlert />
        
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

        {/* Full-Page Loading Overlay - Shows while AI generates */}
        {isPreviewing && (
          <div className="fixed inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center space-y-6 p-8">
              <div className="relative">
                <div className="w-24 h-24 mx-auto">
                  <Loader2 className="w-24 h-24 text-blue-600 animate-spin" />
                </div>
                <Sparkles className="w-10 h-10 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-300 mb-3">
                  AI is Creating Your Meal Plan
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Analyzing your profile and generating personalized meals...
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
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
                      <Button disabled={isGenerating || isPreviewing} className="px-6" data-testid="button-generate-meal-plan">
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
                          Preview New Plan
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button onClick={handleGenerate} disabled={isGenerating || isPreviewing} className="px-6" data-testid="button-generate-meal-plan">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isPreviewing ? 'Generating Preview...' : isGenerating ? 'Saving...' : 'Generate Plan'}
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

        {/* Preview Modal - Only opens after data is fetched */}
        <Dialog open={previewModalOpen} onOpenChange={(open) => {
          if (!open && isSavingPreview) return;
          setPreviewModalOpen(open);
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto relative">
            {/* Loading Overlay for Saving */}
            {isSavingPreview && (
              <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                <div className="text-center space-y-4 p-8">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto" />
                    <CheckCircle className="w-8 h-8 text-green-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-2">
                      Saving Your Meal Plan
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Almost there! Saving your plan to the dashboard...
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Meal Plan Preview
              </DialogTitle>
              <DialogDescription>
                Review your AI-generated meal plan before saving it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!isSavingPreview && (
                <>
                  {previewError && (
                    <div className="space-y-4">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{previewError}</AlertDescription>
                      </Alert>
                      <div className="text-center py-4">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          There was a problem generating your meal plan. Please try again.
                        </p>
                        <Button 
                          onClick={() => {
                            setPreviewModalOpen(false);
                            setPreviewError(null);
                            handlePreviewGenerate();
                          }}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}
                  {previewPlan && (
                    <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{previewPlan.days?.length || 0}</div>
                      <div className="text-sm text-gray-500">Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {previewPlan.days?.reduce((sum: number, day: any) => sum + (day.meals?.length || 0), 0) || 0}
                      </div>
                      <div className="text-sm text-gray-500">Total Meals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {previewPlan.metadata?.calorie_target || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">Cal/Day Target</div>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {previewPlan.days?.map((day: any, dayIndex: number) => (
                      <Card key={dayIndex}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            Day {dayIndex + 1} - {day.date}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {day.meals?.map((meal: any, mealIndex: number) => (
                              <div key={mealIndex} className="p-3 bg-white dark:bg-gray-800 border rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 dark:text-white capitalize">{meal.slot?.replace('_', ' ')}</div>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{meal.title || meal.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {meal.calories} cal | P: {meal.macros?.protein || meal.protein || 0}g | C: {meal.macros?.carbs || meal.carbs || 0}g | F: {meal.macros?.fat || meal.fats || 0}g
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={handleCancelPreview}
                disabled={isPreviewing || isSavingPreview}
                data-testid="button-cancel-preview"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleAcceptPreview}
                disabled={isPreviewing || isSavingPreview || !previewPlan}
                data-testid="button-accept-preview"
              >
                {isSavingPreview ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept & Save Plan
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}