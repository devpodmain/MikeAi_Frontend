import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, CheckCircle2, UtensilsCrossed, ChefHat, Calendar } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";

interface MealItem {
  name: string;
  portion?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

interface Meal {
  id?: string;
  name: string;
  type: string; // Breakfast, Lunch, Dinner, Snack
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  foods?: string[];
  items?: MealItem[]; // Legacy field support
  notes?: string;
}

export default function OrgTrackMeals() {
  const { user } = useAuth();
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<string>(
    ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()]
  );
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Track last mutation time to prevent race condition with cache refetch
  const lastMutationTime = useRef<number>(0);
  
  // Calculate the date for the selected weekday
  const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const todayIndex = new Date().getDay();
  const selectedDayIndex = weekdayNames.indexOf(selectedDay.toLowerCase());
  const dayDifference = selectedDayIndex - todayIndex;
  const selectedDate = format(addDays(new Date(), dayDifference), 'yyyy-MM-dd');

  // Fetch assigned meal plan
  const { data: assignedPlan, isLoading: isPlanLoading } = useQuery<{
    name?: string;
    dayMapping?: Record<string, string>;
    planData?: {
      days?: any[];
    };
  }>({
    queryKey: [`/api/organizations/${(user as any)?.organizationId}/assigned-meal-plan/${(user as any)?.id}`],
    enabled: !!(user as any)?.id && !!(user as any)?.organizationId,
  });

  // Fetch existing meal logs for selected date
  const { data: existingLogs } = useQuery({
    queryKey: ['/api/meal-logs', (user as any)?.id, selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/meal-logs?date=${selectedDate}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch meal logs');
      return response.json();
    },
    enabled: !!(user as any)?.id && !!selectedDate,
  });

  // Save meal log mutation
  const saveLogMutation = useMutation({
    mutationFn: async (logData: any) => {
      return apiRequest(`/api/meal-logs`, 'POST', logData);
    },
    onSuccess: () => {
      // Invalidate the scoped query key for proper cache refresh
      queryClient.invalidateQueries({ queryKey: ['/api/meal-logs', (user as any)?.id, selectedDate] });
    },
  });

  // Helper function to get plan day for any weekday using dayMapping
  const getPlanDayForWeekday = (weekday: string, dayMapping: Record<string, string> | undefined | null, planData: { days?: any[] } | undefined | null) => {
    if (!planData?.days || planData.days.length === 0) {
      return null;
    }

    const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    // If dayMapping exists and is not empty, use it
    if (dayMapping && Object.keys(dayMapping).length > 0) {
      // Check format: old (planDayIndex → weekday) vs new (weekday → planDayIndex)
      const firstKey = Object.keys(dayMapping)[0];
      const firstValue = dayMapping[firstKey];
      const isOldFormat = !isNaN(parseInt(firstKey)) && typeof firstValue === 'string' && weekdayNames.includes(firstValue.toLowerCase());
      
      let mappedValue: string | undefined;
      if (isOldFormat) {
        // Convert old format on the fly
        const newMapping: Record<string, string> = {};
        for (const [planDayIndex, wd] of Object.entries(dayMapping)) {
          newMapping[wd.toLowerCase()] = planDayIndex;
        }
        mappedValue = newMapping[weekday.toLowerCase()];
      } else {
        // New format
        mappedValue = dayMapping[weekday.toLowerCase()];
      }
      
      // Check if this day is explicitly marked as rest
      if (!mappedValue || mappedValue === "rest") {
        return null;
      }
      
      // Get the plan day index
      const planDayIndex = parseInt(mappedValue);
      if (!isNaN(planDayIndex) && planDayIndex >= 0 && planDayIndex < planData.days.length) {
        return planData.days[planDayIndex];
      }
      
      // Invalid mapping - treat as rest day
      return null;
    }

    // FALLBACK: No dayMapping - cycle through plan days based on weekday
    const weekdayIndex = weekdayNames.indexOf(weekday.toLowerCase());
    if (weekdayIndex !== -1) {
      const planDayIndex = weekdayIndex % planData.days.length;
      return planData.days[planDayIndex];
    }
    
    return null;
  };

  // Get meals for selected day
  const selectedDayMeals = getPlanDayForWeekday(selectedDay, assignedPlan?.dayMapping, assignedPlan?.planData);

  const meals: Meal[] = selectedDayMeals?.meals || [];

