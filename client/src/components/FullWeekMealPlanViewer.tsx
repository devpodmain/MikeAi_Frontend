import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Utensils, Flame, Drumstick, Wheat, Beef } from "lucide-react";

interface Meal {
  type: string;
  name: string;
  calories: number | string;
  protein: number | string;
  carbs: number | string;
  fats: number | string;
}

interface MealDay {
  day?: string;
  meals: Meal[];
}

interface FullWeekMealPlanViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  planData: {
    days?: MealDay[];
  } | MealDay[];
  dayMapping?: Record<string, string> | null;
}

const WEEKDAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const WEEKDAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function FullWeekMealPlanViewer({ 
  open, 
  onOpenChange, 
  planName,
  planData,
  dayMapping 
}: FullWeekMealPlanViewerProps) {
  
  // Normalize planData to array of days
  const days: MealDay[] = Array.isArray(planData) 
    ? planData 
    : (planData?.days || []);

  // Migrate legacy dayMapping format to new format
  const normalizedDayMapping = React.useMemo(() => {
    if (!dayMapping || Object.keys(dayMapping).length === 0) {
      return null;
    }

    // Check if this is old format (planDayIndex → weekday) or new format (weekday → planDayIndex)
    const firstKey = Object.keys(dayMapping)[0];
    const firstValue = dayMapping[firstKey];

    // Old format: keys are numbers (plan day indices), values are weekdays
    if (!isNaN(parseInt(firstKey)) && typeof firstValue === 'string' && WEEKDAY_ORDER.includes(firstValue.toLowerCase())) {
      // Convert old format to new format
      const newMapping: Record<string, string> = {};
      for (const [planDayIndex, weekday] of Object.entries(dayMapping)) {
        newMapping[weekday.toLowerCase()] = planDayIndex;
      }
      return newMapping;
    }

    // New format: keys are weekdays, values are plan day indices or "rest"
    return dayMapping;
  }, [dayMapping]);

  // Create week structure based on dayMapping
  const weekStructure = WEEKDAY_ORDER.map((weekday, weekdayIndex) => {
    // If normalizedDayMapping exists and is not empty, use it
    if (normalizedDayMapping && Object.keys(normalizedDayMapping).length > 0) {
      const mappedValue = normalizedDayMapping[weekday];
      
      // Check if this weekday is explicitly marked as rest
      if (!mappedValue || mappedValue === "rest") {
        return {
          weekday,
          label: WEEKDAY_LABELS[weekday],
          meals: [],
          isRestDay: true
        };
      }
      
      // Map to specific plan day
      const planDayIndex = parseInt(mappedValue);
      if (!isNaN(planDayIndex) && planDayIndex >= 0 && planDayIndex < days.length) {
        const planDay = days[planDayIndex];
        return {
          weekday,
          label: WEEKDAY_LABELS[weekday],
          meals: planDay?.meals || [],
          isRestDay: (planDay?.meals || []).length === 0
        };
      }
      
      // Invalid mapping - treat as rest day
      return {
        weekday,
        label: WEEKDAY_LABELS[weekday],
        meals: [],
        isRestDay: true
      };
    }
    
    // FALLBACK: No dayMapping - cycle through plan days using modulo
    if (days.length > 0) {
      const planDayIndex = weekdayIndex % days.length;
      const planDay = days[planDayIndex];
      return {
        weekday,
        label: WEEKDAY_LABELS[weekday],
        meals: planDay?.meals || [],
        isRestDay: (planDay?.meals || []).length === 0
      };
    }
    
    // No plan days at all - rest day
    return {
      weekday,
      label: WEEKDAY_LABELS[weekday],
      meals: [],
      isRestDay: true
    };
  });

  const getMealIcon = (mealType: string) => {
    const type = mealType.toLowerCase();
    if (type.includes('breakfast')) return <Utensils className="h-4 w-4" />;
    if (type.includes('lunch')) return <Drumstick className="h-4 w-4" />;
    if (type.includes('dinner')) return <Beef className="h-4 w-4" />;
    return <Wheat className="h-4 w-4" />;
  };

  const getMealColor = (mealType: string) => {
    const type = mealType.toLowerCase();
    if (type.includes('breakfast')) return 'bg-orange-50 border-orange-200';
    if (type.includes('lunch')) return 'bg-blue-50 border-blue-200';
    if (type.includes('dinner')) return 'bg-purple-50 border-purple-200';
    return 'bg-green-50 border-green-200';
  };

  const calculateDayTotals = (meals: Meal[]) => {
    return meals.reduce((acc, meal) => ({
      calories: acc.calories + (typeof meal.calories === 'number' ? meal.calories : parseInt(meal.calories) || 0),
      protein: acc.protein + (typeof meal.protein === 'number' ? meal.protein : parseInt(meal.protein) || 0),
      carbs: acc.carbs + (typeof meal.carbs === 'number' ? meal.carbs : parseInt(meal.carbs) || 0),
      fats: acc.fats + (typeof meal.fats === 'number' ? meal.fats : parseInt(meal.fats) || 0),
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-6 w-6 text-green-600" />
            Full Week Meal Plan: {planName}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekStructure.map((day) => {
              const totals = day.meals.length > 0 ? calculateDayTotals(day.meals) : null;
              
              return (
                <Card key={day.weekday} className="p-4 space-y-3" data-testid={`day-card-${day.weekday}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">{day.label}</h3>
                    {day.isRestDay && (
                      <Badge variant="outline" className="text-xs">
                        Rest Day
                      </Badge>
                    )}
                  </div>

                  {day.isRestDay ? (
                    <div className="text-center py-8 text-gray-400">
                      <Utensils className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No meals planned</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {day.meals.map((meal, index) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded-lg border ${getMealColor(meal.type)}`}
                          data-testid={`meal-${day.weekday}-${index}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {getMealIcon(meal.type)}
                            <span className="font-medium text-sm capitalize">{meal.type}</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800">{meal.name}</p>
                          <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              {meal.calories} cal
                            </div>
                            <div>P: {meal.protein}g</div>
                            <div>C: {meal.carbs}g</div>
                            <div>F: {meal.fats}g</div>
                          </div>
                        </div>
                      ))}

                      {totals && (
                        <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
                          <p className="font-semibold text-xs text-gray-700 mb-2">Daily Totals</p>
                          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              <span className="font-bold">{totals.calories}</span> cal
                            </div>
                            <div><span className="font-bold">{totals.protein}g</span> protein</div>
                            <div><span className="font-bold">{totals.carbs}g</span> carbs</div>
                            <div><span className="font-bold">{totals.fats}g</span> fats</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
