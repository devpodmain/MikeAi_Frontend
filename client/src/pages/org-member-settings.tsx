import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Lock, User, Mail, Building2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function OrgMemberSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const setPasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      return await apiRequest("/api/org-member/set-password", "POST", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Password updated successfully",
        description: "You can now use your personal password to login",
      });
      form.reset();
      setShowPasswordForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update password",
        description: error.message || "Please check your current password and try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PasswordFormData) => {
    setPasswordMutation.mutate(data);
  };

  if (!user) return null;

  // Determine dashboard path based on role, with fallback to userType
  const dashboardPath = user.role === 'client' 
    ? '/org-client-dashboard' 
    : user.role === 'coach' 
      ? '/coach-org-dashboard' 
      : user.userType === 'org_client' 
        ? '/org-client-dashboard' 
        : '/coach-org-dashboard';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href={dashboardPath}>
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900" data-testid="button-back-org-member-dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Account Information */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription className="text-gray-600">Your organization member details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900 mt-1">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <p className="text-gray-900 mt-1">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organization
                </label>
                <p className="text-gray-900 mt-1">{user.organizationName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <Badge className="mt-1 bg-amber-500 hover:bg-amber-600">
                  {user.role === 'coach' ? 'Coach' : 'Client'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Lock className="h-5 w-5" />
              Password Settings
            </CardTitle>
            <CardDescription className="text-gray-600">
              {(user as any).hasPersonalPassword 
                ? "Update your personal password" 
                : "Set a personal password to login without using the organization password"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showPasswordForm ? (
              <Button 
                onClick={() => setShowPasswordForm(true)}
                className="bg-amber-500 hover:bg-amber-600"
                data-testid="button-set-password"
              >
                {(user as any).hasPersonalPassword ? "Change Password" : "Set Personal Password"}
              </Button>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Current Password
                          <span className="text-xs text-gray-500 ml-2">
                            (Use organization password if you haven't set a personal one)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            className="bg-white border-gray-200 text-gray-900"
                            data-testid="input-current-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">New Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            className="bg-white border-gray-200 text-gray-900"
                            data-testid="input-new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Confirm New Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            className="bg-white border-gray-200 text-gray-900"
                            data-testid="input-confirm-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={setPasswordMutation.isPending}
                      className="bg-amber-500 hover:bg-amber-600"
                      data-testid="button-save-password"
                    >
                      {setPasswordMutation.isPending ? "Saving..." : "Save Password"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        form.reset();
                      }}
                      className="border-gray-200 text-gray-700 hover:bg-gray-50"
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
