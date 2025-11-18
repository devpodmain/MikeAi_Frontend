import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import logoImage from "@assets/1_1753425387748.png";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    setToken(tokenParam);

    if (!tokenParam) {
      toast({
        title: "Invalid Reset Link",
        description: "The password reset link is missing or invalid.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      if (!token) {
        throw new Error("Reset token is missing");
      }

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: data.password,
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      return await response.json();
    },
    onSuccess: () => {
      setResetSuccess(true);
      setErrorMessage(null);
      toast({
        title: "Password reset successful!",
        description: "You can now log in with your new password.",
      });
    },
    onError: (error) => {
      const message = error.message || "The reset link may have expired. Please request a new one.";
      setErrorMessage(message);
      toast({
        title: "Failed to reset password",
        description: message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    setErrorMessage(null); // Clear any previous errors
    resetPasswordMutation.mutate(data);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Invalid Reset Link
            </CardTitle>
            <CardDescription className="text-gray-600">
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                Please request a new password reset link from the login page.
              </AlertDescription>
            </Alert>
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              onClick={() => navigate("/forgot-password")}
              data-testid="button-request-new-link"
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link href="/forgot-password">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900" data-testid="button-back-to-forgot-password">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forgot Password
            </Button>
          </Link>
        </div>
        
        <div className="text-center mb-8">
          <img
            src={logoImage}
            alt="MikeAI Logo"
            className="h-16 w-16 mx-auto mb-4 rounded-full"
          />
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 mt-2">Enter your new password below</p>
        </div>

        <Card className="border-gray-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Create New Password</CardTitle>
            <CardDescription className="text-gray-600">
              Choose a strong password to protect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!resetSuccess ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {errorMessage && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <AlertDescription className="ml-2 text-red-800">
                        <strong>Error:</strong> {errorMessage}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              {...field}
                              type="password"
                              placeholder="Enter new password"
                              className="pl-10 border-gray-300 focus:border-orange-500"
                              data-testid="input-password"
                            />
                          </div>
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
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              {...field}
                              type="password"
                              placeholder="Confirm new password"
                              className="pl-10 border-gray-300 focus:border-orange-500"
                              data-testid="input-confirm-password"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertDescription className="text-amber-800 text-sm">
                      <strong>Password Requirements:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>At least 6 characters long</li>
                        <li>Use a mix of letters, numbers, and symbols</li>
                        <li>Avoid using common words or personal info</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    disabled={resetPasswordMutation.isPending}
                    data-testid="button-reset-password"
                  >
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription className="ml-2 text-green-800">
                    <strong className="font-semibold">Password reset successful!</strong>
                    <p className="mt-2 text-sm">
                      Your password has been updated. You can now log in with your new password.
                    </p>
                  </AlertDescription>
                </Alert>

                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  onClick={() => navigate("/auth/login")}
                  data-testid="button-go-to-login"
                >
                  Go to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {!resetSuccess && (
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Remember your password?{" "}
              <button
                onClick={() => navigate("/auth/login")}
                className="text-orange-600 hover:underline font-semibold"
                data-testid="link-login"
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
