import { Calendar, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { MealCard } from './MealCard';
import { DayPlan, Meal, RegenerateMealArgs } from '@/types/mealPlan';

interface MealDayProps {
  dayPlan: DayPlan;
  onToggleMeal: (day: string, slot: Meal['slot']) => void;
  onRegenerateMeal: (day: string, slot: Meal['slot'], constraints?: RegenerateMealArgs['constraints']) => void;
  isRegenerating?: boolean;
}

export function MealDay({ 
  dayPlan, 
  onToggleMeal, 
  onRegenerateMeal, 
  isRegenerating 
}: MealDayProps) {
  const date = parseISO(dayPlan.date);
  const formattedDate = format(date, 'EEEE, MMMM d');
  const completedMeals = dayPlan.meals.filter(meal => meal.completed).length;
  const totalMeals = dayPlan.meals.length;
  
  // Sort meals by typical meal order
  const mealOrder = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'];
  const sortedMeals = [...dayPlan.meals].sort((a, b) => {
    return mealOrder.indexOf(a.slot) - mealOrder.indexOf(b.slot);
  });

  return (
    <AccordionItem value={dayPlan.date} className="border rounded-lg">
      <AccordionTrigger className="px-6 py-4 hover:no-underline">
        <div className="flex items-center justify-between w-full mr-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <h3 className="font-semibold text-lg">{formattedDate}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {completedMeals}/{totalMeals} meals completed
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {dayPlan.total_calories && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                {dayPlan.total_calories} cal
              </Badge>
            )}
            
            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedMeals / totalMeals) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="px-6 pb-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {sortedMeals.map((meal) => (
            <MealCard
              key={meal.slot}
              meal={meal}
              day={dayPlan.date}
              onComplete={() => onToggleMeal(dayPlan.date, meal.slot)}
              onRegenerate={(constraints) => onRegenerateMeal(dayPlan.date, meal.slot, constraints)}
              isRegenerating={isRegenerating}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}