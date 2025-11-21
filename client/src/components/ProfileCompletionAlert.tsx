import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useProfileStatus } from "@/hooks/useProfileStatus";

export function ProfileCompletionAlert() {
  const { isComplete, missingFields, isLoading } = useProfileStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isLoading || isComplete || isDismissed) {
    return null;
  }

  return (
    <Alert 
      className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800"
      data-testid="alert-profile-incomplete"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
          <div className="flex-1">
            <AlertDescription className="text-orange-900 dark:text-orange-100">
              <span className="font-semibold">Complete your profile to get personalized AI recommendations</span>
              <div className="mt-2 text-sm">
                Missing: {missingFields.join(", ")}
              </div>
              <Link href="/profile">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 border-orange-600 text-orange-600 hover:bg-orange-100 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900"
                  data-testid="button-complete-profile"
                >
                  Complete Profile Now
                </Button>
              </Link>
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDismissed(true)}
          className="text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900 h-8 w-8 p-0"
          data-testid="button-dismiss-alert"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}