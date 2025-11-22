import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCard } from "@/components/ui/animated-card";
import { OrgMessaging } from "@/components/org-messaging";
import { DayMappingEditor } from "@/components/DayMappingEditor";
import { 
  Users, ChefHat, Dumbbell, BarChart3, MessageSquare, Calendar,
  Search, Filter, Eye, Send, Plus, Clock, Activity, TrendingUp,
  Award, ChevronRight, Building2, Target, Trophy, Star,
  FileText, CheckCircle2, AlertCircle, User, Mail, Trash2, X, Sparkles, Clipboard, Settings, Edit, Lock, Loader2
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  activePlans: number;
  lastActivity: string;
  progress: number;
  mealPlan?: string;
  workoutPlan?: string;
}

interface Plan {
  id: string;
  name: string;
  type: 'meal' | 'workout';
  createdDate: string;
  assignedCount: number;
  description?: string;
  weeks?: number;
  isTemplate?: boolean;
  planData?: any;
  createdBy?: string;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  type: 'announcement' | 'client' | 'organization';
  isRead?: boolean;
}

interface MealDay {
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
}

interface WorkoutDay {
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    rest: number;
  }>;
}

export default function CoachOrgDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("clients");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [assignPlanOpen, setAssignPlanOpen] = useState(false);
  const [viewClientOpen, setViewClientOpen] = useState(false);
  const [createMealPlanOpen, setCreateMealPlanOpen] = useState(false);
  const [createWorkoutPlanOpen, setCreateWorkoutPlanOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [aiMealPlanDialogOpen, setAiMealPlanDialogOpen] = useState(false);
  const [aiWorkoutPlanDialogOpen, setAiWorkoutPlanDialogOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  
  // Edit day mapping states
  const [editDayMappingOpen, setEditDayMappingOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [editDayMapping, setEditDayMapping] = useState<Record<string, string>>({});
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState("");
  
  // Plan editing states
  const [mealPlanIdBeingEdited, setMealPlanIdBeingEdited] = useState<string | null>(null);
  const [workoutPlanIdBeingEdited, setWorkoutPlanIdBeingEdited] = useState<string | null>(null);
  
  // Form states
  const [mealPlanForm, setMealPlanForm] = useState({ name: "", description: "", planData: "" });
  const [workoutPlanForm, setWorkoutPlanForm] = useState({ name: "", description: "", planData: "" });
  
  // Visual plan builders
  const [mealDays, setMealDays] = useState<Array<{day: string, meals: Array<{type: string, name: string, calories: string, protein: string, carbs: string, fats: string}>}>>([
    { day: "Monday", meals: [] }
  ]);
  const [workoutDays, setWorkoutDays] = useState<Array<{day: string, exercises: Array<{name: string, sets: string, reps: string, rest: string}>}>>([
    { day: "Monday", exercises: [] }
  ]);
  
  const [assignForm, setAssignForm] = useState({
    clientIds: [] as string[],
    planType: "meal",
    planId: "",
    startDate: "",
    endDate: "",
    dayMapping: {} as Record<string, string>
  });
  
  const [messageContent, setMessageContent] = useState("");
  const [messageType, setMessageType] = useState<"announcement" | "reply">("announcement");
  
  // AI generation forms
  const [aiMealForm, setAiMealForm] = useState({
    goal: "maintain" as "lose_weight" | "maintain" | "build_muscle",
    dietType: "none" as "none" | "vegetarian" | "vegan" | "keto" | "paleo" | "mediterranean",
    cuisineType: "any" as "any" | "italian" | "mexican" | "chinese" | "japanese" | "mediterranean" | "american" | "indian" | "thai" | "korean" | "french",
    allergies: "",
    caloriesTarget: "",
    days: 7,
    mealsPerDay: 5
  });
  const [aiWorkoutForm, setAiWorkoutForm] = useState({
    goal: "general_fitness" as "hypertrophy" | "strength" | "fat_loss" | "general_fitness",
    daysPerWeek: 3,
    equipment: [] as string[],
    injuries: "",
    desiredSplit: "auto" as "auto" | "full-body" | "upper/lower" | "push/pull/legs",
    weeks: 4
  });

  // Get organization ID from user context
  const orgId = (user as any)?.currentOrgId || 1;
  const coachId = (user as any)?.id || 'coach-1';
  const coachName = `${user?.firstName} ${user?.lastName}` || 'Coach';
  const orgName = (user as any)?.organizationName || 'Fitness Organization';

  // Billing status check - this query will detect 402 errors with locked: true
  const { data: clientsResponse, isLoading: loadingClients, error: clientsError } = useQuery({
    queryKey: ['/api/organizations', orgId, 'clients'],
    enabled: !!orgId
  });

  const { data: plansResponse, isLoading: loadingPlans, error: plansError } = useQuery({
    queryKey: ['/api/organizations', orgId, 'plans'],
    enabled: !!orgId
  });

  const { data: messagesData = [], isLoading: loadingMessages, error: messagesError } = useQuery({
    queryKey: ['/api/organizations', orgId, 'messages', coachId],
    queryFn: async () => {
      return [];
    },
    enabled: !!orgId && activeTab === 'messages'
  });

  const { data: analyticsData, isLoading: loadingAnalytics, error: analyticsError } = useQuery({
    queryKey: ['/api/organizations', orgId, 'analytics'],
    queryFn: () => apiRequest(`/api/organizations/${orgId}/analytics`, 'GET'),
    enabled: !!orgId
  });

  const { data: assignmentsData, isLoading: loadingAssignments, error: assignmentsError } = useQuery({
    queryKey: ['/api/organizations', orgId, 'plan-assignments'],
    queryFn: () => apiRequest(`/api/organizations/${orgId}/plan-assignments`, 'GET'),
    enabled: !!orgId
  });

  // Check if any query returned a 402 error with locked: true
  const checkBillingLock = (error: any) => {
    if (!error) return false;
    
    // Check if error is a Response object with 402 status
    if (error instanceof Response && error.status === 402) {
      return true; // 402 = billing locked
    }
    
    // Check if error has status 402 directly
    if (error.status === 402) {
      return true;
    }
    
    // Check parsed error data
    const errorData = error.response?.data || error.data || {};
    return errorData.locked === true || errorData.requiresUpgrade === true;
  };

  const isBillingLocked = 
    checkBillingLock(clientsError) || 
    checkBillingLock(plansError) || 
    checkBillingLock(analyticsError) || 
    checkBillingLock(assignmentsError);

  // Render lock screen if billing is locked
  if (isBillingLocked) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full" data-testid="card-subscription-lock">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-600 dark:text-red-400" data-testid="icon-lock" />
            </div>
            <CardTitle data-testid="text-lock-title">Access Locked</CardTitle>
            <CardDescription data-testid="text-lock-description">
              Organization billing has expired or is inactive
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600 dark:text-slate-400" data-testid="text-lock-message">
              Please contact your organization owner to renew access to continue using all features.
            </p>
            <Button asChild className="w-full" data-testid="button-return-home">
              <Link href="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform API data to UI format
  const clientsData: Client[] = ((clientsResponse as any)?.clients || []).map((client: any) => ({
    id: client.id.toString(),
    name: `${client.firstName} ${client.lastName}`,
    email: client.email,
    activePlans: client.activePlans || 0,
    lastActivity: client.lastActivity || "No activity",
    progress: client.progress || 0,
    mealPlan: client.mealPlan,
    workoutPlan: client.workoutPlan
  }));

  // Combine meal plans and workout plans
  const mealPlans = ((plansResponse as any)?.mealPlans || []).map((plan: any) => ({
    id: plan.id.toString(),
    name: plan.name,
    type: 'meal' as const,
    createdDate: plan.createdAt,
    assignedCount: plan.assignedCount || 0,
    weeks: plan.weekNumber,
    isTemplate: plan.isTemplate,
    planData: plan.planData,
    createdBy: plan.createdBy
  }));

  const workoutPlans = ((plansResponse as any)?.workoutPlans || []).map((plan: any) => ({
    id: plan.id.toString(),
    name: plan.name,
    type: 'workout' as const,
    createdDate: plan.createdAt,
    assignedCount: plan.assignedCount || 0,
    weeks: plan.weekNumber,
    isTemplate: plan.isTemplate,
    planData: plan.planData,
    createdBy: plan.createdBy
  }));

  const plansData: Plan[] = [...mealPlans, ...workoutPlans];

  // Helper function to get the number of days from a selected plan
  const getSelectedPlanDays = (): number => {
    if (!assignForm.planId) return 0;
    const selectedPlan = plansData.find(p => p.id === assignForm.planId);
    if (!selectedPlan?.planData?.days) return 0;
    return selectedPlan.planData.days.length;
  };

  // Mutations
  const createMealPlanMutation = useMutation({
    mutationFn: (data: typeof mealPlanForm) => {
      const planData = {
        days: mealDays.map(day => ({
          day: day.day,
          meals: day.meals.map(meal => ({
            type: meal.type,
            name: meal.name,
            calories: parseInt(meal.calories) || 0,
            protein: parseInt(meal.protein) || 0,
            carbs: parseInt(meal.carbs) || 0,
            fats: parseInt(meal.fats) || 0
          }))
        }))
      };
      
      if (mealPlanIdBeingEdited) {
        // Update existing meal plan
        return apiRequest(`/api/organizations/${orgId}/meal-plans/${mealPlanIdBeingEdited}`, 'PATCH', {
          name: data.name,
          description: data.description,
          planData
        });
      } else {
        // Create new meal plan
        return apiRequest(`/api/organizations/${orgId}/meal-plans`, 'POST', {
          name: data.name,
          description: data.description,
          planData
        });
      }
    },
    onSuccess: () => {
      toast({ title: mealPlanIdBeingEdited ? "Meal plan updated successfully" : "Meal plan created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'analytics'] });
      setCreateMealPlanOpen(false);
      setMealPlanForm({ name: "", description: "", planData: "" });
      setMealDays([{ day: "Monday", meals: [] }]);
      setMealPlanIdBeingEdited(null);
    },
    onError: (error: any) => {
      toast({ 
        title: mealPlanIdBeingEdited ? "Failed to update meal plan" : "Failed to create meal plan", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const createWorkoutPlanMutation = useMutation({
    mutationFn: (data: typeof workoutPlanForm) => {
      const planData = {
        days: workoutDays.map(day => ({
          day: day.day,
          exercises: day.exercises.map(ex => ({
            name: ex.name,
            sets: parseInt(ex.sets) || 0,
            reps: parseInt(ex.reps) || 0,
            rest: parseInt(ex.rest) || 0
          }))
        }))
      };
      
      if (workoutPlanIdBeingEdited) {
        // Update existing workout plan
        return apiRequest(`/api/organizations/${orgId}/workout-plans/${workoutPlanIdBeingEdited}`, 'PATCH', {
          name: data.name,
          description: data.description,
          planData
        });
      } else {
        // Create new workout plan
        return apiRequest(`/api/organizations/${orgId}/workout-plans`, 'POST', {
          name: data.name,
          description: data.description,
          planData
        });
      }
    },
    onSuccess: () => {
      toast({ title: workoutPlanIdBeingEdited ? "Workout plan updated successfully" : "Workout plan created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'analytics'] });
      setCreateWorkoutPlanOpen(false);
      setWorkoutPlanForm({ name: "", description: "", planData: "" });
      setWorkoutDays([{ day: "Monday", exercises: [] }]);
      setWorkoutPlanIdBeingEdited(null);
    },
    onError: (error: any) => {
      toast({ 
        title: workoutPlanIdBeingEdited ? "Failed to update workout plan" : "Failed to create workout plan", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const assignPlanMutation = useMutation({
    mutationFn: async (data: typeof assignForm) => {
      return await apiRequest(
        `/api/organizations/${orgId}/plans/assign`,
        'POST',
        {
          clientIds: data.clientIds,
          planId: parseInt(data.planId),
          planType: data.planType,
          startsAt: data.startDate, // API expects startsAt, not startDate
          endsAt: data.endDate || undefined, // API expects endsAt, not endDate
          dayMapping: data.dayMapping || undefined // Send dayMapping if available
        }
      );
    },
    onSuccess: () => {
      toast({ 
        title: "Plan assigned successfully",
        description: `The plan has been assigned to ${assignForm.clientIds.length} client(s).`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'plan-assignments'] });
      setAssignPlanOpen(false);
      setAssignForm({
        clientIds: [],
        planType: "meal",
        planId: "",
        startDate: "",
        endDate: "",
        dayMapping: {}
      });
    }
  });

  const updateDayMappingMutation = useMutation({
    mutationFn: ({ assignmentId, dayMapping }: { assignmentId: number; dayMapping: Record<string, string> }) => 
      apiRequest(`/api/organizations/${orgId}/plan-assignments/${assignmentId}/day-mapping`, 'PATCH', { dayMapping }),
    onSuccess: () => {
      toast({ title: "Day mapping updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'plan-assignments'] });
      setEditDayMappingOpen(false);
      setEditingAssignment(null);
      setEditDayMapping({});
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update day mapping", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; type: string; recipients?: string[] }) => {
      // Mock API call
      console.log('Sending message:', data);
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: "Message sent successfully" });
      setMessageContent("");
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'messages'] });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async () => {
      if (!itemToDelete) return;
      const { type, id } = itemToDelete;
      
      if (type === 'plan') {
        return apiRequest(`/api/organizations/${orgId}/plans/${id}`, 'DELETE');
      }
    },
    onSuccess: () => {
      toast({ title: "Plan deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'analytics'] });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete plan", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Helper functions
  const canDeletePlan = (plan: Plan): boolean => {
    if (!user) return false;
    // Org owners can delete any plan
    if (user.userType === 'org_owner') return true;
    // Coaches can only delete plans they created
    return plan.createdBy === user.id;
  };

  const handleDelete = (type: string, id: number | string, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteConfirmOpen(true);
  };

  // Meal plan builder helpers
  const addMealDay = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const nextDay = days[mealDays.length % 7];
    setMealDays([...mealDays, { day: nextDay, meals: [] }]);
  };

  const removeMealDay = (index: number) => {
    setMealDays(mealDays.filter((_, i) => i !== index));
  };

  const addMealToDay = (dayIndex: number) => {
    const updated = [...mealDays];
    updated[dayIndex].meals.push({ type: "Breakfast", name: "", calories: "", protein: "", carbs: "", fats: "" });
    setMealDays(updated);
  };

  const removeMealFromDay = (dayIndex: number, mealIndex: number) => {
    const updated = [...mealDays];
    updated[dayIndex].meals.splice(mealIndex, 1);
    setMealDays(updated);
  };

  const updateMeal = (dayIndex: number, mealIndex: number, field: string, value: string) => {
    const updated = [...mealDays];
    (updated[dayIndex].meals[mealIndex] as any)[field] = value;
    setMealDays(updated);
  };

  // Workout plan builder helpers
  const addWorkoutDay = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const nextDay = days[workoutDays.length % 7];
    setWorkoutDays([...workoutDays, { day: nextDay, exercises: [] }]);
  };

  const removeWorkoutDay = (index: number) => {
    setWorkoutDays(workoutDays.filter((_, i) => i !== index));
  };

  const addExerciseToDay = (dayIndex: number) => {
    const updated = [...workoutDays];
    updated[dayIndex].exercises.push({ name: "", sets: "", reps: "", rest: "" });
    setWorkoutDays(updated);
  };

  const removeExerciseFromDay = (dayIndex: number, exerciseIndex: number) => {
    const updated = [...workoutDays];
    updated[dayIndex].exercises.splice(exerciseIndex, 1);
    setWorkoutDays(updated);
  };

  const updateExercise = (dayIndex: number, exerciseIndex: number, field: string, value: string) => {
    const updated = [...workoutDays];
    (updated[dayIndex].exercises[exerciseIndex] as any)[field] = value;
    setWorkoutDays(updated);
  };

  // 7-day template generators
  const generate7DayMealTemplate = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];
    
    setMealDays(days.map(day => ({
      day,
      meals: mealTypes.map(type => ({
        type,
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: ""
      }))
    })));
    
    toast({ 
      title: "7-Day Template Generated", 
      description: "All 7 days added with 4 meals each. Customize as needed!" 
    });
  };

  const generate7DayWorkoutTemplate = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    setWorkoutDays(days.map(day => ({
      day,
      exercises: [
        { name: "", sets: "", reps: "", rest: "" }
      ]
    })));
    
    toast({ 
      title: "7-Day Template Generated", 
      description: "All 7 days added with blank exercises. Customize as needed!" 
    });
  };

  // Reset form functions
  const resetMealPlanForm = () => {
    setMealPlanIdBeingEdited(null);
    setMealPlanForm({ name: "", description: "", planData: "" });
    setMealDays([{ day: "Monday", meals: [] }]);
    setCreateMealPlanOpen(true);
  };

  const resetWorkoutPlanForm = () => {
    setWorkoutPlanIdBeingEdited(null);
    setWorkoutPlanForm({ name: "", description: "", planData: "" });
    setWorkoutDays([{ day: "Monday", exercises: [] }]);
    setCreateWorkoutPlanOpen(true);
  };

  // Edit plan handlers
  const handleEditMealPlan = (plan: any) => {
    setMealPlanIdBeingEdited(plan.id);
    setMealPlanForm({
      name: plan.name,
      description: plan.description || "",
      planData: ""
    });
    
    if (plan.planData && plan.planData.days) {
      setMealDays(plan.planData.days.map((day: any) => ({
        day: day.day,
        meals: day.meals.map((meal: any) => ({
          type: meal.type || "Breakfast",
          name: meal.name || "",
          calories: String(meal.calories || ""),
          protein: String(meal.protein || ""),
          carbs: String(meal.carbs || ""),
          fats: String(meal.fats || "")
        }))
      })));
    }
    
    setCreateMealPlanOpen(true);
  };

  const handleEditWorkoutPlan = (plan: any) => {
    setWorkoutPlanIdBeingEdited(plan.id);
    setWorkoutPlanForm({
      name: plan.name,
      description: plan.description || "",
      planData: ""
    });
    
    if (plan.planData && plan.planData.days) {
      setWorkoutDays(plan.planData.days.map((day: any) => ({
        day: day.day,
        exercises: day.exercises.map((ex: any) => ({
          name: ex.name || "",
          sets: String(ex.sets || ""),
          reps: String(ex.reps || ""),
          rest: String(ex.rest || "")
        }))
      })));
    }
    
    setCreateWorkoutPlanOpen(true);
  };

  // Helper function to map AI slot values to dropdown values
  const mapSlotToDropdownValue = (slot: string): string => {
    const mapping: Record<string, string> = {
      'breakfast': 'Breakfast',
      'lunch': 'Lunch',
      'dinner': 'Dinner',
      'snack1': 'Snack',
      'snack2': 'Snack'
    };
    return mapping[slot.toLowerCase()] || 'Breakfast';
  };

  // AI Generation handlers
  const generateAIMealPlan = async () => {
    setAiGenerating(true);
    try {
      // Build profile from AI form data
      const profile = {
        user_id: "coach-generated",
        fitness_goal: aiMealForm.goal,
        diet_type: aiMealForm.dietType,
        preferred_cuisines: aiMealForm.cuisineType !== "any" ? [aiMealForm.cuisineType] : [],
        allergies: aiMealForm.allergies ? aiMealForm.allergies.split(',').map(a => a.trim()) : [],
        daily_calorie_goal: aiMealForm.caloriesTarget ? parseInt(aiMealForm.caloriesTarget) : undefined
      };
      
      console.log("=== AI MEAL PLAN REQUEST ===");
      console.log("Profile:", profile);
      console.log("Days:", aiMealForm.days);
      console.log("Meals per day:", aiMealForm.mealsPerDay);

      // Call AI endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://mikeai.co/fastapi'}/ai/meal-plans/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          days: aiMealForm.days,
          mealsPerDay: aiMealForm.mealsPerDay,
          provider: "openai",
          model: "gpt-4o-mini"
        })
      });

      if (!response.ok) throw new Error('Failed to generate meal plan');
      
      const data = await response.json();
      
      console.log("=== AI MEAL PLAN RESPONSE ===");
      console.log("Full response:", JSON.stringify(data, null, 2));
      
      if (!data.success || !data.plan) throw new Error('Invalid response from AI');

      // Transform AI response to mealDays format
      const generatedDays = data.plan.days.map((day: any, dayIndex: number) => {
        console.log(`=== Day ${dayIndex + 1}: ${day.day_name} ===`);
        return {
          day: day.day_name,
          meals: day.meals.map((meal: any, mealIndex: number) => {
            const aiSlot = meal.slot || meal.meal_type || "breakfast";
            const dropdownValue = mapSlotToDropdownValue(aiSlot);
            
            const transformedMeal = {
              type: dropdownValue,
              name: meal.title || meal.name || "",
              calories: String(meal.calories || ""),
              protein: String(meal.macros?.protein || ""),
              carbs: String(meal.macros?.carbs || ""),
              fats: String(meal.macros?.fat || meal.macros?.fats || "")
            };
            console.log(`  Meal ${mealIndex + 1}:`, {
              originalSlot: aiSlot,
              mappedType: dropdownValue,
              name: transformedMeal.name,
              calories: transformedMeal.calories
            });
            return transformedMeal;
          })
        };
      });

      setMealDays(generatedDays);
      setAiMealPlanDialogOpen(false);
      
      // Reset AI form for next use
      setAiMealForm({
        goal: "maintain",
        dietType: "none",
        cuisineType: "any",
        allergies: "",
        caloriesTarget: "",
        days: 7,
        mealsPerDay: 5
      });
      
      toast({
        title: "AI Meal Plan Generated!",
        description: `Generated ${generatedDays.length}-day meal plan. Review and edit as needed.`
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate meal plan with AI",
        variant: "destructive"
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const generateAIWorkoutPlan = async () => {
    setAiGenerating(true);
    try {
      // Build profile from AI form data
      const profile = {
        user_id: "coach-generated"
      };

      const prefs = {
        goal: aiWorkoutForm.goal,
        days_per_week: aiWorkoutForm.daysPerWeek,
        equipment: aiWorkoutForm.equipment,
        injuries: aiWorkoutForm.injuries || undefined,
        desired_split: aiWorkoutForm.desiredSplit
      };

      // Call AI endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://mikeai.co/fastapi'}/ai/workouts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          prefs,
          weeks: aiWorkoutForm.weeks
        })
      });

      if (!response.ok) throw new Error('Failed to generate workout plan');
      
      const data = await response.json();
      
      if (!data.success || !data.data) throw new Error('Invalid response from AI');

      // Transform AI response to workoutDays format
      const workoutPlan = data.data;
      const generatedDays = workoutPlan.days.map((day: any) => ({
        day: day.name,
        exercises: day.items.map((item: any) => ({
          name: item.exercise,
          sets: String(item.sets || ""),
          reps: String(item.reps || ""),
          rest: String(item.restSec ? `${item.restSec}s` : "")
        }))
      }));

      setWorkoutDays(generatedDays);
      setAiWorkoutPlanDialogOpen(false);
      
      // Reset AI form for next use
      setAiWorkoutForm({
        goal: "general_fitness",
        daysPerWeek: 3,
        equipment: [],
        injuries: "",
        desiredSplit: "auto",
        weeks: 4
      });
      
      toast({
        title: "AI Workout Plan Generated!",
        description: `Generated ${generatedDays.length}-day workout plan. Review and edit as needed.`
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate workout plan with AI",
        variant: "destructive"
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const filteredClients = clientsData.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Use analytics data if available, fallback to manual calculation
  const analytics = analyticsData?.analytics;
  const stats = {
    totalClients: analytics?.totalClients ?? clientsData.length,
    activePlans: analytics?.activePlans ?? clientsData.reduce((acc, client) => acc + client.activePlans, 0),
    avgProgress: clientsData.length > 0 
      ? Math.round(clientsData.reduce((acc, client) => acc + client.progress, 0) / clientsData.length)
      : 0,
    completionRate: analytics?.completionRate ?? 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-8 mb-8 border border-teal-200 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Building2 className="w-6 h-6 text-teal-600" />
                <span className="text-teal-600/80 text-sm font-medium">{orgName}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {coachName}!
              </h1>
              <p className="text-gray-700">Manage your clients and create personalized plans</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <AnimatedCard className="bg-white p-4 rounded-xl border border-teal-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Clients</p>
                    <p className="text-2xl font-bold text-teal-600">{stats.totalClients}</p>
                  </div>
                  <Users className="w-8 h-8 text-teal-600/50" />
                </div>
              </AnimatedCard>
              
              <AnimatedCard className="bg-white p-4 rounded-xl border border-teal-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Active Plans</p>
                    <p className="text-2xl font-bold text-teal-600">{stats.activePlans}</p>
                  </div>
                  <FileText className="w-8 h-8 text-teal-600/50" />
                </div>
              </AnimatedCard>
              
              <AnimatedCard className="bg-white p-4 rounded-xl border border-teal-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Avg Progress</p>
                    <p className="text-2xl font-bold text-teal-600">{stats.avgProgress}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-teal-600/50" />
                </div>
              </AnimatedCard>
              
              <AnimatedCard className="bg-white p-4 rounded-xl border border-teal-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Completion</p>
                    <p className="text-2xl font-bold text-teal-600">{stats.completionRate}%</p>
                  </div>
                  <Trophy className="w-8 h-8 text-teal-600/50" />
                </div>
              </AnimatedCard>
            </div>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 border border-gray-200">
            <TabsTrigger value="clients" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              My Clients
            </TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Progress
            </TabsTrigger>
          </TabsList>

          {/* My Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">My Clients</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage and monitor your assigned clients
                </CardDescription>
                <div className="flex items-center space-x-2 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4" />
                    <Input
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-50 border-gray-300 text-gray-900"
                    />
                  </div>
                  <Button variant="outline" size="icon" className="border-gray-300">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-600">Client Name</TableHead>
                      <TableHead className="text-gray-600">Email</TableHead>
                      <TableHead className="text-gray-600">Active Plans</TableHead>
                      <TableHead className="text-gray-600">Last Activity</TableHead>
                      <TableHead className="text-gray-600">Progress</TableHead>
                      <TableHead className="text-gray-600">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingClients ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => (
                        <TableRow key={client.id} className="border-gray-200">
                          <TableCell className="font-medium text-gray-900">{client.name}</TableCell>
                          <TableCell className="text-gray-700">{client.email}</TableCell>
                          <TableCell className="text-gray-700">
                            <Badge className="bg-teal-50 text-teal-700 border-teal-200">
                              {client.activePlans} plans
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">{client.lastActivity}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress value={client.progress} className="w-20 h-2" />
                              <span className="text-gray-700 text-sm">{client.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedClient(client);
                                  setViewClientOpen(true);
                                }}
                                className="text-teal-600 hover:text-teal-700"
                                data-testid={`button-view-client-${client.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setAssignForm(prev => ({ ...prev, clientIds: [client.id] }));
                                  setAssignPlanOpen(true);
                                }}
                                className="text-teal-600 hover:text-teal-700"
                                data-testid={`button-quick-assign-${client.id}`}
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <Tabs defaultValue="view" className="space-y-6">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="view" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white">View Plans</TabsTrigger>
                <TabsTrigger value="assign" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white">Assign Plans</TabsTrigger>
                <TabsTrigger value="manage" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white">Manage Assignments</TabsTrigger>
              </TabsList>

              {/* View Plans Nested Tab */}
              <TabsContent value="view" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Meal Plans Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <ChefHat className="h-5 w-5 text-teal-600" />
                        Meal Plans
                      </h3>
                      <Button 
                        onClick={() => setCreateMealPlanOpen(true)}
                        variant="outline"
                        className="border-teal-300 text-teal-600 hover:bg-teal-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create
                      </Button>
                    </div>
                    <Card className="bg-white border-gray-200">
                      <CardContent className="p-4">
                        {loadingPlans ? (
                          <div className="text-center py-8">
                            <Skeleton className="h-12 w-full" />
                          </div>
                        ) : mealPlans.length === 0 ? (
                          <div className="text-center py-8">
                            <ChefHat className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-600">No meal plans yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {mealPlans.map((plan: Plan) => (
                              <div key={plan.id} className="bg-gray-100 rounded-lg p-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="text-gray-900 font-medium">{plan.name}</h4>
                                    <p className="text-xs text-gray-600 mt-1">
                                      Created {plan.createdDate ? format(new Date(plan.createdDate), 'MMM d') : 'Unknown'}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                                        {plan.assignedCount || 0} clients
                                      </Badge>
                                      {plan.weeks && (
                                        <Badge variant="outline" className="text-xs">
                                          Week {plan.weeks}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {canDeletePlan(plan) && (
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleEditMealPlan(plan)}
                                        className="text-blue-600 hover:text-blue-700"
                                        data-testid={`button-edit-meal-plan-${plan.id}`}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDelete('plan', plan.id, plan.name)}
                                        className="text-red-600 hover:text-red-700"
                                        data-testid="button-delete-meal-plan"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Workout Plans Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Dumbbell className="h-5 w-5 text-teal-600" />
                        Workout Plans
                      </h3>
                      <Button 
                        onClick={() => setCreateWorkoutPlanOpen(true)}
                        variant="outline"
                        className="border-teal-300 text-teal-600 hover:bg-teal-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create
                      </Button>
                    </div>
                    <Card className="bg-white border-gray-200">
                      <CardContent className="p-4">
                        {loadingPlans ? (
                          <div className="text-center py-8">
                            <Skeleton className="h-12 w-full" />
                          </div>
                        ) : workoutPlans.length === 0 ? (
                          <div className="text-center py-8">
                            <Dumbbell className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-600">No workout plans yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {workoutPlans.map((plan: Plan) => (
                              <div key={plan.id} className="bg-gray-100 rounded-lg p-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="text-gray-900 font-medium">{plan.name}</h4>
                                    <p className="text-xs text-gray-600 mt-1">
                                      Created {plan.createdDate ? format(new Date(plan.createdDate), 'MMM d') : 'Unknown'}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                                        {plan.assignedCount || 0} clients
                                      </Badge>
                                      {plan.weeks && (
                                        <Badge variant="outline" className="text-xs">
                                          Week {plan.weeks}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {canDeletePlan(plan) && (
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleEditWorkoutPlan(plan)}
                                        className="text-blue-600 hover:text-blue-700"
                                        data-testid={`button-edit-workout-plan-${plan.id}`}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDelete('plan', plan.id, plan.name)}
                                        className="text-red-600 hover:text-red-700"
                                        data-testid="button-delete-workout-plan"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Assign Plans Nested Tab */}
              <TabsContent value="assign" className="space-y-4">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Assign Plans to Clients</CardTitle>
                <CardDescription className="text-gray-600">
                  Select clients and assign meal or workout plans
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Select Clients</Label>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-[200px] overflow-y-auto">
                      {clientsData.map((client) => (
                        <div key={client.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`client-${client.id}`}
                            checked={assignForm.clientIds.includes(client.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAssignForm(prev => ({
                                  ...prev,
                                  clientIds: [...prev.clientIds, client.id]
                                }));
                              } else {
                                setAssignForm(prev => ({
                                  ...prev,
                                  clientIds: prev.clientIds.filter(id => id !== client.id)
                                }));
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`client-${client.id}`}
                            className="text-gray-700 cursor-pointer flex-1"
                          >
                            {client.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Plan Type</Label>
                    <Select 
                      value={assignForm.planType} 
                      onValueChange={(value) => setAssignForm(prev => ({ ...prev, planType: value, planId: "" }))}
                    >
                      <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meal">Meal Plan</SelectItem>
                        <SelectItem value="workout">Workout Plan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Select Plan</Label>
                    <Select 
                      value={assignForm.planId} 
                      onValueChange={(value) => setAssignForm(prev => ({ ...prev, planId: value }))}
                    >
                      <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                        <SelectValue placeholder="Choose a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plansData
                          .filter(plan => plan.type === assignForm.planType)
                          .map(plan => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Day Mapping Editor - shown when a plan is selected */}
                {assignForm.planId && getSelectedPlanDays() > 0 && (
                  <div className="mt-6">
                    <DayMappingEditor
                      planDays={getSelectedPlanDays()}
                      defaultStartDay="monday"
                      value={assignForm.dayMapping}
                      onChange={(mapping) => setAssignForm(prev => ({ ...prev, dayMapping: mapping }))}
                      planType={assignForm.planType as "meal" | "workout"}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Start Date</Label>
                    <Input
                      type="date"
                      value={assignForm.startDate}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="bg-gray-50 border-gray-300 text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">End Date (Optional)</Label>
                    <Input
                      type="date"
                      value={assignForm.endDate}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="bg-gray-50 border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => assignPlanMutation.mutate(assignForm)}
                  disabled={assignPlanMutation.isPending || assignForm.clientIds.length === 0 || !assignForm.planId || !assignForm.startDate}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {assignPlanMutation.isPending ? "Assigning..." : `Assign Plan to ${assignForm.clientIds.length} Client(s)`}
                </Button>
              </CardContent>
            </Card>
              </TabsContent>

              {/* Manage Assignments Nested Tab */}
              <TabsContent value="manage" className="space-y-6">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Manage Plan Assignments</CardTitle>
                    <CardDescription className="text-gray-600">
                      View and edit day mappings for all active plan assignments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Search Input */}
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by client name or plan name..."
                          value={assignmentSearchTerm}
                          onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                          className="pl-10 bg-white border-gray-200 text-gray-900"
                          data-testid="input-search-assignments"
                        />
                      </div>
                    </div>

                    {loadingAssignments ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-20" />
                        ))}
                      </div>
                    ) : (assignmentsData && assignmentsData.length === 0) ? (
                      <div className="text-center py-8">
                        <Clipboard className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-600">No active plan assignments yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(assignmentsData || [])
                          .filter((assignment: any) => {
                            if (!assignmentSearchTerm) return true;
                            const searchLower = assignmentSearchTerm.toLowerCase();
                            const clientNameLower = (assignment.clientName || '').toLowerCase();
                            const planNameLower = (assignment.planName || '').toLowerCase();
                            return clientNameLower.includes(searchLower) || planNameLower.includes(searchLower);
                          })
                          .map((assignment: any) => (
                          <div key={assignment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {assignment.planType === 'meal' ? (
                                    <ChefHat className="h-4 w-4 text-teal-600" />
                                  ) : (
                                    <Dumbbell className="h-4 w-4 text-teal-600" />
                                  )}
                                  <h4 className="text-gray-900 font-medium">{assignment.planName}</h4>
                                  <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                                    {assignment.planType}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  Assigned to: <span className="font-medium">{assignment.clientName}</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Assigned on {assignment.assignedAt ? format(new Date(assignment.assignedAt), 'MMM d, yyyy') : 'Unknown'}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingAssignment(assignment);
                                    setEditDayMapping(assignment.dayMapping || {});
                                    setEditDayMappingOpen(true);
                                  }}
                                  className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                  data-testid={`button-edit-day-mapping-${assignment.id}`}
                                >
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Edit Day Mapping
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <div className="h-[700px]">
              <OrgMessaging 
                userType="coach"
                orgId={orgId}
                embedded={true}
                className="h-full"
              />
            </div>
          </TabsContent>

          {/* Client Progress Tab */}
          <TabsContent value="progress" className="space-y-4">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Client Progress Overview</CardTitle>
                <CardDescription className="text-gray-600">
                  Track and analyze your clients' performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Workout Completion */}
                  <AnimatedCard className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Workout Completion</h4>
                      <Activity className="w-5 h-5 text-teal-600" />
                    </div>
                    {loadingAnalytics ? (
                      <Skeleton className="h-20" />
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Overall</span>
                          <span className="text-teal-600 font-bold">{analytics?.workoutCompletion || 0}%</span>
                        </div>
                        <Progress value={analytics?.workoutCompletion || 0} className="h-2" />
                        <p className="text-xs text-gray-500">Based on active plans</p>
                      </div>
                    )}
                  </AnimatedCard>

                  {/* Meal Plan Adherence */}
                  <AnimatedCard className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Meal Plan Adherence</h4>
                      <ChefHat className="w-5 h-5 text-teal-600" />
                    </div>
                    {loadingAnalytics ? (
                      <Skeleton className="h-20" />
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Overall</span>
                          <span className="text-teal-600 font-bold">{analytics?.mealAdherence || 0}%</span>
                        </div>
                        <Progress value={analytics?.mealAdherence || 0} className="h-2" />
                        <p className="text-xs text-gray-500">Based on active plans</p>
                      </div>
                    )}
                  </AnimatedCard>

                  {/* Average Progress */}
                  <AnimatedCard className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">Average Progress</h4>
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">All Clients</span>
                        <span className="text-teal-600 font-bold">{stats.avgProgress}%</span>
                      </div>
                      <Progress value={stats.avgProgress} className="h-2" />
                      <p className="text-xs text-green-500">{stats.avgProgress > 70 ? 'Excellent performance!' : 'Keep it up!'}</p>
                    </div>
                  </AnimatedCard>
                </div>

                {/* Client Performance Table */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Individual Client Performance</h3>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-600">Client</TableHead>
                        <TableHead className="text-gray-600">Workout Completion</TableHead>
                        <TableHead className="text-gray-600">Meal Adherence</TableHead>
                        <TableHead className="text-gray-600">Weight Trend</TableHead>
                        <TableHead className="text-gray-600">Overall Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientsData.map((client) => (
                        <TableRow key={client.id} className="border-gray-200">
                          <TableCell className="font-medium text-gray-900">{client.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress value={client.progress} className="w-16 h-2" />
                              <span className="text-gray-700 text-sm">{client.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress value={Math.max(0, client.progress - 5)} className="w-16 h-2" />
                              <span className="text-gray-700 text-sm">{Math.max(0, client.progress - 5)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              → N/A
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress value={client.progress} className="w-16 h-2" />
                              <span className="text-teal-600 font-medium">{client.progress}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* New Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Clients Needing Attention Card */}
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-gray-900 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        Clients Needing Attention
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Clients with low activity or 3+ days inactive
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {clientsData
                        .filter(c => c.progress < 30 || c.lastActivity?.includes('day'))
                        .slice(0, 5)
                        .map((client) => (
                          <div key={client.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{client.name}</p>
                              <p className="text-xs text-gray-500">{client.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={client.progress < 30 ? "destructive" : "outline"} className="text-xs">
                                {client.progress}%
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  setSelectedClient(client);
                                  setViewClientOpen(true);
                                }}
                                className="text-teal-600 hover:text-teal-700"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      {clientsData.filter(c => c.progress < 30 || c.lastActivity?.includes('day')).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                          <p className="text-sm">All clients are doing great!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Habit & Water Compliance Card */}
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-gray-900 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Habit & Water Tracking
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        Client adherence to daily habits and hydration
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {clientsData.slice(0, 5).map((client) => (
                          <div key={client.id} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700 font-medium">{client.name}</span>
                              <span className="text-gray-500 text-xs">{client.progress}% active</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600">Habits</span>
                                  <span className="text-purple-600 font-medium">{Math.min(100, client.progress + 10)}%</span>
                                </div>
                                <Progress value={Math.min(100, client.progress + 10)} className="h-1.5 bg-purple-100" />
                              </div>
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600">Water</span>
                                  <span className="text-cyan-600 font-medium">{Math.min(100, client.progress + 15)}%</span>
                                </div>
                                <Progress value={Math.min(100, client.progress + 15)} className="h-1.5 bg-cyan-100" />
                              </div>
                            </div>
                          </div>
                        ))}
                        {clientsData.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No client data available yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Client Dialog */}
        <Dialog open={viewClientOpen} onOpenChange={setViewClientOpen}>
          <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Client Details</DialogTitle>
              <DialogDescription className="text-gray-600">
                View detailed information about {selectedClient?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Name</Label>
                    <p className="text-gray-900 font-medium">{selectedClient.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Email</Label>
                    <p className="text-gray-900 font-medium">{selectedClient.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Current Meal Plan</Label>
                    <p className="text-teal-600">{selectedClient.mealPlan || "None assigned"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Current Workout Plan</Label>
                    <p className="text-teal-600">{selectedClient.workoutPlan || "None assigned"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Progress</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Progress value={selectedClient.progress} className="flex-1" />
                      <span className="text-teal-600 font-medium">{selectedClient.progress}%</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Last Activity</Label>
                    <p className="text-gray-900">{selectedClient.lastActivity}</p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setAssignForm(prev => ({ ...prev, clientIds: [selectedClient.id] }));
                      setViewClientOpen(false);
                      setAssignPlanOpen(true);
                    }}
                    className="border-teal-200 text-teal-600 hover:bg-teal-50"
                  >
                    Assign New Plan
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Assign Plan Dialog */}
        <Dialog open={assignPlanOpen} onOpenChange={setAssignPlanOpen}>
          <DialogContent className="bg-white border-gray-200 text-gray-900">
            <DialogHeader>
              <DialogTitle>Quick Assign Plan</DialogTitle>
              <DialogDescription className="text-gray-600">
                Assign a plan to selected client(s)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Plan Type</Label>
                <Select 
                  value={assignForm.planType} 
                  onValueChange={(value) => setAssignForm(prev => ({ ...prev, planType: value, planId: "" }))}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meal">Meal Plan</SelectItem>
                    <SelectItem value="workout">Workout Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Select Plan</Label>
                <Select 
                  value={assignForm.planId} 
                  onValueChange={(value) => setAssignForm(prev => ({ ...prev, planId: value }))}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plansData
                      .filter(plan => plan.type === assignForm.planType)
                      .map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Day Mapping Editor - shown when a plan is selected */}
              {assignForm.planId && getSelectedPlanDays() > 0 && (
                <div className="my-4">
                  <DayMappingEditor
                    planDays={getSelectedPlanDays()}
                    defaultStartDay="monday"
                    value={assignForm.dayMapping}
                    onChange={(mapping) => setAssignForm(prev => ({ ...prev, dayMapping: mapping }))}
                    planType={assignForm.planType as "meal" | "workout"}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-gray-700">Start Date</Label>
                <Input
                  type="date"
                  value={assignForm.startDate}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-gray-50 border-gray-300 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">End Date (Optional)</Label>
                <Input
                  type="date"
                  value={assignForm.endDate}
                  onChange={(e) => setAssignForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-gray-50 border-gray-300 text-gray-900"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => assignPlanMutation.mutate(assignForm)}
                disabled={assignPlanMutation.isPending || !assignForm.planId || !assignForm.startDate}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {assignPlanMutation.isPending ? "Assigning..." : "Assign Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Meal Plan Modal */}
        <Dialog open={createMealPlanOpen} onOpenChange={setCreateMealPlanOpen}>
          <DialogContent className="bg-white border-gray-200 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-900">
                {mealPlanIdBeingEdited ? 'Edit Meal Plan' : 'Create Meal Plan'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Build a day-by-day meal plan for your clients
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meal-plan-name" className="text-gray-700">Plan Name</Label>
                <Input
                  id="meal-plan-name"
                  placeholder="e.g., Weight Loss Plan"
                  value={mealPlanForm.name}
                  onChange={(e) => setMealPlanForm({...mealPlanForm, name: e.target.value})}
                  className="bg-white border-gray-200 text-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="meal-plan-description" className="text-gray-700">Description</Label>
                <Textarea
                  id="meal-plan-description"
                  placeholder="Describe the meal plan..."
                  value={mealPlanForm.description}
                  onChange={(e) => setMealPlanForm({...mealPlanForm, description: e.target.value})}
                  className="bg-white border-gray-200 text-gray-900"
                />
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-gray-900">Meal Schedule</Label>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setAiMealPlanDialogOpen(true)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      data-testid="button-generate-ai-meal-plan"
                    >
                      <Sparkles className="h-4 w-4 mr-1" /> Generate with AI
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={generate7DayMealTemplate}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                      data-testid="button-generate-7day-meal-template"
                    >
                      <Sparkles className="h-4 w-4 mr-1" /> 7-Day Template
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={addMealDay}
                      className="text-teal-600"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Day
                    </Button>
                  </div>
                </div>
                
                {mealDays.map((day, dayIndex) => (
                  <Card key={dayIndex} className="mb-3 p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-900">{day.day}</h4>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => addMealToDay(dayIndex)}>
                          <Plus className="h-3 w-3 mr-1" /> Add Meal
                        </Button>
                        {mealDays.length > 1 && (
                          <Button size="sm" variant="ghost" onClick={() => removeMealDay(dayIndex)}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {day.meals.map((meal, mealIndex) => (
                      <div key={mealIndex} className="bg-white p-3 rounded mb-2">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <Select value={meal.type} onValueChange={(v) => updateMeal(dayIndex, mealIndex, 'type', v)}>
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Breakfast">Breakfast</SelectItem>
                              <SelectItem value="Lunch">Lunch</SelectItem>
                              <SelectItem value="Dinner">Dinner</SelectItem>
                              <SelectItem value="Snack">Snack</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input 
                            placeholder="Meal name" 
                            value={meal.name}
                            onChange={(e) => updateMeal(dayIndex, mealIndex, 'name', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <Input 
                            placeholder="Cal" 
                            type="number"
                            value={meal.calories}
                            onChange={(e) => updateMeal(dayIndex, mealIndex, 'calories', e.target.value)}
                            className="text-sm"
                          />
                          <Input 
                            placeholder="Protein" 
                            type="number"
                            value={meal.protein}
                            onChange={(e) => updateMeal(dayIndex, mealIndex, 'protein', e.target.value)}
                            className="text-sm"
                          />
                          <Input 
                            placeholder="Carbs" 
                            type="number"
                            value={meal.carbs}
                            onChange={(e) => updateMeal(dayIndex, mealIndex, 'carbs', e.target.value)}
                            className="text-sm"
                          />
                          <div className="flex gap-1">
                            <Input 
                              placeholder="Fats" 
                              type="number"
                              value={meal.fats}
                              onChange={(e) => updateMeal(dayIndex, mealIndex, 'fats', e.target.value)}
                              className="text-sm"
                            />
                            <Button size="sm" variant="ghost" onClick={() => removeMealFromDay(dayIndex, mealIndex)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Card>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateMealPlanOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createMealPlanMutation.mutate(mealPlanForm)}
                className="bg-teal-600 hover:bg-teal-700"
                disabled={!mealPlanForm.name || createMealPlanMutation.isPending}
              >
                Create Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Workout Plan Modal */}
        <Dialog open={createWorkoutPlanOpen} onOpenChange={setCreateWorkoutPlanOpen}>
          <DialogContent className="bg-white border-gray-200 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-900">
                {workoutPlanIdBeingEdited ? 'Edit Workout Plan' : 'Create Workout Plan'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Build a day-by-day workout program for your clients
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="workout-plan-name" className="text-gray-700">Plan Name</Label>
                <Input
                  id="workout-plan-name"
                  placeholder="e.g., Strength Training Program"
                  value={workoutPlanForm.name}
                  onChange={(e) => setWorkoutPlanForm({...workoutPlanForm, name: e.target.value})}
                  className="bg-white border-gray-200 text-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="workout-plan-description" className="text-gray-700">Description</Label>
                <Textarea
                  id="workout-plan-description"
                  placeholder="Describe the workout plan..."
                  value={workoutPlanForm.description}
                  onChange={(e) => setWorkoutPlanForm({...workoutPlanForm, description: e.target.value})}
                  className="bg-white border-gray-200 text-gray-900"
                />
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-gray-900">Workout Schedule</Label>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setAiWorkoutPlanDialogOpen(true)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      data-testid="button-generate-ai-workout-plan"
                    >
                      <Sparkles className="h-4 w-4 mr-1" /> Generate with AI
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={generate7DayWorkoutTemplate}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                      data-testid="button-generate-7day-workout-template"
                    >
                      <Sparkles className="h-4 w-4 mr-1" /> 7-Day Template
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={addWorkoutDay}
                      className="text-teal-600"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Day
                    </Button>
                  </div>
                </div>
                
                {workoutDays.map((day, dayIndex) => (
                  <Card key={dayIndex} className="mb-3 p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-900">{day.day}</h4>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => addExerciseToDay(dayIndex)}>
                          <Plus className="h-3 w-3 mr-1" /> Add Exercise
                        </Button>
                        {workoutDays.length > 1 && (
                          <Button size="sm" variant="ghost" onClick={() => removeWorkoutDay(dayIndex)}>
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="bg-white p-3 rounded mb-2">
                        <div className="grid grid-cols-5 gap-2">
                          <Input 
                            placeholder="Exercise name" 
                            value={exercise.name}
                            onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'name', e.target.value)}
                            className="text-sm col-span-2"
                          />
                          <Input 
                            placeholder="Sets" 
                            type="text"
                            value={exercise.sets}
                            onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'sets', e.target.value)}
                            className="text-sm"
                          />
                          <Input 
                            placeholder="Reps" 
                            type="text"
                            value={exercise.reps}
                            onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'reps', e.target.value)}
                            className="text-sm"
                          />
                          <div className="flex gap-1">
                            <Input 
                              placeholder="Rest (sec)" 
                              type="text"
                              value={exercise.rest}
                              onChange={(e) => updateExercise(dayIndex, exerciseIndex, 'rest', e.target.value)}
                              className="text-sm"
                            />
                            <Button size="sm" variant="ghost" onClick={() => removeExerciseFromDay(dayIndex, exerciseIndex)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Card>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateWorkoutPlanOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createWorkoutPlanMutation.mutate(workoutPlanForm)}
                className="bg-teal-600 hover:bg-teal-700"
                disabled={!workoutPlanForm.name || createWorkoutPlanMutation.isPending}
              >
                Create Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent className="bg-white border-gray-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-900">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                This will permanently delete "{itemToDelete?.name}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteItemMutation.mutate()}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* AI Meal Plan Generation Dialog */}
        <Dialog open={aiMealPlanDialogOpen} onOpenChange={(open) => {
          if (!open && aiGenerating) return;
          setAiMealPlanDialogOpen(open);
        }}>
          <DialogContent className="bg-white border-gray-200 max-w-md relative">
            {/* Loading Overlay */}
            {aiGenerating && (
              <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                <div className="text-center space-y-4 p-8">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto" />
                    <Sparkles className="w-8 h-8 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-2">
                      AI is Generating Meal Plan
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Creating personalized meals based on goals and preferences...
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <DialogHeader>
              <DialogTitle className="text-gray-900">Generate Meal Plan with AI</DialogTitle>
              <DialogDescription className="text-gray-600">
                Provide client details to generate a personalized meal plan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Fitness Goal</Label>
                <Select value={aiMealForm.goal} onValueChange={(v: any) => setAiMealForm({...aiMealForm, goal: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose_weight">Lose Weight</SelectItem>
                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                    <SelectItem value="build_muscle">Build Muscle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Diet Type</Label>
                <Select value={aiMealForm.dietType} onValueChange={(v: any) => setAiMealForm({...aiMealForm, dietType: v})}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label>Cuisine Type</Label>
                <Select value={aiMealForm.cuisineType} onValueChange={(v: any) => setAiMealForm({...aiMealForm, cuisineType: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Cuisine</SelectItem>
                    <SelectItem value="italian">Italian</SelectItem>
                    <SelectItem value="mexican">Mexican</SelectItem>
                    <SelectItem value="chinese">Chinese</SelectItem>
                    <SelectItem value="japanese">Japanese</SelectItem>
                    <SelectItem value="mediterranean">Mediterranean</SelectItem>
                    <SelectItem value="american">American</SelectItem>
                    <SelectItem value="indian">Indian</SelectItem>
                    <SelectItem value="thai">Thai</SelectItem>
                    <SelectItem value="korean">Korean</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Allergies (comma-separated)</Label>
                <Input 
                  placeholder="e.g., nuts, dairy, shellfish"
                  value={aiMealForm.allergies}
                  onChange={(e) => setAiMealForm({...aiMealForm, allergies: e.target.value})}
                />
              </div>
              <div>
                <Label>Daily Calorie Target (optional)</Label>
                <Input 
                  type="number"
                  placeholder="e.g., 2000"
                  value={aiMealForm.caloriesTarget}
                  onChange={(e) => setAiMealForm({...aiMealForm, caloriesTarget: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Days</Label>
                  <Select value={String(aiMealForm.days)} onValueChange={(v) => setAiMealForm({...aiMealForm, days: parseInt(v)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="14">14 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Meals/Day</Label>
                  <Select value={String(aiMealForm.mealsPerDay)} onValueChange={(v) => setAiMealForm({...aiMealForm, mealsPerDay: parseInt(v)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Meals</SelectItem>
                      <SelectItem value="5">5 Meals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAiMealPlanDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={generateAIMealPlan}
                disabled={aiGenerating}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {aiGenerating ? "Generating..." : "Generate Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Workout Plan Generation Dialog */}
        <Dialog open={aiWorkoutPlanDialogOpen} onOpenChange={(open) => {
          if (!open && aiGenerating) return;
          setAiWorkoutPlanDialogOpen(open);
        }}>
          <DialogContent className="bg-white border-gray-200 max-w-md relative">
            {/* Loading Overlay */}
            {aiGenerating && (
              <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                <div className="text-center space-y-4 p-8">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto" />
                    <Sparkles className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300 mb-2">
                      AI is Generating Workout Plan
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Designing exercises and training schedule based on your inputs...
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <DialogHeader>
              <DialogTitle className="text-gray-900">Generate Workout Plan with AI</DialogTitle>
              <DialogDescription className="text-gray-600">
                Provide client details to generate a personalized workout plan
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Training Goal</Label>
                <Select value={aiWorkoutForm.goal} onValueChange={(v: any) => setAiWorkoutForm({...aiWorkoutForm, goal: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hypertrophy">Muscle Building (Hypertrophy)</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="fat_loss">Fat Loss</SelectItem>
                    <SelectItem value="general_fitness">General Fitness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Days Per Week</Label>
                <Select value={String(aiWorkoutForm.daysPerWeek)} onValueChange={(v) => setAiWorkoutForm({...aiWorkoutForm, daysPerWeek: parseInt(v)})}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label>Training Split</Label>
                <Select value={aiWorkoutForm.desiredSplit} onValueChange={(v: any) => setAiWorkoutForm({...aiWorkoutForm, desiredSplit: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (AI Decides)</SelectItem>
                    <SelectItem value="full-body">Full Body</SelectItem>
                    <SelectItem value="upper/lower">Upper/Lower</SelectItem>
                    <SelectItem value="push/pull/legs">Push/Pull/Legs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Equipment Available (comma-separated)</Label>
                <Input 
                  placeholder="e.g., dumbbells, barbell, machines"
                  value={aiWorkoutForm.equipment.join(', ')}
                  onChange={(e) => setAiWorkoutForm({...aiWorkoutForm, equipment: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                />
              </div>
              <div>
                <Label>Injuries or Limitations (optional)</Label>
                <Input 
                  placeholder="e.g., lower back pain, knee issues"
                  value={aiWorkoutForm.injuries}
                  onChange={(e) => setAiWorkoutForm({...aiWorkoutForm, injuries: e.target.value})}
                />
              </div>
              <div>
                <Label>Program Duration (weeks)</Label>
                <Select value={String(aiWorkoutForm.weeks)} onValueChange={(v) => setAiWorkoutForm({...aiWorkoutForm, weeks: parseInt(v)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4 Weeks</SelectItem>
                    <SelectItem value="8">8 Weeks</SelectItem>
                    <SelectItem value="12">12 Weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAiWorkoutPlanDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={generateAIWorkoutPlan}
                disabled={aiGenerating}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {aiGenerating ? "Generating..." : "Generate Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Day Mapping Dialog */}
        <Dialog open={editDayMappingOpen} onOpenChange={setEditDayMappingOpen}>
          <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-gray-900">Edit Day Mapping</DialogTitle>
              <DialogDescription className="text-gray-600">
                Customize which calendar days map to which plan days, or mark days as rest
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
              {editingAssignment && (
                <div className="space-y-4 pb-4">
                  <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Plan:</span> {editingAssignment.planName}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Client:</span> {editingAssignment.clientName}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Type:</span> {editingAssignment.planType}
                    </p>
                  </div>
                  <DayMappingEditor
                    planDays={7}
                    defaultStartDay="monday"
                    value={editDayMapping}
                    onChange={setEditDayMapping}
                    planType={editingAssignment.planType}
                  />
                </div>
              )}
            </div>
            <DialogFooter className="flex-shrink-0 mt-4 border-t pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditDayMappingOpen(false);
                  setEditingAssignment(null);
                  setEditDayMapping({});
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (editingAssignment) {
                    updateDayMappingMutation.mutate({
                      assignmentId: editingAssignment.id,
                      dayMapping: editDayMapping
                    });
                  }
                }}
                disabled={updateDayMappingMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
                data-testid="button-save-day-mapping"
              >
                {updateDayMappingMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}