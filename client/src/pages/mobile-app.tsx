import { useAuth } from "@/hooks/useAuth";
import { MobileNavigation } from "@/components/mobile-navigation";
import { MobileDashboard } from "@/components/mobile-dashboard";
import { MobileMealPlanner } from "@/components/mobile-meal-planner";
import { MobileRecipeList } from "@/components/mobile-recipe-card";
import { MobileFeatures } from "@/components/mobile-features";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import heroImage from "@assets/img 1_1753421307951.jpg";
import logoImage from "@assets/1_1753425387748.png";

// Sample recipe data for mobile app
const sampleRecipes = [
  {
    id: "1",
    title: "Protein Power Bowl",
    description: "High-protein quinoa bowl with grilled chicken, avocado, and fresh vegetables",
    cookTime: 25,
    servings: 2,
    difficulty: "easy" as const,
    calories: 520,
    rating: 4.8,
    reviews: 124,
    author: { name: "Chef Sarah", avatar: "" },
    tags: ["High Protein", "Gluten-Free", "Healthy"],
    isBookmarked: true
  },
  {
    id: "2", 
    title: "Mediterranean Salmon",
    description: "Baked salmon with Mediterranean herbs, olive oil, and roasted vegetables",
    cookTime: 30,
    servings: 4,
    difficulty: "medium" as const,
    calories: 450,
    rating: 4.9,
    reviews: 89,
    author: { name: "Chef Marco", avatar: "" },
    tags: ["Heart Healthy", "Omega-3", "Low Carb"],
    isBookmarked: false
  },
  {
    id: "3",
    title: "Vegan Buddha Bowl",
    description: "Colorful plant-based bowl with quinoa, roasted chickpeas, and tahini dressing",
    cookTime: 35,
    servings: 3,
    difficulty: "easy" as const,
    calories: 380,
    rating: 4.7,
    reviews: 156,
    author: { name: "Chef Emma", avatar: "" },
    tags: ["Vegan", "Plant-Based", "Fiber Rich"],
    isBookmarked: true
  }
];

export default function MobileApp() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <p className="text-gray-600">Loading ACTIV...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <MobileLandingPage />;
  }

  const userType = (user as any)?.userType || "individual";

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigation userType={userType} />
      
      <main className="pt-16 pb-16">
        {location === "/" && <MobileDashboard userType={userType} />}
        {location === "/meal-planner" && <MobileMealPlanner />}
        {location === "/mobile-features" && <MobileFeatures />}
        {location === "/recipes" && (
          <div className="px-4 pt-4">
            <MobileRecipeList 
              recipes={sampleRecipes}
              onRecipeClick={(id) => console.log("Recipe clicked:", id)}
              onLike={(id) => console.log("Recipe liked:", id)}
              onBookmark={(id) => console.log("Recipe bookmarked:", id)}
              onShare={(id) => console.log("Recipe shared:", id)}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function MobileLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Mobile App Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img 
              src={logoImage} 
              alt="MikeAI Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MikeAI</h1>
            <p className="text-sm text-gray-500">Mobile Nutrition App</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-8 shadow-lg">
            <img 
              src={heroImage} 
              alt="Health and fitness equipment"
              className="w-full h-full object-cover"
            />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Your Personal Nutrition Companion
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            AI-powered meal planning, nutrition tracking, and personalized coaching in your pocket
          </p>
        </div>

        {/* Features */}
        <div className="space-y-6 mb-12">
          <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Smart Meal Planning</h3>
              <p className="text-sm text-gray-600">AI creates personalized meal plans based on your goals</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Food Scanning</h3>
              <p className="text-sm text-gray-600">Scan any food item to track nutrition instantly</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Community Support</h3>
              <p className="text-sm text-gray-600">Connect with others on similar health journeys</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-4">
          <Link href="/auth/login">
            <Button size="lg" className="w-full h-14 text-lg">
              Get Started - It's Free
            </Button>
          </Link>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Already have an account?</p>
            <Link href="/auth/login">
              <Button variant="ghost" className="font-medium">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* App Store Badges (Placeholder) */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">Coming soon to:</p>
          <div className="flex justify-center space-x-4">
            <div className="w-32 h-10 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-medium">App Store</span>
            </div>
            <div className="w-32 h-10 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-medium">Google Play</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}