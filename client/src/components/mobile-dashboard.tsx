import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  TrendingUp, 
  Target, 
  Award, 
  Plus, 
  Camera,
  Zap,
  Clock,
  Users,
  Heart,
  Utensils,
  Activity,
  CheckCircle2,
  ArrowRight,
  Flame
} from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

interface MobileDashboardProps {
  userType?: "individual" | "coach";
}

export function MobileDashboard({ userType = "individual" }: MobileDashboardProps) {
  const { user } = useAuth();

  const todayStats = {
    calories: { consumed: 1420, target: 2000 },
    water: { consumed: 6, target: 8 },
    steps: { taken: 8234, target: 10000 },
    workouts: { completed: 1, target: 1 }
  };

  const weeklyStreak = 7;
  const currentLevel = 15;
  const nextLevelProgress = 78;

  if (userType === "coach") {
    return <CoachMobileDashboard />;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back!</h1>
            <p className="opacity-90">{(user as any)?.firstName || "User"}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">{weeklyStreak} day streak</span>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
              Level {currentLevel}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex-1 bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500" 
              style={{ width: `${nextLevelProgress}%` }}
            />
          </div>
          <span className="text-sm opacity-90">{nextLevelProgress}%</span>
        </div>
        <p className="text-sm opacity-75">22 XP to next level</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4 px-4">
        <AnimatedCard className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
            <Utensils className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{todayStats.calories.consumed}</div>
          <div className="text-sm text-gray-500">of {todayStats.calories.target} cal</div>
          <Progress value={(todayStats.calories.consumed / todayStats.calories.target) * 100} className="mt-2" />
        </AnimatedCard>

        <AnimatedCard className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{todayStats.steps.taken.toLocaleString()}</div>
          <div className="text-sm text-gray-500">of {todayStats.steps.target.toLocaleString()} steps</div>
          <Progress value={(todayStats.steps.taken / todayStats.steps.target) * 100} className="mt-2" />
        </AnimatedCard>

        <AnimatedCard className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 rounded-full mx-auto mb-2">
            <div className="w-6 h-6 text-cyan-600 text-xl">💧</div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{todayStats.water.consumed}</div>
          <div className="text-sm text-gray-500">of {todayStats.water.target} glasses</div>
          <Progress value={(todayStats.water.consumed / todayStats.water.target) * 100} className="mt-2" />
        </AnimatedCard>

        <AnimatedCard className="p-4 text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
            <Zap className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{todayStats.workouts.completed}</div>
          <div className="text-sm text-gray-500">of {todayStats.workouts.target} workout</div>
          <div className="mt-2 flex justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
        </AnimatedCard>
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <AnimatedButton 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center space-y-2"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm">Log Meal</span>
          </AnimatedButton>
          
          <AnimatedButton 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center space-y-2"
          >
            <Camera className="w-6 h-6" />
            <span className="text-sm">Scan Food</span>
          </AnimatedButton>
          
          <Link href="/recipes">
            <AnimatedButton 
              variant="outline" 
              className="h-20 w-full flex flex-col items-center justify-center space-y-2"
            >
              <Utensils className="w-6 h-6" />
              <span className="text-sm">Find Recipe</span>
            </AnimatedButton>
          </Link>
          
          <AnimatedButton 
            variant="outline" 
            className="h-20 flex flex-col items-center justify-center space-y-2" 
            onClick={() => window.location.href = '/mobile-features'}
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-sm">Features</span>
          </AnimatedButton>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Today's Plan</h2>
          <Button variant="ghost" size="sm">
            <Calendar className="w-4 h-4 mr-1" />
            View All
          </Button>
        </div>
        
        <div className="space-y-3">
          <AnimatedCard className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-12 bg-green-400 rounded-full"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Breakfast</h3>
                  <Badge variant="outline" className="text-xs">450 cal</Badge>
                </div>
                <p className="text-sm text-gray-500">Oatmeal with berries</p>
                <p className="text-xs text-gray-400">8:00 AM</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-12 bg-blue-400 rounded-full"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Lunch</h3>
                  <Badge variant="outline" className="text-xs">650 cal</Badge>
                </div>
                <p className="text-sm text-gray-500">Grilled chicken salad</p>
                <p className="text-xs text-gray-400">12:30 PM</p>
              </div>
              <Button size="sm" variant="ghost">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </AnimatedCard>

          <AnimatedCard className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-12 bg-orange-400 rounded-full"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Evening Workout</h3>
                  <Badge variant="outline" className="text-xs">30 min</Badge>
                </div>
                <p className="text-sm text-gray-500">Cardio & strength training</p>
                <p className="text-xs text-gray-400">6:00 PM</p>
              </div>
              <Button size="sm" variant="ghost">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </AnimatedCard>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-green-100 text-green-600">
                <Award className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">Achievement unlocked!</p>
              <p className="text-xs text-gray-500">7-day nutrition streak</p>
            </div>
            <span className="text-xs text-gray-400">2h ago</span>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                <Users className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">Sarah liked your progress</p>
              <p className="text-xs text-gray-500">Community support</p>
            </div>
            <span className="text-xs text-gray-400">5h ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoachMobileDashboard() {
  return (
    <div className="space-y-6 pb-20 bg-slate-900 min-h-screen">
      {/* Coach Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 rounded-b-3xl border-b border-amber-400/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Coach Dashboard</h1>
            <p className="text-amber-400">Manage your clients</p>
          </div>
          <Badge variant="secondary" className="bg-amber-400/20 text-amber-400 border-amber-400/30">
            15 Active Clients
          </Badge>
        </div>
      </div>

      {/* Coach Stats */}
      <div className="grid grid-cols-2 gap-4 px-4">
        <AnimatedCard className="p-4 text-center bg-slate-800 border-slate-700">
          <Users className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">15</div>
          <div className="text-sm text-gray-300">Active Clients</div>
        </AnimatedCard>

        <AnimatedCard className="p-4 text-center bg-slate-800 border-slate-700">
          <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">92%</div>
          <div className="text-sm text-gray-300">Success Rate</div>
        </AnimatedCard>
      </div>

      {/* Recent Client Activity */}
      <div className="px-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Client Updates</h2>
        <div className="space-y-3">
          <AnimatedCard className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">John Doe</h3>
                <p className="text-sm text-gray-500">Completed today's workout</p>
              </div>
              <Badge variant="outline" className="text-xs">2h ago</Badge>
            </div>
          </AnimatedCard>
        </div>
      </div>
    </div>
  );
}