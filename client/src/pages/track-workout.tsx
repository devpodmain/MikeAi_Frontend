import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/hooks/useAuth";
import { loadExistingWorkoutPlan } from "@/lib/workoutPlanApi";
import {
  ArrowLeft, Play, Plus, Minus, Weight, Clock, CheckCircle2,
  TrendingUp, Save, RotateCcw
} from "lucide-react";

interface Exercise {
  exercise: string;
  sets: number;
  reps: string;
  rest_seconds?: number;
  restSec?: number;
  video_url?: string;
}

interface WorkoutSession {
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
  };
  targetSets?: number;
  targetReps?: string;
}

export default function TrackWorkout() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [todaysWorkout, setTodaysWorkout] = useState<any>(null);
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isRestTimer, setIsRestTimer] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [workoutStreak, setWorkoutStreak] = useState({ current: 0, longest: 0 });
  const [totalWorkouts, setTotalWorkouts] = useState(0);

  // Get URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const dayParam = urlParams.get('day');

  useEffect(() => {
    const loadWorkout = async () => {
      try {
        const userId = (user as any)?.id || 'demo_user_1';
        const stored = await loadExistingWorkoutPlan(userId);
        setWorkoutPlan(stored);

        // Load workout streaks
        await loadWorkoutStreaks(userId);

        // Find today's workout
        if (stored && stored.days) {
          const currentDayOfWeek = new Date().getDay();
          const workoutDays = stored.days.length;
          const daysSinceMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
          const workoutDayIndex = (daysSinceMonday % workoutDays);
          
          const todayWorkout = stored.days[workoutDayIndex];
          setTodaysWorkout(todayWorkout);

          // Initialize workout session with previous progress
          if (todayWorkout?.items) {
            const session = await Promise.all(
              todayWorkout.items.map(async (exercise: Exercise) => {
                const previousBest = await loadPreviousBest(userId, exercise.exercise);
                return {
                  exercise: exercise.exercise,
                  sets: Array.from({ length: exercise.sets }, () => ({
                    reps: 0,
                    weight: 0,
                    completed: false
                  })),
                  notes: '',
                  previousBest,
                  targetSets: exercise.sets,
                  targetReps: exercise.reps
                };
              })
            );
            setWorkoutSession(session);
          }
        }
      } catch (error) {
        console.log('Error loading workout:', error);
      }
    };

    loadWorkout();
  }, [user]);

  const loadWorkoutStreaks = async (userId: string) => {
    try {
      const response = await fetch(`/api/workout-streaks/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkoutStreak({ current: data.current_streak, longest: data.longest_streak });
        setTotalWorkouts(data.total_workouts);
      }
    } catch (error) {
      console.log('Error loading streaks:', error);
    }
  };

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

  const startRestTimer = (seconds: number) => {
    setRestTime(seconds);
    setIsRestTimer(true);
    const timer = setInterval(() => {
      setRestTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRestTimer(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setWorkoutSession(prev => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex][field] = value;
      return updated;
    });
  };

  const toggleSetCompleted = (exerciseIndex: number, setIndex: number) => {
    setWorkoutSession(prev => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex].completed = !updated[exerciseIndex].sets[setIndex].completed;
      return updated;
    });

    // Start rest timer if set is completed
    if (!workoutSession[exerciseIndex].sets[setIndex].completed && todaysWorkout?.items[exerciseIndex]) {
      const restSeconds = todaysWorkout.items[exerciseIndex].rest_seconds || todaysWorkout.items[exerciseIndex].restSec || 60;
      startRestTimer(restSeconds);
    }
  };

  const nextExercise = async () => {
    if (currentExerciseIndex < workoutSession.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      setWorkoutCompleted(true);
      await saveWorkoutProgress(true);
    }
  };

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  const saveWorkoutProgress = async (isCompleted = false) => {
    try {
      const userId = (user as any)?.id || 'demo_user_1';
      const today = new Date().toISOString().split('T')[0];
      
      // Save individual exercise progress
      for (const exercise of workoutSession) {
        const completedSets = exercise.sets.filter(set => set.completed);
        if (completedSets.length > 0) {
          const bestWeight = Math.max(...completedSets.map(set => set.weight));
          const bestReps = Math.max(...completedSets.map(set => set.reps));
          const totalVolume = completedSets.reduce((sum, set) => sum + (set.weight * set.reps), 0);

          await fetch('/api/workout-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              exercise_name: exercise.exercise,
              workout_name: todaysWorkout?.name,
              date: today,
              sets_data: exercise.sets,
              best_weight: bestWeight,
              best_reps: bestReps,
              total_volume: totalVolume,
              notes: exercise.notes
            })
          });
        }
      }

      // Update workout streaks if completed
      if (isCompleted) {
        await fetch('/api/workout-streaks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            workout_date: today
          })
        });
        
        // Reload streak data
        await loadWorkoutStreaks(userId);
      }

      // Save to localStorage as backup
      const workoutData = {
        date: today,
        workoutName: todaysWorkout?.name,
        session: workoutSession,
        completed: isCompleted
      };
      
      localStorage.setItem(`workout_session_${userId}`, JSON.stringify(workoutData));
    } catch (error) {
      console.log('Error saving progress:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!todaysWorkout) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">No Workout Found</h1>
            <p className="text-gray-600 mb-6">No workout scheduled for today.</p>
            <Link to="/workouts">
              <Button>View Workout Plans</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentExercise = workoutSession[currentExerciseIndex];
  const currentExerciseData = todaysWorkout.items[currentExerciseIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{todaysWorkout.name}</h1>
              <p className="text-gray-600">Exercise {currentExerciseIndex + 1} of {workoutSession.length}</p>
            </div>
          </div>
          
          {workoutStarted && !workoutCompleted && (
            <Button onClick={() => saveWorkoutProgress()} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save Progress
            </Button>
          )}
        </div>

        {!workoutStarted ? (
          /* Pre-workout Overview */
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Play className="w-5 h-5 mr-2 text-green-500" />
                  Ready to Start Your Workout?
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1 text-orange-500" />
                    <span>{workoutStreak.current} day streak</span>
                  </div>
                  <div className="flex items-center">
                    <Weight className="w-4 h-4 mr-1 text-blue-500" />
                    <span>{totalWorkouts} total</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Weight className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="font-medium">{todaysWorkout.items?.length} Exercises</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-medium">~45 Minutes</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <p className="font-medium">{todaysWorkout.goal || 'Strength'}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-800">Today's Exercises:</h3>
                  {todaysWorkout.items?.map((exercise: Exercise, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <span className="font-medium">{exercise.exercise}</span>
                      <Badge variant="outline">{exercise.sets} × {exercise.reps}</Badge>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => setWorkoutStarted(true)} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Workout
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : workoutCompleted ? (
          /* Workout Complete */
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Workout Completed!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-gray-600">Great job completing your {todaysWorkout.name} workout!</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {workoutSession.reduce((total, ex) => total + ex.sets.filter(s => s.completed).length, 0)}
                    </p>
                    <p className="text-sm text-green-700">Sets Completed</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{workoutSession.length}</p>
                    <p className="text-sm text-blue-700">Exercises Done</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Link to="/" className="flex-1">
                    <Button className="w-full">Back to Dashboard</Button>
                  </Link>
                  <Link to="/workouts" className="flex-1">
                    <Button variant="outline" className="w-full">View Plans</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Active Workout */
          <>
            {/* Rest Timer */}
            {isRestTimer && (
              <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardContent className="p-6 text-center">
                  <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-blue-800 mb-2">Rest Time</h3>
                  <p className="text-3xl font-bold text-blue-600">{formatTime(restTime)}</p>
                  <p className="text-blue-700 mt-2">Take a breather, you've earned it!</p>
                </CardContent>
              </Card>
            )}

            {/* Current Exercise */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{currentExercise?.exercise}</span>
                  <Badge variant="outline">
                    {currentExerciseIndex + 1} / {workoutSession.length}
                  </Badge>
                </CardTitle>
                
                {/* Target and Previous Best Info */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Target</h4>
                    <p className="text-lg font-bold text-blue-600">
                      {currentExercise?.targetSets} × {currentExercise?.targetReps}
                    </p>
                  </div>
                  
                  {currentExercise?.previousBest && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="text-sm font-medium text-green-800 mb-1">Previous Best</h4>
                      <p className="text-lg font-bold text-green-600">
                        {currentExercise.previousBest.weight}kg × {currentExercise.previousBest.reps}
                      </p>
                      <p className="text-xs text-green-700">{currentExercise.previousBest.date}</p>
                    </div>
                  )}
                </div>
                
                {currentExerciseData?.video_url && (
                  <div className="mt-3">
                    <Button variant="outline" size="sm" asChild>
                      <a href={currentExerciseData.video_url} target="_blank" rel="noopener noreferrer">
                        <Play className="w-4 h-4 mr-2" />
                        Watch Form Video
                      </a>
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentExercise?.sets.map((set, setIndex) => (
                    <div key={setIndex} className={`p-4 rounded-lg border-2 ${
                      set.completed ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Set {setIndex + 1}</h4>
                        <Button
                          variant={set.completed ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSetCompleted(currentExerciseIndex, setIndex)}
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
                              onClick={() => updateSet(currentExerciseIndex, setIndex, 'reps', Math.max(0, set.reps - 1))}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              value={set.reps}
                              onChange={(e) => updateSet(currentExerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                              className="w-20 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateSet(currentExerciseIndex, setIndex, 'reps', set.reps + 1)}
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
                              onClick={() => updateSet(currentExerciseIndex, setIndex, 'weight', Math.max(0, set.weight - 2.5))}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              step="0.5"
                              value={set.weight}
                              onChange={(e) => updateSet(currentExerciseIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                              className="w-20 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateSet(currentExerciseIndex, setIndex, 'weight', set.weight + 2.5)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={previousExercise}
                    disabled={currentExerciseIndex === 0}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  
                  <Button
                    onClick={nextExercise}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {currentExerciseIndex === workoutSession.length - 1 ? 'Finish' : 'Next Exercise'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}