import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  TrendingUp, 
  Target, 
  Calendar as CalendarIcon,
  BarChart3,
  Scale,
  Activity,
  Zap,
  Award,
  Flame,
  Download,
  FileText
} from "lucide-react";

export default function ProgressTracker() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    retry: false,
  });

  const { data: mealLogs = [] } = useQuery({
    queryKey: ["/api/meal-logs"],
    retry: false,
  });

  const { data: habitLogs = [] } = useQuery({
    queryKey: ["/api/habit-logs"],
    retry: false,
  });

  // Calculate progress metrics
  const todaysCalories = mealLogs.reduce((sum: number, log: any) => sum + (log.recipe?.calories || 0), 0);
  const targetCalories = profile?.targetCalories || 2000;
  const caloriesProgress = Math.min((todaysCalories / targetCalories) * 100, 100);

  const weeklyGoals = {
    mealsLogged: { current: 18, target: 21, percentage: 86 },
    waterIntake: { current: 45, target: 56, percentage: 80 },
    exerciseMinutes: { current: 180, target: 300, percentage: 60 },
    sleepHours: { current: 52, target: 56, percentage: 93 }
  };

  const monthlyStats = {
    totalMeals: 89,
    avgCalories: 1850,
    streakDays: 12,
    weightChange: -3.2
  };

  const nutritionBreakdown = {
    protein: { current: 45, target: profile?.targetProtein || 120, percentage: 38 },
    carbs: { current: 180, target: profile?.targetCarbs || 200, percentage: 90 },
    fats: { current: 50, target: profile?.targetFats || 67, percentage: 75 }
  };

  // CSV generation functions
  const generateWeeklyReportCSV = () => {
    const headers = ['Metric', 'Current', 'Target', 'Percentage'];
    const rows = Object.entries(weeklyGoals).map(([key, goal]) => [
      key.replace(/([A-Z])/g, ' $1'),
      goal.current.toString(),
      goal.target.toString(),
      `${goal.percentage}%`
    ]);
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  const generateMonthlyReportCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Meals Logged', monthlyStats.totalMeals.toString()],
      ['Average Daily Calories', monthlyStats.avgCalories.toString()],
      ['Current Streak (Days)', monthlyStats.streakDays.toString()],
      ['Weight Change (lbs)', monthlyStats.weightChange.toString()],
      ['Current Calories Today', todaysCalories.toString()],
      ['Target Calories', targetCalories.toString()]
    ];
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  const generateNutritionReportCSV = () => {
    const headers = ['Nutrient', 'Current (g)', 'Target (g)', 'Percentage'];
    const rows = Object.entries(nutritionBreakdown).map(([nutrient, data]) => [
      nutrient.charAt(0).toUpperCase() + nutrient.slice(1),
      data.current.toString(),
      data.target.toString(),
      `${data.percentage}%`
    ]);
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  const downloadCSV = (csvData: string, filename: string) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Progress Tracker</h2>
          <p className="text-gray-600">Monitor your nutrition and health journey</p>
        </div>
        <Dialog open={isReportsOpen} onOpenChange={setIsReportsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Progress Reports
              </DialogTitle>
              <DialogDescription>
                View detailed analytics and download reports of your nutrition and fitness progress.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Progress Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{todaysCalories}</p>
                      <p className="text-sm text-gray-600">Calories Today</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{monthlyStats.streakDays}</p>
                      <p className="text-sm text-gray-600">Day Streak</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{monthlyStats.totalMeals}</p>
                      <p className="text-sm text-gray-600">Meals Logged</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{monthlyStats.weightChange > 0 ? '+' : ''}{monthlyStats.weightChange}</p>
                      <p className="text-sm text-gray-600">Weight Change (lbs)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Progress Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Goals Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(weeklyGoals).map(([key, goal]) => (
                      <div key={key}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-sm text-gray-600">{goal.current} / {goal.target}</span>
                        </div>
                        <Progress value={goal.percentage} className="h-2" />
                        <div className="text-xs text-gray-500 mt-1 text-right">{goal.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Nutrition Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Nutrition Breakdown Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(nutritionBreakdown).map(([nutrient, data]) => (
                      <div key={nutrient}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium capitalize">{nutrient}</span>
                          <span className="text-sm text-gray-600">{data.current}g / {data.target}g</span>
                        </div>
                        <Progress value={data.percentage} className="h-2" />
                        <div className="text-xs text-gray-500 mt-1 text-right">{data.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        // Generate weekly report
                        const csvData = generateWeeklyReportCSV();
                        downloadCSV(csvData, 'weekly-progress-report.csv');
                        toast({
                          title: "Weekly report downloaded",
                          description: "Your weekly progress report has been saved as CSV",
                        });
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Weekly Report
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        // Generate monthly report
                        const csvData = generateMonthlyReportCSV();
                        downloadCSV(csvData, 'monthly-progress-report.csv');
                        toast({
                          title: "Monthly report downloaded",
                          description: "Your monthly progress report has been saved as CSV",
                        });
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Monthly Report
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        // Generate nutrition report
                        const csvData = generateNutritionReportCSV();
                        downloadCSV(csvData, 'nutrition-report.csv');
                        toast({
                          title: "Nutrition report downloaded",
                          description: "Your nutrition breakdown report has been saved as CSV",
                        });
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Nutrition Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Progress Area */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="space-y-4">
              {/* Today's Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="mr-2 h-5 w-5" />
                    Today's Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Calories</span>
                      <span className="text-sm text-gray-600">{todaysCalories} / {targetCalories}</span>
                    </div>
                    <Progress value={caloriesProgress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0</span>
                      <span>{Math.round(caloriesProgress)}%</span>
                      <span>{targetCalories}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Protein</span>
                        <span className="text-sm text-gray-600">{nutritionBreakdown.protein.current}g</span>
                      </div>
                      <Progress value={nutritionBreakdown.protein.percentage} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Carbs</span>
                        <span className="text-sm text-gray-600">{nutritionBreakdown.carbs.current}g</span>
                      </div>
                      <Progress value={nutritionBreakdown.carbs.percentage} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Fats</span>
                        <span className="text-sm text-gray-600">{nutritionBreakdown.fats.current}g</span>
                      </div>
                      <Progress value={nutritionBreakdown.fats.percentage} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Meal Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Meal Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-sm">Breakfast logged</p>
                        <p className="text-xs text-gray-600">8:30 AM • 320 calories</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-sm">Lunch due</p>
                        <p className="text-xs text-gray-600">12:00 PM • Planned</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div>
                        <p className="font-medium text-sm">Dinner planned</p>
                        <p className="text-xs text-gray-600">7:00 PM • 420 calories</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="weekly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Weekly Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(weeklyGoals).map(([key, goal]) => (
                    <div key={key}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm text-gray-600">
                          {goal.current} / {goal.target}
                        </span>
                      </div>
                      <Progress value={goal.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0</span>
                        <span>{goal.percentage}%</span>
                        <span>{goal.target}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="monthly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Monthly Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{monthlyStats.totalMeals}</div>
                      <div className="text-sm text-gray-600">Total Meals</div>
                    </div>
                    <div className="text-center p-4 bg-accent/10 rounded-lg">
                      <div className="text-2xl font-bold text-accent">{monthlyStats.avgCalories}</div>
                      <div className="text-sm text-gray-600">Avg Calories</div>
                    </div>
                    <div className="text-center p-4 bg-success/10 rounded-lg">
                      <div className="text-2xl font-bold text-success">{monthlyStats.streakDays}</div>
                      <div className="text-sm text-gray-600">Streak Days</div>
                    </div>
                    <div className="text-center p-4 bg-info/10 rounded-lg">
                      <div className="text-2xl font-bold text-info">{monthlyStats.weightChange}</div>
                      <div className="text-sm text-gray-600">Weight Change (lbs)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" />
                Progress Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                    <Flame className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">First Week Complete</p>
                    <p className="text-xs text-gray-600">Logged meals for 7 days</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Goal Achiever</p>
                    <p className="text-xs text-gray-600">Hit calorie target 5 days</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Consistency King</p>
                    <p className="text-xs text-gray-600">12-day logging streak</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Streak</span>
                  <Badge variant="outline">{monthlyStats.streakDays} days</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Best Streak</span>
                  <Badge variant="outline">18 days</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">This Month</span>
                  <Badge variant="outline">{monthlyStats.totalMeals} meals</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Goal Adherence</span>
                  <Badge variant="outline">84%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
