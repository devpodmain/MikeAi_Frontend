import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, X } from "lucide-react";
import { useState } from "react";

export function SubscriptionBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!user || dismissed) return null;

  const trialDaysRemaining = user.trialDaysRemaining || 0;
  const hasTrialExpired = user.trialExpired;
  const isSubscribed = user.subscriptionStatus === "active";

  // Don't show banner if user is already subscribed
  if (isSubscribed) return null;

  // Show different messages based on trial status
  if (hasTrialExpired) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <p className="text-sm text-red-800">
                <strong>Trial Expired:</strong> Your free trial has ended. Subscribe to continue using ACTIV.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => window.location.href = "/subscription"}
              className="bg-red-600 hover:bg-red-700"
            >
              Subscribe Now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show warning when trial is about to expire
  if (trialDaysRemaining <= 3) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-400 mr-2" />
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Trial Ending Soon:</strong> You have {trialDaysRemaining} days left in your free trial.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.href = "/subscription"}
            >
              View Plans
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}