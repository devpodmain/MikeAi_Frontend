import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dumbbell, Timer, Repeat } from "lucide-react";

interface Exercise {
  name: string;
  sets: number | string;
  reps: number | string;
  rest?: number | string;
  restSec?: number | string;
}

interface WorkoutDay {
  name?: string;
  day?: string;
  exercises?: Exercise[];
  items?: Exercise[];
}

interface FullWeekWorkoutPlanViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  planData: {
    days?: WorkoutDay[];
  } | WorkoutDay[];
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

export function FullWeekWorkoutPlanViewer({ 
  open, 
  onOpenChange, 
  planName,
  planData,
  dayMapping 
}: FullWeekWorkoutPlanViewerProps) {
  
  // Normalize planData to array of days
  const days: WorkoutDay[] = Array.isArray(planData) 
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
          dayName: "Rest Day",
          exercises: [],
          isRestDay: true
        };
      }
      
      // Map to specific plan day
      const planDayIndex = parseInt(mappedValue);
      if (!isNaN(planDayIndex) && planDayIndex >= 0 && planDayIndex < days.length) {
        const planDay = days[planDayIndex];
        const exercises = planDay?.exercises || planDay?.items || [];
        return {
          weekday,
          label: WEEKDAY_LABELS[weekday],
          dayName: planDay?.name || planDay?.day || WEEKDAY_LABELS[weekday],
          exercises,
          isRestDay: exercises.length === 0
        };
      }
      
      // Invalid mapping - treat as rest day
      return {
        weekday,
        label: WEEKDAY_LABELS[weekday],
        dayName: "Rest Day",
        exercises: [],
        isRestDay: true
      };
    }
    
    // FALLBACK: No dayMapping - cycle through plan days using modulo
    if (days.length > 0) {
      const planDayIndex = weekdayIndex % days.length;
      const planDay = days[planDayIndex];
      const exercises = planDay?.exercises || planDay?.items || [];
      return {
        weekday,
        label: WEEKDAY_LABELS[weekday],
        dayName: planDay?.name || planDay?.day || WEEKDAY_LABELS[weekday],
        exercises,
        isRestDay: exercises.length === 0
      };
    }
    
    // No plan days at all - rest day
    return {
      weekday,
      label: WEEKDAY_LABELS[weekday],
      dayName: "Rest Day",
      exercises: [],
      isRestDay: true
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-purple-600" />
            Full Week Workout Plan: {planName}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekStructure.map((day) => {
              return (
                <Card key={day.weekday} className="p-4 space-y-3" data-testid={`day-card-${day.weekday}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{day.label}</h3>
                      {!day.isRestDay && day.dayName !== day.label && (
                        <p className="text-sm text-gray-600">{day.dayName}</p>
                      )}
                    </div>
                    {day.isRestDay && (
                      <Badge variant="outline" className="text-xs">
                        Rest Day
                      </Badge>
                    )}
                  </div>

                  {day.isRestDay ? (
                    <div className="text-center py-8 text-gray-400">
                      <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Recovery Day</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {day.exercises.map((exercise, index) => (
                        <div 
                          key={index} 
                          className="p-3 rounded-lg bg-purple-50 border border-purple-200"
                          data-testid={`exercise-${day.weekday}-${index}`}
                        >
                          <p className="font-semibold text-sm text-purple-900 mb-2">{exercise.name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Repeat className="h-3 w-3" />
                              <span>{exercise.sets} sets</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>×</span>
                              <span>{exercise.reps} reps</span>
                            </div>
                            {(exercise.rest || exercise.restSec) && (
                              <div className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                <span>{exercise.rest || exercise.restSec}s</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className="p-2 bg-gray-100 rounded-lg border border-gray-200 text-center">
                        <p className="text-xs text-gray-600">
                          <span className="font-bold">{day.exercises.length}</span> exercise{day.exercises.length !== 1 ? 's' : ''}
                        </p>
                      </div>
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
