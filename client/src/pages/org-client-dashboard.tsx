import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Target, Heart, Utensils, Calendar, TrendingUp, 
  Plus, CheckCircle2, Star, Award, Zap,
  Activity, Apple, Droplets, Trash2, Settings, RotateCcw,
  Building2, Minus, Dumbbell, Flame, Lock
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { WaterMeter } from "@/components/ui/water-meter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FullWeekMealPlanViewer } from "@/components/FullWeekMealPlanViewer";
import { FullWeekWorkoutPlanViewer } from "@/components/FullWeekWorkoutPlanViewer";
import logoImage from "@assets/1_1753425387748.png";
import heroImage from "@assets/img 1_1753421307951.jpg";

// Motivational quotes array
const MOTIVATIONAL_QUOTES = [
  "Every healthy choice you make today is an investment in tomorrow's stronger, happier you!",
  "Your body is a reflection of your lifestyle. Make it a masterpiece!",
  "Success is the sum of small efforts repeated day in and day out.",
  "The only bad workout is the one that didn't happen.",
  "Don't wait for the perfect moment. Take the moment and make it perfect.",
  "Small progress is still progress. Keep going!",
  "You are one workout away from a good mood.",
  "Strive for progress, not perfection.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "The secret of getting ahead is getting started.",
];

