import { Navigation } from "@/components/navigation";
import { DisclaimerSection } from "@/components/disclaimer";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

export default function TermsAndDisclaimer() {
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
                Terms of Use & Disclaimer
              </h1>
              <p className="text-gray-600">
                Important guidelines and legal information for using our fitness coaching platform
              </p>
            </div>
          </div>

          <DisclaimerSection />
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center space-x-2 text-blue-800">
              <Shield className="w-5 h-5" />
              <span className="font-medium">Looking for our Privacy Policy?</span>
            </div>
            <p className="text-center text-sm text-blue-700 mt-2">
              For information about how we collect, use, and protect your data, please visit our{" "}
              <Link href="/privacy" className="underline font-medium hover:text-blue-900" data-testid="link-privacy-policy">
                Privacy Policy
              </Link>
            </p>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}