import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Loader2, Target, Clock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WorkoutGenerator() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [fitnessGoal, setFitnessGoal] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("");
  const [duration, setDuration] = useState("");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [limitations, setLimitations] = useState("");
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);

  const equipmentOptions = [
    "Dumbbells",
    "Barbell",
    "Resistance Bands",
    "Pull-up Bar",
    "Kettlebell",
    "No Equipment"
  ];

  const toggleEquipment = (item: string) => {
    setEquipment(prev =>
      prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]
    );
  };

  const handleGenerate = async () => {
    if (!fitnessGoal || !experienceLevel || !daysPerWeek || !duration) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate API call - Replace with actual FastAPI endpoint
    setTimeout(() => {
      setGeneratedWorkout({
        title: `${daysPerWeek}-Day ${fitnessGoal} Plan`,
        description: `Customized for ${experienceLevel} level, ${duration} sessions`,
        days: [
          {
            name: "Upper Body",
            exercises: [
              { name: "Push-ups", sets: 3, reps: "12-15" },
              { name: "Dumbbell Rows", sets: 3, reps: "10-12" },
              { name: "Shoulder Press", sets: 3, reps: "10-12" }
            ]
          }
        ]
      });
      setIsGenerating(false);
      toast({
        title: "Workout generated!",
        description: "Your personalized workout plan is ready.",
      });
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Dumbbell className="mr-3 h-6 w-6 text-emerald-600" />
            AI Workout Generator
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-300">
            Get a personalized workout plan tailored to your goals and experience
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Input Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="goal">Fitness Goal *</Label>
                <Select value={fitnessGoal} onValueChange={setFitnessGoal}>
                  <SelectTrigger id="goal" data-testid="select-fitness-goal">
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Muscle Building">Muscle Building</SelectItem>
                    <SelectItem value="Weight Loss">Weight Loss</SelectItem>
                    <SelectItem value="Strength">Strength</SelectItem>
                    <SelectItem value="Endurance">Endurance</SelectItem>
                    <SelectItem value="General Fitness">General Fitness</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="level">Experience Level *</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger id="level" data-testid="select-experience">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="days">Days Per Week *</Label>
                <Select value={daysPerWeek} onValueChange={setDaysPerWeek}>
                  <SelectTrigger id="days" data-testid="select-days-per-week">
                    <SelectValue placeholder="Select days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="4">4 Days</SelectItem>
                    <SelectItem value="5">5 Days</SelectItem>
                    <SelectItem value="6">6 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Session Duration *</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration" data-testid="select-duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30 minutes">30 minutes</SelectItem>
                    <SelectItem value="45 minutes">45 minutes</SelectItem>
                    <SelectItem value="60 minutes">60 minutes</SelectItem>
                    <SelectItem value="90 minutes">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Available Equipment</Label>
                <div className="flex flex-wrap gap-2">
                  {equipmentOptions.map((item) => (
                    <Badge
                      key={item}
                      variant={equipment.includes(item) ? "default" : "outline"}
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => toggleEquipment(item)}
                      data-testid={`badge-equipment-${item.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="limitations">Injuries or Limitations (optional)</Label>
                <Textarea
                  id="limitations"
                  value={limitations}
                  onChange={(e) => setLimitations(e.target.value)}
                  placeholder="E.g., lower back pain, knee injury..."
                  rows={3}
                  data-testid="textarea-limitations"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                data-testid="button-generate-workout"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Workout Plan
                  </>
                )}
              </Button>
            </div>

            {/* Right Column - Generated Workout */}
            <div>
              {generatedWorkout ? (
                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200">
                  <CardHeader>
                    <CardTitle className="flex items-center text-emerald-700 dark:text-emerald-300">
                      <Target className="mr-2 h-5 w-5" />
                      {generatedWorkout.title}
                    </CardTitle>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {generatedWorkout.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {generatedWorkout.days.map((day: any, idx: number) => (
                      <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-emerald-600" />
                          {day.name}
                        </h4>
                        <div className="space-y-2">
                          {day.exercises.map((exercise: any, eidx: number) => (
                            <div key={eidx} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {exercise.name}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {exercise.sets} × {exercise.reps}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-4">
                      💡 This is a preview. Full workout integration coming soon!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-8">
                  <div className="text-center">
                    <Dumbbell className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Fill in your details and generate your personalized workout plan
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
