import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle, Download, Calendar, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";

interface Payment {
  id: number;
  userId: string;
  amount: string;
  planName: string;
  expiresAt: string;
  invoiceUrl: string | null;
  receiptUrl: string | null;
  billingAddress: any;
  createdAt: string;
}

export default function SubscriptionSuccess() {
  const [, navigate] = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);

  // Get session_id from URL (Stripe Checkout redirect)
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
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
          
          // Check if payment was successful using native Stripe fields
          // Stripe returns status='complete' with payment_status='paid' for successful payments
          if (sessionData.payment_status === 'paid' && sessionData.status === 'complete' && sessionData.paymentIntentId) {
            // Fetch the payment record from our database
            const paymentResponse = await fetch(`/api/payment/${sessionData.paymentIntentId}`, {
              credentials: "include"
            });
            
            if (paymentResponse.ok) {
              const paymentData = await paymentResponse.json();
              
              // Verify this is a recent payment
              const paymentAge = Date.now() - new Date(paymentData.createdAt).getTime();
              const fiveMinutes = 5 * 60 * 1000;
              
              if (paymentAge < fiveMinutes && paymentData.status === 'succeeded') {
                setPayment(paymentData);
              } else {
                console.error("Payment verification failed: payment is too old or not succeeded");
              }
            } else {
              console.error("Payment record not found in database");
            }
          } else {
            console.error("Checkout session payment not completed");
          }
        } else {
          console.error("Checkout session not found");
        }
      } catch (error) {
        console.error("Failed to fetch payment:", error);
      }
      
      setVerifying(false);
    };

    verifyPayment();
  }, [sessionId]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin mb-4" />
              <CardTitle>Verifying Your Purchase</CardTitle>
              <CardDescription>
                Please wait while we confirm your payment...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (payment) {
    const expiryDate = new Date(payment.expiresAt);
    const daysRemaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-3xl">Purchase Complete!</CardTitle>
              <CardDescription className="text-lg">
                You now have full access to MikeAI Plus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Purchase Details */}
              <div className="bg-gradient-to-br from-primary/10 to-blue-50 p-6 rounded-lg space-y-4">
                <h3 className="font-bold text-gray-900 text-lg mb-4">Purchase Details</h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-medium">Amount Paid</span>
                  </div>
                  <span className="font-bold text-xl text-primary">${payment.amount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">Access Expires</span>
                  </div>
                  <span className="font-semibold">{expiryDate.toLocaleDateString()}</span>
                </div>
                
                <div className="bg-white/80 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 text-center">
                    <span className="font-bold text-primary">{daysRemaining} days</span> of full access remaining
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3">You now have access to:</h3>
                <ul className="text-sm text-green-800 space-y-2">
                  <li>✓ Unlimited AI meal plans</li>
                  <li>✓ Custom workout programs</li>
                  <li>✓ 24/7 Fitness GPT AI Coach</li>
                  <li>✓ AI supplement recommendations</li>
                  <li>✓ All premium features for 30 days!</li>
                </ul>
              </div>

              {/* Invoice Download */}
              {payment.invoiceUrl && (
                <div className="border-t pt-4">
                  <a
                    href={payment.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 font-medium"
                  >
                    <Download className="w-5 h-5" />
                    Download Invoice (PDF)
                  </a>
                </div>
              )}
              
              <Button 
                onClick={() => navigate("/")}
                className="w-full"
                size="lg"
                data-testid="button-go-dashboard"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Purchase Verification Failed</CardTitle>
            <CardDescription>
              We couldn't verify your purchase. Please contact support if you were charged.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate("/subscription")}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => navigate("/")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
