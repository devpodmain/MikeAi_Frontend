import { useAuth } from "@/hooks/useAuth";

export interface TrialGuardResult {
  isLoading: boolean;
  isTrialExpired: boolean;
  isSubscribed: boolean;
  canAccessPremium: boolean;
  trialDaysRemaining: number;
}

export function useTrialGuard(): TrialGuardResult {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return {
      isLoading: true,
      isTrialExpired: false,
      isSubscribed: false,
      canAccessPremium: false,
      trialDaysRemaining: 0,
    };
  }

  const isSubscribed = user.subscriptionStatus === "active";
  const isTrialExpired = user.trialExpired === true;
  const trialDaysRemaining = user.trialDaysRemaining || 0;
  
  const canAccessPremium = isSubscribed || (!isTrialExpired && trialDaysRemaining > 0);

  return {
    isLoading: false,
    isTrialExpired,
    isSubscribed,
    canAccessPremium,
    trialDaysRemaining,
  };
}