  // Sync completed meals from existing logs for selected date
  // RACE CONDITION FIX: Only sync if no recent mutations (prevents cache refetch from overwriting optimistic updates)
  useEffect(() => {
    if (existingLogs && Array.isArray(existingLogs)) {
      const timeSinceLastMutation = Date.now() - lastMutationTime.current;
      
      // If a mutation happened less than 1000ms ago, skip sync to preserve optimistic update
      // The mutation's onSuccess will invalidate cache, and the next sync will have fresh data
      if (timeSinceLastMutation < 1000) {
        return;
      }
      
      const completed = new Set<string>();
      (existingLogs as any[])
        .forEach((logEntry: any) => {
          // Handle Drizzle's joined query format: { meal_logs: {...}, recipes: {...} }
          const log = logEntry.meal_logs || logEntry; // Support both joined and flat formats
          if (log.logDate === selectedDate) {
            completed.add(log.mealType);
          }
        });
      setCompletedMeals(completed);
    }
  }, [existingLogs, selectedDate]);

  // Delete meal log mutation - uses robust endpoint that deletes by mealType and date
  const deleteMealMutation = useMutation({
    mutationFn: async (data: { mealIdentifier: string; legacyIdentifier: string; selectedDate: string }) => {
      // Try new format first, then fallback to legacy format
      try {
        const encodedMealType = encodeURIComponent(data.mealIdentifier);
        const encodedDate = encodeURIComponent(data.selectedDate);
        return await apiRequest(`/api/meal-logs/${encodedMealType}/${encodedDate}`, 'DELETE');
      } catch (error) {
        // If new format fails, try legacy format
        const encodedLegacyType = encodeURIComponent(data.legacyIdentifier);
        const encodedDate = encodeURIComponent(data.selectedDate);
        return await apiRequest(`/api/meal-logs/${encodedLegacyType}/${encodedDate}`, 'DELETE');
      }
    },
    onSuccess: () => {
      // Invalidate with full query key to ensure proper refetch
      queryClient.invalidateQueries({ queryKey: ['/api/meal-logs', (user as any)?.id, selectedDate] });
    },
  });

  const toggleMealComplete = (mealData: any) => {
    // Track mutation timestamp to prevent race condition with cache refetch
    lastMutationTime.current = Date.now();
    
    // Create unique identifier using meal name + type to support multiple snacks
    const mealIdentifier = `${mealData.name}|${mealData.type}`;
    const legacyIdentifier = mealData.type?.toLowerCase() || 'snack';
    
    // Check both new and legacy formats for completion status
    const isCurrentlyCompleted = completedMeals.has(mealIdentifier) || completedMeals.has(legacyIdentifier);
    
    // Update UI immediately (optimistic update)
    const newCompleted = new Set(completedMeals);
    if (isCurrentlyCompleted) {
      newCompleted.delete(mealIdentifier);
      newCompleted.delete(legacyIdentifier); // Also remove legacy if it exists
    } else {
      newCompleted.add(mealIdentifier);
    }
    setCompletedMeals(newCompleted);
    
    // Fire-and-forget mutation (no await, instant UI response)
    if (isCurrentlyCompleted) {
      deleteMealMutation.mutate({ mealIdentifier, legacyIdentifier, selectedDate }, {
        onSuccess: () => {
          lastMutationTime.current = Date.now();
          // Invalidate cache with full query key to ensure refetch
          queryClient.invalidateQueries({ queryKey: ['/api/meal-logs', (user as any)?.id, selectedDate] });
        },
        onError: () => {
          // Revert on error
          const revertCompleted = new Set(completedMeals);
          revertCompleted.add(mealIdentifier);
          setCompletedMeals(revertCompleted);
        }
      });
    } else {
      // Always save with new format using selectedDate instead of today
      saveLogMutation.mutate({
        userId: (user as any)?.id,
        mealType: mealIdentifier,
        logDate: selectedDate,
      }, {
        onSuccess: () => {
          lastMutationTime.current = Date.now();
          // Invalidate cache with full query key to ensure refetch
          queryClient.invalidateQueries({ queryKey: ['/api/meal-logs', (user as any)?.id, selectedDate] });
        },
        onError: () => {
          // Revert on error
          const revertCompleted = new Set(completedMeals);
          revertCompleted.delete(mealIdentifier);
          setCompletedMeals(revertCompleted);
        }
      });
    }
  };

  const progress = meals.length > 0 ? (completedMeals.size / meals.length) * 100 : 0;

