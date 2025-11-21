import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Target, Heart, Utensils, Calendar, TrendingUp, 
  Camera, Plus, CheckCircle2, Star, Award, Zap,
  Activity, Apple, Droplets, Moon, Sun, Sparkles, Brain, Pill, Trash2, Settings, RotateCcw
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { WaterMeter } from "@/components/ui/water-meter";
import SubscriptionStatusCard from "@/components/subscription-status-card";
import { useAuth } from "@/hooks/useAuth";
import { useMealPlan } from "@/hooks/useMealPlan";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { loadExistingWorkoutPlan } from "@/lib/workoutPlanApi";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/1_1753425387748.png";
import heroImage from "@assets/img 1_1753421307951.jpg";
import { ProfileCompletionAlert } from "@/components/ProfileCompletionAlert";

// Motivational quotes array
const MOTIVATIONAL_QUOTES = [
  "Every healthy choice you make today is an investment in tomorrow's stronger, happier you!",
  "Your body is a reflection of your lifestyle. Make it a masterpiece!",
  "Success is the sum of small efforts repeated day in and day out.",
  "The only bad workout is the one that didn't happen.",
  "You don't have to be great to start, but you have to start to be great.",
  "Take care of your body. It's the only place you have to live.",
  "Fitness is not about being better than someone else. It's about being better than you used to be.",
  "The groundwork for all happiness is good health.",
  "Your health is an investment, not an expense.",
  "Don't wait for the perfect moment. Take the moment and make it perfect.",
  "Small progress is still progress. Keep going!",
  "You are one workout away from a good mood.",
  "Strive for progress, not perfection.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "The secret of getting ahead is getting started.",
  "Don't count the days. Make the days count.",
  "It's not about having time. It's about making time.",
  "You're stronger than you think. Believe in yourself!",
  "The only way to finish is to start.",
  "Health is not valued until sickness comes.",
  "A journey of a thousand miles begins with a single step.",
  "Your health account, your bank account, they're the same thing. The more you put in, the more you can take out.",
  "Motivation is what gets you started. Habit is what keeps you going.",
  "The difference between try and triumph is a little umph.",
  "Success starts with self-discipline.",
  "Every accomplishment starts with the decision to try.",
  "The body achieves what the mind believes.",
  "Wake up with determination. Go to bed with satisfaction.",
  "You are what you eat, so don't be fast, cheap, easy, or fake.",
  "Eat well, train dirty, live clean.",
  "Discipline is doing what needs to be done, even when you don't want to do it.",
  "Your future self will thank you for the choices you make today.",
  "The greatest wealth is health.",
  "Fitness is like a relationship. You can't cheat and expect it to work.",
  "Don't wish for it, work for it.",
  "Sweat is fat crying.",
  "The only person you should try to be better than is the person you were yesterday.",
  "Make yourself a priority once in a while. It's not selfish, it's necessary.",
  "Good things come to those who sweat.",
  "Your health is what you make of it. Everything you do and think either adds to the vitality or takes from it.",
  "Physical fitness is the first requisite of happiness.",
  "Those who think they have no time for healthy eating will sooner or later have to find time for illness.",
  "A healthy outside starts from the inside.",
  "The food you eat can be either the safest and most powerful form of medicine or the slowest form of poison.",
  "If you keep good food in your fridge, you will eat good food.",
  "Your diet is a bank account. Good food choices are good investments.",
  "Eat breakfast like a king, lunch like a prince, and dinner like a pauper.",
  "Let food be thy medicine and medicine be thy food.",
  "The only bad workout is the one you didn't do.",
  "You can't out-exercise a bad diet.",
  "Strong people don't put others down. They lift them up.",
  "Your limitation—it's only your imagination.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Dream bigger. Do bigger.",
  "Don't stop when you're tired. Stop when you're done.",
  "Be stronger than your strongest excuse."
];

