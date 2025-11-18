import { useState } from 'react';
import { Clock, ChefHat, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Meal, RegenerateMealArgs } from '@/types/mealPlan';

interface MealCardProps {
  meal: Meal;
  day: string;
  onComplete: () => void;
  onRegenerate: (constraints?: RegenerateMealArgs['constraints']) => void;
  isRegenerating?: boolean;
}

export function MealCard({ meal, day, onComplete, onRegenerate, isRegenerating }: MealCardProps) {
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [constraints, setConstraints] = useState<RegenerateMealArgs['constraints']>({});

  const handleRegenerate = () => {
    onRegenerate(constraints);
    setShowRegenerateDialog(false);
    setConstraints({});
  };

  const formatSlotName = (slot: string) => {
    const names = {
      breakfast: 'Breakfast',
      lunch: 'Lunch', 
      dinner: 'Dinner',
      snack1: 'Morning Snack',
      snack2: 'Evening Snack',
    };
    return names[slot as keyof typeof names] || slot;
  };

  return (
    <Card className={`transition-all duration-200 ${meal.completed ? 'opacity-70 bg-green-50 dark:bg-green-900/20' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {formatSlotName(meal.slot)}
              {meal.completed && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </CardTitle>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mt-1">
              {meal.title}
            </h4>
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox
              checked={meal.completed}
              onCheckedChange={onComplete}
              className="h-5 w-5"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {meal.calories} cal
          </Badge>
          
          {meal.cuisine && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              <ChefHat className="h-3 w-3 mr-1" />
              {meal.cuisine}
            </Badge>
          )}
          
          {meal.prep_time_min && (
            <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              <Clock className="h-3 w-3 mr-1" />
              {meal.prep_time_min}m
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Macros */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-600">{meal.macros.protein}g</div>
            <div className="text-gray-500">Protein</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{meal.macros.carbs}g</div>
            <div className="text-gray-500">Carbs</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-yellow-600">{meal.macros.fat}g</div>
            <div className="text-gray-500">Fat</div>
          </div>
        </div>

        {/* Allergen flags */}
        {meal.allergen_flags && meal.allergen_flags.length > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <div className="flex flex-wrap gap-1">
              {meal.allergen_flags.map((allergen, index) => (
                <Badge key={index} variant="destructive" className="text-xs">
                  {allergen}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Ingredients */}
        <div>
          <h5 className="font-medium text-sm mb-2">Ingredients</h5>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {meal.ingredients.join(', ')}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h5 className="font-medium text-sm mb-2">Instructions</h5>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {meal.instructions}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isRegenerating}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Regenerate {formatSlotName(meal.slot)}</DialogTitle>
                <DialogDescription>
                  Customize the constraints for regenerating this meal.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-calories">Min Calories</Label>
                    <Input
                      id="min-calories"
                      type="number"
                      placeholder="300"
                      value={constraints?.calorie_range?.min || ''}
                      onChange={(e) => setConstraints(prev => ({
                        ...prev,
                        calorie_range: {
                          ...prev?.calorie_range,
                          min: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-calories">Max Calories</Label>
                    <Input
                      id="max-calories"
                      type="number"
                      placeholder="600"
                      value={constraints?.calorie_range?.max || ''}
                      onChange={(e) => setConstraints(prev => ({
                        ...prev,
                        calorie_range: {
                          ...prev?.calorie_range,
                          max: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="cuisine">Keep Cuisine</Label>
                  <Select
                    value={constraints?.keep_cuisine || undefined}
                    onValueChange={(value) => setConstraints(prev => ({
                      ...prev,
                      keep_cuisine: value === 'none' ? undefined : value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any cuisine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Any cuisine</SelectItem>
                      <SelectItem value="italian">Italian</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="mexican">Mexican</SelectItem>
                      <SelectItem value="indian">Indian</SelectItem>
                      <SelectItem value="japanese">Japanese</SelectItem>
                      <SelectItem value="american">American</SelectItem>
                      <SelectItem value="thai">Thai</SelectItem>
                      <SelectItem value="mediterranean">Mediterranean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="prep-time">Max Prep Time (minutes)</Label>
                  <Input
                    id="prep-time"
                    type="number"
                    placeholder="30"
                    value={constraints?.prep_time_max_min || ''}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      prep_time_max_min: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="avoid">Avoid Ingredients</Label>
                  <Textarea
                    id="avoid"
                    placeholder="eggs, dairy, nuts (comma-separated)"
                    value={constraints?.avoid || ''}
                    onChange={(e) => setConstraints(prev => ({
                      ...prev,
                      avoid: e.target.value || undefined
                    }))}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRegenerateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRegenerate} disabled={isRegenerating}>
                  Regenerate Meal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}