import { Navigation } from "@/components/navigation";
import { PrivacyPolicySection } from "@/components/privacy-policy";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/")}
              className="mb-4"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Privacy Policy
              </h1>
              <p className="text-gray-600">
                How MikeAI collects, uses, stores, and protects your personal information
              </p>
            </div>
          </div>

          <PrivacyPolicySection />
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              For questions about this policy, contact us at{" "}
              <a href="mailto:support@mikeai.co" className="text-blue-600 underline">
                support@mikeai.co
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
