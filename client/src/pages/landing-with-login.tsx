import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, User, UserCheck, Star, ArrowRight, Users, Trophy, Target, 
  Zap, Shield, X, LogIn 
} from "lucide-react";
import { AnimatedPage } from "@/components/ui/animated-page";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";
import { motion } from "framer-motion";
import heroImage from "@assets/img 1_1753421307951.jpg";
import logoImage from "@assets/1_1753425387748.png";

export default function LandingWithLogin() {
  const [userType, setUserType] = useState<"individual" | "coach">("individual");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("/api/auth/mock-login", "POST", { userType });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Login Successful",
          description: `Logged in as ${userType}`,
        });
        
        setTimeout(() => {
          window.location.href = userType === "coach" ? "/coach-home" : "/";
        }, 1000);
      } else {
        throw new Error(data.message || "Login failed");
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
    <AnimatedPage className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img 
                    src={logoImage} 
                    alt="MikeAI Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-900">MikeAI</span>
                  <span className="text-xs text-gray-500">Nutrition & Fitness</span>
                </div>
              </div>
            </div>
            
            {/* Auth Links */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/mobile'}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none hover:from-blue-600 hover:to-purple-700"
              >
                📱 Mobile App
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
              <Button onClick={() => window.location.href = '/coach/login'}>
                For Coaches
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                AI-Powered Nutrition Platform
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Transform Your
                <span className="text-primary"> Nutrition</span>
                <br />
                Journey with AI
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Whether you're an individual seeking personalized meal plans or a coach managing clients, 
                MikeAI provides intelligent nutrition guidance tailored to your unique needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6" 
                  onClick={() => setShowLoginModal(true)}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-6"
                  onClick={() => window.location.href = '/mobile'}
                >
                  📱 Try Mobile App
                </Button>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative">
              <div className="w-full h-96 rounded-2xl overflow-hidden shadow-lg">
                <img 
                  src={heroImage} 
                  alt="Health and fitness equipment with fresh vegetables"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose MikeAI?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of nutrition with our comprehensive platform designed for both individuals and professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 text-center border-2 hover:border-primary/20 transition-colors">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Plans</h3>
              <p className="text-gray-600">Get personalized meal plans powered by advanced AI algorithms.</p>
            </Card>

            <Card className="p-6 text-center border-2 hover:border-primary/20 transition-colors">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Goal Tracking</h3>
              <p className="text-gray-600">Track your progress and achieve your health goals with precision.</p>
            </Card>

            <Card className="p-6 text-center border-2 hover:border-primary/20 transition-colors">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Support</h3>
              <p className="text-gray-600">Connect with like-minded individuals on your wellness journey.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            <Card className="border-0 shadow-none">
              <CardHeader className="text-center relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLoginModal(false)}
                  className="absolute right-2 top-2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Welcome to MikeAI</CardTitle>
                <p className="text-gray-600">Choose your user type to continue</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={userType} onValueChange={(value) => setUserType(value as "individual" | "coach")}>
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
          </motion.div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Nutrition?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who have already started their journey with MikeAI
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-6" 
              onClick={() => window.location.href = '/mobile'}
            >
              <Heart className="mr-2 h-5 w-5" />
              Try Mobile App
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 bg-white/10 border-white/20 text-white hover:bg-white/20" 
              onClick={() => setShowLoginModal(true)}
            >
              <Users className="mr-2 h-5 w-5" />
              Sign In
            </Button>
          </div>
        </div>
      </section>
    </AnimatedPage>
  );
}