export default function UserHome() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [workoutStreaks, setWorkoutStreaks] = useState({ current_streak: 0, longest_streak: 0, total_workouts: 0 });
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [waterSettingsOpen, setWaterSettingsOpen] = useState(false);
  const [newWaterGoal, setNewWaterGoal] = useState(8);
  const { toast } = useToast();
  
  // Select a random motivational quote
  const [dailyQuote] = useState(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[randomIndex];
  });
  
  // Get real meal plan data
  const {
    plan,
    isLoading: mealPlanLoading,
    progress,
    toggleMealCompletion,
  } = useMealPlan((user as any)?.id || '');

  // Load workout plan and streaks
  useEffect(() => {
    const loadWorkout = async () => {
      try {
        const userId = (user as any)?.id || 'demo_user_1';
        console.log('Loading workout plan for user:', userId);
        const stored = await loadExistingWorkoutPlan(userId);
        console.log('Loaded workout plan:', stored);
        setWorkoutPlan(stored);

        // Load workout streaks
        const streakResponse = await fetch(`/api/workout-streaks/${userId}`);
        if (streakResponse.ok) {
          const streakData = await streakResponse.json();
          setWorkoutStreaks(streakData);
        }
      } catch (error) {
        console.log('No workout plan found:', error);
      }
    };
    if (user) {
      loadWorkout();
    }
  }, [user]);
  
  const today = new Date().toISOString().split('T')[0];
  const currentDayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Get real habit data
  const { data: habits = [] } = useQuery({
    queryKey: ["/api/habits"],
    retry: false,
  });

  const { data: habitLogs = [] } = useQuery({
    queryKey: [`/api/habit-logs?date=${today}`],
    retry: false,
  });

  // Get user preferences for water tracking
  const { data: userPrefs } = useQuery<{ waterDailyGoalGlasses: number }>({
    queryKey: ["/api/user-preferences"],
    retry: false,
  });

  const waterGoal = userPrefs?.waterDailyGoalGlasses || 8;
  const WATER_GLASS_SIZE_ML = 250; // FIXED: glass size is always 250ml

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
      setNewHabitName("");
      setHabitModalOpen(false);
      toast({ title: "Habit added successfully!" });
    }
  });

  // Delete habit mutation
  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      return await apiRequest(`/api/habits/${habitId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({ title: "Habit deleted successfully!" });
    }
  });

  // Update water preferences mutation
  const updateWaterPrefsMutation = useMutation({
    mutationFn: async (waterDailyGoalGlasses: number) => {
      return await apiRequest("/api/user-preferences", "PUT", {
        waterDailyGoalGlasses
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
      setWaterSettingsOpen(false);
      toast({ title: "Water goal updated successfully!" });
    }
  });

  // Get today's workout based on current day of week
  const getTodaysWorkout = () => {
    if (!workoutPlan || !workoutPlan.days) return null;
    
    // Find workout for today based on cycling through available workout days
    const workoutDays = workoutPlan.days.length;
    const daysSinceMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Monday = 0, Sunday = 6
    const workoutDayIndex = (daysSinceMonday % workoutDays);
    
    // Check if today is a workout day based on days_per_week
    const daysPerWeek = workoutPlan.days_per_week || workoutDays;
    const isWorkoutDay = daysSinceMonday < daysPerWeek;
    
    if (!isWorkoutDay) return null;
    
    return workoutPlan.days[workoutDayIndex];
  };

  const todaysWorkout = getTodaysWorkout();

  // Get today's plan and meals
  const todayPlan = plan?.days.find(d => d.date === today);
  
  // Calculate habits completed today
  const habitsCompleted = (habitLogs as any[] || []).filter((log: any) => log.completed).length;
  const totalHabits = (habits as any[] || []).length;
  
  // Calculate today's stats from real data
  const todayStats = {
    calories: { 
      consumed: todayPlan?.meals.filter(m => m.completed)
        .reduce((sum, m) => sum + (m.macros?.protein * 4 + m.macros?.carbs * 4 + m.macros?.fat * 9 || 0), 0) || 0,
      target: todayPlan?.meals.reduce((sum, m) => sum + (m.macros?.protein * 4 + m.macros?.carbs * 4 + m.macros?.fat * 9 || m.calories || 0), 0) || 2000
    },
    water: { consumed: (waterData as any)?.glasses || 0, target: waterGoal },
    habits: { completed: habitsCompleted, target: totalHabits }
  };

  // Get today's meals from real meal plan
  const todayMeals = todayPlan?.meals.map(meal => ({
    time: meal.slot.charAt(0).toUpperCase() + meal.slot.slice(1),
    meal: meal.title || `${meal.slot} meal`,
    calories: Math.round(meal.macros?.protein * 4 + meal.macros?.carbs * 4 + meal.macros?.fat * 9 || meal.calories || 0),
    completed: meal.completed || false,
    id: `${meal.slot}-${today}`,
    slot: meal.slot
  })) || [];

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

  const handleMealToggle = (slot: string) => {
    toggleMealCompletion(today, slot as any);
  };

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! ☀️";
    if (hour < 18) return "Good afternoon! 🌤️";
    return "Good evening! 🌙";
  };

  // Calculate real progress indicators
  const goalsAchievedToday = habitsCompleted + (todayMeals.filter(m => m.completed).length) + (todayStats.water.consumed >= todayStats.water.target ? 1 : 0);
  const totalGoalsToday = totalHabits + todayMeals.length + 1; // habits + meals + water goal
  const todayProgress = totalGoalsToday > 0 ? Math.round((goalsAchievedToday / totalGoalsToday) * 100) : 0;
  const journeyDays = workoutStreaks.total_workouts > 0 ? workoutStreaks.total_workouts : 1; // Use total workouts as journey metric

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <ProfileCompletionAlert />
        
        {/* User Welcome Header */}
        <div className="relative rounded-3xl overflow-hidden mb-8" style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/80 to-blue-600/80"></div>
          <div className="relative z-10 p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                  <img 
                    src={logoImage} 
                    alt="User"
                    className="w-16 h-16 object-cover rounded-full"
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    {getGreeting()}
                  </h1>
                  <p className="text-xl opacity-90">Ready to crush your nutrition goals today?</p>
                  <div className="flex items-center space-x-4 mt-3">
                    <Badge className="bg-white/20 text-white border-white/30">
                      <Heart className="w-4 h-4 mr-1" />
                      Day {journeyDays} Journey
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30">
                      <Award className="w-4 h-4 mr-1" />
                      {goalsAchievedToday} Goals Achieved
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                  <div className="text-3xl font-bold">{todayProgress}%</div>
                  <div className="text-sm opacity-90">Today's Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Health Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <AnimatedCard className="bg-white border-green-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-gray-600 text-xs">Calories</p>
                <p className="text-lg font-bold text-green-600">
                  {todayStats.calories.consumed}/{todayStats.calories.target}
                </p>
              </div>
              <Apple className="w-6 h-6 text-green-500" />
            </div>
            <Progress value={(todayStats.calories.consumed / todayStats.calories.target) * 100} className="h-1" />
          </AnimatedCard>

          <AnimatedCard className="bg-white border-blue-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-gray-600 text-xs">Water</p>
                <p className="text-lg font-bold text-blue-600">
                  {todayStats.water.consumed}/{todayStats.water.target}
                </p>
              </div>
              <Droplets className="w-6 h-6 text-blue-500" />
            </div>
            <Progress value={(todayStats.water.consumed / todayStats.water.target) * 100} className="h-1" />
          </AnimatedCard>

          <AnimatedCard className="bg-white border-purple-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-gray-600 text-xs">Habits</p>
                <p className="text-lg font-bold text-purple-600">
                  {todayStats.habits.completed}/{todayStats.habits.target}
                </p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-purple-500" />
            </div>
            <Progress value={todayStats.habits.target > 0 ? (todayStats.habits.completed / todayStats.habits.target) * 100 : 0} className="h-1" />
          </AnimatedCard>

          <AnimatedCard className="bg-white border-orange-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-gray-600 text-xs">Workout Streak</p>
                <p className="text-lg font-bold text-orange-600">
                  {workoutStreaks.current_streak} days
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500">Best: {workoutStreaks.longest_streak} days</p>
          </AnimatedCard>
        </div>

        {/* Subscription Status Card */}
        <div className="mt-4">
          <SubscriptionStatusCard />
        </div>

        {/* Main Content - Clean 2 Column Layout for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Today's Meals */}
          <div>
            <Card className="bg-white border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-gray-800 flex items-center">
                  <Utensils className="w-5 h-5 mr-2 text-green-500" />
                  Today's Meal Plan
                </CardTitle>
                <Link href="/recipes">
                  <Button size="sm" className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white">
                    <Utensils className="w-4 h-4 mr-1" />
                    Search Recipes
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {todayMeals.length > 0 ? (
                  <div className="space-y-4">
                    {todayMeals.map((meal, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            meal.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {meal.completed ? <CheckCircle2 className="w-6 h-6" /> : <Utensils className="w-6 h-6" />}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{meal.time}</h4>
                            <p className="text-sm text-gray-600">{meal.meal}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={meal.completed ? "default" : "outline"} className="mb-2">
                            {meal.calories} cal
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className={meal.completed ? "text-green-600" : "text-gray-400 hover:text-green-600"}
                            onClick={() => handleMealToggle(meal.slot)}
                          >
                            {meal.completed ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Link href="/meal-plan">
                      <Button variant="outline" className="w-full mt-2 border-green-200 text-green-700 hover:bg-green-50">
                        View Full Meal Plan
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Meal Plan Yet</h3>
                    <p className="text-gray-500 mb-4">Generate your personalized AI meal plan to get started!</p>
                    <Link href="/meal-plan">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Meal Plan
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Today's Workout & Plan */}
          <div className="space-y-4">
            {/* Today's Workout Widget */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-purple-500" />
                  Today's Workout
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaysWorkout ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-800">{todaysWorkout.name}</h3>
                      <p className="text-sm text-gray-600">
                        {todaysWorkout.items?.length || 0} exercises
                      </p>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {todaysWorkout.items?.slice(0, 3).map((exercise: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
                          <span className="font-medium text-gray-700">{exercise.exercise}</span>
                          <span className="text-gray-500">{exercise.sets}×{exercise.reps}</span>
                        </div>
                      ))}
                      {todaysWorkout.items?.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{todaysWorkout.items.length - 3} more exercises
                        </p>
                      )}
                    </div>
                    <Link href={`/track-workout?day=${encodeURIComponent(todaysWorkout.name)}`}>
                      <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                        Start Workout
                      </Button>
                    </Link>
                  </div>
                ) : workoutPlan ? (
                  <div className="text-center py-4">
                    <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">Rest day today</p>
                    <Link href="/workouts">
                      <Button size="sm" variant="outline" className="w-full">
                        View Full Plan
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">No workout plan yet</p>
                    <Link href="/workouts">
                      <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                        Generate Plan
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workout Plan Summary Widget */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-500" />
                  Workout Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workoutPlan ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-gray-800">{String(workoutPlan.name || 'Workout Plan')}</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {String(workoutPlan.goal || 'fitness')} • {String(workoutPlan.weeks || 8)} weeks
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{String(workoutPlan.days_per_week || 4)} days/week</span>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        {String(workoutPlan.split || 'auto')}
                      </Badge>
                    </div>
                    <Link href="/workouts">
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                        View Full Plan
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Target className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">No workout plan yet</p>
                    <Link href="/workouts">
                      <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                        Generate Plan
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Bottom Section - Habits, Water, and Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-start">
          {/* Daily Habits */}
          <div>
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 mr-2 text-orange-500" />
                    Daily Habits
                  </div>
                  <Dialog open={habitModalOpen} onOpenChange={setHabitModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8" data-testid="button-manage-habits">
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Manage Habits</DialogTitle>
                        <DialogDescription>
                          Add new habits or manage existing ones to track your daily progress.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="habit-name">New Habit</Label>
                          <div className="flex gap-2">
                            <Input
                              id="habit-name"
                              placeholder="e.g., Drink 8 glasses of water"
                              value={newHabitName}
                              onChange={(e) => setNewHabitName(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && newHabitName.trim()) {
                                  addHabitMutation.mutate(newHabitName.trim());
                                }
                              }}
                              data-testid="input-habit-name"
                            />
                            <Button 
                              onClick={() => newHabitName.trim() && addHabitMutation.mutate(newHabitName.trim())}
                              disabled={!newHabitName.trim() || addHabitMutation.isPending}
                              data-testid="button-add-habit"
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium mb-2">Your Habits</h4>
                          {habitStreak.length > 0 ? (
                            <div className="space-y-2">
                              {habitStreak.map((habit) => (
                                <div key={habit.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                                  <div>
                                    <p className="text-sm font-medium">{habit.habit}</p>
                                    <p className="text-xs text-gray-500">{habit.streak} day streak</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => deleteHabitMutation.mutate(habit.id)}
                                    disabled={deleteHabitMutation.isPending}
                                    data-testid={`button-delete-habit-${habit.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No habits yet. Add one above!</p>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {habitStreak.length > 0 ? (
                  <div className="space-y-3">
                    {habitStreak.map((habit, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          habit.completed 
                            ? 'bg-green-50 border-green-300 hover:bg-green-100' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => logHabitMutation.mutate({ habitId: habit.id, completed: !habit.completed })}
                        data-testid={`habit-row-${habit.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            habit.completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                          }`}>
                            {habit.completed ? <CheckCircle2 className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{habit.habit}</p>
                            <p className="text-xs text-gray-600">{habit.streak} day streak</p>
                          </div>
                        </div>
                        <Badge 
                          variant={habit.completed ? "default" : "secondary"} 
                          className={`text-xs font-semibold ${
                            habit.completed ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        >
                          {habit.completed ? '✓ Done' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Target className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm mb-2">No habits tracked yet</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setHabitModalOpen(true)}
                      data-testid="button-add-first-habit"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Your First Habit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Water Tracking */}
          <div>
            <Card className="bg-white border-blue-200">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplets className="w-5 h-5 mr-2 text-blue-500" />
                    Daily Water Tracking
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-gray-600">
                      {WATER_GLASS_SIZE_ML}ml per glass
                    </span>
                    <Dialog open={waterSettingsOpen} onOpenChange={setWaterSettingsOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                          onClick={() => {
                            setNewWaterGoal(waterGoal);
                            setWaterSettingsOpen(true);
                          }}
                          data-testid="button-water-settings"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Water Tracking Settings</DialogTitle>
                          <DialogDescription>
                            Set your daily water intake goal. Glass size is fixed at {WATER_GLASS_SIZE_ML}ml.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="waterGoal">Daily Water Goal (glasses)</Label>
                            <p className="text-xs text-gray-500">Each glass is {WATER_GLASS_SIZE_ML}ml</p>
                            <Input
                              id="waterGoal"
                              type="number"
                              min="1"
                              max="20"
                              value={newWaterGoal}
                              onChange={(e) => setNewWaterGoal(parseInt(e.target.value) || 1)}
                              data-testid="input-water-goal"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setWaterSettingsOpen(false)}
                              data-testid="button-cancel-water-settings"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => updateWaterPrefsMutation.mutate(newWaterGoal)}
                              disabled={updateWaterPrefsMutation.isPending}
                              data-testid="button-save-water-settings"
                            >
                              Save Goal
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <WaterMeter 
                  currentIntake={(todayStats.water.consumed * WATER_GLASS_SIZE_ML / 1000)} 
                  targetIntake={(todayStats.water.target * WATER_GLASS_SIZE_ML / 1000)} 
                  unit="L"
                  showCelebration={todayStats.water.consumed >= todayStats.water.target}
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {todayStats.water.consumed} / {todayStats.water.target} glasses
                  </span>
                  <span className="font-medium text-blue-600">
                    {((todayStats.water.consumed / todayStats.water.target) * 100).toFixed(0)}%
                  </span>
                </div>
                {todayStats.water.consumed >= todayStats.water.target ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="text-sm font-medium text-green-700">Goal Achieved! 🎉</p>
                    <p className="text-xs text-green-600">Great hydration today!</p>
                  </div>
                ) : (
                  <Button 
                    onClick={() => logWaterMutation.mutate(1)}
                    disabled={logWaterMutation.isPending}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    data-testid="button-log-water"
                  >
                    <Droplets className="w-4 h-4 mr-2" />
                    Log Water Glass (+{WATER_GLASS_SIZE_ML}ml)
                  </Button>
                )}
                {/* Reset Water Log Button */}
                {todayStats.water.consumed > 0 && (
                  <Button
                    onClick={() => resetWaterMutation.mutate()}
                    disabled={resetWaterMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="w-full text-gray-600 hover:text-red-600 hover:border-red-500"
                    data-testid="button-reset-water"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Today's Water Log
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Workout Progress Summary */}
          <div>
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-orange-500" />
                    Workout Progress
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{workoutStreaks.current_streak}</p>
                    <p className="text-xs text-orange-700">Current Streak</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{workoutStreaks.longest_streak}</p>
                    <p className="text-xs text-blue-700">Best Streak</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{workoutStreaks.total_workouts}</p>
                    <p className="text-xs text-green-700">Total Workouts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Motivation */}
          <div>
            <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <h4 className="font-bold text-sm">Daily Motivation</h4>
                </div>
                <p className="text-sm opacity-90 italic">
                  "{dailyQuote}"
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}