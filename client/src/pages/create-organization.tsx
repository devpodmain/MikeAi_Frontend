import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  Users, 
  Target,
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowRight
} from "lucide-react";

export default function CreateOrganization() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [step, setStep] = useState<"form" | "success">("form");
  const [orgData, setOrgData] = useState({
    name: "",
    commonPassword: "",
    confirmPassword: "",
    description: "",
    maxCoaches: 2,
    maxClients: 50
  });

  const createOrgMutation = useMutation({
    mutationFn: (data: { name: string; commonPassword: string }) =>
      apiRequest("/api/organizations/create", "POST", data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setStep("success");
      toast({
        title: "Organization Created!",
        description: "Your organization has been successfully created.",
      });
      setTimeout(() => {
        navigate("/org-owner-dashboard");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orgData.name.trim()) {
      toast({
        title: "Error",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }

    if (!orgData.commonPassword) {
      toast({
        title: "Error",
        description: "Organization password is required",
        variant: "destructive",
      });
      return;
    }

    if (orgData.commonPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (orgData.commonPassword !== orgData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    createOrgMutation.mutate({
      name: orgData.name,
      commonPassword: orgData.commonPassword
    });
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Organization Created Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            Redirecting to your organization dashboard...
          </p>
          <div className="animate-pulse">
            <Clock className="h-5 w-5 text-gray-400 inline-block animate-spin" />
          </div>
        </Card>
      </div>
    );
  }

  // Check if user is authenticated
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Building2 className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Organization</h2>
          <p className="text-gray-600 mb-6">
            Sign in first to create and manage your fitness organization
          </p>
          <Button 
            onClick={() => window.location.href = "/signin"} 
            className="w-full"
            data-testid="button-signin-create-org"
          >
            Sign In to Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Card>
      </div>
    );
  }

  // If user already owns an organization, redirect to dashboard
  if (user?.userType === "org_owner" && user?.currentOrgId) {
    navigate("/org-owner-dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Building2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Create Your Organization
            </h1>
            <p className="text-xl text-gray-600">
              Transform your coaching practice with powerful team management tools
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Elite Fitness Coaching"
                  value={orgData.name}
                  onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                  className="mt-2"
                  data-testid="input-org-name"
                />
              </div>

              <div>
                <Label htmlFor="commonPassword">Organization Password *</Label>
                <Input
                  id="commonPassword"
                  type="password"
                  placeholder="Shared password for coaches and clients"
                  value={orgData.commonPassword}
                  onChange={(e) => setOrgData({ ...orgData, commonPassword: e.target.value })}
                  className="mt-2"
                  minLength={6}
                  data-testid="input-org-password"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This password will be used by coaches and clients to access your organization
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter the organization password"
                  value={orgData.confirmPassword}
                  onChange={(e) => setOrgData({ ...orgData, confirmPassword: e.target.value })}
                  className="mt-2"
                  minLength={6}
                  data-testid="input-org-confirm-password"
                />
              </div>

              <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Subscription Plans
                </h3>
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">FREE Tier</h4>
                      <span className="text-sm font-medium text-blue-600">$0/month</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Your organization starts here - explore the platform before upgrading
                    </p>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                        <span>0 coaches, 0 clients</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                        <span>Upgrade anytime to add members</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">BASIC Tier</h4>
                      <span className="text-sm font-medium text-gray-900">$79/month</span>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>1 coach, 20 clients included</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Add more coaches or clients as needed</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">PRO Tier</h4>
                      <span className="text-sm font-medium text-gray-900">$249/month</span>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>5 coaches, 50 clients included</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Best value for growing teams</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-4 italic">
                  You can upgrade from FREE to BASIC or PRO anytime from your Subscription page
                </p>
              </div>

              <div className="pt-6">
                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-400 to-yellow-400 text-gray-900 hover:from-orange-500 hover:to-yellow-500"
                  size="lg"
                  disabled={createOrgMutation.isPending}
                  data-testid="button-create-org"
                >
                  {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}