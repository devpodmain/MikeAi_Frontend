import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { type WorkoutPlan } from "@/types/workoutPlan";
import { generateWorkoutPlan, persistWorkoutPlan, loadExistingWorkoutPlan, deleteWorkoutPlan, getUserProfile, type WorkoutPrefs } from "@/lib/workoutPlanApi";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Activity, Target, Clock, Users, Dumbbell, 
  Zap, CheckCircle, Star, Trophy, Sparkles, ChevronRight,
  Home, Calendar, RotateCcw, Trash2, Play
} from 'lucide-react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { useAuth } from "@/hooks/useAuth";

const EQUIP_HOME = ["bodyweight","dumbbell","bands","kettlebell"];
const EQUIP_GYM  = ["barbell","dumbbell","machine","cable","kettlebell","bodyweight"];

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState<any>(null);

  // Form state
  const [goal, setGoal] = useState<WorkoutPrefs["goal"]>("hypertrophy");
  const [split, setSplit] = useState<NonNullable<WorkoutPrefs["desired_split"]>>("auto");
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [workoutsPerDay, setWorkoutsPerDay] = useState<number>(6);

  // Optional fields per your spec
  const [sessionMinutes, setSessionMinutes] = useState<number | undefined>(undefined);
  const [where, setWhere] = useState<"home"|"gym">("gym");
  const [equipment, setEquipment] = useState<string[] | undefined>(EQUIP_GYM);
  const [injuries, setInjuries] = useState<string>("");

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;
    
    (async () => {
      try {
        const uid = (user as any)?.id;
        if (!uid) return;
        
        setUserId(uid);
        const dbProf = await getUserProfile(uid);
        setProfile(dbProf);

        const stored = await loadExistingWorkoutPlan(uid);
        if (stored) setPlan(stored);
      } catch (error) {
        console.error('Error loading workout data:', error);
        setProfile({ user_id: (user as any)?.id });
      }
    })();
  }, [user]);

  // Auto equipment by location; user can clear it to make it "optional"
  useEffect(() => {
    setEquipment(undefined); // Start with no equipment selected
  }, [where]);

  const canSubmit = useMemo(() => !!profile && !loading && !!daysPerWeek && !!goal, [profile, loading, daysPerWeek, goal]);

  async function onGenerate() {
    if (!profile) return;
    setLoading(true); setErr("");

    // Build prefs with optionals only if present
    const prefs: WorkoutPrefs = {
      goal,
      days_per_week: daysPerWeek,
      workouts_per_day: workoutsPerDay,
      ...(sessionMinutes !== undefined ? { session_minutes: sessionMinutes } : {}),
      ...(equipment !== undefined && equipment.length > 0 ? { equipment } : {}),
      ...(injuries ? { injuries } : {}),
      ...(split ? { desired_split: split } : {})
    };

    try {
      const newPlan = await generateWorkoutPlan(profile, prefs, 8);
      setPlan(newPlan);
      await persistWorkoutPlan(userId, newPlan);
    } catch (e: any) {
      setErr(e?.message || "Failed to generate workout plan");
    } finally {
      setLoading(false);
    }
  }

  async function onDeletePlan() {
    try {
      await deleteWorkoutPlan(userId);
      setPlan(null);
    } catch (e: any) {
      setErr(e?.message || "Failed to delete workout plan");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header with Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/user-home">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="hidden sm:block w-px h-6 bg-gray-300" />
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Workout Planner
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Create form */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardHeader className="pb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Create Your AI Workout Plan
                </CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Personalized training designed just for you
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="goal" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Target className="w-4 h-4 mr-2 text-purple-500" />
                  Training Goal
                </Label>
                <Select value={goal} onValueChange={(value) => setGoal(value as any)}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-purple-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: "hypertrophy", label: "Muscle Building (Hypertrophy)" },
                      { value: "strength", label: "Strength Training" },
                      { value: "fat_loss", label: "Fat Loss & Conditioning" },
                      { value: "general_fitness", label: "General Fitness" }
                    ].map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="split" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  Training Split
                </Label>
                <Select value={split} onValueChange={(value) => setSplit(value as any)}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: "auto", label: "Auto-Select (Recommended)" },
                      { value: "full-body", label: "Full Body" },
                      { value: "upper/lower", label: "Upper/Lower Split" },
                      { value: "push/pull/legs", label: "Push/Pull/Legs" }
                    ].map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="daysPerWeek" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-green-500" />
                  Days per Week
                </Label>
                <Input
                  type="number"
                  min={2}
                  max={7}
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(+e.target.value)}
                  className="h-12 border-2 border-gray-200 hover:border-green-300 focus:border-green-400 transition-colors"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="workoutsPerDay" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Dumbbell className="w-4 h-4 mr-2 text-orange-500" />
                  Exercises per Session
                </Label>
                <Input
                  type="number"
                  min={4}
                  max={12}
                  value={workoutsPerDay}
                  onChange={(e) => setWorkoutsPerDay(+e.target.value)}
                  className="h-12 border-2 border-gray-200 hover:border-orange-300 focus:border-orange-400 transition-colors"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="sessionMinutes" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-pink-500" />
                  Session Duration (optional)
                </Label>
                <Input
                  type="number"
                  min={30}
                  max={120}
                  placeholder="Leave empty for flexible timing"
                  value={sessionMinutes ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSessionMinutes(v === "" ? undefined : +v);
                  }}
                  className="h-12 border-2 border-gray-200 hover:border-pink-300 focus:border-pink-400 transition-colors"
                />
              </div>

              <div className="lg:col-span-2 space-y-4">
                <Label className="text-sm font-semibold text-gray-700 flex items-center">
                  <Home className="w-4 h-4 mr-2 text-indigo-500" />
                  Training Location
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {(["home","gym"] as const).map(loc => (
                    <div key={loc}>
                      <input
                        type="radio"
                        id={loc}
                        name="location"
                        checked={where === loc}
                        onChange={() => setWhere(loc)}
                        className="sr-only"
                      />
                      <label
                        htmlFor={loc}
                        className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          where === loc
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:border-indigo-300 text-gray-600'
                        }`}
                      >
                        <span className="capitalize font-medium">{loc === 'home' ? 'Home' : 'Gym'}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center">
                    <Dumbbell className="w-4 h-4 mr-2 text-purple-500" />
                    Available Equipment (optional)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEquipment(undefined)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { key: "barbell", label: "Barbell", rec: where === "gym" },
                    { key: "dumbbell", label: "Dumbbells", rec: true },
                    { key: "machine", label: "Machines", rec: where === "gym" },
                    { key: "cable", label: "Cables", rec: where === "gym" },
                    { key: "kettlebell", label: "Kettlebells", rec: false },
                    { key: "bodyweight", label: "Bodyweight", rec: where === "home" },
                    { key: "bands", label: "Resistance Bands", rec: where === "home" }
                  ].map(e => {
                    const isSelected = (equipment || []).includes(e.key);
                    return (
                      <div key={e.key}>
                        <input
                          type="checkbox"
                          id={e.key}
                          checked={isSelected}
                          onChange={() => {
                            setEquipment(prev => {
                              const cur = prev ? [...prev] : [];
                              const i = cur.indexOf(e.key);
                              if (i >= 0) cur.splice(i,1); else cur.push(e.key);
                              return cur.length > 0 ? cur : undefined;
                            });
                          }}
                          className="sr-only"
                        />
                        <label
                          htmlFor={e.key}
                          className={`block p-3 border-2 rounded-lg cursor-pointer transition-all text-sm ${
                            isSelected
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : e.rec
                              ? 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:border-purple-300'
                              : 'border-gray-200 text-gray-600 hover:border-purple-300'
                          }`}
                        >
                          <span className="font-medium">{e.label}</span>
                          {e.rec && !isSelected && <div className="text-xs text-yellow-600 mt-1">Recommended</div>}
                        </label>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  Note: Leave empty to let AI choose the best exercises for you
                </div>
              </div>

              <div className="lg:col-span-2 space-y-3">
                <Label htmlFor="injuries" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-red-500" />
                  Injuries or Limitations (optional)
                </Label>
                <Textarea
                  id="injuries"
                  rows={3}
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  placeholder="e.g., Lower back issues, knee problems, shoulder injury..."
                  className="border-2 border-gray-200 hover:border-red-300 focus:border-red-400 transition-colors resize-none"
                />
              </div>
            </div>

            <Separator className="my-6" />

            {err && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {err}
              </div>
            )}

            <Button 
              onClick={onGenerate} 
              disabled={!canSubmit} 
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3" />
                  Generating Your Perfect Plan...
                </div>
              ) : (
                <div className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-3" />
                  Generate AI Workout Plan
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Render plan from backend */}
        {plan && (
          <Card className="bg-white/90 backdrop-blur-sm border border-white/20 shadow-2xl">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-1 capitalize">
                      {plan.goal} • {plan.weeks} weeks • {plan.days_per_week || daysPerWeek} days/week
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeletePlan}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {plan.days.sort((a,b) => a.dayIndex - b.dayIndex).map(d => (
                  <div key={d.dayIndex} className="border border-gray-200 rounded-xl p-5 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                          {d.dayIndex}
                        </div>
                        {d.name}
                      </h3>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {d.items.length} exercises
                      </Badge>
                    </div>
                    <div className="grid gap-3">
                      {d.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">{it.exercise}</h4>
                              {it.notes && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {typeof it.notes === 'object' ? JSON.stringify(it.notes) : String(it.notes)}
                                </p>
                              )}
                              {it.video_url && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="mt-2 text-xs h-7"
                                  onClick={() => window.open(it.video_url, '_blank')}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Watch Form Video
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-right">
                            <div className="text-sm">
                              <div className="font-semibold text-gray-800">{it.sets} × {it.reps}</div>
                              {it.restSec && (
                                <div className="text-gray-500">Rest: {it.restSec}s</div>
                              )}
                            </div>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Additional Notes */}
                {(plan.progression_notes || plan.warmup_notes || plan.deload) && (
                  <div className="border-t border-gray-200 pt-6 space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-yellow-500" />
                      Important Notes
                    </h3>
                    <div className="grid gap-4">
                      {plan.progression_notes && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-800 mb-2">Progression Strategy</h4>
                          <p className="text-blue-700 text-sm">
                            {typeof plan.progression_notes === 'object' ? JSON.stringify(plan.progression_notes) : String(plan.progression_notes)}
                          </p>
                        </div>
                      )}
                      {plan.warmup_notes && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <h4 className="font-semibold text-orange-800 mb-2">Warm-up Protocol</h4>
                          <p className="text-orange-700 text-sm">
                            {typeof plan.warmup_notes === 'object' ? JSON.stringify(plan.warmup_notes) : String(plan.warmup_notes)}
                          </p>
                        </div>
                      )}
                      {plan.deload && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <h4 className="font-semibold text-purple-800 mb-2">Deload Guidelines</h4>
                          <p className="text-purple-700 text-sm">
                            {typeof plan.deload === 'object' ? JSON.stringify(plan.deload) : String(plan.deload)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}