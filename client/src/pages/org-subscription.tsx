import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, Crown, Rocket, Building2, ArrowRight, Shield, Users, UserPlus, ArrowLeft, Lock, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";

interface SubscriptionTier {
  id: string;
  name: string;
  monthlyPrice: number;
  description: string;
  icon: React.ReactNode;
  features: string[];
  includedCoaches: number;
  includedClients: number;
  badge?: string;
  popular?: boolean;
}

interface UsageStats {
  coachesUsed: number;
  coachesAllowed: number;
  clientsUsed: number;
  clientsAllowed: number;
  daysRemaining: number;
  hasActiveBilling: boolean;
  periodEndsAt?: string;
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
  amountPaid: number;
  currency: string;
}

export default function OrgSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [addonDialogOpen, setAddonDialogOpen] = useState(false);
  const [addonType, setAddonType] = useState<'coach' | 'client'>('coach');
  const [addonQuantity, setAddonQuantity] = useState(1);
  const [purchasingAddon, setPurchasingAddon] = useState(false);
  const [previewData, setPreviewData] = useState<{
    proratedAmount: number;
    currency: string;
    monthlyRecurring: number;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Track extra coaches/clients for each tier
  const [extraCoaches, setExtraCoaches] = useState<{[key: string]: number}>({ basic: 0, pro: 0 });
  const [extraClients, setExtraClients] = useState<{[key: string]: number}>({ basic: 0, pro: 0 });

  // Fetch current billing period
  const { data: billing, isLoading: billingLoading } = useQuery<OrgBilling>({
    queryKey: [`/api/org/${user?.currentOrgId}/billing`],
    enabled: !!user?.currentOrgId,
  });

  // Fetch usage stats
  const { data: usage, isLoading: usageLoading} = useQuery<UsageStats>({
    queryKey: [`/api/org/${user?.currentOrgId}/usage`],
    enabled: !!user?.currentOrgId,
  });

  // Pre-populate dropdowns with last purchase quantities
  useEffect(() => {
    if (billing && billing.tier !== 'free') {
      // Set the current tier's addon quantities from the active billing period
      setExtraCoaches(prev => ({
        ...prev,
        [billing.tier]: billing.addonCoachQty || 0
      }));
      setExtraClients(prev => ({
        ...prev,
        [billing.tier]: billing.addonClientQty || 0
      }));
    }
  }, [billing]);

  const subscriptionTiers: SubscriptionTier[] = [
    {
      id: "basic",
      name: "Basic",
      monthlyPrice: 79,
      description: "Perfect for personal trainers",
      icon: <Crown className="w-8 h-8 text-amber-500" />,
      features: [
        "2 coach accounts included",
        "20 client slots included",
        "Maximum 4 coaches total",
        "Maximum 50 clients total",
        "Advanced meal plans with AI",
        "Custom workout programs",
        "Progress tracking & analytics",
        "Priority email support",
        "Add coaches at $25/month each",
        "Add clients at $3/month each"
      ],
      includedCoaches: 2,
      includedClients: 20,
      badge: "Most Popular",
      popular: true
    },
    {
      id: "pro",
      name: "Pro",
      monthlyPrice: 149,
      description: "For growing fitness businesses",
      icon: <Rocket className="w-8 h-8 text-purple-500" />,
      features: [
        "5 coach accounts included",
        "50 client slots included",
        "Maximum 15 coaches total",
        "Maximum 200 clients total",
        "Advanced analytics dashboard",
        "White-label options",
        "Dedicated account manager",
        "Cheaper add-ons: $20/coach, $2/client",
        "Priority 24/7 support"
      ],
      includedCoaches: 5,
      includedClients: 50
    }
  ];

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setLoading(true);
    
    try {
      // Create checkout session and get redirect URL
      // Note: organizationId is derived from authenticated session on backend
      const data = await apiRequest<{ url: string; sessionId: string }>("/api/org/create-checkout-session", "POST", {
        tier: tier.id,
        addonCoachQty: extraCoaches[tier.id] || 0,
        addonClientQty: extraClients[tier.id] || 0
      });
      
      if (data.url) {
        // Redirect to Stripe Checkout hosted page
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    } catch (error: any) {
      // Check if it's a downgrade protection error
      if (error.downgradeBlocked) {
        toast({
          title: "Downgrade Blocked",
          description: error.instructions || error.message,
          variant: "destructive",
          duration: 10000, // Show for 10 seconds
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create checkout session",
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  };

  const openAddonDialog = (type: 'coach' | 'client') => {
    setAddonType(type);
    setAddonQuantity(1);
    setPreviewData(null);
    setAddonDialogOpen(true);
  };

  const fetchPreview = async (type: 'coach' | 'client', quantity: number) => {
    setLoadingPreview(true);
    try {
      // For one-time payments, calculate preview locally (no API call needed)
      const pricePerUnit = type === 'coach' ? 25 : 3;
      const totalAmount = pricePerUnit * quantity * 100; // Convert to cents
      
      setPreviewData({
        proratedAmount: totalAmount,
        currency: 'usd',
        monthlyRecurring: totalAmount, // For one-time payments, these are the same
      });
    } catch (error: any) {
      toast({
        title: "Preview Error",
        description: error.message || "Failed to calculate preview",
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handlePurchaseAddon = async () => {
    setPurchasingAddon(true);
    
    try {
      const payload = addonType === 'coach' 
        ? { extraCoaches: addonQuantity, extraClients: 0 }
        : { extraCoaches: 0, extraClients: addonQuantity };

      // New endpoint redirects to Stripe checkout for add-on purchase
      const data = await apiRequest<{ url: string }>(
        `/api/org/${user?.currentOrgId}/add-slots`,
        "POST",
        payload
      );
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
        setPurchasingAddon(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to purchase add-on",
        variant: "destructive",
      });
      setPurchasingAddon(false);
    }
  };

  const getAddonPrice = (type: 'coach' | 'client', tierId?: string) => {
    // PRO tier has cheaper add-ons
    if (tierId === 'pro') {
      return type === 'coach' ? 20 : 2;
    }
    // BASIC tier pricing
    return type === 'coach' ? 25 : 3;
  };

  // Calculate total price for a tier with extras
  const calculateTotalPrice = (tier: SubscriptionTier) => {
    const basePrice = tier.monthlyPrice;
    const coachPrice = tier.id === 'pro' ? 20 : 25;
    const clientPrice = tier.id === 'pro' ? 2 : 3;
    const coachAddonCost = (extraCoaches[tier.id] || 0) * coachPrice;
    const clientAddonCost = (extraClients[tier.id] || 0) * clientPrice;
    return basePrice + coachAddonCost + clientAddonCost;
  };

  // Get maximum allowed for tier
  const getMaxAllowed = (tier: SubscriptionTier, type: 'coach' | 'client') => {
    if (tier.id === 'pro') {
      return type === 'coach' ? 15 : 200;
    }
    // BASIC tier caps
    return type === 'coach' ? 4 : 50;
  };

  const currentTier = billing?.tier || "none";
  const currentStatus = billing?.status || "active";
  const totalCoaches = billing?.totalCoachAllowance || 0;
  const totalClients = billing?.totalClientAllowance || 0;
  const activeCoaches = usage?.coachesUsed || 0;
  const activeClients = usage?.clientsUsed || 0;
  const lockedCoaches = Math.max(0, activeCoaches - totalCoaches);
  const lockedClients = Math.max(0, activeClients - totalClients);
  const daysRemaining = usage?.daysRemaining || 0;
  const hasActiveBilling = usage?.hasActiveBilling || false;
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining === 0 && hasActiveBilling;

  const isCurrentTier = (tierId: string) => currentTier === tierId;

  if (billingLoading || usageLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-900 dark:text-white text-lg">Loading subscription details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/org-owner-dashboard">
              <Button 
                variant="ghost" 
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-4"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            
            <div className="text-center mb-8">
              <Badge className="mb-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-6 py-2 border border-amber-500/30">
                <Rocket className="w-4 h-4 mr-2 inline" />
                Flexible Pricing • Scale as You Grow
              </Badge>
              <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-4">
                Choose Your Plan
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Purchase monthly access with no recurring commitments. Add coaches and clients as needed.
              </p>
            </div>
          </div>

          {/* Access Expiry Alert */}
          {(isExpiringSoon || isExpired) && (
            <Card className={`mb-6 ${isExpired ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isExpired ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  <AlertCircle className="w-5 h-5" />
                  {isExpired ? 'Access Expired' : 'Access Expiring Soon'}
                </CardTitle>
                <CardDescription className={isExpired ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>
                  {isExpired 
                    ? 'Your access has expired. Extend your access to continue using all features.'
                    : `Your access expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Extend now to avoid interruption.`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  data-testid="button-extend-access"
                  onClick={() => {
                    const tier = subscriptionTiers.find(t => t.id === currentTier);
                    if (tier) handleUpgrade(tier);
                  }}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Extend Access for 30 Days
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Current Status Card */}
          {hasActiveBilling && (
            <Card className="mb-8 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Current Access Period</span>
                  <Badge 
                    variant={currentStatus === "active" ? "default" : "destructive"}
                    className={currentStatus === "active" ? "bg-green-500" : ""}
                  >
                    {currentStatus}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {billing?.currentPeriodEndsAt && (
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {daysRemaining > 0 
                        ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining (expires ${new Date(billing.currentPeriodEndsAt).toLocaleDateString()})`
                        : 'Access expired'
                      }
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-amber-500" />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Coach Usage</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {activeCoaches} / {totalCoaches}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    {totalCoaches - activeCoaches} slots available
                  </p>
                  {lockedCoaches > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {lockedCoaches} coach{lockedCoaches !== 1 ? 'es' : ''} locked
                    </p>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <UserPlus className="w-5 h-5 text-amber-500" />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Client Usage</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {activeClients} / {totalClients}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    {totalClients - activeClients} slots available
                  </p>
                  {lockedClients > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {lockedClients} client{lockedClients !== 1 ? 's' : ''} locked
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Renewal Protection Warning */}
          {hasActiveBilling && (activeCoaches > 0 || activeClients > 0) && (
            <Card className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <AlertCircle className="w-5 h-5" />
                  Important: Renewal Protection
                </CardTitle>
                <CardDescription className="text-blue-600 dark:text-blue-400">
                  You currently have <strong>{activeCoaches} active coach{activeCoaches !== 1 ? 'es' : ''}</strong> and{' '}
                  <strong>{activeClients} active client{activeClients !== 1 ? 's' : ''}</strong>.
                  {' '}Make sure to purchase at least this capacity to keep all members active.
                  {' '}If you purchase less, members will be automatically soft-locked.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-5xl mx-auto">
            {subscriptionTiers.map((tier) => (
              <Card 
                key={tier.id}
                className={`relative hover:shadow-2xl transition-all duration-300 ${
                  tier.popular 
                    ? "ring-2 ring-amber-500 shadow-xl border-amber-500 bg-white dark:bg-slate-800/80" 
                    : isCurrentTier(tier.id)
                    ? "ring-2 ring-green-500 bg-white dark:bg-slate-800/80 border-green-500"
                    : "bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                }`}
                data-testid={`card-tier-${tier.id}`}
              >
                {tier.badge && !isCurrentTier(tier.id) && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className={`px-4 py-1 font-bold shadow-lg ${
                      tier.popular ? "bg-amber-500 text-white" : "bg-slate-700 text-white"
                    }`}>
                      {tier.badge}
                    </Badge>
                  </div>
                )}

                {isCurrentTier(tier.id) && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="px-4 py-1 font-bold bg-green-500 text-white shadow-lg">
                      Current Plan
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-6 pt-8">
                  <div className="flex justify-center mb-4">
                    <div className={`p-4 rounded-2xl ${
                      tier.popular ? "bg-amber-500/10" : "bg-slate-100 dark:bg-slate-700/50"
                    }`}>
                      {tier.icon}
                    </div>
                  </div>
                  <CardTitle className="text-3xl font-black mb-2 text-slate-900 dark:text-white">{tier.name}</CardTitle>
                  <CardDescription className="text-base text-slate-600 dark:text-slate-400">{tier.description}</CardDescription>
                  
                  <div className="mt-6">
                    <div className="flex items-end justify-center gap-2">
                      <span className="text-2xl text-slate-500 dark:text-slate-400">$</span>
                      <span className="text-6xl font-black text-slate-900 dark:text-white">{tier.monthlyPrice}</span>
                      <span className="text-slate-500 dark:text-slate-400 mb-2">/mo</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                      {tier.includedCoaches} coach{tier.includedCoaches > 1 ? 'es' : ''} • {tier.includedClients} client{tier.includedClients > 1 ? 's' : ''}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features List */}
                  <div className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Add-on Dropdowns - Only show if not current tier */}
                  {!isCurrentTier(tier.id) && (
                    <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg space-y-4 border border-slate-200 dark:border-slate-700">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Customize Your Plan</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`extra-coaches-${tier.id}`} className="text-xs text-slate-600 dark:text-slate-400">
                          Extra Coaches (+${getAddonPrice('coach', tier.id)}/coach/month)
                          {tier.id === 'basic' && <span className="text-amber-600"> • Max 4 total</span>}
                          {tier.id === 'pro' && <span className="text-purple-600"> • Max 15 total</span>}
                        </Label>
                        <Select 
                          value={extraCoaches[tier.id]?.toString() || "0"}
                          onValueChange={(value) => setExtraCoaches({...extraCoaches, [tier.id]: parseInt(value)})}
                        >
                          <SelectTrigger id={`extra-coaches-${tier.id}`} data-testid={`select-extra-coaches-${tier.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tier.id === 'basic' 
                              ? [0, 1, 2].map((num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num} {num === 0 ? '(included only)' : `extra (${tier.includedCoaches + num} total)`}
                                  </SelectItem>
                                ))
                              : [0, 1, 2, 3, 5, 10].map((num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num} {num === 0 ? '(included only)' : `extra (${tier.includedCoaches + num} total)`}
                                  </SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`extra-clients-${tier.id}`} className="text-xs text-slate-600 dark:text-slate-400">
                          Extra Clients (+${getAddonPrice('client', tier.id)}/client/month)
                          {tier.id === 'basic' && <span className="text-amber-600"> • Max 50 total</span>}
                          {tier.id === 'pro' && <span className="text-purple-600"> • Max 200 total</span>}
                        </Label>
                        <Select 
                          value={extraClients[tier.id]?.toString() || "0"}
                          onValueChange={(value) => setExtraClients({...extraClients, [tier.id]: parseInt(value)})}
                        >
                          <SelectTrigger id={`extra-clients-${tier.id}`} data-testid={`select-extra-clients-${tier.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tier.id === 'basic'
                              ? [0, 5, 10, 20, 30, 48].map((num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num} {num === 0 ? '(included only)' : `extra (${tier.includedClients + num} total)`}
                                  </SelectItem>
                                ))
                              : [0, 5, 10, 20, 50, 100, 150].map((num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num} {num === 0 ? '(included only)' : `extra (${tier.includedClients + num} total)`}
                                  </SelectItem>
                                ))
                            }
                          </SelectContent>
                        </Select>
                      </div>

                      {(extraCoaches[tier.id] > 0 || extraClients[tier.id] > 0) && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">Total Monthly Price:</span>
                            <span className="font-bold text-slate-900 dark:text-white text-lg">
                              ${calculateTotalPrice(tier)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  {isCurrentTier(tier.id) ? (
                    <Button
                      disabled
                      className="w-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-white py-6"
                      data-testid={`button-current-${tier.id}`}
                    >
                      Current Plan
                    </Button>
                  ) : usage?.hasActiveBilling ? (
                    <div className="space-y-2">
                      <Button
                        disabled
                        className="w-full py-6 text-lg bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                        data-testid={`button-upgrade-${tier.id}-blocked`}
                      >
                        <Lock className="mr-2 w-5 h-5" />
                        Upgrade Blocked
                      </Button>
                      <p className="text-xs text-amber-600 dark:text-amber-400 text-center flex items-center justify-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Mid-cycle upgrades blocked. Wait until {usage.periodEndsAt ? new Date(usage.periodEndsAt).toLocaleDateString() : 'current period expires'}.
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(tier)}
                      disabled={loading}
                      className={`w-full py-6 text-lg ${
                        tier.popular
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold"
                          : "bg-slate-700 hover:bg-slate-600 text-white"
                      }`}
                      data-testid={`button-upgrade-${tier.id}`}
                    >
                      {loading ? (
                        "Processing..."
                      ) : (
                        <>
                          Purchase Monthly Access
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </>
                      )}
                    </Button>
                  )}

                  {!usage?.hasActiveBilling && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
                      One-time payment for 30 days of access
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Security & Benefits Section */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">No Commitments</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Purchase monthly access with no long-term contracts or automatic renewals.</p>
            </div>

            <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                <Shield className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Secure Payment</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Powered by Stripe. Bank-level security with 3D Secure protection.</p>
            </div>

            <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                <Rocket className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Scale Instantly</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Add coaches and clients as needed during your access period.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add-on Purchase Dialog */}
      <Dialog 
        open={addonDialogOpen} 
        onOpenChange={(open) => {
          setAddonDialogOpen(open);
          if (open) {
            fetchPreview(addonType, 1);
          }
        }}
      >
        <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">
              Purchase {addonType === 'coach' ? 'Coach' : 'Client'} Slots
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Add extra {addonType} slots to your current access period. Pay only for the remaining days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-slate-900 dark:text-white">
                Number of slots to add
              </Label>
              <div className="flex gap-2">
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="50"
                  value={addonQuantity}
                  onChange={(e) => {
                    const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                    setAddonQuantity(newQuantity);
                  }}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  data-testid="input-addon-quantity"
                />
                <Button
                  onClick={() => fetchPreview(addonType, addonQuantity)}
                  variant="outline"
                  className="border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  disabled={loadingPreview}
                  data-testid="button-refresh-preview"
                >
                  {loadingPreview ? "Loading..." : "Update Preview"}
                </Button>
              </div>
            </div>

            {loadingPreview ? (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-slate-600 dark:text-slate-400">Loading billing preview...</p>
              </div>
            ) : previewData ? (
              <div className="bg-amber-50 dark:bg-slate-900/50 p-4 rounded-lg border border-amber-500/30 space-y-3">
                <h4 className="text-slate-900 dark:text-white font-semibold text-sm">Billing Preview</h4>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Price per slot:</span>
                  <span className="text-slate-900 dark:text-white font-mono">${getAddonPrice(addonType)}/month</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Quantity:</span>
                  <span className="text-slate-900 dark:text-white font-mono">×{addonQuantity}</span>
                </div>
                <div className="h-px bg-slate-300 dark:bg-slate-700 my-2"></div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Charge for remaining period:</span>
                  <span className="text-green-600 dark:text-green-400 font-bold">
                    ${(previewData.proratedAmount / 100).toFixed(2)} {previewData.currency.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                  You'll be charged ${(previewData.proratedAmount / 100).toFixed(2)} for the remaining {daysRemaining} days of your access period.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-slate-600 dark:text-slate-400 text-sm">Click "Update Preview" to see billing details</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddonDialogOpen(false)}
              className="border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              data-testid="button-cancel-addon"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchaseAddon}
              disabled={purchasingAddon || !previewData}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold disabled:opacity-50"
              data-testid="button-confirm-addon"
            >
              {purchasingAddon ? "Processing..." : !previewData ? "Load Preview First" : `Confirm Purchase`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
