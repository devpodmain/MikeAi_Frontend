import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  CheckCircle, 
  Circle, 
  Flame, 
  Target, 
  Award, 
  Calendar,
  TrendingUp,
  Droplets,
  Utensils,
  Moon,
  Activity,
  Edit,
  Trash2,
  Star,
  Zap
} from "lucide-react";

interface Habit {
  id: number;
  name: string;
  description: string;
  targetFrequency: number;
  points: number;
  category: string;
  isActive: boolean;
  createdAt: string;
}

interface HabitLog {
  id: number;
  habitId: number;
  logDate: string;
  completed: boolean;
  notes: string;
  habit: Habit;
}

export default function HabitTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateHabitOpen, setIsCreateHabitOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newHabit, setNewHabit] = useState({
    name: "",
    description: "",
    category: "custom",
    targetFrequency: 1,
    points: 10
  });

  // Fetch habits
  const { data: habits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ["/api/habits"],
    retry: false,
  });

  // Fetch habit logs for selected date
  const { data: habitLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["/api/habit-logs", selectedDate],
    retry: false,
  });

  // Create habit mutation
  const createHabitMutation = useMutation({
    mutationFn: async (habitData: typeof newHabit) => {
      return await apiRequest("/api/habits", "POST", habitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setIsCreateHabitOpen(false);
      setNewHabit({
        name: "",
        description: "",
        category: "custom",
        targetFrequency: 1,
        points: 10
      });
      toast({
        title: "Habit created!",
        description: "Your new habit has been added to your tracker.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating habit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Log habit completion mutation
  const logHabitMutation = useMutation({
    mutationFn: async (data: { habitId: number; completed: boolean; notes?: string }) => {
      return await apiRequest("/api/habit-logs", "POST", {
        ...data,
        logDate: selectedDate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
      toast({
        title: "Habit logged!",
        description: "Your habit completion has been recorded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error logging habit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete habit mutation
  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      return await apiRequest(`/api/habits/${habitId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
      toast({
        title: "Habit deleted!",
        description: "Your habit has been removed from tracking.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting habit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get habit streaks
  const getHabitStreak = (habitId: number) => {
    // This would typically come from an API call
    // For now, we'll use a placeholder
    return Math.floor(Math.random() * 30);
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'nutrition':
        return <Utensils className="h-4 w-4" />;
      case 'hydration':
        return <Droplets className="h-4 w-4" />;
      case 'exercise':
        return <Activity className="h-4 w-4" />;
      case 'sleep':
        return <Moon className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'nutrition':
        return 'bg-primary';
      case 'hydration':
        return 'bg-info';
      case 'exercise':
        return 'bg-accent';
      case 'sleep':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Check if habit is completed today
  const isHabitCompleted = (habitId: number) => {
    return habitLogs.some(log => log.habitId === habitId && log.completed);
  };

  // Calculate total points for today
  const totalPointsToday = habitLogs
    .filter(log => log.completed)
    .reduce((sum, log) => sum + log.habit.points, 0);

  // Calculate completion percentage
  const completionPercentage = habits.length > 0 
    ? (habitLogs.filter(log => log.completed).length / habits.length) * 100 
    : 0;

  const handleCreateHabit = () => {
    if (!newHabit.name.trim()) return;
    createHabitMutation.mutate(newHabit);
  };

  const handleToggleHabit = (habitId: number) => {
    const isCompleted = isHabitCompleted(habitId);
    logHabitMutation.mutate({
      habitId,
      completed: !isCompleted,
      notes: ""
    });
  };

  if (habitsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Habit Tracker</h2>
          <p className="text-gray-600">Build healthy habits and track your progress</p>
        </div>
        <Dialog open={isCreateHabitOpen} onOpenChange={setIsCreateHabitOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-white hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
              <DialogDescription>
                Add a new healthy habit to track and build into your daily routine.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Habit Name</Label>
                <Input
                  id="name"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Drink 8 glasses of water"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newHabit.category} onValueChange={(value) => setNewHabit(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nutrition">Nutrition</SelectItem>
                      <SelectItem value="hydration">Hydration</SelectItem>
                      <SelectItem value="exercise">Exercise</SelectItem>
                      <SelectItem value="sleep">Sleep</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newHabit.points}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
                    min="1"
                    max="100"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="frequency">Target Frequency (per day)</Label>
                <Input
                  id="frequency"
                  type="number"
                  value={newHabit.targetFrequency}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, targetFrequency: parseInt(e.target.value) || 1 }))}
                  min="1"
                  max="10"
                />
              </div>
              <Button
                onClick={handleCreateHabit}
                disabled={createHabitMutation.isPending}
                className="w-full bg-primary text-white hover:bg-primary/90"
              >
                {createHabitMutation.isPending ? "Creating..." : "Create Habit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{habits.length}</div>
                <div className="text-sm text-gray-600">Active Habits</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-success">{Math.round(completionPercentage)}%</div>
                <div className="text-sm text-gray-600">Completed Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <Star className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">{totalPointsToday}</div>
                <div className="text-sm text-gray-600">Points Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center">
                <Flame className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">
                  {habits.length > 0 ? Math.max(...habits.map(h => getHabitStreak(h.id))) : 0}
                </div>
                <div className="text-sm text-gray-600">Best Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="habits">My Habits</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Today's Habits
                </span>
                <Badge variant="outline">
                  {new Date(selectedDate).toLocaleDateString()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {habits.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No habits yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first habit to start tracking your progress
                  </p>
                  <Button
                    onClick={() => setIsCreateHabitOpen(true)}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Habit
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {habits.map((habit) => {
                    const isCompleted = isHabitCompleted(habit.id);
                    const streak = getHabitStreak(habit.id);
                    
                    return (
                      <div
                        key={habit.id}
                        className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-colors ${
                          isCompleted 
                            ? 'bg-success/10 border-success/20' 
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleHabit(habit.id)}
                          disabled={logHabitMutation.isPending}
                          className="p-0 h-8 w-8"
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-6 w-6 text-success" />
                          ) : (
                            <Circle className="h-6 w-6 text-gray-400 hover:text-primary" />
                          )}
                        </Button>
                        
                        <div className={`w-8 h-8 ${getCategoryColor(habit.category)} rounded-full flex items-center justify-center`}>
                          {getCategoryIcon(habit.category)}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{habit.name}</h4>
                          <p className="text-sm text-gray-600">{habit.description}</p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-sm font-bold text-accent">{habit.points}</div>
                            <div className="text-xs text-gray-500">points</div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Flame className="h-4 w-4 text-warning" />
                            <span className="text-sm font-medium text-warning">{streak}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="habits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Habit Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {habits.map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 ${getCategoryColor(habit.category)} rounded-full flex items-center justify-center`}>
                        {getCategoryIcon(habit.category)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{habit.name}</h4>
                        <p className="text-sm text-gray-600">{habit.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {habit.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {habit.points} points
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteHabitMutation.mutate(habit.id)}
                        disabled={deleteHabitMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {habits.map((habit) => {
                  const streak = getHabitStreak(habit.id);
                  const weeklyCompletion = Math.floor(Math.random() * 100); // This would come from API
                  
                  return (
                    <div key={habit.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${getCategoryColor(habit.category)} rounded-full flex items-center justify-center`}>
                            {getCategoryIcon(habit.category)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{habit.name}</h4>
                            <p className="text-sm text-gray-600">Weekly completion rate</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-sm font-bold text-warning">{streak}</div>
                            <div className="text-xs text-gray-500">streak</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-bold text-success">{weeklyCompletion}%</div>
                            <div className="text-xs text-gray-500">this week</div>
                          </div>
                        </div>
                      </div>
                      <Progress value={weeklyCompletion} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
