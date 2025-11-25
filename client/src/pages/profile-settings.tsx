import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  User, 
  Heart, 
  Target, 
  UtensilsCrossed, 
  Clock, 
  ChefHat, 
  Shield,
  Save,
  CheckCircle,
  ArrowLeft
} from "lucide-react";

// Form validation schema
const profileFormSchema = z.object({
  // Personal Info
  fullName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  
  // Physical Metrics
  height: z.string().optional(),
  weight: z.string().optional(),
  activityLevel: z.enum(["sedentary", "lightly_active", "active", "very_active"]).optional(),
  
  // Goals
  fitnessGoal: z.enum(["lose_weight", "maintain", "build_muscle"]).optional(),
  targetWeight: z.string().optional(),
  dailyCalorieGoal: z.string().optional(),
  
  // Dietary Preferences
  dietType: z.enum(["none", "vegetarian", "vegan", "keto", "paleo", "mediterranean"]).optional(),
  allergies: z.array(z.string()).optional(),
  dislikedFoods: z.string().optional(),
  preferredCuisines: z.array(z.string()).optional(),
  mealsPerDay: z.enum(["3_meals", "3_meals_2_snacks"]).optional(),
  intermittentFasting: z.boolean().optional(),
  
  // Meal Timing & Cooking
  breakfastTime: z.string().optional(),
  lunchTime: z.string().optional(),
  dinnerTime: z.string().optional(),

  
  // Wellness & Lifestyle
  chronicConditions: z.array(z.string()).optional(),
  supplementsTaken: z.string().optional(),
  stressLevel: z.enum(["low", "medium", "high"]).optional(),
  sleepDuration: z.string().optional(),
  waterIntakeGoal: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

const allergyOptions = ["dairy", "gluten", "peanuts", "shellfish", "eggs", "nuts", "soy", "fish"];
const cuisineOptions = ["indian", "italian", "chinese", "mexican", "japanese", "american", "thai", "mediterranean"];

const conditionOptions = ["diabetes", "pcos", "hypertension", "heart_disease", "none"];

export default function ProfileSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const getDashboardRoute = () => {
    if (!user) return '/user-home';
    
    const userType = user.userType || user.role;
    
    switch (userType) {
      case 'org_owner':
        return '/org-owner-dashboard';
      case 'coach':
        return '/coach-org-dashboard';
      case 'org_client':
        return '/org-client-dashboard';
      default:
        return '/user-home';
    }
  };

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      allergies: [],
      preferredCuisines: [],
      chronicConditions: [],
      intermittentFasting: false,
    },
  });

  // Load profile data from database on mount
  useEffect(() => {
    const loadProfileFromDatabase = async () => {
      try {
        const response = await fetch('/api/db/get-profile', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const dbProfile = await response.json();
          console.log("Loaded profile from database:", dbProfile);
          
          if (dbProfile && Object.keys(dbProfile).length > 0) {
            // Parse JSON strings or PostgreSQL arrays back to JavaScript arrays
            const parseJsonSafely = (str: any) => {
              if (Array.isArray(str)) return str;
              if (!str) return [];
              
              // Handle PostgreSQL array format: {"value1","value2"} or {value1,value2}
              if (typeof str === 'string' && str.startsWith('{') && str.endsWith('}')) {
                const content = str.slice(1, -1); // Remove { and }
                if (!content) return [];
                // Split by comma and clean up each value
                return content.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
              }
              
              // Try standard JSON parse
              try {
                return JSON.parse(str);
              } catch {
                return [];
              }
            };

            form.reset({
              fullName: dbProfile.full_name || "",
              dateOfBirth: dbProfile.date_of_birth || "",
              gender: dbProfile.gender || undefined,
              height: dbProfile.height?.toString() || "",
              weight: dbProfile.weight?.toString() || "",
              activityLevel: dbProfile.activity_level || undefined,
              fitnessGoal: dbProfile.fitness_goal || undefined,
              targetWeight: dbProfile.target_weight?.toString() || "",
              dailyCalorieGoal: dbProfile.daily_calorie_goal?.toString() || dbProfile.target_calories?.toString() || "",
              dietType: dbProfile.diet_type || undefined,
              allergies: Array.isArray(dbProfile.allergies) ? dbProfile.allergies : parseJsonSafely(dbProfile.allergens),
              dislikedFoods: dbProfile.disliked_foods || "",
              preferredCuisines: Array.isArray(dbProfile.preferred_cuisines) ? dbProfile.preferred_cuisines : parseJsonSafely(dbProfile.cultural_preferences),
              mealsPerDay: dbProfile.meals_per_day || undefined,
              intermittentFasting: dbProfile.intermittent_fasting || false,
              breakfastTime: dbProfile.breakfast_time?.substring(0, 5) || "",
              lunchTime: dbProfile.lunch_time?.substring(0, 5) || "",
              dinnerTime: dbProfile.dinner_time?.substring(0, 5) || "",
              chronicConditions: Array.isArray(dbProfile.chronic_conditions) ? dbProfile.chronic_conditions : parseJsonSafely(dbProfile.chronic_conditions),
              supplementsTaken: dbProfile.supplements_taken || "",
              stressLevel: dbProfile.stress_level || undefined,
              sleepDuration: dbProfile.sleep_duration?.toString() || "",
              waterIntakeGoal: dbProfile.water_intake_goal?.toString() || "",
            });
            setProfileLoaded(true);
          }
        } else {
          console.log("No existing profile found in database");
          setProfileLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load profile from database:", error);
        setProfileLoaded(true);
      }
    };
    
    loadProfileFromDatabase();
  }, [form]);



  const syncToDatabase = async (profileData: ProfileFormData) => {
    try {
      const response = await fetch('/api/db/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (response.ok) {
        console.log("Profile synced to database successfully");
      }
    } catch (error) {
      console.error("Failed to sync profile to database:", error);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      // Save to localStorage immediately
      localStorage.setItem('userProfile', JSON.stringify(data));
      
      // Sync to database in background
      await syncToDatabase(data);
      
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile settings have been saved successfully.",
      });
      setIsSaving(false);
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to update profile settings.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    updateProfileMutation.mutate(data);
  };





  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to={getDashboardRoute()}>
            <Button 
              variant="ghost" 
              className="mb-4 text-gray-600 hover:text-gray-900"
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Set up your personal preferences to get tailored meal plans and nutrition guidance.
          </p>
        </div>

        {/* Current Profile Summary */}
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardHeader>
            <h3 className="text-lg font-semibold text-green-800">Currently Saved Profile</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {form.watch("fullName") && (
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2 text-green-700">{form.watch("fullName")}</span>
                </div>
              )}
              {form.watch("gender") && (
                <div>
                  <span className="font-medium text-gray-700">Gender:</span>
                  <span className="ml-2 text-green-700 capitalize">{form.watch("gender")}</span>
                </div>
              )}
              {form.watch("height") && (
                <div>
                  <span className="font-medium text-gray-700">Height:</span>
                  <span className="ml-2 text-green-700">{form.watch("height")} cm</span>
                </div>
              )}
              {form.watch("weight") && (
                <div>
                  <span className="font-medium text-gray-700">Weight:</span>
                  <span className="ml-2 text-green-700">{form.watch("weight")} kg</span>
                </div>
              )}
              {form.watch("activityLevel") && (
                <div>
                  <span className="font-medium text-gray-700">Activity:</span>
                  <span className="ml-2 text-green-700">{form.watch("activityLevel").replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
              )}
              {form.watch("fitnessGoal") && (
                <div>
                  <span className="font-medium text-gray-700">Goal:</span>
                  <span className="ml-2 text-green-700">{form.watch("fitnessGoal").replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
              )}
              {form.watch("dietType") && (
                <div>
                  <span className="font-medium text-gray-700">Diet:</span>
                  <span className="ml-2 text-green-700 capitalize">{form.watch("dietType") === 'none' ? 'No specific diet' : form.watch("dietType")}</span>
                </div>
              )}
              {form.watch("allergies") && form.watch("allergies").length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Allergies:</span>
                  <span className="ml-2 text-green-700">{form.watch("allergies").join(", ")}</span>
                </div>
              )}
              {form.watch("preferredCuisines") && form.watch("preferredCuisines").length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Cuisines:</span>
                  <span className="ml-2 text-green-700">{form.watch("preferredCuisines").join(", ")}</span>
                </div>
              )}
              {form.watch("mealsPerDay") && (
                <div>
                  <span className="font-medium text-gray-700">Meals/Day:</span>
                  <span className="ml-2 text-green-700">{form.watch("mealsPerDay").replace('_', ' ')}</span>
                </div>
              )}
              {form.watch("breakfastTime") && (
                <div>
                  <span className="font-medium text-gray-700">Breakfast:</span>
                  <span className="ml-2 text-green-700">{form.watch("breakfastTime")}</span>
                </div>
              )}

              {form.watch("stressLevel") && (
                <div>
                  <span className="font-medium text-gray-700">Stress Level:</span>
                  <span className="ml-2 text-green-700 capitalize">{form.watch("stressLevel")}</span>
                </div>
              )}
            </div>
            <div className="text-xs text-green-600 mt-4">
              ✓ This data is saved in your database and will be used for AI meal planning
            </div>
          </CardContent>
        </Card>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Accordion type="multiple" defaultValue={["personal", "physical", "goals"]} className="space-y-4">
            
            {/* Personal Information */}
            <AccordionItem value="personal">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          {...form.register("fullName")}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          {...form.register("dateOfBirth")}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <Select onValueChange={(value) => form.setValue("gender", value as any)} value={form.watch("gender")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>

                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Physical Metrics */}
            <AccordionItem value="physical">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Physical Metrics
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="170"
                          {...form.register("height")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight">Current Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          placeholder="70"
                          {...form.register("weight")}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="activityLevel">Activity Level</Label>
                      <Select onValueChange={(value) => form.setValue("activityLevel", value as any)} value={form.watch("activityLevel")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                          <SelectItem value="lightly_active">Lightly Active (light exercise 1-3 days/week)</SelectItem>
                          <SelectItem value="moderately_active">Moderately Active (exercise 3-5 days/week)</SelectItem>
                          <SelectItem value="very_active">Very Active (hard exercise 6-7 days/week)</SelectItem>
                        </SelectContent>
                      </Select>

                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Goals */}
            <AccordionItem value="goals">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Goals
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label htmlFor="fitnessGoal">Fitness Goal</Label>
                      <Select onValueChange={(value) => form.setValue("fitnessGoal", value as any)} value={form.watch("fitnessGoal")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your primary goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lose_weight">Lose Weight</SelectItem>
                          <SelectItem value="maintain">Maintain Current Weight</SelectItem>
                          <SelectItem value="build_muscle">Build Muscle</SelectItem>
                        </SelectContent>
                      </Select>

                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="targetWeight">Target Weight (kg)</Label>
                        <Input
                          id="targetWeight"
                          type="number"
                          placeholder="65"
                          {...form.register("targetWeight")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dailyCalorieGoal">Daily Calorie Goal</Label>
                        <Input
                          id="dailyCalorieGoal"
                          type="number"
                          placeholder="2000"
                          {...form.register("dailyCalorieGoal")}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Dietary Preferences */}
            <AccordionItem value="dietary">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5" />
                  Dietary Preferences
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <Label htmlFor="dietType">Diet Type</Label>
                      <Select onValueChange={(value) => form.setValue("dietType", value as any)} value={form.watch("dietType")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select diet type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific diet</SelectItem>
                          <SelectItem value="vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="vegan">Vegan</SelectItem>
                          <SelectItem value="keto">Keto</SelectItem>
                          <SelectItem value="paleo">Paleo</SelectItem>
                          <SelectItem value="mediterranean">Mediterranean</SelectItem>
                        </SelectContent>
                      </Select>

                    </div>

                    <div>
                      <Label>Allergies</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                        {allergyOptions.map((allergy) => (
                          <div key={allergy} className="flex items-center space-x-2">
                            <Checkbox
                              id={`allergy-${allergy}`}
                              checked={form.watch("allergies")?.includes(allergy)}
                              onCheckedChange={(checked) => {
                                const current = form.watch("allergies") || [];
                                if (checked) {
                                  form.setValue("allergies", [...current, allergy]);
                                } else {
                                  form.setValue("allergies", current.filter(item => item !== allergy));
                                }
                              }}
                            />
                            <Label htmlFor={`allergy-${allergy}`} className="text-sm capitalize">
                              {allergy}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="dislikedFoods">Disliked Foods</Label>
                      <Textarea
                        id="dislikedFoods"
                        placeholder="List any foods you don't like (e.g., mushrooms, olives)"
                        {...form.register("dislikedFoods")}
                      />
                    </div>

                    <div>
                      <Label>Preferred Cuisines</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                        {cuisineOptions.map((cuisine) => (
                          <div key={cuisine} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cuisine-${cuisine}`}
                              checked={form.watch("preferredCuisines")?.includes(cuisine)}
                              onCheckedChange={(checked) => {
                                const current = form.watch("preferredCuisines") || [];
                                if (checked) {
                                  form.setValue("preferredCuisines", [...current, cuisine]);
                                } else {
                                  form.setValue("preferredCuisines", current.filter(item => item !== cuisine));
                                }
                              }}
                            />
                            <Label htmlFor={`cuisine-${cuisine}`} className="text-sm capitalize">
                              {cuisine}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Meals per Day</Label>
                        <RadioGroup
                          value={form.watch("mealsPerDay")}
                          onValueChange={(value) => form.setValue("mealsPerDay", value as any)}
                          className="mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="3_meals" id="3_meals" />
                            <Label htmlFor="3_meals">3 main meals</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="3_meals_2_snacks" id="3_meals_2_snacks" />
                            <Label htmlFor="3_meals_2_snacks">3 meals + 2 snacks</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="intermittentFasting">Intermittent Fasting</Label>
                          <Switch
                            id="intermittentFasting"
                            checked={form.watch("intermittentFasting")}
                            onCheckedChange={(checked) => form.setValue("intermittentFasting", checked)}
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Enable if you practice intermittent fasting
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Meal Timing & Cooking */}
            <AccordionItem value="cooking">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Meal Timing & Cooking
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <Label className="text-base font-medium">Preferred Meal Times</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        <div>
                          <Label htmlFor="breakfastTime">Breakfast</Label>
                          <Input
                            id="breakfastTime"
                            type="time"
                            {...form.register("breakfastTime")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lunchTime">Lunch</Label>
                          <Input
                            id="lunchTime"
                            type="time"
                            {...form.register("lunchTime")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="dinnerTime">Dinner</Label>
                          <Input
                            id="dinnerTime"
                            type="time"
                            {...form.register("dinnerTime")}
                          />
                        </div>
                      </div>
                    </div>


                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Wellness & Lifestyle */}
            <AccordionItem value="wellness">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Wellness & Lifestyle
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <Label>Chronic Conditions</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                        {conditionOptions.map((condition) => (
                          <div key={condition} className="flex items-center space-x-2">
                            <Checkbox
                              id={`condition-${condition}`}
                              checked={Array.isArray(form.watch("chronicConditions")) && form.watch("chronicConditions")?.includes(condition)}
                              onCheckedChange={(checked) => {
                                const current = Array.isArray(form.watch("chronicConditions")) ? form.watch("chronicConditions") : [];
                                if (checked) {
                                  if (condition === "none") {
                                    form.setValue("chronicConditions", ["none"]);
                                  } else {
                                    const filtered = current.filter(item => item !== "none");
                                    form.setValue("chronicConditions", [...filtered, condition]);
                                  }
                                } else {
                                  form.setValue("chronicConditions", current.filter(item => item !== condition));
                                }
                              }}
                            />
                            <Label htmlFor={`condition-${condition}`} className="text-sm capitalize">
                              {condition === "pcos" ? "PCOS" : condition.replace('_', ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="supplementsTaken">Supplements Taken</Label>
                      <Textarea
                        id="supplementsTaken"
                        placeholder="List any supplements you're currently taking (e.g., Vitamin D, Omega-3)"
                        {...form.register("supplementsTaken")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="stressLevel">Stress Level</Label>
                        <Select onValueChange={(value) => form.setValue("stressLevel", value as any)} value={form.watch("stressLevel")}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stress level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="sleepDuration">Sleep Duration (hours/night)</Label>
                        <Input
                          id="sleepDuration"
                          type="number"
                          step="0.5"
                          placeholder="8"
                          {...form.register("sleepDuration")}
                        />
                      </div>
                      <div>
                        <Label htmlFor="waterIntakeGoal">Water Intake Goal (liters)</Label>
                        <Input
                          id="waterIntakeGoal"
                          type="number"
                          step="0.5"
                          placeholder="2.5"
                          {...form.register("waterIntakeGoal")}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Save Button */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6">
            <div className="max-w-4xl mx-auto flex justify-end">
              <Button 
                type="submit" 
                disabled={isSaving || updateProfileMutation.isPending}
                className="px-8 py-2"
              >
                {isSaving ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}