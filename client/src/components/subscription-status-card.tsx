import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Calendar, AlertCircle, CheckCircle, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

interface SubscriptionInfo {
  subscriptionStatus: string;
  subscriptionTier: string;
  expiresAt: string | null;
  daysRemaining: number;
  isExpired: boolean;
  activePayment: any;
}

export default function SubscriptionStatusCard() {
  const [, navigate] = useLocation();
  
  const { data: subInfo, isLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/user/subscription-info"],
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 via-blue-50 to-purple-50 border-primary/20">
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (!subInfo) return null;

  const { subscriptionStatus, subscriptionTier, expiresAt, daysRemaining, isExpired } = subInfo;
  
  // Determine status color and icon
  const getStatusConfig = () => {
    if (subscriptionTier === 'plus' && !isExpired) {
      return {
        color: 'bg-gradient-to-r from-primary to-blue-600',
        textColor: 'text-white',
        icon: <Crown className="w-5 h-5" />,
        badge: 'PLUS',
        badgeColor: 'bg-amber-500 text-white',
        showRenew: daysRemaining <= 7
      };
    } else if (isExpired) {
      return {
        color: 'bg-gradient-to-r from-gray-400 to-gray-500',
        textColor: 'text-white',
        icon: <AlertCircle className="w-5 h-5" />,
        badge: 'EXPIRED',
        badgeColor: 'bg-red-500 text-white',
        showRenew: true
      };
    } else {
      return {
        color: 'bg-gradient-to-r from-gray-100 to-gray-200',
        textColor: 'text-gray-900',
        icon: <Sparkles className="w-5 h-5" />,
        badge: 'FREE TRIAL',
        badgeColor: 'bg-blue-500 text-white',
        showRenew: false
      };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className={`${config.color} shadow-lg border-0`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/20 ${config.textColor}`}>
              {config.icon}
            </div>
            <div>
              <CardTitle className={`text-lg ${config.textColor}`}>
                Your Plan
              </CardTitle>
              <CardDescription className={`${config.textColor} opacity-90`}>
                Current subscription status
              </CardDescription>
            </div>
          </div>
          <Badge className={config.badgeColor}>
            {config.badge}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Expiry Information */}
        {expiresAt && !isExpired && (
          <div className={`flex items-center justify-between p-3 rounded-lg bg-white/10 ${config.textColor}`}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Expires</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">
                {new Date(expiresAt).toLocaleDateString()}
              </p>
              <p className="text-xs opacity-80">
                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
              </p>
            </div>
          </div>
        )}

        {/* Expired Message */}
        {isExpired && (
          <div className={`flex items-center gap-2 p-3 rounded-lg bg-white/10 ${config.textColor}`}>
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Your subscription has expired</span>
          </div>
        )}

        {/* Free Trial Message */}
        {subscriptionTier === 'free' && !isExpired && (
          <div className={`flex items-center gap-2 p-3 rounded-lg bg-white/10 ${config.textColor}`}>
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Limited access to basic features</span>
          </div>
        )}

        {/* Renew/Upgrade Button */}
        {(config.showRenew || subscriptionTier === 'free') && (
          <Button
            onClick={() => navigate('/subscription')}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold shadow-md"
            data-testid="button-upgrade-renew"
          >
            {isExpired ? 'Renew Now' : subscriptionTier === 'free' ? 'Upgrade to Plus' : 'Renew Early'}
          </Button>
        )}

        {/* Active Subscription Message */}
        {subscriptionTier === 'plus' && !isExpired && daysRemaining > 7 && (
          <div className={`text-center text-sm ${config.textColor} opacity-90`}>
            <CheckCircle className="w-4 h-4 inline mr-1" />
            All premium features unlocked
          </div>
        )}
      </CardContent>
    </Card>
  );
}
