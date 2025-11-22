import { useState, useEffect } from "react";
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
import { 
  Building2, Users, UserPlus, Crown, ChefHat, Dumbbell,
  BarChart3, MessageSquare, Calendar, Plus, Search, Filter,
  Mail, Phone, Clock, Activity, TrendingUp, Award, Edit,
  Trash2, Send, AlertCircle, CheckCircle2, X, ChevronRight,
  FileText, Settings, Eye, UserCheck, UserX, Clipboard, Sparkles, Lock, Loader2
} from "lucide-react";
import { OrgMessaging } from "@/components/org-messaging";
import { DayMappingEditor } from "@/components/DayMappingEditor";

interface Organization {
  id: number;
  name: string;
  logo?: string;
  subscriptionPlan: 'free' | 'basic' | 'pro';
  maxCoaches: number;
  maxClients: number;
  currentCoaches?: number;
  currentClients?: number;
}

interface OrgBilling {
  tier: string;
  baseCoachAllowance: number;
  baseClientAllowance: number;
  addonCoachQty: number;
  addonClientQty: number;
  totalCoachAllowance: number;
  totalClientAllowance: number;
  currentPeriodStartsAt: string | null;
  currentPeriodEndsAt: string | null;
  status: string;
}

interface OrgMember {
  id: number;
  email: string;
  role: 'coach' | 'client';
  firstName?: string | null;
  lastName?: string | null;
  organizationId: number;
  isActive: boolean;
  createdAt: Date;
  status?: 'active' | 'locked_downgrade' | 'locked_manual' | null;
}

interface Plan {
  id: string;
  name: string;
  type: 'meal' | 'workout';
  createdBy: string;
  createdDate: string;
  assignedTo: number;
  description?: string;
  planData?: any;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  type: 'announcement' | 'direct';
}

