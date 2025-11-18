import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, CheckCircle2, Activity, Dumbbell, Clock, Plus, Minus } from "lucide-react";
import { format } from "date-fns";

interface Exercise {
  name: string;
  sets: number | string; // Backend sends as string
  reps: string;
  rest_seconds?: number;
  notes?: string;
}

interface WorkoutLog {
  exercise: string;
  sets: Array<{
    reps: number;
    weight: number;
    completed: boolean;
  }>;
  notes: string;
  previousBest?: {
    weight: number;
    reps: number;
    date: string;
  } | null;
}

export default function OrgTrackWorkout() {
  const { user } = useAuth();
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch assigned workout plan
  const { data: assignedPlan, isLoading: isPlanLoading } = useQuery<{
    name?: string;
    dayMapping?: Record<string, string>;
    planData?: {
      days?: any[];
    };
  }>({
    queryKey: [`/api/organizations/${(user as any)?.organizationId}/assigned-workout-plan/${(user as any)?.id}`],
    enabled: !!(user as any)?.id && !!(user as any)?.organizationId,
  });

  // Fetch today's workout logs to restore progress on page refresh
  const { data: todaysWorkoutLogs } = useQuery<Array<{
    exercise_name: string;
    sets_data: any;
    workout_name: string;
    notes: string;
  }>>({
    queryKey: [`/api/workout-logs/${(user as any)?.id}/${today}`],
    enabled: !!(user as any)?.id,
  });

  // Save workout progress mutation (with PR tracking and streak updates)
  const saveProgressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      return apiRequest(`/api/workout-progress`, 'POST', progressData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-progress'] });
      queryClient.invalidateQueries({ queryKey: [`/api/workout-streaks`, (user as any)?.id] });
      queryClient.invalidateQueries({ queryKey: [`/api/workout-logs/${(user as any)?.id}/${today}`] });
    },
  });

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

  // Get today's workout from plan using dayMapping
  const todaysWorkout = getTodaysPlanDay(assignedPlan?.dayMapping, assignedPlan?.planData);

  const exercises: Exercise[] = todaysWorkout?.exercises || todaysWorkout?.items || [];

  // Load previous best for an exercise (copied from individual user track-workout.tsx)
  const loadPreviousBest = async (userId: string, exerciseName: string) => {
    try {
      const response = await fetch(`/api/workout-progress/${userId}/${encodeURIComponent(exerciseName)}/best`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.log('Error loading previous best:', error);
    }
    return null;
  };

  // Initialize workout logs with PR data and merge today's saved progress
  useEffect(() => {
    const initializeWorkout = async () => {
      if (exercises.length > 0 && workoutLogs.length === 0 && (user as any)?.id) {
        const userId = (user as any).id;
        
        // Load PRs for each exercise individually
        const logsWithPRs = await Promise.all(
          exercises.map(async (ex) => {
            const previousBest = await loadPreviousBest(userId, ex.name);
            
            // Check if there's saved progress for this exercise today
            const savedProgress = todaysWorkoutLogs?.find(log => log.exercise_name === ex.name);
            
            // If we have saved progress, restore it; otherwise create empty sets
            const sets = savedProgress?.sets_data 
              ? savedProgress.sets_data 
              : Array(parseInt(String(ex.sets))).fill(null).map(() => ({
                  reps: 0,
                  weight: 0,
                  completed: false,
                }));
            
            return {
              exercise: ex.name,
              sets,
              notes: savedProgress?.notes || '',
              previousBest,
            };
          })
        );
        
        setWorkoutLogs(logsWithPRs);
      }
    };
    
    initializeWorkout();
  }, [exercises, user, todaysWorkoutLogs]);

  const currentExercise = exercises[currentExerciseIndex];
  const currentLog = workoutLogs[currentExerciseIndex];

  // Get PR for current exercise from the workout log (now stored with each exercise)
  const currentExercisePR = currentLog?.previousBest || null;

  const updateSet = (exerciseIdx: number, setIdx: number, field: 'reps' | 'weight', value: number) => {
    const newLogs = [...workoutLogs];
    newLogs[exerciseIdx].sets[setIdx][field] = value;
    setWorkoutLogs(newLogs);
  };

  const toggleSetComplete = (exerciseIdx: number, setIdx: number) => {
    const newLogs = [...workoutLogs];
    newLogs[exerciseIdx].sets[setIdx].completed = !newLogs[exerciseIdx].sets[setIdx].completed;
    setWorkoutLogs(newLogs);
  };

  const handleSaveWorkout = async () => {
    const userId = (user as any)?.id;
    
    try {
      // Save each exercise with PR tracking (like individual users)
      for (const exerciseLog of workoutLogs) {
        const completedSets = exerciseLog.sets.filter(set => set.completed);
        
        if (completedSets.length > 0) {
          const bestWeight = Math.max(...completedSets.map(set => set.weight));
          const bestReps = Math.max(...completedSets.map(set => set.reps));
          const totalVolume = completedSets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
          
          const progressData = {
            user_id: userId,
            exercise_name: exerciseLog.exercise,
            workout_name: assignedPlan?.name,
            date: today,
            sets_data: exerciseLog.sets,
            best_weight: bestWeight,
            best_reps: bestReps,
            total_volume: totalVolume,
            notes: exerciseLog.notes || '',
          };
          
          // Use mutateAsync to properly queue and wait for each save
          await saveProgressMutation.mutateAsync(progressData);
        }
      }
    } catch (error) {
      console.error('Failed to save workout:', error);
    }
  };

  const completedSets = currentLog?.sets.filter(s => s.completed).length || 0;
  const totalSets = currentLog?.sets.length || 0;
  const progress = (completedSets / totalSets) * 100;

  if (isPlanLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-pulse">
                <Dumbbell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Loading your workout plan...</p>
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
              <Dumbbell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Workout Plan Assigned</h3>
              <p className="text-gray-600">Contact your coach to get a personalized workout plan</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!todaysWorkout) {
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
              <Activity className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Rest Day</h3>
              <p className="text-gray-600">No workout scheduled for today. Enjoy your recovery!</p>
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
          <h1 className="text-3xl font-bold mb-2">{assignedPlan.name}</h1>
          <p className="text-gray-600">Today's Workout - {format(new Date(), 'EEEE, MMMM d')}</p>
        </div>

        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Workout Progress</span>
                <Badge variant="outline">
                  {currentExerciseIndex + 1} of {exercises.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exercises.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{ex.name}</p>
                      <p className="text-sm text-gray-600">{ex.sets} sets × {ex.reps} reps</p>
                    </div>
                    {workoutLogs[idx] && (
                      <Badge variant={workoutLogs[idx].sets.every(s => s.completed) ? "default" : "outline"}>
                        {workoutLogs[idx].sets.filter(s => s.completed).length}/{workoutLogs[idx].sets.length}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {currentExercise && currentLog && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{currentExercise.name}</span>
                  {currentExercise.rest_seconds && (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {currentExercise.rest_seconds}s rest
                    </Badge>
                  )}
                </CardTitle>
                <Progress value={progress} className="mt-4" />
                <p className="text-sm text-gray-600 mt-2">
                  {completedSets === totalSets && totalSets > 0 
                    ? `All ${totalSets} set${totalSets > 1 ? 's' : ''} completed! 🎉`
                    : `Progress: ${completedSets}/${totalSets} sets completed`
                  }
                </p>
              </CardHeader>
              <CardContent>
                {/* Display Previous PR */}
                {currentExercisePR && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                    <p className="text-sm font-semibold text-amber-900 mb-1">💪 Previous Best</p>
                    <p className="text-lg font-bold text-amber-800">
                      {currentExercisePR.weight} kg × {currentExercisePR.reps} reps
                    </p>
                  </div>
                )}
                <div className="space-y-4">
                  {currentLog.sets.map((set, setIdx) => (
                    <div key={setIdx} className={`p-4 rounded-lg border-2 ${
                      set.completed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Set {setIdx + 1}</h4>
                        <Button
                          variant={set.completed ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSetComplete(currentExerciseIndex, setIdx)}
                          data-testid={`button-complete-set-${setIdx}`}
                        >
                          {set.completed ? <CheckCircle2 className="w-4 h-4" /> : "Complete"}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Reps</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateSet(currentExerciseIndex, setIdx, 'reps', Math.max(0, set.reps - 1))}
                              data-testid={`button-decrease-reps-${setIdx}`}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              value={set.reps}
                              onChange={(e) => updateSet(currentExerciseIndex, setIdx, 'reps', parseInt(e.target.value) || 0)}
                              className="w-20 text-center"
                              data-testid={`input-reps-${setIdx}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateSet(currentExerciseIndex, setIdx, 'reps', set.reps + 1)}
                              data-testid={`button-increase-reps-${setIdx}`}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm">Weight (kg)</Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateSet(currentExerciseIndex, setIdx, 'weight', Math.max(0, set.weight - 2.5))}
                              data-testid={`button-decrease-weight-${setIdx}`}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              step="0.5"
                              value={set.weight}
                              onChange={(e) => updateSet(currentExerciseIndex, setIdx, 'weight', parseFloat(e.target.value) || 0)}
                              className="w-20 text-center"
                              data-testid={`input-weight-${setIdx}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateSet(currentExerciseIndex, setIdx, 'weight', set.weight + 2.5)}
                              data-testid={`button-increase-weight-${setIdx}`}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
                    disabled={currentExerciseIndex === 0}
                    className="flex-1"
                    data-testid="button-previous-exercise"
                  >
                    Previous Exercise
                  </Button>
                  <Button
                    onClick={() => setCurrentExerciseIndex(Math.min(exercises.length - 1, currentExerciseIndex + 1))}
                    disabled={currentExerciseIndex === exercises.length - 1}
                    className="flex-1"
                    data-testid="button-next-exercise"
                  >
                    Next Exercise
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleSaveWorkout}
            className="flex-1"
            size="lg"
            disabled={saveProgressMutation.isPending}
            data-testid="button-save-workout"
          >
            {saveProgressMutation.isPending ? 'Saving...' : 'Save Workout Progress'}
          </Button>
        </div>
      </div>
    </div>
  );
}
