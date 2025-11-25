import { Lock, Sparkles, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

interface TrialExpiredLockoutProps {
  featureName?: string;
}

export function TrialExpiredLockout({ featureName = "this feature" }: TrialExpiredLockoutProps) {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-amber-50/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-0 bg-white/80 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
            <Lock className="w-10 h-10 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Your Free Trial Has Ended
          </CardTitle>
          <CardDescription className="text-base text-gray-600 mt-2">
            Your 7-day free trial has expired. Subscribe now to continue using {featureName} and unlock all premium features.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Crown className="w-5 h-5 text-orange-500" />
              Unlock Premium Features
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>AI-powered personalized meal plans</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Custom workout plans tailored to your goals</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>AI recipe generator with unlimited searches</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Fitness GPT and Supplements AI assistant</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>Progress tracking and habit building tools</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate("/subscription")}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg"
              data-testid="button-subscribe"
            >
              View Subscription Plans
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
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