export default function OrgClientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [waterSettingsOpen, setWaterSettingsOpen] = useState(false);
  const [newWaterGoal, setNewWaterGoal] = useState(8);
  const [viewFullMealPlanOpen, setViewFullMealPlanOpen] = useState(false);
  const [viewFullWorkoutPlanOpen, setViewFullWorkoutPlanOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const currentDayOfWeek = new Date().getDay();

  // Select a random motivational quote
  const [dailyQuote] = useState(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[randomIndex];
  });

  // Get organization info and client data
  const { data: orgData, error: orgDataError } = useQuery<{
    organizationId?: number;
    organizationName?: string;
    organizationLogo?: string;
    coachId?: string;
    coachName?: string;
    coachEmail?: string;
    ownerId?: string;
  }>({
    queryKey: [`/api/organizations/${user?.organizationId}/client-info/${user?.id}`],
    enabled: !!user?.id && !!user?.organizationId,
  });

  // Get assigned meal plan - uses hierarchical query key for cache consistency
  const { data: assignedMealPlan, error: mealPlanError } = useQuery<{
    name?: string;
    assignedBy?: string;
    weekNumber?: number;
    dayMapping?: Record<string, string>;
    planData?: {
      days?: any[];
    };
  }>({
    queryKey: [`/api/organizations/${user?.organizationId}/assigned-meal-plan/${user?.id}`],
    enabled: !!user?.id && !!user?.organizationId,
  });

  // Get assigned workout plan - uses hierarchical query key for cache consistency
  const { data: assignedWorkoutPlan, error: workoutPlanError } = useQuery<{
    name?: string;
    assignedBy?: string;
    weekNumber?: number;
    dayMapping?: Record<string, string>;
    planData?: {
      days?: any[];
      days_per_week?: number;
    };
  }>({
    queryKey: [`/api/organizations/${user?.organizationId}/assigned-workout-plan/${user?.id}`],
    enabled: !!user?.id && !!user?.organizationId,
  });

  // Check if any query returned a 402 error with locked: true
  const checkBillingLock = (error: any) => {
    if (!error) return false;
    
    // Check if error is a Response object with 402 status
    if (error instanceof Response && error.status === 402) {
      return true; // 402 = billing locked
    }
    
    // Check if error has status 402 directly
    if (error.status === 402) {
      return true;
    }
    
    // Check parsed error data
    const errorData = error.response?.data || error.data || {};
    return errorData.locked === true || errorData.requiresUpgrade === true;
  };

  const isBillingLocked = 
    checkBillingLock(orgDataError) || 
    checkBillingLock(mealPlanError) || 
    checkBillingLock(workoutPlanError);

  // Render lock screen if billing is locked
  if (isBillingLocked) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full" data-testid="card-subscription-lock">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-600 dark:text-red-400" data-testid="icon-lock" />
            </div>
            <CardTitle data-testid="text-lock-title">Access Locked</CardTitle>
            <CardDescription data-testid="text-lock-description">
              Organization billing has expired or is inactive
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600 dark:text-slate-400" data-testid="text-lock-message">
              Please contact your organization owner to renew access to continue using all features.
            </p>
            <Button asChild className="w-full" data-testid="button-return-home">
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Load workout streaks using TanStack Query for proper cache invalidation
  const { data: workoutStreaks = { current_streak: 0, longest_streak: 0, total_workouts: 0 } } = useQuery<{
    current_streak: number;
    longest_streak: number;
    total_workouts: number;
  }>({
    queryKey: [`/api/workout-streaks`, user?.id],
    enabled: !!user?.id,
  });

  // Get habit data
  const { data: habits = [] } = useQuery({
    queryKey: ["/api/habits"],
    retry: false,
    enabled: !!user?.id,
  });

  const { data: habitLogs = [] } = useQuery({
    queryKey: [`/api/habit-logs?date=${today}`],
    retry: false,
    enabled: !!user?.id,
  });

  // Get user preferences for water tracking
  const { data: userPrefs } = useQuery<{ waterDailyGoalGlasses: number }>({
    queryKey: ["/api/user-preferences"],
    retry: false,
    enabled: !!user?.id,
  });

  const waterGoal = userPrefs?.waterDailyGoalGlasses || 8;

  // Sync newWaterGoal with current waterGoal when preferences load
  useEffect(() => {
    if (waterGoal) {
      setNewWaterGoal(waterGoal);
    }
  }, [waterGoal]);

  // Get real water intake data
  const { data: waterData } = useQuery({
    queryKey: [`/api/water-logs/today?date=${today}`],
    retry: false,
    enabled: !!user?.id,
  });

  // Water logging mutation
  const logWaterMutation = useMutation({
    mutationFn: async (glassesCount: number) => {
      return await apiRequest("/api/water-logs", "POST", {
        glassesCount,
        logDate: today
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/water-logs/today?date=${today}`] });
    }
  });

  // Reset water log mutation
  const resetWaterMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/water-logs/today`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/water-logs/today?date=${today}`] });
      toast({ title: "Water log reset successfully!" });
    }
  });

  // Habit completion mutation
  const logHabitMutation = useMutation({
    mutationFn: async (data: { habitId: number; completed: boolean }) => {
      return await apiRequest("/api/habit-logs", "POST", {
        habitId: data.habitId,
        completed: data.completed,
        logDate: today
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/habit-logs?date=${today}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
    }
  });

  // Add habit mutation
  const addHabitMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("/api/habits", "POST", {
        name,
        targetDays: 7
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Habit added!",
        description: "Your new habit has been created successfully.",
      });
      setNewHabitName("");
      setHabitModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add habit. Maximum 5 habits allowed.",
        variant: "destructive",
      });
    }
  });

  // Delete habit mutation
  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      return await apiRequest(`/api/habits/${habitId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Habit deleted",
        description: "Your habit has been removed.",
      });
    }
  });

  // Update water goal mutation
  const updateWaterPrefsMutation = useMutation({
    mutationFn: async (goalGlasses: number) => {
      return await apiRequest("/api/user-preferences", "POST", {
        waterDailyGoalGlasses: goalGlasses
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
      toast({
        title: "Water goal updated!",
        description: `Your daily water goal is now ${newWaterGoal} glasses.`,
      });
      setWaterSettingsOpen(false);
    }
  });

  const handleWaterIncrement = () => {
    logWaterMutation.mutate(1);
  };

  const handleWaterDecrement = () => {
    const currentGlasses = (waterData as any)?.glasses || 0;
    if (currentGlasses > 0) {
      logWaterMutation.mutate(-1);
    }
  };

  const handleWaterReset = () => {
    resetWaterMutation.mutate();
  };

  const handleHabitToggle = (habitId: number, currentlyCompleted: boolean) => {
    logHabitMutation.mutate({ habitId, completed: !currentlyCompleted });
  };

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      addHabitMutation.mutate(newHabitName.trim());
    }
  };

  const handleDeleteHabit = (habitId: number) => {
    deleteHabitMutation.mutate(habitId);
  };

  const handleUpdateWaterGoal = () => {
    updateWaterPrefsMutation.mutate(newWaterGoal);
  };

  // Helper function to get today's plan day using dayMapping
  const getTodaysPlanDay = (dayMapping: Record<string, string> | undefined | null, planData: { days?: any[] } | undefined | null) => {
    if (!planData?.days || planData.days.length === 0) {
      return null;
    }

    // Get today's weekday name (lowercase)
    const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDayOfWeek = new Date().getDay();
    const todayWeekday = weekdayNames[currentDayOfWeek];

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
        for (const [planDayIndex, weekday] of Object.entries(dayMapping)) {
          newMapping[weekday.toLowerCase()] = planDayIndex;
        }
        mappedValue = newMapping[todayWeekday];
      } else {
        // New format
        mappedValue = dayMapping[todayWeekday];
      }
      
      // Check if today is explicitly marked as rest
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

    // FALLBACK: No dayMapping - cycle through plan days based on current day of week
    // Use modulo to cycle if plan has fewer days than the week
    const planDayIndex = currentDayOfWeek % planData.days.length;
    return planData.days[planDayIndex];
  };

  // Get today's workout from the plan using dayMapping
  const todaysWorkout = getTodaysPlanDay(assignedWorkoutPlan?.dayMapping, assignedWorkoutPlan?.planData);

  // Calculate statistics
  const totalHabits = (habits as any[] || []).length;
  const habitsCompleted = (habitLogs as any[] || []).filter((log: any) => log.completed).length;
  const currentWater = (waterData as any)?.glasses || 0;

  // Get meal logs for today - uses hierarchical query key for proper cache invalidation
  const { data: mealLogs = [] } = useQuery({
    queryKey: ['/api/meal-logs', user?.id, today],
    queryFn: async () => {
      const response = await fetch(`/api/meal-logs?date=${today}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch meal logs');
      return response.json();
    },
    retry: false,
    enabled: !!user?.id,
  });

  // Get today's meals from assigned plan using dayMapping
  const todaysMealData = getTodaysPlanDay(assignedMealPlan?.dayMapping, assignedMealPlan?.planData);

  const rawMeals = todaysMealData?.meals || [];
  
  // Merge meal plan with completion status from logs
  const todaysMeals = rawMeals.map((meal: any) => {
    // Use unique identifier (name|type) to support multiple snacks
    const mealIdentifier = `${meal.name}|${meal.type}`;
    const legacyIdentifier = meal.type?.toLowerCase() || 'snack';
    
    // Check both new and legacy formats for backward compatibility
    // Handle Drizzle's joined query format: { meal_logs: {...}, recipes: {...} }
    const isCompleted = (mealLogs as any[]).some((logEntry: any) => {
      const log = logEntry.meal_logs || logEntry; // Support both joined and flat formats
      return (log.mealType === mealIdentifier || log.mealType === legacyIdentifier) && log.logDate === today;
    });
    
    return {
      ...meal,
      completed: isCompleted,
      mealType: mealIdentifier,
      legacyMealType: legacyIdentifier,
      displayType: meal.type || 'Snack',
      displayName: meal.name
    };
  });

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  };

  // Get workout logs for today
  const { data: workoutLogsToday = [] } = useQuery({
    queryKey: [`/api/workout-logs`, user?.id, today],
    retry: false,
    enabled: !!user?.id,
  });

  // Calculate real progress indicators
  const completedMeals = todaysMeals.filter((m: any) => m.completed).length;
  const hasCompletedWorkout = (workoutLogsToday as any[]).length > 0;
  const workoutGoal = todaysWorkout ? 1 : 0; // 1 if workout planned today, 0 if rest day
  const workoutCompleted = hasCompletedWorkout ? 1 : 0;
  
  const goalsAchievedToday = habitsCompleted + completedMeals + (currentWater >= waterGoal ? 1 : 0) + workoutCompleted;
  const totalGoalsToday = totalHabits + todaysMeals.length + 1 + workoutGoal; // habits + meals + water + workout
  const todayProgress = totalGoalsToday > 0 ? Math.round((goalsAchievedToday / totalGoalsToday) * 100) : 0;

  // Get habit streaks from real data
  const habitStreak = (habits as any[] || []).map((habit: any) => {
    const todayLog = (habitLogs as any[] || []).find((log: any) => log.habitId === habit.id);
    return {
      habit: habit.name,
      streak: habit.streak || 0,
      completed: !!todayLog?.completed,
      id: habit.id
    };
  });

  // Meal completion mutation
  const completeMealMutation = useMutation({
    mutationFn: async (data: { mealType: string; legacyMealType: string; completed: boolean }) => {
      if (data.completed) {
        // Always save with new format
        return await apiRequest("/api/meal-logs", "POST", {
          mealType: data.mealType,
          logDate: today,
          notes: ""
        });
      } else {
        // Try deleting with new format first, then legacy format for backward compatibility
        try {
          const encodedMealType = encodeURIComponent(data.mealType);
          const encodedDate = encodeURIComponent(today);
          return await apiRequest(`/api/meal-logs/${encodedMealType}/${encodedDate}`, "DELETE");
        } catch (error) {
          // If new format fails, try legacy format
          const encodedLegacyType = encodeURIComponent(data.legacyMealType);
          const encodedDate = encodeURIComponent(today);
          return await apiRequest(`/api/meal-logs/${encodedLegacyType}/${encodedDate}`, "DELETE");
        }
      }
    },
    onSuccess: () => {
      // Use hierarchical query key for proper cache invalidation
      queryClient.invalidateQueries({ queryKey: ['/api/meal-logs', user?.id, today] });
    }
  });

  const handleMealToggle = (mealType: string, legacyMealType: string, currentlyCompleted: boolean) => {
    completeMealMutation.mutate({ mealType, legacyMealType, completed: !currentlyCompleted });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Inspiring Greeting Card */}
        <AnimatedCard className="mb-6 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-2" data-testid="text-greeting">
                  {getGreeting()}, {user?.firstName}! 🌟
                </h1>
                <p className="text-xl md:text-2xl opacity-90 mb-3" data-testid="text-quote">{dailyQuote}</p>
                <p className="text-sm opacity-75">Member of {orgData?.organizationName || "Your Organization"}</p>
              </div>
              <div className="flex gap-3">
                {workoutStreaks.current_streak > 0 && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="w-5 h-5" />
                      <p className="text-2xl font-bold">{workoutStreaks.current_streak}</p>
                    </div>
                    <p className="text-sm opacity-90">Day Streak</p>
                  </div>
                )}
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                  <p className="text-3xl font-bold mb-1">{todayProgress}%</p>
                  <p className="text-sm opacity-90">Today's Progress</p>
                </div>
              </div>
            </div>
            {workoutStreaks.current_streak > 0 && (
              <div className="mt-4 p-4 bg-white/20 backdrop-blur-sm rounded-lg">
                <p className="text-lg font-medium">🔥 You're on a {workoutStreaks.current_streak}-day streak! Keep it up!</p>
              </div>
            )}
          </CardContent>
        </AnimatedCard>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Habits Card */}
          <AnimatedCard className="lg:col-span-1">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span>Daily Habits</span>
                </CardTitle>
                <Dialog open={habitModalOpen} onOpenChange={setHabitModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" data-testid="button-add-habit">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Habit</DialogTitle>
                      <DialogDescription>
                        Create a new daily habit to track. Maximum 5 habits allowed.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="habit-name">Habit Name</Label>
                        <Input
                          id="habit-name"
                          placeholder="e.g., Drink 8 glasses of water"
                          value={newHabitName}
                          onChange={(e) => setNewHabitName(e.target.value)}
                          data-testid="input-habit-name"
                        />
                      </div>
                      <Button 
                        onClick={handleAddHabit} 
                        className="w-full"
                        disabled={!newHabitName.trim() || addHabitMutation.isPending}
                        data-testid="button-save-habit"
                      >
                        {addHabitMutation.isPending ? "Adding..." : "Add Habit"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {habitStreak.length > 0 ? (
                habitStreak.map((habit: any) => (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                    data-testid={`habit-${habit.id}`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <button
                        onClick={() => handleHabitToggle(habit.id, habit.completed)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          habit.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                        data-testid={`checkbox-habit-${habit.id}`}
                      >
                        {habit.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                      <div className="flex-1">
                        <p className={`font-medium ${habit.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {habit.habit}
                        </p>
                        {habit.streak > 0 && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-orange-500" />
                            {habit.streak} day streak
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteHabit(habit.id)}
                      data-testid={`button-delete-habit-${habit.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No habits yet</p>
                  <p className="text-xs mt-1">Click + to add your first habit</p>
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{habitsCompleted}/{totalHabits}</span>
                </div>
                <Progress 
                  value={totalHabits > 0 ? (habitsCompleted / totalHabits) * 100 : 0} 
                  className="h-2 mt-2" 
                />
              </div>
            </CardContent>
          </AnimatedCard>

          {/* Water Tracking Card - Modern Design with +/- Buttons */}
          <AnimatedCard className="lg:col-span-1 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-xl transition-all">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center space-x-2">
                  <Droplets className="w-6 h-6 text-blue-600" />
                  <span className="text-blue-900">Water Intake</span>
                </CardTitle>
                <Dialog open={waterSettingsOpen} onOpenChange={setWaterSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="border-blue-300" data-testid="button-water-settings">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Water Goal Settings</DialogTitle>
                      <DialogDescription>
                        Set your daily water intake goal (in glasses). Each glass is 250ml.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="water-goal">Daily Goal (glasses)</Label>
                        <Input
                          id="water-goal"
                          type="number"
                          min={1}
                          max={20}
                          value={newWaterGoal}
                          onChange={(e) => setNewWaterGoal(parseInt(e.target.value) || 8)}
                          data-testid="input-water-goal"
                        />
                      </div>
                      <Button 
                        onClick={handleUpdateWaterGoal} 
                        className="w-full"
                        disabled={updateWaterPrefsMutation.isPending}
                        data-testid="button-save-water-goal"
                      >
                        {updateWaterPrefsMutation.isPending ? "Saving..." : "Save Goal"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Large +/- Controls */}
              <div className="flex items-center justify-center gap-4 py-4">
                <Button 
                  onClick={handleWaterDecrement} 
                  size="lg"
                  variant="outline"
                  className="h-16 w-16 rounded-full border-2 border-blue-400 hover:bg-blue-100"
                  disabled={logWaterMutation.isPending || currentWater === 0}
                  data-testid="button-water-decrement"
                >
                  <Minus className="w-6 h-6 text-blue-600" />
                </Button>
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-600" data-testid="text-water-count">{currentWater}</div>
                  <p className="text-sm text-blue-700 mt-1">glasses</p>
                </div>
                <Button 
                  onClick={handleWaterIncrement} 
                  size="lg"
                  className="h-16 w-16 rounded-full bg-blue-600 hover:bg-blue-700"
                  disabled={logWaterMutation.isPending}
                  data-testid="button-water-increment"
                >
                  <Plus className="w-6 h-6 text-white" />
                </Button>
              </div>
              <div className="text-center">
                <p className="text-sm text-blue-700">Goal: {waterGoal} glasses</p>
                <Progress value={(currentWater / waterGoal) * 100} className="h-2 mt-2 bg-blue-100" />
              </div>
            </CardContent>
          </AnimatedCard>

          {/* Workout Streak Card */}
          <AnimatedCard className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span>Workout Streak</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">{workoutStreaks.current_streak}</p>
                  <p className="text-xs text-gray-500 mt-1">Current Streak</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{workoutStreaks.longest_streak}</p>
                  <p className="text-xs text-gray-500 mt-1">Longest Streak</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{workoutStreaks.total_workouts}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Workouts</p>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <p className="font-semibold text-sm">Keep it up!</p>
                </div>
                <p className="text-xs text-gray-600">
                  You've completed {workoutStreaks.total_workouts} workout{workoutStreaks.total_workouts !== 1 ? 's' : ''}. 
                  {workoutStreaks.current_streak > 0 
                    ? ` You're on a ${workoutStreaks.current_streak}-day streak!` 
                    : " Start today to build your streak!"
                  }
                </p>
              </div>
            </CardContent>
          </AnimatedCard>
        </div>

        {/* Today's Meals & Workouts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Today's Meals - Simplified with inline checkboxes */}
          <AnimatedCard className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200 hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Utensils className="w-6 h-6 text-green-600" />
                  <span className="text-green-900">Today's Meals</span>
                </div>
                <div className="flex items-center gap-2">
                  {assignedMealPlan && (
                    <>
                      <Badge variant="outline" className="text-xs border-green-300">
                        {assignedMealPlan.name}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewFullMealPlanOpen(true)}
                        className="text-xs h-7"
                        data-testid="button-view-full-meal-week"
                      >
                        View Full Week
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {todaysMeals.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {todaysMeals.map((meal: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-100 hover:border-green-300 transition-colors"
                        data-testid={`meal-${meal.mealType}`}
                      >
                        <button
                          onClick={() => handleMealToggle(meal.mealType, meal.legacyMealType, meal.completed)}
                          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            meal.completed
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                          data-testid={`checkbox-meal-${meal.mealType}`}
                        >
                          {meal.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>
                        <div className="flex-1">
                          <p className={`font-medium ${meal.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {meal.displayName || meal.name}
                          </p>
                          <p className="text-xs text-gray-500">{meal.displayType}</p>
                          {meal.macros && (
                            <div className="flex gap-3 mt-1 text-xs text-gray-500">
                              <span>P: {meal.macros.protein}g</span>
                              <span>C: {meal.macros.carbs}g</span>
                              <span>F: {meal.macros.fat}g</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-green-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-green-700">
                        {completedMeals}/{todaysMeals.length} completed
                      </span>
                    </div>
                    <Progress value={(completedMeals / todaysMeals.length) * 100} className="h-2 bg-green-100" />
                  </div>
                  <Link href="/org-track-meals">
                    <Button className="w-full bg-green-600 hover:bg-green-700" data-testid="button-track-meals">
                      <Utensils className="w-4 h-4 mr-2" />
                      Full Meal Tracking
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <Utensils className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
                  <p className="text-gray-500 font-medium">No meals planned for today</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {assignedMealPlan 
                      ? "Check back tomorrow for your next meal plan"
                      : "Contact your coach for a personalized meal plan"}
                  </p>
                </div>
              )}
            </CardContent>
          </AnimatedCard>

          {/* Today's Workout - Simplified with navigation */}
          <AnimatedCard className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Dumbbell className="w-6 h-6 text-purple-600" />
                  <span className="text-purple-900">Today's Workout</span>
                </div>
                <div className="flex items-center gap-2">
                  {assignedWorkoutPlan && (
                    <>
                      <Badge variant="outline" className="text-xs border-purple-300">
                        {assignedWorkoutPlan.name}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewFullWorkoutPlanOpen(true)}
                        className="text-xs h-7"
                        data-testid="button-view-full-workout-week"
                      >
                        View Full Week
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedWorkoutPlan ? (
                <>
                  {todaysWorkout ? (
                    <>
                      <div className="p-4 bg-white rounded-lg border border-purple-100">
                        <h3 className="font-bold text-lg text-purple-900 mb-3">{todaysWorkout.name}</h3>
                        <div className="space-y-2">
                          {(todaysWorkout.exercises || todaysWorkout.items)?.slice(0, 3).map((exercise: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                              <span className="text-gray-700">{exercise.name}</span>
                              <span className="text-gray-500 text-xs ml-auto">
                                {exercise.sets && exercise.reps ? `${exercise.sets}x${exercise.reps}` : ''}
                              </span>
                            </div>
                          ))}
                          {(todaysWorkout.exercises || todaysWorkout.items)?.length > 3 && (
                            <p className="text-xs text-gray-500 pl-4">
                              + {(todaysWorkout.exercises || todaysWorkout.items).length - 3} more exercises
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-100/50 rounded-lg">
                        <span className="text-sm text-purple-800">Total Exercises</span>
                        <span className="text-lg font-bold text-purple-900">
                          {(todaysWorkout.exercises || todaysWorkout.items)?.length || 0}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-white rounded-lg border border-purple-100 text-center">
                      <p className="text-gray-600 font-medium">🎉 Rest Day!</p>
                      <p className="text-sm text-gray-500 mt-1">Recovery is part of the process</p>
                    </div>
                  )}
                  <Link href="/org-track-workout">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700" data-testid="button-track-workout">
                      <Dumbbell className="w-4 h-4 mr-2" />
                      Log Today's Workout
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
                  <p className="text-gray-500 font-medium">No workout plan assigned yet</p>
                  <p className="text-sm text-gray-400 mt-2">Contact your coach for a personalized plan</p>
                </div>
              )}
            </CardContent>
          </AnimatedCard>
        </div>
      </div>

      {/* Full Week Viewer Modals */}
      <FullWeekMealPlanViewer
        open={viewFullMealPlanOpen}
        onOpenChange={setViewFullMealPlanOpen}
        planName={assignedMealPlan?.name || "Meal Plan"}
        planData={assignedMealPlan?.planData || []}
        dayMapping={assignedMealPlan?.dayMapping}
      />
      <FullWeekWorkoutPlanViewer
        open={viewFullWorkoutPlanOpen}
        onOpenChange={setViewFullWorkoutPlanOpen}
        planName={assignedWorkoutPlan?.name || "Workout Plan"}
        planData={assignedWorkoutPlan?.planData || []}
        dayMapping={assignedWorkoutPlan?.dayMapping}
      />
    </div>
  );
}
