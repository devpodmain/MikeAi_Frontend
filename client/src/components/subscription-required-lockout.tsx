import { Lock, Sparkles, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionRequiredLockoutProps {
  featureName?: string;
}

export function SubscriptionRequiredLockout({ featureName = "this feature" }: SubscriptionRequiredLockoutProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const getDashboardRoute = () => {
    if (!user) return "/";
    const userType = (user as any)?.userType;
    switch (userType) {
      case 'org_owner':
        return "/org-owner-dashboard";
      case 'coach':
        return "/coach-org-dashboard";
      case 'org_client':
        return "/org-client-dashboard";
      case 'individual':
      default:
        return "/user-home";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-0 bg-white/80 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <Lock className="w-10 h-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Subscription Required
          </CardTitle>
          <CardDescription className="text-base text-gray-600 mt-2">
            {featureName} is an exclusive feature for subscribers. Upgrade your account to unlock this premium feature.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Crown className="w-5 h-5 text-blue-500" />
              Subscriber Benefits
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Full access to Fitness GPT - Your personal AI trainer</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>AI-powered supplement recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Unlimited AI meal and workout plan generation</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Advanced recipe search with AI suggestions</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Priority support and new feature access</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate("/subscription")}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg"
              data-testid="button-subscribe"
            >
              Subscribe Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(getDashboardRoute())}
              className="w-full"
              data-testid="button-back-dashboard"
            >
              Back to Dashboard
            </Button>
          </div>

          <p className="text-center text-xs text-gray-500">
            Need help? Contact us at support@mikeai.co
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
