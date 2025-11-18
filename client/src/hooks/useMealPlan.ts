import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  generatePlan, 
  regenerateMeal, 
  getUserProfile, 
  persistPlan, 
  loadExistingPlan 
} from '@/lib/mealPlanApi';
import { Plan, Meal, RegenerateMealArgs } from '@/types/mealPlan';

export function useMealPlan(userId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  // Query for existing plan
  const { data: plan, isLoading: isLoadingPlan } = useQuery({
    queryKey: ['meal-plan', userId],
    queryFn: () => loadExistingPlan(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate new meal plan mutation
  const generateMutation = useMutation({
    mutationFn: async ({ days, mealsPerDay }: { days: 7 | 14; mealsPerDay: 3 | 5 }) => {
      console.log('=== MUTATION STARTED ===');
      console.log('User ID:', userId);
      console.log('Days:', days, 'Meals per day:', mealsPerDay);
      setProgress(10);
      
      try {
        // Fetch user profile
        console.log('Fetching user profile...');
        const profile = await getUserProfile(userId);
        console.log('Profile fetched successfully:', profile);
        setProgress(30);
        
        // Generate plan
        console.log('Calling generatePlan...');
        const newPlan = await generatePlan(profile, days, mealsPerDay);
        console.log('Plan generated successfully:', newPlan);
        setProgress(80);
        
        // Persist plan
        console.log('Persisting plan...');
        await persistPlan(userId, newPlan);
        console.log('Plan persisted successfully');
        setProgress(100);
        
        return newPlan;
      } catch (error) {
        console.error('=== MUTATION ERROR ===', error);
        throw error;
      }
    },
    onSuccess: (newPlan) => {
      queryClient.setQueryData(['meal-plan', userId], newPlan);
      setProgress(0);
      toast({
        title: "Meal Plan Generated",
        description: "Your personalized meal plan is ready!",
      });
    },
    onError: (error: any) => {
      setProgress(0);
      const message = error.message || 'Failed to generate meal plan';
      toast({
        title: "Generation Failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Regenerate single meal mutation
  const regenerateMutation = useMutation({
    mutationFn: async ({ 
      day, 
      slot, 
      constraints 
    }: { 
      day: string; 
      slot: Meal['slot']; 
      constraints?: RegenerateMealArgs['constraints'] 
    }) => {
      if (!plan) throw new Error('No plan available');
      
      // Get user profile
      const profile = await getUserProfile(userId);
      
      // Find other meals for context
      const dayPlan = plan.days.find(d => d.date === day);
      if (!dayPlan) throw new Error('Day not found in plan');
      
      const contextMeals = dayPlan.meals.filter(m => m.slot !== slot);
      
      // Regenerate the meal
      const newMeal = await regenerateMeal({
        profile,
        day,
        slot,
        constraints,
        contextMeals,
      });
      
      return { day, slot, newMeal };
    },
    onSuccess: ({ day, slot, newMeal }) => {
      if (!plan) return;
      
      // Update the plan with the new meal
      const updatedPlan = {
        ...plan,
        days: plan.days.map(dayPlan => {
          if (dayPlan.date === day) {
            const updatedMeals = dayPlan.meals.map(meal => 
              meal.slot === slot ? { ...newMeal, completed: false } : meal
            );
            
            // Recalculate total calories
            const totalCalories = updatedMeals.reduce((sum, meal) => sum + meal.calories, 0);
            
            return {
              ...dayPlan,
              meals: updatedMeals,
              total_calories: totalCalories,
            };
          }
          return dayPlan;
        }),
      };
      
      // Update cache and persist
      queryClient.setQueryData(['meal-plan', userId], updatedPlan);
      persistPlan(userId, updatedPlan);
      
      toast({
        title: "Meal Updated",
        description: `${newMeal.title} has been regenerated!`,
      });
    },
    onError: (error: any) => {
      const message = error.message || 'Failed to regenerate meal';
      toast({
        title: "Regeneration Failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Toggle meal completion
  const toggleMealCompletion = (day: string, slot: Meal['slot']) => {
    if (!plan) return;
    
    const updatedPlan = {
      ...plan,
      days: plan.days.map(dayPlan => {
        if (dayPlan.date === day) {
          return {
            ...dayPlan,
            meals: dayPlan.meals.map(meal => 
              meal.slot === slot 
                ? { ...meal, completed: !meal.completed }
                : meal
            ),
          };
        }
        return dayPlan;
      }),
    };
    
    queryClient.setQueryData(['meal-plan', userId], updatedPlan);
    persistPlan(userId, updatedPlan);
  };

  // Clear existing plan (local only)
  const clearPlan = () => {
    queryClient.setQueryData(['meal-plan', userId], null);
    localStorage.removeItem(`meal-plan-${userId}`);
  };

  // Delete all meal plans mutation (from database)
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      console.log('Deleting all meal plans from database for user:', userId);
      const response = await fetch('/api/meal-plans', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meal plans');
      }

      return response.json();
    },
    onSuccess: () => {
      // Clear local cache
      queryClient.setQueryData(['meal-plan', userId], null);
      localStorage.removeItem(`meal-plan-${userId}`);
      
      toast({
        title: "All Meal Plans Deleted",
        description: "Your meal plans have been permanently removed from the database.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || 'Failed to delete meal plans. Please try again.',
        variant: "destructive",
      });
    },
  });

  return {
    // State
    plan,
    isLoading: isLoadingPlan,
    isGenerating: generateMutation.isPending,
    isRegenerating: regenerateMutation.isPending,
    isDeleting: deleteAllMutation.isPending,
    progress,
    error: generateMutation.error || regenerateMutation.error,
    
    // Actions
    generate: generateMutation.mutate,
    regenerate: regenerateMutation.mutate,
    toggleMealCompletion,
    clearPlan,
    deleteAllMealPlans: deleteAllMutation.mutate,
    
    // Status helpers
    hasExistingPlan: !!plan,
  };
}