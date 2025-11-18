import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, FileText, Users, Target, Clock, Plus, Save,
  Calendar, Utensils, Activity, Zap, Star, CheckCircle2
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";

export default function CreatePlan() {
  const [planType, setPlanType] = useState("nutrition");
  const [selectedClient, setSelectedClient] = useState("");
  
  const clients = [
    { id: "1", name: "Sarah Johnson", goals: "Weight Loss" },
    { id: "2", name: "Mike Chen", goals: "Muscle Gain" },
    { id: "3", name: "Emma Davis", goals: "General Health" },
    { id: "4", name: "James Wilson", goals: "Athletic Performance" }
  ];

  const mealTemplates = [
    { name: "Mediterranean Diet", calories: "1800-2000", focus: "Heart Health" },
    { name: "High Protein Plan", calories: "2000-2200", focus: "Muscle Building" },
    { name: "Low Carb Keto", calories: "1600-1800", focus: "Weight Loss" },
    { name: "Balanced Nutrition", calories: "1800-2000", focus: "General Health" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/coach-home">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Create New Plan</h1>
              <p className="text-gray-300">Design personalized nutrition and fitness plans for your clients</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Plan Creation Form */}
          <div className="lg:col-span-2">
            <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-cyan-400" />
                  Plan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Type Selection */}
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={planType === "nutrition" ? "default" : "outline"}
                    onClick={() => setPlanType("nutrition")}
                    className={`h-20 flex flex-col items-center justify-center ${
                      planType === "nutrition" 
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600" 
                        : "border-white/20 text-white hover:bg-white/10"
                    }`}
                  >
                    <Utensils className="w-6 h-6 mb-1" />
                    <span>Nutrition Plan</span>
                  </Button>
                  <Button
                    variant={planType === "fitness" ? "default" : "outline"}
                    onClick={() => setPlanType("fitness")}
                    className={`h-20 flex flex-col items-center justify-center ${
                      planType === "fitness" 
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600" 
                        : "border-white/20 text-white hover:bg-white/10"
                    }`}
                  >
                    <Activity className="w-6 h-6 mb-1" />
                    <span>Fitness Plan</span>
                  </Button>
                  <Button
                    variant={planType === "combined" ? "default" : "outline"}
                    onClick={() => setPlanType("combined")}
                    className={`h-20 flex flex-col items-center justify-center ${
                      planType === "combined" 
                        ? "bg-gradient-to-r from-purple-500 to-pink-600" 
                        : "border-white/20 text-white hover:bg-white/10"
                    }`}
                  >
                    <Zap className="w-6 h-6 mb-1" />
                    <span>Combined</span>
                  </Button>
                </div>

                {/* Client Selection */}
                <div>
                  <Label className="text-white">Select Client</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Choose a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.goals}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Plan Name */}
                <div>
                  <Label className="text-white">Plan Name</Label>
                  <Input 
                    placeholder="Enter plan name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                {/* Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Duration (weeks)</Label>
                    <Input 
                      type="number"
                      placeholder="4"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Target Calories/Day</Label>
                    <Input 
                      type="number"
                      placeholder="2000"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                </div>

                {/* Goals */}
                <div>
                  <Label className="text-white">Plan Goals</Label>
                  <Textarea 
                    placeholder="Describe the specific goals and objectives for this plan"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    rows={3}
                  />
                </div>

                {/* Special Instructions */}
                <div>
                  <Label className="text-white">Special Instructions</Label>
                  <Textarea 
                    placeholder="Any dietary restrictions, allergies, or special considerations"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Plan
                  </Button>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    <Star className="w-4 h-4 mr-2" />
                    Save as Template
                  </Button>
                </div>
              </CardContent>
            </AnimatedCard>
          </div>

          {/* Templates and Preview */}
          <div className="space-y-6">
            {/* Quick Templates */}
            <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                  Quick Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mealTemplates.map((template, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-pointer">
                      <h4 className="font-medium text-white">{template.name}</h4>
                      <p className="text-sm text-gray-300">{template.calories}</p>
                      <Badge variant="outline" className="mt-1 border-cyan-400/30 text-cyan-400">
                        {template.focus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </AnimatedCard>

            {/* Plan Preview */}
            <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="w-5 h-5 mr-2 text-green-400" />
                  Plan Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Plan Type:</span>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-400/30">
                      {planType.charAt(0).toUpperCase() + planType.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Duration:</span>
                    <span className="text-white">4 weeks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Target:</span>
                    <span className="text-white">2000 cal/day</span>
                  </div>
                  <div className="pt-4">
                    <div className="flex items-center space-x-2 text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">Ready to create</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </div>
  );
}