  if (isPlanLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-pulse">
                <UtensilsCrossed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Loading your meal plan...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!assignedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Link to="/org-client-dashboard">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Card>
            <CardContent className="p-12 text-center">
              <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Meal Plan Assigned</h3>
              <p className="text-gray-600">Contact your coach to get a personalized meal plan</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Get all week days with their meal data
  const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const weekDaysCapitalized = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Today's weekday for highlighting
  const todayWeekday = weekDays[new Date().getDay()];

  // Check if there are any meals for the entire week
  const hasAnyMeals = weekDays.some(day => {
    const dayMeals = getPlanDayForWeekday(day, assignedPlan?.dayMapping, assignedPlan?.planData);
    return dayMeals?.meals && dayMeals.meals.length > 0;
  });

  if (!hasAnyMeals) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Link to="/org-client-dashboard">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Card>
            <CardContent className="p-12 text-center">
              <UtensilsCrossed className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Meals Scheduled</h3>
              <p className="text-gray-600">No meals scheduled for this week. Contact your coach!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/org-client-dashboard">
          <Button variant="ghost" className="mb-6" data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            {assignedPlan.name}
          </h1>
          <p className="text-gray-600">Full Week Meal Plan</p>
        </div>

        <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-6">
            {weekDays.map((day, idx) => {
              const dayMeals = getPlanDayForWeekday(day, assignedPlan?.dayMapping, assignedPlan?.planData);
              const mealsCount = dayMeals?.meals?.length || 0;
              const isToday = day === todayWeekday;
              
              return (
                <TabsTrigger key={day} value={day} className="relative" data-testid={`tab-${day}`}>
                  <div className="flex flex-col items-center">
                    <span className={`text-xs sm:text-sm ${isToday ? 'font-bold' : ''}`}>
                      {weekDaysCapitalized[idx].slice(0, 3)}
                    </span>
                    {mealsCount > 0 ? (
                      <Badge variant="secondary" className="mt-1 text-[10px] sm:text-xs">
                        {mealsCount}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-gray-400 mt-1">Rest</span>
                    )}
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {weekDays.map((day) => {
            const dayMeals = getPlanDayForWeekday(day, assignedPlan?.dayMapping, assignedPlan?.planData);
            const dayMealsList: Meal[] = dayMeals?.meals || [];
            
            return (
              <TabsContent key={day} value={day} className="space-y-6">
                {dayMealsList.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Rest day - no meals scheduled</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Meal Progress for {weekDaysCapitalized[weekDays.indexOf(day)]}</span>
                          <Badge variant="outline">
                            {dayMealsList.filter(m => {
                              const mealId = `${m.name}|${m.type}`;
                              const legacyId = m.type?.toLowerCase() || 'snack';
                              return completedMeals.has(mealId) || completedMeals.has(legacyId);
                            }).length} of {dayMealsList.length} completed
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Progress value={(dayMealsList.filter(m => {
                          const mealId = `${m.name}|${m.type}`;
                          const legacyId = m.type?.toLowerCase() || 'snack';
                          return completedMeals.has(mealId) || completedMeals.has(legacyId);
                        }).length / dayMealsList.length) * 100} className="h-3" />
                      </CardContent>
                    </Card>

                    {dayMealsList.map((meal, idx) => {
                      const mealIdentifier = `${meal.name}|${meal.type}`;
                      const legacyIdentifier = meal.type?.toLowerCase() || 'snack';
                      // Check both new and legacy formats for completion status
                      const isCompleted = completedMeals.has(mealIdentifier) || completedMeals.has(legacyIdentifier);
                      const totalCalories = meal.calories || (meal.items?.reduce((sum, item) => sum + (item.calories || 0), 0) || 0);
                      const totalProtein = meal.protein || (meal.items?.reduce((sum, item) => sum + (item.protein || 0), 0) || 0);

                      return (
                        <Card key={idx} className={isCompleted ? 'border-green-500 bg-green-50' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => toggleMealComplete(meal)}
                        className="h-6 w-6"
                        data-testid={`checkbox-meal-${idx}`}
                      />
                      <div>
                        <h3 className="text-xl font-semibold">{meal.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{meal.type}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      {totalCalories > 0 && (
                        <Badge variant="outline">{totalCalories} cal</Badge>
                      )}
                      {totalProtein > 0 && (
                        <Badge variant="outline">{totalProtein}g protein</Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {meal.foods && meal.foods.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Foods</p>
                      <ul className="list-disc list-inside space-y-1">
                        {meal.foods.map((food: string, i: number) => (
                          <li key={i} className="text-sm text-gray-700">{food}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {meal.items && meal.items.length > 0 && (
                    <div className="space-y-3">
                      {meal.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex justify-between items-start p-3 bg-white rounded-lg">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.portion && (
                              <p className="text-sm text-gray-600">{item.portion}</p>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            {item.calories && <p>{item.calories} cal</p>}
                            {item.protein && <p>{item.protein}g protein</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {meal.notes && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> {meal.notes}
                      </p>
                    </div>
                  )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  </>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            ✨ Your progress is saved automatically when you check off meals
          </p>
        </div>
      </div>
    </div>
  );
}
