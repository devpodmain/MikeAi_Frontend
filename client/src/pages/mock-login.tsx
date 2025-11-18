import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Heart, User, UserCheck, Building2, Users } from "lucide-react";

export default function MockLogin() {
  const [userType, setUserType] = useState<"individual" | "coach" | "org_owner" | "org_client">("individual");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("/api/auth/mock-login", "POST", { userType });
      
      if (response.success) {
        toast({
          title: "Login Successful",
          description: `Logged in as ${userType}`,
        });
        
        // Redirect based on user type and reload to refresh auth state
        setTimeout(() => {
          let redirectUrl = "/";
          switch(userType) {
            case "coach":
              redirectUrl = "/coach-home";
              break;
            case "org_owner":
              redirectUrl = "/org-owner-dashboard";
              break;
            case "org_client":
              redirectUrl = "/org-client-dashboard";
              break;
            default:
              redirectUrl = "/";
          }
          window.location.href = redirectUrl;
        }, 1000);
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Welcome to MikeAI</CardTitle>
          <p className="text-gray-600">Choose your user type to continue</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={userType} onValueChange={(value) => setUserType(value as "individual" | "coach" | "org_owner" | "org_client")}>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="individual" id="individual" />
              <Label htmlFor="individual" className="flex items-center space-x-3 cursor-pointer flex-1">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium">Individual User</p>
                  <p className="text-sm text-gray-500">Personal nutrition and fitness tracking</p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="coach" id="coach" />
              <Label htmlFor="coach" className="flex items-center space-x-3 cursor-pointer flex-1">
                <UserCheck className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Coach/Trainer</p>
                  <p className="text-sm text-gray-500">Manage clients and create meal plans</p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="org_owner" id="org_owner" />
              <Label htmlFor="org_owner" className="flex items-center space-x-3 cursor-pointer flex-1">
                <Building2 className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium">Organization Owner</p>
                  <p className="text-sm text-gray-500">Manage coaches, clients, and organization</p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="org_client" id="org_client" />
              <Label htmlFor="org_client" className="flex items-center space-x-3 cursor-pointer flex-1">
                <Users className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium">Organization Client</p>
                  <p className="text-sm text-gray-500">Member of an organization with assigned coach</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
          
          <Button 
            onClick={handleLogin} 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isLoading ? "Logging in..." : "Continue"}
          </Button>
          
          <div className="text-center text-sm text-gray-500">
            <p>This is a demo login for development purposes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}