export default function OrgOwnerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [createMealPlanOpen, setCreateMealPlanOpen] = useState(false);
  const [createWorkoutPlanOpen, setCreateWorkoutPlanOpen] = useState(false);
  const [assignPlanOpen, setAssignPlanOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [mealPlanIdBeingEdited, setMealPlanIdBeingEdited] = useState<number | null>(null);
  const [workoutPlanIdBeingEdited, setWorkoutPlanIdBeingEdited] = useState<number | null>(null);
  const [aiMealPlanDialogOpen, setAiMealPlanDialogOpen] = useState(false);
  const [aiWorkoutPlanDialogOpen, setAiWorkoutPlanDialogOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [manageActiveMembersOpen, setManageActiveMembersOpen] = useState(false);
  const [swapRole, setSwapRole] = useState<'coach' | 'client'>('coach');
  const [swapActivateMemberId, setSwapActivateMemberId] = useState<number | null>(null);
  const [swapDeactivateMemberId, setSwapDeactivateMemberId] = useState<number | null>(null);
  const [showActivationHistory, setShowActivationHistory] = useState(false);
  
  // Form states
  const [memberForm, setMemberForm] = useState({ email: "", role: "client" as "coach" | "client", firstName: "", lastName: "", commonPassword: "" });
  const [mealPlanForm, setMealPlanForm] = useState({ name: "", description: "", planData: "" });
  const [workoutPlanForm, setWorkoutPlanForm] = useState({ name: "", description: "", planData: "" });
  const [changePasswordForm, setChangePasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newResetPassword, setNewResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  // Visual plan builders
  const [mealDays, setMealDays] = useState<Array<{day: string, meals: Array<{type: string, name: string, calories: string, protein: string, carbs: string, fats: string}>}>>([
    { day: "Monday", meals: [] }
  ]);
  const [workoutDays, setWorkoutDays] = useState<Array<{day: string, exercises: Array<{name: string, sets: string, reps: string, rest: string}>}>>([
    { day: "Monday", exercises: [] }
  ]);
  const [assignForm, setAssignForm] = useState({ 
    planType: "meal", 
    planId: "", 
    clientIds: [] as number[], 
    startDate: "", 
    endDate: "",
    dayMapping: {} as Record<string, string>
  });
  const [messageContent, setMessageContent] = useState("");
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  
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

  // Edit day mapping state
  const [editDayMappingOpen, setEditDayMappingOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [editDayMapping, setEditDayMapping] = useState<Record<string, string>>({});
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState("");

  // Get organization ID from user context
  const orgId = (user as any)?.currentOrgId || 1;

  // Queries
  const { data: orgData, isLoading: loadingOrg } = useQuery({
    queryKey: ['/api/organizations', orgId],
    queryFn: () => apiRequest(`/api/organizations/${orgId}`, 'GET'),
    enabled: !!orgId
  });

  const { data: coachesData, isLoading: loadingCoaches } = useQuery({
    queryKey: ['/api/organizations', orgId, 'coaches'],
    queryFn: () => apiRequest(`/api/organizations/${orgId}/coaches`, 'GET'),
    enabled: !!orgId
  });

  const { data: clientsData, isLoading: loadingClients } = useQuery({
    queryKey: ['/api/organizations', orgId, 'clients'],
    queryFn: () => apiRequest(`/api/organizations/${orgId}/clients`, 'GET'),
    enabled: !!orgId
  });

  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ['/api/organizations', orgId, 'plans'],
    queryFn: () => apiRequest(`/api/organizations/${orgId}/plans`, 'GET'),
    enabled: !!orgId
  });

  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['/api/organizations', orgId, 'messages'],
    queryFn: () => apiRequest(`/api/organizations/${orgId}/messages`, 'GET'),
    enabled: !!orgId && activeTab === 'messages'
  });

  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['/api/organizations', orgId, 'analytics'],
    queryFn: () => apiRequest(`/api/organizations/${orgId}/analytics`, 'GET'),
    enabled: !!orgId
  });

  const { data: assignmentsData, isLoading: loadingAssignments } = useQuery({
    queryKey: ['/api/organizations', orgId, 'plan-assignments'],
    queryFn: () => apiRequest(`/api/organizations/${orgId}/plan-assignments`, 'GET'),
    enabled: !!orgId
  });

  const { data: billing } = useQuery<OrgBilling>({
    queryKey: [`/api/org/${orgId}/billing`],
    enabled: !!orgId
  });

  const { data: billingHistory } = useQuery<any>({
    queryKey: [`/api/org/${orgId}/billing-history`],
    enabled: !!orgId && activeTab === 'settings'
  });

  const { data: activationSummary, isLoading: loadingActivation } = useQuery({
    queryKey: ['/api/organizations', orgId, 'activation-summary'],
    queryFn: () => apiRequest(`/api/organizations/${orgId}/members/activation-summary`, 'GET'),
    enabled: !!orgId && manageActiveMembersOpen
  });

  // Mutations
  const swapActivationMutation = useMutation({
    mutationFn: ({ activateMemberId, deactivateMemberId }: { activateMemberId: number, deactivateMemberId: number }) => 
      apiRequest(`/api/organizations/${orgId}/members/swap-activation`, 'POST', { activateMemberId, deactivateMemberId }),
    onSuccess: () => {
      toast({ title: "Member activation swapped successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'activation-summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'coaches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'clients'] });
      setSwapActivateMemberId(null);
      setSwapDeactivateMemberId(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to swap activation", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (data: typeof memberForm) => 
      apiRequest(`/api/organizations/${orgId}/members`, 'POST', data),
    onSuccess: (response: any) => {
      const role = memberForm.role;
      toast({ title: `${role === 'coach' ? 'Coach' : 'Client'} added successfully` });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'coaches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'analytics'] });
      setAddMemberOpen(false);
      setMemberForm({ email: "", role: "client", firstName: "", lastName: "", commonPassword: "" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to add member", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const createMealPlanMutation = useMutation({
    mutationFn: (data: typeof mealPlanForm) => {
      // Convert visual builder data to plan data structure
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
      
      const method = mealPlanIdBeingEdited ? 'PUT' : 'POST';
      const url = mealPlanIdBeingEdited 
        ? `/api/organizations/${orgId}/meal-plans/${mealPlanIdBeingEdited}`
        : `/api/organizations/${orgId}/meal-plans`;
      
      return apiRequest(url, method, {
        name: data.name,
        description: data.description,
        planData
      });
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
      // Convert visual builder data to plan data structure
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
      
      const method = workoutPlanIdBeingEdited ? 'PUT' : 'POST';
      const url = workoutPlanIdBeingEdited 
        ? `/api/organizations/${orgId}/workout-plans/${workoutPlanIdBeingEdited}`
        : `/api/organizations/${orgId}/workout-plans`;
      
      return apiRequest(url, method, {
        name: data.name,
        description: data.description,
        planData
      });
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
    mutationFn: (data: typeof assignForm) => 
      apiRequest(`/api/organizations/${orgId}/plans/assign`, 'POST', {
        planId: parseInt(data.planId),
        planType: data.planType,
        clientIds: data.clientIds.map(String), // Convert to strings for API
        startsAt: data.startDate, // API expects startsAt
        endsAt: data.endDate || undefined, // API expects endsAt
        dayMapping: data.dayMapping || undefined // Send dayMapping if available
      }),
    onSuccess: () => {
      toast({ title: "Plan assigned successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'plans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'plan-assignments'] });
      setAssignPlanOpen(false);
      setAssignForm({ 
        planType: "meal", 
        planId: "", 
        clientIds: [], 
        startDate: "", 
        endDate: "",
        dayMapping: {}
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to assign plan", 
        description: error.message,
        variant: "destructive" 
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
    mutationFn: (content: string) => 
      apiRequest(`/api/organizations/${orgId}/messages`, 'POST', { 
        content, 
        type: 'announcement' 
      }),
    onSuccess: () => {
      toast({ title: "Message sent successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'messages'] });
      setMessageContent("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to send message", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async () => {
      if (!itemToDelete) return;
      const { type, id } = itemToDelete;
      
      if (type === 'coach') {
        return apiRequest(`/api/organizations/${orgId}/coaches/${id}`, 'DELETE');
      } else if (type === 'client') {
        return apiRequest(`/api/organizations/${orgId}/clients/${id}`, 'DELETE');
      } else if (type === 'plan') {
        return apiRequest(`/api/organizations/${orgId}/plans/${id}`, 'DELETE');
      }
    },
    onSuccess: () => {
      toast({ title: "Item deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'coaches'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'analytics'] });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete item", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: typeof changePasswordForm) => 
      apiRequest(`/api/organizations/${orgId}/change-common-password`, 'POST', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      }),
    onSuccess: () => {
      toast({ 
        title: "Password updated successfully",
        description: "All members will use the new password on next login"
      });
      setChangePasswordOpen(false);
      setChangePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update password", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (newPassword: string) =>
      apiRequest(`/api/organizations/${orgId}/reset-password`, 'POST', { newPassword }),
    onSuccess: (response: any) => {
      toast({ 
        title: "Password reset successfully",
        description: "Share this password with your members"
      });
      setNewResetPassword(response.password);
      setShowResetPassword(true);
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to reset password", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleResetPassword = () => {
    const generatedPassword = "Team" + Math.random().toString(36).slice(2, 10);
    resetPasswordMutation.mutate(generatedPassword);
  };

  const canDeletePlan = (plan: Plan): boolean => {
    // Org owners can delete any plan
    return true;
  };

  const handleDelete = (type: string, id: number | string, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteConfirmOpen(true);
  };

  const handleChangePassword = () => {
    if (!changePasswordForm.currentPassword || !changePasswordForm.newPassword || !changePasswordForm.confirmPassword) {
      toast({ 
        title: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      toast({ 
        title: "Passwords don't match",
        description: "New password and confirm password must match",
        variant: "destructive"
      });
      return;
    }

    if (changePasswordForm.newPassword.length < 6) {
      toast({ 
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    changePasswordMutation.mutate(changePasswordForm);
  };

  // Reset functions for create mode
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

  // Meal plan builder helpers
  const addMealDay = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    // Get the last day in the current list to find next day properly
    const lastDay = mealDays.length > 0 ? mealDays[mealDays.length - 1].day : "Sunday";
    const lastDayIndex = days.indexOf(lastDay);
    const nextDay = days[(lastDayIndex + 1) % 7];
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
    // Get the last day in the current list to find next day properly
    const lastDay = workoutDays.length > 0 ? workoutDays[workoutDays.length - 1].day : "Sunday";
    const lastDayIndex = days.indexOf(lastDay);
    const nextDay = days[(lastDayIndex + 1) % 7];
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

  const handleBulkAssignCoach = (coachId: string) => {
    if (selectedClients.length === 0) {
      toast({ 
        title: "No clients selected", 
        description: "Please select clients to assign",
        variant: "destructive" 
      });
      return;
    }
    
    const coachIdNum = parseInt(coachId, 10);
    // Implementation for bulk assign coach
    toast({ title: `Assigned ${selectedClients.length} clients to coach` });
    setSelectedClients([]);
  };

  // Helper function to get the number of days from a selected plan
  const getSelectedPlanDays = (): number => {
    if (!assignForm.planId) return 0;
    const allPlans = [
      ...((plansData as any)?.mealPlans || []).map((p: any) => ({ ...p, type: 'meal' })),
      ...((plansData as any)?.workoutPlans || []).map((p: any) => ({ ...p, type: 'workout' }))
    ];
    const selectedPlan = allPlans.find((p: any) => p.id.toString() === assignForm.planId);
    if (!selectedPlan?.planData?.days) return 0;
    return selectedPlan.planData.days.length;
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

  const organization = orgData?.organization || {
    name: "Loading...",
    subscriptionPlan: billing?.tier || "free",
    maxCoaches: billing?.totalCoachAllowance || 0,
    maxClients: billing?.totalClientAllowance || 0,
    currentCoaches: 0,
    currentClients: 0
  };

  const coaches = coachesData?.coaches || [];
  const clients = clientsData?.clients || [];
  const messages = messagesData?.messages || [];

  const mealPlans = plansData?.mealPlans || [];
  const workoutPlans = plansData?.workoutPlans || [];
  
  // Billing tier check for FREE tier restrictions
  const isFreeTier = billing?.tier === 'free';
  const isFreeRestricted = isFreeTier;

  const filteredClients = clients.filter((client: OrgMember) =>
    client.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count only ACTIVE members (not locked ones)
  const activeCoaches = coaches.filter(c => (c.status || 'active') === 'active').length;
  const activeClients = clients.filter(c => (c.status || 'active') === 'active').length;
  const lockedCoaches = coaches.filter(c => c.status === 'locked_downgrade' || c.status === 'locked_manual').length;
  const lockedClients = clients.filter(c => c.status === 'locked_downgrade' || c.status === 'locked_manual').length;
  
  // Use analytics data if available, but ALWAYS use our active counts for coaches/clients
  const analytics = analyticsData?.analytics;
  
  const stats = {
    totalCoaches: activeCoaches, // Always use active count, not analytics total
    totalClients: activeClients, // Always use active count, not analytics total
    activePlans: analytics?.activePlans ?? (mealPlans.length + workoutPlans.length),
    completionRate: analytics?.completionRate ?? 0,
    lockedCoaches,
    lockedClients
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-amber-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Organization Header */}
        <div className="bg-gradient-to-r from-blue-100 to-amber-100 rounded-lg p-6 mb-8 border border-amber-300/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-lg bg-amber-100 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                    <Crown className="h-3 w-3 mr-1" />
                    {billing?.tier || 'free'}
                  </Badge>
                  <span className="text-gray-700 text-sm">
                    Coaches: {stats.totalCoaches} active{stats.lockedCoaches > 0 ? ` (${stats.lockedCoaches} locked)` : ''} / {organization.maxCoaches}
                  </span>
                  <span className="text-gray-700 text-sm">
                    Clients: {stats.totalClients} active{stats.lockedClients > 0 ? ` (${stats.lockedClients} locked)` : ''} / {organization.maxClients}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => setManageActiveMembersOpen(true)}
                data-testid="button-manage-active-members"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Manage Active Members
              </Button>
              <Button 
                variant="outline" 
                className="border-amber-300 text-amber-600 hover:bg-amber-50"
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-100">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="coaches" className="data-[state=active]:bg-amber-100">
              <Users className="h-4 w-4 mr-2" />
              Coaches
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-amber-100">
              <UserCheck className="h-4 w-4 mr-2" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-amber-100">
              <FileText className="h-4 w-4 mr-2" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-amber-100">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-amber-100">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Coaches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalCoaches}</div>
                  <Progress 
                    value={(stats.totalCoaches / organization.maxCoaches) * 100} 
                    className="mt-2 h-1" 
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    {organization.maxCoaches - stats.totalCoaches} slots available
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalClients}</div>
                  <Progress 
                    value={(stats.totalClients / organization.maxClients) * 100} 
                    className="mt-2 h-1" 
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    {organization.maxClients - stats.totalClients} slots available
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">Active Plans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.activePlans}</div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      <ChefHat className="h-3 w-3 mr-1" />
                      {mealPlans.length}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Dumbbell className="h-3 w-3 mr-1" />
                      {workoutPlans.length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.completionRate}%</div>
                  <Progress value={stats.completionRate} className="mt-2 h-1" />
                  <p className="text-xs text-gray-600 mt-1">Above average</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {loadingAnalytics ? (
                      <div className="space-y-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                      analytics.recentActivity.map((activity: any, index: number) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'message' ? 'bg-blue-500' : 'bg-green-500'
                          }`}></div>
                          <span className="text-sm text-gray-700 flex-1">{activity.description}</span>
                          <span className="text-xs text-gray-500 whitespace-nowrap">{activity.timeAgo}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 text-sm">No recent activity</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coaches Tab */}
          <TabsContent value="coaches" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Coaches Management</h2>
              {isFreeRestricted ? (
                <Button 
                  onClick={() => window.location.href = '/org-subscription'}
                  className="bg-amber-500 hover:bg-amber-600"
                  data-testid="button-upgrade-to-add-coach"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Add Coaches
                </Button>
              ) : (
                <Button 
                  onClick={() => { setMemberForm({ ...memberForm, role: "coach" }); setAddMemberOpen(true); }}
                  className="bg-amber-500 hover:bg-amber-600"
                  disabled={coaches.length >= organization.maxCoaches}
                  data-testid="button-add-coach"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Coach
                </Button>
              )}
            </div>

            <Card className="bg-white border-gray-200">
              <CardContent className="p-0">
                {loadingCoaches ? (
                  <div className="p-8 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : coaches.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-600">No coaches yet</p>
                    {isFreeRestricted ? (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-amber-600">Upgrade to add coaches to your organization</p>
                        <Button 
                          onClick={() => window.location.href = '/org-subscription'}
                          variant="outline"
                          className="border-amber-500 text-amber-600 hover:bg-amber-50"
                          data-testid="button-upgrade-empty-coaches"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade Now
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => { setMemberForm({ ...memberForm, role: "coach" }); setAddMemberOpen(true); }}
                        className="mt-4"
                        variant="outline"
                        data-testid="button-add-first-coach"
                      >
                        Add Your First Coach
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-700">Name</TableHead>
                        <TableHead className="text-gray-700">Email</TableHead>
                        <TableHead className="text-gray-700">Joined</TableHead>
                        <TableHead className="text-gray-700">Status</TableHead>
                        <TableHead className="text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coaches.map((coach: OrgMember) => {
                        const displayName = coach.firstName && coach.lastName 
                          ? `${coach.firstName} ${coach.lastName}`
                          : coach.firstName || coach.email;
                        const status = coach.status || 'active';
                        const isLocked = status === 'locked_downgrade' || status === 'locked_manual';
                        return (
                          <TableRow key={coach.id}>
                            <TableCell className="text-gray-900 font-medium">
                              <div className="flex items-center gap-2">
                                {displayName}
                                {isLocked && (
                                  <Lock className="h-3 w-3 text-amber-600" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-700">{coach.email}</TableCell>
                            <TableCell className="text-gray-700">
                              {format(new Date(coach.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                isLocked ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                coach.isActive ? 'bg-green-100 text-green-700' : 
                                'bg-slate-500/20 text-gray-600'
                              }>
                                {isLocked ? (status === 'locked_downgrade' ? 'locked (downgrade)' : 'locked') : 
                                 coach.isActive ? 'active' : 'inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {isLocked ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete('coach', coach.id, displayName)}
                                  className="text-red-600 hover:text-red-700"
                                  data-testid={`button-delete-coach-${coach.id}`}
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Swap to unlock delete</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>{coaches.length} of {organization.maxCoaches} coach slots used</span>
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Clients Management</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-200 text-gray-900"
                  />
                </div>
                {isFreeRestricted ? (
                  <Button 
                    onClick={() => window.location.href = '/org-subscription'}
                    className="bg-amber-500 hover:bg-amber-600"
                    data-testid="button-upgrade-to-add-client"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Add Clients
                  </Button>
                ) : (
                  <Button 
                    onClick={() => { setMemberForm({ ...memberForm, role: "client" }); setAddMemberOpen(true); }}
                    className="bg-amber-500 hover:bg-amber-600"
                    disabled={clients.length >= organization.maxClients}
                    data-testid="button-add-client"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                )}
              </div>
            </div>

            {selectedClients.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
                <span className="text-amber-700">
                  {selectedClients.length} clients selected
                </span>
                <div className="flex gap-2">
                  <Select onValueChange={handleBulkAssignCoach}>
                    <SelectTrigger className="w-[200px] bg-white border-gray-200">
                      <SelectValue placeholder="Assign to coach..." />
                    </SelectTrigger>
                    <SelectContent>
                      {coaches.map((coach: OrgMember) => {
                        const displayName = coach.firstName && coach.lastName 
                          ? `${coach.firstName} ${coach.lastName}`
                          : coach.firstName || coach.email;
                        return (
                          <SelectItem key={coach.id} value={coach.id.toString()}>
                            {displayName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedClients([])}
                    className="border-gray-200"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}

            <Card className="bg-white border-gray-200">
              <CardContent className="p-0">
                {loadingClients ? (
                  <div className="p-8 space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-600">
                      {searchTerm ? 'No clients found' : 'No clients yet'}
                    </p>
                    {!searchTerm && (
                      isFreeRestricted ? (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm text-amber-600">Upgrade to add clients to your organization</p>
                          <Button 
                            onClick={() => window.location.href = '/org-subscription'}
                            variant="outline"
                            className="border-amber-500 text-amber-600 hover:bg-amber-50"
                            data-testid="button-upgrade-empty-clients"
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            Upgrade Now
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => { setMemberForm({ ...memberForm, role: "client" }); setAddMemberOpen(true); }}
                          className="mt-4"
                          variant="outline"
                          data-testid="button-add-first-client"
                        >
                          Add Your First Client
                        </Button>
                      )
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox 
                            checked={selectedClients.length === filteredClients.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedClients(filteredClients.map((c: OrgMember) => c.id));
                              } else {
                                setSelectedClients([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className="text-gray-700">Name</TableHead>
                        <TableHead className="text-gray-700">Email</TableHead>
                        <TableHead className="text-gray-700">Joined</TableHead>
                        <TableHead className="text-gray-700">Status</TableHead>
                        <TableHead className="text-gray-700">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client: OrgMember) => {
                        const displayName = client.firstName && client.lastName 
                          ? `${client.firstName} ${client.lastName}`
                          : client.firstName || client.email;
                        const status = client.status || 'active';
                        const isLocked = status === 'locked_downgrade' || status === 'locked_manual';
                        return (
                          <TableRow key={client.id}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedClients.includes(client.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedClients([...selectedClients, client.id]);
                                  } else {
                                    setSelectedClients(selectedClients.filter(id => id !== client.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-gray-900 font-medium">
                              <div className="flex items-center gap-2">
                                {displayName}
                                {isLocked && (
                                  <Lock className="h-3 w-3 text-amber-600" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-700">{client.email}</TableCell>
                            <TableCell className="text-gray-700">
                              {format(new Date(client.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                isLocked ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                client.isActive ? 'bg-green-100 text-green-700' : 
                                'bg-slate-500/20 text-gray-600'
                              }>
                                {isLocked ? (status === 'locked_downgrade' ? 'locked (downgrade)' : 'locked') : 
                                 client.isActive ? 'active' : 'inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {isLocked ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete('client', client.id, displayName)}
                                  className="text-red-600 hover:text-red-700"
                                  data-testid={`button-delete-client-${client.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Swap to unlock delete</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>{clients.length} of {organization.maxClients} client slots used</span>
            </div>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <Tabs defaultValue="view" className="space-y-6">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="view">View Plans</TabsTrigger>
                <TabsTrigger value="assign">Assign Plans</TabsTrigger>
                <TabsTrigger value="manage">Manage Assignments</TabsTrigger>
              </TabsList>

              <TabsContent value="view" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Meal Plans Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <ChefHat className="h-5 w-5 text-amber-600" />
                        Meal Plans
                      </h3>
                      {isFreeRestricted ? (
                        <Button 
                          onClick={() => window.location.href = '/org-subscription'}
                          variant="outline"
                          className="border-amber-500 text-amber-600 hover:bg-amber-50"
                          data-testid="button-upgrade-to-create-meal-plan"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade
                        </Button>
                      ) : (
                        <Button 
                          onClick={resetMealPlanForm}
                          variant="outline"
                          className="border-amber-300 text-amber-600"
                          data-testid="button-create-meal-plan"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create
                        </Button>
                      )}
                    </div>
                    <Card className="bg-white border-gray-200">
                      <CardContent className="p-4">
                        {mealPlans.length === 0 ? (
                          <div className="text-center py-8">
                            <ChefHat className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-600">No meal plans yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {mealPlans.map((plan: any) => (
                              <div key={plan.id} className="bg-gray-100 rounded-lg p-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="text-gray-900 font-medium">{plan.name}</h4>
                                    <p className="text-xs text-gray-600 mt-1">
                                      Created by {plan.createdBy} • {plan.createdAt ? format(new Date(plan.createdAt), 'MMM d') : 'Unknown'}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {plan.assignedCount || 0} clients
                                      </Badge>
                                    </div>
                                  </div>
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
                        <Dumbbell className="h-5 w-5 text-amber-600" />
                        Workout Plans
                      </h3>
                      {isFreeRestricted ? (
                        <Button 
                          onClick={() => window.location.href = '/org-subscription'}
                          variant="outline"
                          className="border-amber-500 text-amber-600 hover:bg-amber-50"
                          data-testid="button-upgrade-to-create-workout-plan"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade
                        </Button>
                      ) : (
                        <Button 
                          onClick={resetWorkoutPlanForm}
                          variant="outline"
                          className="border-amber-300 text-amber-600"
                          data-testid="button-create-workout-plan"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create
                        </Button>
                      )}
                    </div>
                    <Card className="bg-white border-gray-200">
                      <CardContent className="p-4">
                        {workoutPlans.length === 0 ? (
                          <div className="text-center py-8">
                            <Dumbbell className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-600">No workout plans yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {workoutPlans.map((plan: any) => (
                              <div key={plan.id} className="bg-gray-100 rounded-lg p-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="text-gray-900 font-medium">{plan.name}</h4>
                                    <p className="text-xs text-gray-600 mt-1">
                                      Created by {plan.createdBy} • {plan.createdAt ? format(new Date(plan.createdAt), 'MMM d') : 'Unknown'}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {plan.assignedCount || 0} clients
                                      </Badge>
                                    </div>
                                  </div>
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

              <TabsContent value="assign" className="space-y-6">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">Assign Plans to Clients</CardTitle>
                    <CardDescription className="text-gray-600">
                      Select a plan and assign it to multiple clients at once
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="plan-type" className="text-gray-700">Plan Type</Label>
                        <Select 
                          value={assignForm.planType} 
                          onValueChange={(value) => setAssignForm({...assignForm, planType: value as 'meal' | 'workout'})}
                        >
                          <SelectTrigger className="bg-white border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="meal">Meal Plan</SelectItem>
                            <SelectItem value="workout">Workout Plan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="plan" className="text-gray-700">Select Plan</Label>
                        <Select 
                          value={assignForm.planId} 
                          onValueChange={(value) => setAssignForm({...assignForm, planId: value})}
                        >
                          <SelectTrigger className="bg-white border-gray-200">
                            <SelectValue placeholder="Choose a plan..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(assignForm.planType === 'meal' ? mealPlans : workoutPlans).map((plan: any) => (
                              <SelectItem key={plan.id} value={String(plan.id)}>
                                {plan.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-700">Select Clients</Label>
                      <Card className="bg-white border-gray-200 mt-2">
                        <CardContent className="p-3">
                          <ScrollArea className="h-[200px]">
                            <div className="space-y-2">
                              {clients.map((client: OrgMember) => {
                                const displayName = client.firstName && client.lastName 
                                  ? `${client.firstName} ${client.lastName}`
                                  : client.firstName || client.lastName || client.email;
                                return (
                                  <div key={client.id} className="flex items-center space-x-3">
                                    <Checkbox 
                                      id={client.id.toString()}
                                      checked={assignForm.clientIds.includes(client.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setAssignForm({
                                            ...assignForm, 
                                            clientIds: [...assignForm.clientIds, client.id]
                                          });
                                        } else {
                                          setAssignForm({
                                            ...assignForm,
                                            clientIds: assignForm.clientIds.filter(id => id !== client.id)
                                          });
                                        }
                                      }}
                                    />
                                    <label 
                                      htmlFor={client.id.toString()} 
                                      className="text-sm text-gray-700 cursor-pointer flex-1"
                                    >
                                      {displayName} ({client.email})
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-date" className="text-gray-700">Start Date (Optional)</Label>
                        <Input 
                          id="start-date"
                          type="date"
                          value={assignForm.startDate}
                          onChange={(e) => setAssignForm({...assignForm, startDate: e.target.value})}
                          className="bg-white border-gray-200 text-gray-900"
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date" className="text-gray-700">End Date (Optional)</Label>
                        <Input 
                          id="end-date"
                          type="date"
                          value={assignForm.endDate}
                          onChange={(e) => setAssignForm({...assignForm, endDate: e.target.value})}
                          className="bg-white border-gray-200 text-gray-900"
                        />
                      </div>
                    </div>

                    {assignForm.planId && getSelectedPlanDays() > 0 && (
                      <div className="border-t pt-4">
                        <DayMappingEditor
                          planDays={getSelectedPlanDays()}
                          defaultStartDay="monday"
                          value={assignForm.dayMapping}
                          onChange={(mapping) => setAssignForm({...assignForm, dayMapping: mapping})}
                          planType={assignForm.planType as "meal" | "workout"}
                        />
                      </div>
                    )}

                    <Button 
                      onClick={() => assignPlanMutation.mutate(assignForm)}
                      className="w-full bg-amber-500 hover:bg-amber-600"
                      disabled={!assignForm.planId || assignForm.clientIds.length === 0 || assignPlanMutation.isPending}
                    >
                      Assign Plan to {assignForm.clientIds.length} Clients
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

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
                          <div key={assignment.id} className="bg-gray-100 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {assignment.planType === 'meal' ? (
                                    <ChefHat className="h-4 w-4 text-amber-600" />
                                  ) : (
                                    <Dumbbell className="h-4 w-4 text-amber-600" />
                                  )}
                                  <h4 className="text-gray-900 font-medium">{assignment.planName}</h4>
                                  <Badge variant="outline" className="text-xs">
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
                                  className="text-blue-600 hover:text-blue-700"
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Client Progress Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingAnalytics ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Average Completion</span>
                        <span className="text-gray-900 font-bold">{analytics?.completionRate || 0}%</span>
                      </div>
                      <Progress value={analytics?.completionRate || 0} className="h-2" />
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{analytics?.clientDistribution?.excellent || 0}%</div>
                          <div className="text-xs text-gray-600">Excellent</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">{analytics?.clientDistribution?.good || 0}%</div>
                          <div className="text-xs text-gray-600">Good</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{analytics?.clientDistribution?.needsHelp || 0}%</div>
                          <div className="text-xs text-gray-600">Needs Help</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Plan Completion Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingAnalytics ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">Meal Plan Adherence</span>
                          <span className="text-gray-900">{analytics?.mealAdherence || 0}%</span>
                        </div>
                        <Progress value={analytics?.mealAdherence || 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">Workout Completion</span>
                          <span className="text-gray-900">{analytics?.workoutCompletion || 0}%</span>
                        </div>
                        <Progress value={analytics?.workoutCompletion || 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">Overall Plan Completion</span>
                          <span className="text-gray-900">{analytics?.completionRate || 0}%</span>
                        </div>
                        <Progress value={analytics?.completionRate || 0} className="h-2" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Most Active Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(analytics?.mostActiveClients || []).map((client: any, index: number) => (
                      <div key={client.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                            ${index === 0 ? 'bg-amber-500 text-white' : 
                              index === 1 ? 'bg-blue-500 text-white' : 
                              'bg-orange-500 text-white'}`}>
                            {index + 1}
                          </div>
                          <span className="text-gray-900">{client.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {client.activityPercentage}% active
                        </Badge>
                      </div>
                    ))}
                    {(!analytics?.mostActiveClients || analytics.mostActiveClients.length === 0) && (
                      <p className="text-sm text-gray-500">No active clients yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900">Coach Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(analytics?.coachPerformance || []).map((coach: any) => (
                      <div key={coach.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">{coach.name}</span>
                          <span className="text-gray-900">{coach.clientCount} clients</span>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <Badge variant="outline">{coach.totalPlans} plans created</Badge>
                          <Badge variant="outline" className="text-green-600">{coach.successRate}% success</Badge>
                        </div>
                      </div>
                    ))}
                    {(!analytics?.coachPerformance || analytics.coachPerformance.length === 0) && (
                      <p className="text-sm text-gray-500">No coaches yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Team Capacity Card */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-600" />
                    Team Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingAnalytics ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <div className="space-y-6">
                      {/* Coaches */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-700 font-medium">Coaches</span>
                          <span className="text-sm text-gray-900 font-bold">
                            {analytics?.teamCapacity?.coachesUsed || 0} / {analytics?.teamCapacity?.coachesAllowed || 0}
                          </span>
                        </div>
                        <Progress 
                          value={analytics?.teamCapacity?.coachesAllowed > 0 
                            ? (analytics?.teamCapacity?.coachesUsed / analytics?.teamCapacity?.coachesAllowed) * 100 
                            : 0
                          } 
                          className="h-3" 
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {analytics?.teamCapacity?.coachesAllowed > 0 
                            ? `${analytics?.teamCapacity?.coachesAllowed - analytics?.teamCapacity?.coachesUsed} slots available`
                            : 'No capacity set'}
                        </p>
                      </div>
                      
                      {/* Clients */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-700 font-medium">Clients</span>
                          <span className="text-sm text-gray-900 font-bold">
                            {analytics?.teamCapacity?.clientsUsed || 0} / {analytics?.teamCapacity?.clientsAllowed || 0}
                          </span>
                        </div>
                        <Progress 
                          value={analytics?.teamCapacity?.clientsAllowed > 0 
                            ? (analytics?.teamCapacity?.clientsUsed / analytics?.teamCapacity?.clientsAllowed) * 100 
                            : 0
                          } 
                          className="h-3" 
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {analytics?.teamCapacity?.clientsAllowed > 0 
                            ? `${analytics?.teamCapacity?.clientsAllowed - analytics?.teamCapacity?.clientsUsed} slots available`
                            : 'No capacity set'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activity Trend Chart - Full Width */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Activity Trend (Last 30 Days)
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Daily client engagement across all activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAnalytics ? (
                  <Skeleton className="h-64" />
                ) : (
                  <div className="h-64">
                    {analytics?.activityTrend && analytics.activityTrend.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {analytics.activityTrend.reduce((sum: number, day: any) => sum + (day.workouts || 0), 0)}
                            </div>
                            <div className="text-xs text-gray-600">Total Workouts</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {analytics.activityTrend.reduce((sum: number, day: any) => sum + (day.meals || 0), 0)}
                            </div>
                            <div className="text-xs text-gray-600">Total Meals</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {analytics.activityTrend.reduce((sum: number, day: any) => sum + (day.habits || 0), 0)}
                            </div>
                            <div className="text-xs text-gray-600">Total Habits</div>
                          </div>
                          <div className="text-center p-3 bg-cyan-50 rounded-lg">
                            <div className="text-2xl font-bold text-cyan-600">
                              {analytics.activityTrend.reduce((sum: number, day: any) => sum + (day.water || 0), 0)}
                            </div>
                            <div className="text-xs text-gray-600">Total Water Logs</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 text-center">
                          Showing activity from {new Date(analytics.activityTrend[0].date).toLocaleDateString()} to {new Date(analytics.activityTrend[analytics.activityTrend.length - 1].date).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p>No activity data available yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab - Redirect to dedicated settings page */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Organization Settings</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage your personal and organization security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <Settings className="h-16 w-16 mx-auto text-amber-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Security & Password Management</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Access advanced settings to manage your personal password and organization common password
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/org-owner-settings'}
                    className="bg-amber-500 hover:bg-amber-600"
                    data-testid="button-password-manager"
                  >
                    Password Manager
                  </Button>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700">Organization Name</Label>
                      <p className="text-gray-900 mt-1">{organization.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-700">Subscription Plan</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                          {billing?.tier?.toUpperCase() || organization.subscriptionPlan.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Quota: {organization.maxCoaches} coaches, {organization.maxClients} clients
                      </p>
                      {billing?.currentPeriodStartsAt && billing?.currentPeriodEndsAt && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Current Period:</span> {new Date(billing.currentPeriodStartsAt).toLocaleDateString()} - {new Date(billing.currentPeriodEndsAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-600">
                            <span className="font-medium">Renews:</span> {new Date(billing.currentPeriodEndsAt).toLocaleDateString()} ({Math.max(0, Math.ceil((new Date(billing.currentPeriodEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days remaining)
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-gray-700">Capacity Usage</Label>
                      <div className="space-y-2 mt-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">Coaches</span>
                            <span className="text-gray-600">
                              {activationSummary ? 
                                `${activationSummary.quotas.coaches.active} active${activationSummary.quotas.coaches.total > activationSummary.quotas.coaches.active ? ` (${activationSummary.quotas.coaches.total - activationSummary.quotas.coaches.active} locked)` : ''}` : 
                                `${stats.totalCoaches}/${organization.maxCoaches}`}
                            </span>
                          </div>
                          <Progress value={(stats.totalCoaches / organization.maxCoaches) * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">Clients</span>
                            <span className="text-gray-600">
                              {activationSummary ? 
                                `${activationSummary.quotas.clients.active} active${activationSummary.quotas.clients.total > activationSummary.quotas.clients.active ? ` (${activationSummary.quotas.clients.total - activationSummary.quotas.clients.active} locked)` : ''}` : 
                                `${stats.totalClients}/${organization.maxClients}`}
                            </span>
                          </div>
                          <Progress value={(stats.totalClients / organization.maxClients) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing History Section */}
                {billingHistory?.billingHistory && billingHistory.billingHistory.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                    <div className="space-y-3">
                      {billingHistory.billingHistory.map((period: any) => (
                        <div key={period.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {period.tier.toUpperCase()} Tier
                                {period.addonCoachQty > 0 && ` + ${period.addonCoachQty} Coaches`}
                                {period.addonClientQty > 0 && ` + ${period.addonClientQty} Clients`}
                              </p>
                              <p className="text-xs text-gray-600">
                                Purchased on {new Date(period.purchasedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={
                              period.status === 'active' ? 'bg-green-100 text-green-700' : 
                              period.status === 'expired' ? 'bg-gray-100 text-gray-600' : 
                              'bg-amber-100 text-amber-700'
                            }>
                              {period.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            <div>
                              <p className="text-xs text-gray-500">Amount Paid</p>
                              <p className="font-semibold text-gray-900">
                                ${(period.amountPaid / 100).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Period Start</p>
                              <p className="text-sm text-gray-900">
                                {new Date(period.currentPeriodStartsAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Period End</p>
                              <p className="text-sm text-gray-900">
                                {new Date(period.currentPeriodEndsAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Resources</p>
                              <p className="text-sm text-gray-900">
                                {period.baseCoachAllowance + period.addonCoachQty}C / {period.baseClientAllowance + period.addonClientQty}CL
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Member Modal */}
        <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Add Organization Member</DialogTitle>
              <DialogDescription className="text-gray-600">
                Add a new {memberForm.role === 'coach' ? 'coach' : 'client'} to your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="member-role" className="text-gray-700">Role</Label>
                <Select 
                  value={memberForm.role} 
                  onValueChange={(value) => setMemberForm({...memberForm, role: value as "coach" | "client"})}
                >
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coach" disabled={stats.totalCoaches >= organization.maxCoaches}>
                      Coach {stats.totalCoaches >= organization.maxCoaches && '(Limit reached)'}
                    </SelectItem>
                    <SelectItem value="client" disabled={stats.totalClients >= organization.maxClients}>
                      Client {stats.totalClients >= organization.maxClients && '(Limit reached)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {stats.totalCoaches >= organization.maxCoaches && memberForm.role === 'coach' && (
                  <p className="text-xs text-amber-600 mt-1">
                    Coach limit reached. Upgrade your plan or remove a coach to add more.
                  </p>
                )}
                {stats.totalClients >= organization.maxClients && memberForm.role === 'client' && (
                  <p className="text-xs text-amber-600 mt-1">
                    Client limit reached. Upgrade your plan or remove a client to add more.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="member-email" className="text-gray-700">Email Address</Label>
                <Input
                  id="member-email"
                  type="email"
                  placeholder="email@example.com"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({...memberForm, email: e.target.value})}
                  className="bg-white border-gray-200 text-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="member-firstname" className="text-gray-700">First Name (Optional)</Label>
                <Input
                  id="member-firstname"
                  placeholder="John"
                  value={memberForm.firstName}
                  onChange={(e) => setMemberForm({...memberForm, firstName: e.target.value})}
                  className="bg-white border-gray-200 text-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="member-lastname" className="text-gray-700">Last Name (Optional)</Label>
                <Input
                  id="member-lastname"
                  placeholder="Doe"
                  value={memberForm.lastName}
                  onChange={(e) => setMemberForm({...memberForm, lastName: e.target.value})}
                  className="bg-white border-gray-200 text-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="member-password" className="text-gray-700">
                  Organization Common Password
                </Label>
                <Input
                  id="member-password"
                  type="password"
                  placeholder="Enter the password you set during organization creation"
                  value={memberForm.commonPassword}
                  onChange={(e) => setMemberForm({...memberForm, commonPassword: e.target.value})}
                  className="bg-white border-gray-200 text-gray-900"
                  data-testid="input-common-password"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This password will be sent in the invitation email and allows members to log in.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => addMemberMutation.mutate(memberForm)}
                className="bg-amber-500 hover:bg-amber-600"
                disabled={
                  !memberForm.email || 
                  !memberForm.commonPassword || 
                  addMemberMutation.isPending ||
                  (memberForm.role === 'coach' && stats.totalCoaches >= organization.maxCoaches) ||
                  (memberForm.role === 'client' && stats.totalClients >= organization.maxClients)
                }
                data-testid="button-add-member"
              >
                Add {memberForm.role === 'coach' ? 'Coach' : 'Client'}
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
                      className="text-amber-600 border-amber-300 hover:bg-amber-50"
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
                className="bg-amber-500 hover:bg-amber-600"
                disabled={!mealPlanForm.name || createMealPlanMutation.isPending}
              >
                {mealPlanIdBeingEdited ? 'Update Plan' : 'Create Plan'}
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
                      className="text-amber-600 border-amber-300 hover:bg-amber-50"
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
                className="bg-amber-500 hover:bg-amber-600"
                disabled={!workoutPlanForm.name || createWorkoutPlanMutation.isPending}
              >
                {workoutPlanIdBeingEdited ? 'Update Plan' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Password Modal */}
        <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Change Organization Password</DialogTitle>
              <DialogDescription className="text-gray-600">
                Update the common password used by coaches and clients to login
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-password" className="text-gray-700">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current organization password"
                  value={changePasswordForm.currentPassword}
                  onChange={(e) => setChangePasswordForm({...changePasswordForm, currentPassword: e.target.value})}
                  className="bg-white border-gray-200 text-gray-900"
                  data-testid="input-current-password"
                />
              </div>
              <div>
                <Label htmlFor="new-password" className="text-gray-700">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={changePasswordForm.newPassword}
                  onChange={(e) => setChangePasswordForm({...changePasswordForm, newPassword: e.target.value})}
                  className="bg-white border-gray-200 text-gray-900"
                  data-testid="input-new-password"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password" className="text-gray-700">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter new password"
                  value={changePasswordForm.confirmPassword}
                  onChange={(e) => setChangePasswordForm({...changePasswordForm, confirmPassword: e.target.value})}
                  className="bg-white border-gray-200 text-gray-900"
                  data-testid="input-confirm-password"
                />
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> Members with personal passwords will keep them. Members who haven't set personal passwords will use this new password.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleChangePassword}
                className="bg-amber-500 hover:bg-amber-600"
                disabled={changePasswordMutation.isPending}
                data-testid="button-save-password"
              >
                {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
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
                  <div className="bg-gray-100 p-3 rounded-lg">
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
                    planDays={7} // Default to 7 days for now
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
                className="bg-amber-500 hover:bg-amber-600"
                data-testid="button-save-day-mapping"
              >
                {updateDayMappingMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Active Members Modal */}
        <Dialog open={manageActiveMembersOpen} onOpenChange={setManageActiveMembersOpen}>
          <DialogContent className="bg-white border-gray-200 max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Manage Active Members</DialogTitle>
              <DialogDescription className="text-gray-600">
                Control which members can access your organization. Swap activations when you need to make changes.
              </DialogDescription>
            </DialogHeader>

            {loadingActivation ? (
              <div className="py-8 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Swap Budget & Cooldown Status */}
                {activationSummary && activationSummary.swapBudget && (
                  <div className="bg-gradient-to-r from-blue-50 to-amber-50 border border-blue-300 rounded-lg p-4">
                    <div className="mb-3 pb-3 border-b border-blue-200">
                      <p className="text-xs text-gray-700">
                        <strong>Swap Rules:</strong> Each member can only be activated once per billing period. 
                        Your plan includes {activationSummary.swapBudget.coaches.total} coach swaps and {activationSummary.swapBudget.clients.total} client swaps per billing cycle. 
                        Swaps reset at the start of each new billing period.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Coach Swap Budget */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900">Coach Swaps</h4>
                          <Badge className={activationSummary.swapBudget.coaches.remaining > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {activationSummary.swapBudget.coaches.used} / {activationSummary.swapBudget.coaches.total} Used
                          </Badge>
                        </div>
                        {activationSummary.cooldownStatus?.coaches.active && (
                          <div className="flex items-center gap-2 text-xs text-amber-700">
                            <Clock className="h-3 w-3" />
                            <span>Cooldown: {activationSummary.cooldownStatus.coaches.hoursRemaining}h remaining</span>
                          </div>
                        )}
                        {activationSummary.swapBudget.coaches.remaining === 0 && !activationSummary.cooldownStatus?.coaches.active && (
                          <p className="text-xs text-red-600">Budget exhausted for this cycle</p>
                        )}
                      </div>

                      {/* Client Swap Budget */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900">Client Swaps</h4>
                          <Badge className={activationSummary.swapBudget.clients.remaining > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {activationSummary.swapBudget.clients.used} / {activationSummary.swapBudget.clients.total} Used
                          </Badge>
                        </div>
                        {activationSummary.cooldownStatus?.clients.active && (
                          <div className="flex items-center gap-2 text-xs text-amber-700">
                            <Clock className="h-3 w-3" />
                            <span>Cooldown: {activationSummary.cooldownStatus.clients.hoursRemaining}h remaining</span>
                          </div>
                        )}
                        {activationSummary.swapBudget.clients.remaining === 0 && !activationSummary.cooldownStatus?.clients.active && (
                          <p className="text-xs text-red-600">Budget exhausted for this cycle</p>
                        )}
                      </div>
                    </div>

                    {/* Activation History - Collapsible */}
                    {(activationSummary.activationHistory.coaches.length > 0 || activationSummary.activationHistory.clients.length > 0) && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900">Activation History</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowActivationHistory(!showActivationHistory)}
                            className="text-blue-600 hover:text-blue-700"
                            data-testid="button-toggle-activation-history"
                          >
                            {showActivationHistory ? 'Hide' : 'Show'}
                          </Button>
                        </div>
                        {showActivationHistory && (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {[...activationSummary.activationHistory.coaches, ...activationSummary.activationHistory.clients]
                              .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
                              .slice(0, 10)
                              .map((event: any, i) => (
                                <div key={i} className="text-xs text-gray-700 flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                                  <span className="text-blue-500">•</span>
                                  <span className="flex-1">
                                    {event.reason.includes('rejected') ? `⚠️ ${event.reason.replace('swap_rejected_', '').replace('_', ' ')}` : 
                                     event.reason === 'swap' ? 'Member swapped' : 
                                     event.reason}
                                  </span>
                                  <span className="text-gray-500">{new Date(event.changedAt).toLocaleDateString()}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Two-Column Layout: Coaches | Clients */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coaches Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Coaches</h3>
                      <Badge className={
                        activationSummary?.quotas.coaches.active === activationSummary?.quotas.coaches.allowed
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }>
                        {activationSummary?.quotas.coaches.active || 0} / {activationSummary?.quotas.coaches.allowed || 0} Active
                      </Badge>
                    </div>

                    {/* Active Coaches */}
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-green-900">Active Coaches</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {activationSummary?.members.coaches
                          .filter(m => m.status === 'active')
                          .map(member => (
                            <div key={member.id} className="flex items-center justify-between bg-white p-2 rounded border border-green-200">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.email}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{member.email}</p>
                              </div>
                              {activationSummary.swapBudget && activationSummary.swapBudget.coaches.remaining > 0 && !activationSummary.cooldownStatus?.coaches.active && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSwapRole('coach');
                                    setSwapDeactivateMemberId(member.id);
                                  }}
                                  className="text-amber-600 hover:text-amber-700"
                                  data-testid={`button-deactivate-coach-${member.id}`}
                                >
                                  Deactivate
                                </Button>
                              )}
                            </div>
                          ))}
                        {activationSummary?.members.coaches.filter(m => m.status === 'active').length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No active coaches</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Locked Coaches */}
                    {activationSummary?.members.coaches.filter(m => m.status !== 'active').length > 0 && (
                      <Card className="bg-gray-50 border-gray-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-gray-700">Locked Coaches</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {activationSummary.members.coaches
                            .filter(m => m.status !== 'active')
                            .map(member => (
                              <div key={member.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-700 truncate">
                                    {member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.email}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge className="text-xs bg-gray-200 text-gray-600">
                                      {member.status === 'locked_downgrade' ? 'Downgrade' : 'Manual Lock'}
                                    </Badge>
                                    {member.swappedInThisCycle && (
                                      <Badge className="text-xs bg-purple-100 text-purple-700">
                                        Swapped In
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {activationSummary.swapBudget && activationSummary.swapBudget.coaches.remaining > 0 && !activationSummary.cooldownStatus?.coaches.active && activationSummary.quotas.coaches.active < activationSummary.quotas.coaches.allowed && !member.swappedInThisCycle && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSwapRole('coach');
                                      setSwapActivateMemberId(member.id);
                                    }}
                                    className="text-green-600 hover:text-green-700"
                                    data-testid={`button-activate-coach-${member.id}`}
                                  >
                                    Activate
                                  </Button>
                                )}
                              </div>
                            ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Swap Confirmation for Coaches */}
                    {swapRole === 'coach' && (swapActivateMemberId || swapDeactivateMemberId) && (
                      <Card className="bg-blue-50 border-blue-300">
                        <CardContent className="pt-4">
                          <p className="text-sm font-medium text-blue-900 mb-3">Complete Coach Swap</p>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs text-blue-700">Activate:</Label>
                              <Select value={String(swapActivateMemberId || '')} onValueChange={(v) => setSwapActivateMemberId(v ? parseInt(v) : null)}>
                                <SelectTrigger className="bg-white" data-testid="select-activate-coach">
                                  <SelectValue placeholder="Select locked coach" />
                                </SelectTrigger>
                                <SelectContent>
                                  {activationSummary?.members.coaches.filter(m => m.status !== 'active').map(m => (
                                    <SelectItem key={m.id} value={String(m.id)}>
                                      {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-blue-700">Deactivate:</Label>
                              <Select value={String(swapDeactivateMemberId || '')} onValueChange={(v) => setSwapDeactivateMemberId(v ? parseInt(v) : null)}>
                                <SelectTrigger className="bg-white" data-testid="select-deactivate-coach">
                                  <SelectValue placeholder="Select active coach" />
                                </SelectTrigger>
                                <SelectContent>
                                  {activationSummary?.members.coaches.filter(m => m.status === 'active').map(m => (
                                    <SelectItem key={m.id} value={String(m.id)}>
                                      {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={() => {
                                  if (swapActivateMemberId && swapDeactivateMemberId) {
                                    swapActivationMutation.mutate({
                                      activateMemberId: swapActivateMemberId,
                                      deactivateMemberId: swapDeactivateMemberId
                                    });
                                  }
                                }}
                                disabled={!swapActivateMemberId || !swapDeactivateMemberId || swapActivationMutation.isPending}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                data-testid="button-confirm-coach-swap"
                              >
                                {swapActivationMutation.isPending ? 'Swapping...' : 'Confirm Swap'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSwapActivateMemberId(null);
                                  setSwapDeactivateMemberId(null);
                                }}
                                data-testid="button-cancel-coach-swap"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Clients Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Clients</h3>
                      <Badge className={
                        activationSummary?.quotas.clients.active === activationSummary?.quotas.clients.allowed
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                      }>
                        {activationSummary?.quotas.clients.active || 0} / {activationSummary?.quotas.clients.allowed || 0} Active
                      </Badge>
                    </div>

                    {/* Active Clients */}
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-green-900">Active Clients</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                        {activationSummary?.members.clients
                          .filter(m => m.status === 'active')
                          .map(member => (
                            <div key={member.id} className="flex items-center justify-between bg-white p-2 rounded border border-green-200">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.email}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{member.email}</p>
                              </div>
                              {activationSummary.swapBudget && activationSummary.swapBudget.clients.remaining > 0 && !activationSummary.cooldownStatus?.clients.active && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSwapRole('client');
                                    setSwapDeactivateMemberId(member.id);
                                  }}
                                  className="text-amber-600 hover:text-amber-700"
                                  data-testid={`button-deactivate-client-${member.id}`}
                                >
                                  Deactivate
                                </Button>
                              )}
                            </div>
                          ))}
                        {activationSummary?.members.clients.filter(m => m.status === 'active').length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No active clients</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Locked Clients */}
                    {activationSummary?.members.clients.filter(m => m.status !== 'active').length > 0 && (
                      <Card className="bg-gray-50 border-gray-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm text-gray-700">Locked Clients</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                          {activationSummary.members.clients
                            .filter(m => m.status !== 'active')
                            .map(member => (
                              <div key={member.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-700 truncate">
                                    {member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.email}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                  <div className="flex gap-2 mt-1">
                                    <Badge className="text-xs bg-gray-200 text-gray-600">
                                      {member.status === 'locked_downgrade' ? 'Downgrade' : 'Manual Lock'}
                                    </Badge>
                                    {member.swappedInThisCycle && (
                                      <Badge className="text-xs bg-purple-100 text-purple-700">
                                        Swapped In
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {activationSummary.swapBudget && activationSummary.swapBudget.clients.remaining > 0 && !activationSummary.cooldownStatus?.clients.active && activationSummary.quotas.clients.active < activationSummary.quotas.clients.allowed && !member.swappedInThisCycle && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSwapRole('client');
                                      setSwapActivateMemberId(member.id);
                                    }}
                                    className="text-green-600 hover:text-green-700"
                                    data-testid={`button-activate-client-${member.id}`}
                                  >
                                    Activate
                                  </Button>
                                )}
                              </div>
                            ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Swap Confirmation for Clients */}
                    {swapRole === 'client' && (swapActivateMemberId || swapDeactivateMemberId) && (
                      <Card className="bg-blue-50 border-blue-300">
                        <CardContent className="pt-4">
                          <p className="text-sm font-medium text-blue-900 mb-3">Complete Client Swap</p>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs text-blue-700">Activate:</Label>
                              <Select value={String(swapActivateMemberId || '')} onValueChange={(v) => setSwapActivateMemberId(v ? parseInt(v) : null)}>
                                <SelectTrigger className="bg-white" data-testid="select-activate-client">
                                  <SelectValue placeholder="Select locked client" />
                                </SelectTrigger>
                                <SelectContent>
                                  {activationSummary?.members.clients.filter(m => m.status !== 'active').map(m => (
                                    <SelectItem key={m.id} value={String(m.id)}>
                                      {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-blue-700">Deactivate:</Label>
                              <Select value={String(swapDeactivateMemberId || '')} onValueChange={(v) => setSwapDeactivateMemberId(v ? parseInt(v) : null)}>
                                <SelectTrigger className="bg-white" data-testid="select-deactivate-client">
                                  <SelectValue placeholder="Select active client" />
                                </SelectTrigger>
                                <SelectContent>
                                  {activationSummary?.members.clients.filter(m => m.status === 'active').map(m => (
                                    <SelectItem key={m.id} value={String(m.id)}>
                                      {m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : m.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={() => {
                                  if (swapActivateMemberId && swapDeactivateMemberId) {
                                    swapActivationMutation.mutate({
                                      activateMemberId: swapActivateMemberId,
                                      deactivateMemberId: swapDeactivateMemberId
                                    });
                                  }
                                }}
                                disabled={!swapActivateMemberId || !swapDeactivateMemberId || swapActivationMutation.isPending}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                data-testid="button-confirm-client-swap"
                              >
                                {swapActivationMutation.isPending ? 'Swapping...' : 'Confirm Swap'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSwapActivateMemberId(null);
                                  setSwapDeactivateMemberId(null);
                                }}
                                data-testid="button-cancel-client-swap"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setManageActiveMembersOpen(false);
                  setSwapActivateMemberId(null);
                  setSwapDeactivateMemberId(null);
                  setShowActivationHistory(false);
                }}
                data-testid="button-close-manage-members"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}