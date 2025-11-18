import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Crown, Sparkles, ArrowRight, Shield } from "lucide-react";
import Navigation from "@/components/navigation";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: React.ReactNode;
  features: string[];
  badge?: string;
  popular?: boolean;
}

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // PLUS plan - One-time payment for 30 days access
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "plus",
      name: "Plus",
      price: 4.99,
      description: "30 days of full access",
      icon: <Crown className="w-8 h-8 text-blue-500" />,
      features: [
        "Unlimited AI meal plans",
        "Custom workout programs",
        "24/7 Fitness GPT AI Coach",
        "AI supplement recommendations",
        "AI recipe generator",
        "Habit tracking (up to 5 habits)",
        "Water intake tracking",
        "Community access",
        "Progress analytics & insights",
        "Priority support"
      ],
      badge: "30 Days Access",
      popular: true
    }
  ];

  const handleBuyNow = async (plan: SubscriptionPlan) => {
    setLoading(true);
    
    try {
      // Create checkout session and get redirect URL
      const data = await apiRequest<{ url: string; sessionId: string }>("/api/create-checkout-session", "POST", {
        planId: plan.id
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
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const currentPlan = user?.subscriptionStatus || "trial";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary px-6 py-2">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              No Subscriptions • No Automatic Billing
            </Badge>
            <h1 className="text-5xl font-black text-gray-900 mb-4">
              Get 30 Days of Full Access
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              One-time payment of $4.99. No recurring charges. Renew only when you want to.
            </p>
            {currentPlan && (
              <div className="mt-6">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Current Plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </Badge>
              </div>
            )}
          </div>

          {/* Pricing Card */}
          {subscriptionPlans.map((plan) => (
            <Card 
              key={plan.id}
              className="relative hover:shadow-2xl transition-all duration-300 ring-2 ring-primary shadow-xl border-primary"
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="px-4 py-1 font-bold bg-primary text-white shadow-lg">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6 pt-8">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-2xl bg-primary/10">
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className="text-3xl font-black mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                
                <div className="mt-6">
                  <div className="flex items-end justify-center gap-2">
                    <span className="text-6xl font-black text-primary">${plan.price}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">One-time payment • 30 days access</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features List */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Security Badge */}
                <div className="flex items-center space-x-3 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Secure Payment via Stripe</p>
                    <p className="text-xs">Your payment information is encrypted and secure</p>
                  </div>
                </div>

                {/* Buy Now Button */}
                <Button
                  onClick={() => handleBuyNow(plan)}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-lg py-6"
                  data-testid="button-buy-now"
                >
                  {loading ? (
                    "Redirecting to checkout..."
                  ) : (
                    <>
                      Buy Now - $4.99
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Clicking "Buy Now" will redirect you to Stripe's secure checkout page.
                  No credit card is stored on our servers.
                </p>
              </CardContent>
            </Card>
          ))}

          {/* Benefits Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">No Auto-Renewal</h3>
              <p className="text-sm text-gray-600">Pay once, use for 30 days. No surprises.</p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Secure Payment</h3>
              <p className="text-sm text-gray-600">Powered by Stripe. Bank-level security.</p>
            </div>

            <div className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Full Access</h3>
              <p className="text-sm text-gray-600">Unlock all premium features instantly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
