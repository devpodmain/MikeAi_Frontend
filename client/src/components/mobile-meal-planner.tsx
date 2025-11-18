import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Calendar, 
  Plus, 
  Clock, 
  Users, 
  Flame,
  Search,
  Filter,
  Camera,
  Utensils,
  Coffee,
  Sun,
  Moon,
  Apple,
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp
} from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string;
  time?: string;
  logged: boolean;
}

interface DayPlan {
  date: string;
  meals: {
    breakfast: Meal[];
    lunch: Meal[];
    dinner: Meal[];
    snacks: Meal[];
  };
  totalCalories: number;
  targetCalories: number;
}

const mealIcons = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snacks: Apple
};

const mealColors = {
  breakfast: "bg-yellow-100 text-yellow-800",
  lunch: "bg-blue-100 text-blue-800", 
  dinner: "bg-purple-100 text-purple-800",
  snacks: "bg-green-100 text-green-800"
};

export function MobileMealPlanner() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);

  // Mock data for demonstration
  const weekPlan: DayPlan[] = [
    {
      date: "2025-01-24",
      meals: {
        breakfast: [
          {
            id: "1",
            name: "Oatmeal with Berries",
            calories: 320,
            protein: 12,
            carbs: 58,
            fat: 6,
            time: "8:00 AM",
            logged: true
          }
        ],
        lunch: [
          {
            id: "2", 
            name: "Grilled Chicken Salad",
            calories: 450,
            protein: 35,
            carbs: 12,
            fat: 28,
            time: "12:30 PM",
            logged: false
          }
        ],
        dinner: [
          {
            id: "3",
            name: "Salmon with Quinoa",
            calories: 520,
            protein: 42,
            carbs: 35,
            fat: 22,
            time: "7:00 PM",
            logged: false
          }
        ],
        snacks: [
          {
            id: "4",
            name: "Greek Yogurt",
            calories: 150,
            protein: 15,
            carbs: 12,
            fat: 4,
            time: "3:00 PM",
            logged: true
          }
        ]
      },
      totalCalories: 1440,
      targetCalories: 2000
    }
  ];

  const currentPlan = weekPlan[0]; // For demo, using first day

  const getMealTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const calculateMacroPercentage = (macro: number, totalCalories: number) => {
    return Math.round((macro * (macro === 4 ? 4 : 9)) / totalCalories * 100);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Date Navigation */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Meal Planner</h1>
            <p className="opacity-90">Plan your perfect nutrition</p>
          </div>
          <Button variant="secondary" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Week View
          </Button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <div className="text-lg font-semibold">Today</div>
            <div className="text-sm opacity-75">January 24, 2025</div>
          </div>
          
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Daily Summary */}
      <div className="px-4">
        <AnimatedCard className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Today's Progress</h2>
            <Badge variant="outline">
              {currentPlan.totalCalories} / {currentPlan.targetCalories} cal
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Calories</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(currentPlan.totalCalories / currentPlan.targetCalories) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{Math.round((currentPlan.totalCalories / currentPlan.targetCalories) * 100)}%</span>
              </div>
            </div>

            {/* Macro breakdown */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">124g</div>
                <div className="text-xs text-gray-500">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">117g</div>
                <div className="text-xs text-gray-500">Carbs</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">60g</div>
                <div className="text-xs text-gray-500">Fat</div>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Meal Categories */}
      <div className="px-4 space-y-4">
        {Object.entries(currentPlan.meals).map(([mealType, meals]) => {
          const MealIcon = mealIcons[mealType as keyof typeof mealIcons];
          const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
          
          return (
            <AnimatedCard key={mealType} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mealColors[mealType as keyof typeof mealColors]}`}>
                      <MealIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{getMealTypeLabel(mealType)}</h3>
                      <p className="text-sm text-gray-500">{totalCalories} calories</p>
                    </div>
                  </div>
                  
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[90vh]">
                      <SheetHeader>
                        <SheetTitle>Add {getMealTypeLabel(mealType)}</SheetTitle>
                      </SheetHeader>
                      <MealAddSheet mealType={mealType} />
                    </SheetContent>
                  </Sheet>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {meals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Utensils className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No meals planned</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {meals.map((meal) => (
                      <div key={meal.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                          {meal.image ? (
                            <img src={meal.image} alt={meal.name} className="w-full h-full rounded-lg object-cover" />
                          ) : (
                            <Utensils className="w-6 h-6 text-orange-400" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{meal.name}</h4>
                            <Badge variant={meal.logged ? "default" : "outline"} className="text-xs">
                              {meal.calories} cal
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>P: {meal.protein}g</span>
                            <span>C: {meal.carbs}g</span>
                            <span>F: {meal.fat}g</span>
                            {meal.time && <span>{meal.time}</span>}
                          </div>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant={meal.logged ? "secondary" : "default"}
                          className="px-3"
                        >
                          {meal.logged ? "Logged" : "Log"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </AnimatedCard>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <AnimatedButton variant="outline" className="h-16 flex flex-col space-y-1">
            <Camera className="w-5 h-5" />
            <span className="text-sm">Scan Food</span>
          </AnimatedButton>
          
          <AnimatedButton variant="outline" className="h-16 flex flex-col space-y-1">
            <Search className="w-5 h-5" />
            <span className="text-sm">Search Recipe</span>
          </AnimatedButton>
          
          <AnimatedButton variant="outline" className="h-16 flex flex-col space-y-1">
            <Target className="w-5 h-5" />
            <span className="text-sm">Set Goals</span>
          </AnimatedButton>
          
          <AnimatedButton variant="outline" className="h-16 flex flex-col space-y-1">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm">View Progress</span>
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}

function MealAddSheet({ mealType }: { mealType: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <div className="space-y-4 mt-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search foods or recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Add Options */}
      <div className="grid grid-cols-3 gap-3">
        <Button variant="outline" className="h-20 flex flex-col space-y-1">
          <Camera className="w-6 h-6" />
          <span className="text-xs">Scan Food</span>
        </Button>
        
        <Button variant="outline" className="h-20 flex flex-col space-y-1">
          <Utensils className="w-6 h-6" />
          <span className="text-xs">Recipe</span>
        </Button>
        
        <Button variant="outline" className="h-20 flex flex-col space-y-1">
          <Plus className="w-6 h-6" />
          <span className="text-xs">Custom</span>
        </Button>
      </div>

      {/* Recent Foods */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Recent Foods</h3>
        <div className="space-y-2">
          {["Grilled Chicken Breast", "Brown Rice", "Avocado", "Greek Yogurt"].map((food) => (
            <div key={food} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-gray-400" />
                </div>
                <span className="font-medium">{food}</span>
              </div>
              <Button size="sm">Add</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}