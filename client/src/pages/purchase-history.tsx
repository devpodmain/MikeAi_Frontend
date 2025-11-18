import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  DollarSign, 
  Download, 
  MapPin, 
  CreditCard,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Payment {
  id: number;
  userId: string;
  amount: string;
  planName: string;
  expiresAt: string;
  status: string;
  invoiceUrl: string | null;
  receiptUrl: string | null;
  billingAddress: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  createdAt: string;
}

export default function PurchaseHistory() {
  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/user/payments"],
  });

  const { data: activePayment } = useQuery<Payment>({
    queryKey: ["/api/user/active-payment"],
    retry: false,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getDaysRemaining = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Purchase History</h1>
          <p className="text-gray-600">View all your past purchases and download invoices</p>
        </div>

        {/* Active Access Status Card */}
        {activePayment && (
          <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-full">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Active Access</CardTitle>
                    <CardDescription className="text-base">You have full access to MikeAI Plus</CardDescription>
                  </div>
                </div>
                <Badge className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-white/80 rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-600">Days Remaining</p>
                    <p className="font-bold text-lg text-primary">
                      {getDaysRemaining(activePayment.expiresAt)} days
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/80 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-gray-600">Expires On</p>
                    <p className="font-semibold">{formatDate(activePayment.expiresAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purchase History */}
        <Card>
          <CardHeader>
            <CardTitle>All Purchases</CardTitle>
            <CardDescription>Complete history of your transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading purchases...</p>
              </div>
            ) : !payments || payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No purchases yet</h3>
                <p className="text-gray-500 mb-6">Get started with MikeAI Plus for just $4.99</p>
                <Button data-testid="button-get-access">
                  <a href="/subscription">Get 30 Days Access</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment, index) => {
                  const expired = isExpired(payment.expiresAt);
                  
                  return (
                    <div key={payment.id}>
                      <div className="p-6 rounded-lg border hover:shadow-md transition-shadow">
                        {/* Header Row */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${expired ? 'bg-gray-200' : 'bg-green-100'}`}>
                              {expired ? (
                                <XCircle className="w-5 h-5 text-gray-600" />
                              ) : (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{payment.planName}</h3>
                              <p className="text-sm text-gray-500">
                                Purchased on {formatDate(payment.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Badge variant={expired ? "outline" : "default"} className="px-3 py-1">
                            {expired ? "Expired" : "Active"}
                          </Badge>
                        </div>

                        {/* Details Grid */}
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Amount Paid</p>
                              <p className="font-semibold text-primary">${payment.amount}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Expiration Date</p>
                              <p className="font-semibold">{formatDate(payment.expiresAt)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Access Period</p>
                              <p className="font-semibold">30 Days</p>
                            </div>
                          </div>
                        </div>

                        {/* Billing Address */}
                        {payment.billingAddress && (
                          <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                              <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">Billing Address</p>
                                <p className="text-sm">{payment.billingAddress.name}</p>
                                <p className="text-sm">{payment.billingAddress.line1}</p>
                                {payment.billingAddress.line2 && (
                                  <p className="text-sm">{payment.billingAddress.line2}</p>
                                )}
                                <p className="text-sm">
                                  {payment.billingAddress.city}, {payment.billingAddress.state} {payment.billingAddress.postal_code}
                                </p>
                                <p className="text-sm">{payment.billingAddress.country}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          {payment.invoiceUrl && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                              data-testid={`button-download-invoice-${payment.id}`}
                            >
                              <a 
                                href={payment.invoiceUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Download Invoice
                              </a>
                            </Button>
                          )}
                          {payment.receiptUrl && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                              data-testid={`button-download-receipt-${payment.id}`}
                            >
                              <a 
                                href={payment.receiptUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Download Receipt
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {index < payments.length - 1 && <Separator className="my-4" />}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Renewal Reminder */}
        {!activePayment && payments && payments.length > 0 && (
          <Card className="mt-8 border-2 border-orange-200 bg-orange-50/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">Your access has expired</h3>
                  <p className="text-gray-600">Renew now to continue using all premium features</p>
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-renew-access">
                  <a href="/subscription">Renew Access - $4.99</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
