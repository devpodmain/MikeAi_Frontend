import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, RotateCcw } from "lucide-react";

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const WEEKDAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

interface DayMappingEditorProps {
  planDays: number; // Number of days in the plan (e.g., 3, 4, 5, 6)
  defaultStartDay?: string; // Default start day (e.g., "monday")
  value?: Record<string, string>; // weekday → plan day index or "rest"
  onChange: (mapping: Record<string, string>) => void;
  planType?: "meal" | "workout";
}

export function DayMappingEditor({
  planDays,
  defaultStartDay = "monday",
  value,
  onChange,
  planType = "workout"
}: DayMappingEditorProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Initialize mapping with default values
  useEffect(() => {
    if (value && Object.keys(value).length > 0) {
      // Check if this is old format (planDayIndex → weekday) or new format (weekday → planDayIndex)
      const firstKey = Object.keys(value)[0];
      const firstValue = value[firstKey];
      const weekdayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      
      // Old format: keys are numbers (plan day indices), values are weekdays
      if (!isNaN(parseInt(firstKey)) && typeof firstValue === 'string' && weekdayNames.includes(firstValue.toLowerCase())) {
        // Convert old format to new format
        const newMapping: Record<string, string> = {};
        for (const [planDayIndex, weekday] of Object.entries(value)) {
          newMapping[weekday.toLowerCase()] = planDayIndex;
        }
        setMapping(newMapping);
        onChange(newMapping); // Update parent with new format
      } else {
        // Already new format
        setMapping(value);
      }
    } else {
      // Create default mapping: map weekdays sequentially to plan days, rest of week = rest
      const startIndex = WEEKDAYS.indexOf(defaultStartDay as any);
      const defaultMapping: Record<string, string> = {};
      
      for (let i = 0; i < 7; i++) {
        const weekdayIndex = (startIndex + i) % 7;
        const weekday = WEEKDAYS[weekdayIndex];
        
        if (i < planDays) {
          // Map to plan day index
          defaultMapping[weekday] = i.toString();
        } else {
          // Rest day
          defaultMapping[weekday] = "rest";
        }
      }
      
      setMapping(defaultMapping);
      onChange(defaultMapping);
    }
  }, [planDays, defaultStartDay, value, onChange]);

  const handleDayChange = (weekday: string, planDayValue: string) => {
    const oldValue = mapping[weekday];
    
    // If changing to "rest" from a plan day, cascade the plan day forward to the next available weekday
    if (planDayValue === "rest" && oldValue !== "rest" && oldValue !== undefined) {
      const removedPlanDay = oldValue; // The plan day we're removing from this weekday
      const newMapping = { ...mapping };
      
      // Set this weekday to rest
      newMapping[weekday] = "rest";
      
      // Cascade the plan day forward through all subsequent weekdays
      const currentWeekdayIndex = WEEKDAYS.indexOf(weekday as any);
      let dayToCascade = removedPlanDay;
      let foundRestDay = false;
      
      // Start from the next weekday and cascade forward
      for (let i = 1; i <= 7; i++) {
        const nextWeekdayIndex = (currentWeekdayIndex + i) % 7;
        const nextWeekday = WEEKDAYS[nextWeekdayIndex];
        const nextAssignment = newMapping[nextWeekday];
        
        if (nextAssignment === "rest") {
          // Found a rest day - place the cascading plan day here and stop
          newMapping[nextWeekday] = dayToCascade;
          foundRestDay = true;
          break;
        } else if (i === 7) {
          // Completed full circle, no rest day found
          // Place the final displaced day back on the current weekday (rotation effect)
          newMapping[weekday] = dayToCascade;
          break;
        } else {
          // This day already has a plan day - swap and continue cascading
          const temp = nextAssignment;
          newMapping[nextWeekday] = dayToCascade;
          dayToCascade = temp;
        }
      }
      
      setMapping(newMapping);
      onChange(newMapping);
    } 
    // If changing from "rest" to a plan day, check for duplicates and handle intelligently
    else if (oldValue === "rest" && planDayValue !== "rest") {
      const newMapping = { ...mapping, [weekday]: planDayValue };
      
      // Check if this plan day is already assigned elsewhere
      const duplicateWeekday = WEEKDAYS.find(
        wd => wd !== weekday && newMapping[wd] === planDayValue
      );
      
      // If duplicate exists, swap: give this weekday the selected plan day, and make the other one rest
      if (duplicateWeekday) {
        newMapping[duplicateWeekday] = "rest";
      }
      
      setMapping(newMapping);
      onChange(newMapping);
    }
    // Simple assignment change (e.g., changing from Day 1 to Day 2)
    else {
      const newMapping = { ...mapping, [weekday]: planDayValue };
      setMapping(newMapping);
      onChange(newMapping);
    }
  };

  const resetToDefault = () => {
    const startIndex = WEEKDAYS.indexOf(defaultStartDay as any);
    const defaultMapping: Record<string, string> = {};
    
    for (let i = 0; i < 7; i++) {
      const weekdayIndex = (startIndex + i) % 7;
      const weekday = WEEKDAYS[weekdayIndex];
      
      if (i < planDays) {
        defaultMapping[weekday] = i.toString();
      } else {
        defaultMapping[weekday] = "rest";
      }
    }
    
    setMapping(defaultMapping);
    onChange(defaultMapping);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Map Days to Week</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetToDefault}
          data-testid="button-reset-day-mapping"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Default
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Assign each weekday to a specific day from your {planDays}-day {planType} plan, or mark it as a rest day.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WEEKDAYS.map((weekday) => (
          <Card key={weekday} className="p-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                {WEEKDAY_LABELS[weekday]}
              </Label>
              <Select
                value={mapping[weekday] || "rest"}
                onValueChange={(value) => handleDayChange(weekday, value)}
              >
                <SelectTrigger data-testid={`select-${weekday}-mapping`}>
                  <SelectValue placeholder="Select assignment" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: planDays }).map((_, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {planType === "workout" ? `Day ${index + 1}` : `Meal Day ${index + 1}`}
                    </SelectItem>
                  ))}
                  <SelectItem value="rest">Rest Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-3">Weekly Schedule Preview</h4>
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAYS.map((weekday) => {
            const assignment = mapping[weekday];
            const isRest = !assignment || assignment === "rest";
            
            return (
              <div
                key={weekday}
                className={`p-3 rounded text-center text-sm ${
                  !isRest
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-background text-muted-foreground"
                }`}
                data-testid={`preview-${weekday}`}
              >
                <div className="font-semibold text-xs uppercase">
                  {weekday.slice(0, 3)}
                </div>
                <div className="mt-1 text-xs">
                  {isRest ? "Rest" : `Day ${parseInt(assignment) + 1}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
