import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle, Users, Calendar } from "lucide-react";

interface OrganizationSubscription {
  id: number;
  organizationId: number;
  tier: 'free' | 'basic' | 'pro';
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  baseCoachAllowance: number;
  baseClientAllowance: number;
  addonCoachQty: number;
  addonClientQty: number;
  totalCoachAllowance: number;
  totalClientAllowance: number;
  currentPeriodStartsAt: string;
  currentPeriodEndsAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrgSubscriptionSuccess() {
  const [, navigate] = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null);
  const [orgId, setOrgId] = useState<number | null>(null);

  // Get session_id from URL (Stripe Checkout redirect)
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  useEffect(() => {
    const verifySubscription = async () => {
      if (!sessionId) {
        console.log("No session ID provided");
        setVerifying(false);
        return;
      }

      // Wait for webhook to process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        // Fetch the checkout session details
        const sessionResponse = await fetch(`/api/checkout-session/${sessionId}`, {
          credentials: "include"
        });
        
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          console.log("Checkout session data:", sessionData);
          
          // Extract organizationId from session metadata
          const organizationId = sessionData.metadata?.organizationId;
          console.log("Organization ID:", organizationId, "Session status:", sessionData.status, "Payment status:", sessionData.payment_status);
          
          if (!organizationId) {
            console.error("No organization ID in session metadata");
            setVerifying(false);
            return;
          }

          // Stripe returns status='complete' with payment_status='paid' for successful payments
          // We require BOTH conditions to be true for a valid payment
          if (sessionData.payment_status !== 'paid' || sessionData.status !== 'complete') {
            console.error("Payment not completed. Status:", sessionData.status, "Payment status:", sessionData.payment_status);
            setVerifying(false);
            return;
          }

          setOrgId(parseInt(organizationId));
          
          // Fetch the organization billing period from database
          const subscriptionResponse = await fetch(`/api/org/${organizationId}/billing`, {
            credentials: "include"
          });
          
          if (subscriptionResponse.ok) {
            const subscriptionData = await subscriptionResponse.json();
            console.log("Billing data:", subscriptionData);
            
            // For newly created subscriptions, just check if it exists and is active
            // Don't rely on updatedAt timing since webhook might process immediately
            if (subscriptionData.status === 'active') {
              setSubscription(subscriptionData);
            } else {
              console.error("Subscription not active. Status:", subscriptionData.status);
            }
          } else {
            const errorText = await subscriptionResponse.text();
            console.error("Failed to fetch billing data:", subscriptionResponse.status, errorText);
          }
        } else {
          const errorText = await sessionResponse.text();
          console.error("Failed to fetch checkout session:", sessionResponse.status, errorText);
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      }
      
      setVerifying(false);
    };

    verifySubscription();
  }, [sessionId]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-md mx-auto text-center bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Loader2 className="w-16 h-16 text-amber-500 mx-auto animate-spin mb-4" />
              <CardTitle className="text-white">Activating Your Subscription</CardTitle>
              <CardDescription className="text-slate-300">
                Please wait while we confirm your subscription...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (subscription && orgId) {
    const tierName = subscription.tier.toUpperCase();
    const periodEnd = new Date(subscription.currentPeriodEndsAt);
    const totalCoaches = subscription.baseCoachAllowance + subscription.addonCoachQty;
    const totalClients = subscription.baseClientAllowance + subscription.addonClientQty;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-2xl mx-auto bg-slate-800/50 border-slate-700">
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-3xl text-white">Subscription Activated!</CardTitle>
              <CardDescription className="text-lg text-slate-300">
                Your organization now has {tierName} plan access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subscription Details */}
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 rounded-lg space-y-4 border border-amber-500/20">
                <h3 className="font-bold text-white text-lg mb-4">Subscription Details</h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Plan</span>
                  <span className="font-bold text-xl text-amber-400">{tierName}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">Next Billing Date</span>
                  </div>
                  <span className="font-semibold text-white">{periodEnd.toLocaleDateString()}</span>
                </div>
              </div>

              {/* Included Resources */}
              <div className="bg-slate-700/50 p-6 rounded-lg border border-slate-600">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  Included Resources
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                    <p className="text-slate-400 mb-1">Coaches</p>
                    <p className="text-2xl font-bold text-amber-400">{totalCoaches}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-lg text-center">
                    <p className="text-slate-400 mb-1">Clients</p>
                    <p className="text-2xl font-bold text-amber-400">{totalClients}</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="bg-green-500/10 p-6 rounded-lg border border-green-500/20">
                <h3 className="font-semibold text-green-400 mb-3">Your organization now has access to:</h3>
                <ul className="text-sm text-slate-300 space-y-2">
                  <li>✓ Multi-coach collaboration</li>
                  <li>✓ Client management dashboard</li>
                  <li>✓ Custom meal and workout plans</li>
                  <li>✓ Progress tracking and analytics</li>
                  <li>✓ Team messaging and support</li>
                </ul>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                <p className="text-sm text-slate-300 text-center">
                  Invoices and receipts will be sent to your email automatically each billing cycle
                </p>
              </div>
              
              <Button 
                onClick={() => navigate("/org-owner-dashboard")}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                size="lg"
                data-testid="button-go-org-dashboard"
              >
                Go to Organization Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto text-center bg-slate-800/50 border-slate-700">
          <CardHeader>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-white">Subscription Verification Failed</CardTitle>
            <CardDescription className="text-slate-300">
              We couldn't verify your subscription. Please contact support if you were charged.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate("/org-subscription")}
              variant="outline"
              className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => navigate("/org-owner-dashboard")}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
