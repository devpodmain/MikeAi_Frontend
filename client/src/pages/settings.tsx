import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Settings, User, Shield, Bell, Palette,
  Save, Upload, Globe, Clock, DollarSign, Star
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { AnimatedCard } from "@/components/ui/animated-card";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  
  const [profile, setProfile] = useState({
    firstName: "Dr. Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@example.com",
    phone: "+1 (555) 123-4567",
    specialization: "Certified Nutrition Specialist",
    bio: "Passionate nutrition coach with 8+ years of experience helping clients achieve their health goals through personalized meal planning and lifestyle coaching.",
    location: "Los Angeles, CA",
    timezone: "PST",
    languages: ["English", "Spanish"]
  });

  const [preferences, setPreferences] = useState({
    theme: "dark",
    notifications: true,
    emailUpdates: true,
    autoScheduling: false,
    clientReminders: true,
    dataBackup: true
  });

  const [pricing, setPricing] = useState({
    consultationRate: 150,
    followUpRate: 75,
    planCreationRate: 200,
    currency: "USD"
  });

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "preferences", label: "Preferences", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "pricing", label: "Pricing", icon: DollarSign },
    { id: "security", label: "Security", icon: Shield }
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
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-gray-300">Manage your coaching profile and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        activeTab === tab.id 
                          ? "bg-gradient-to-r from-cyan-500 to-purple-600" 
                          : "text-white hover:bg-white/10"
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <tab.icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </Button>
                  ))}
                </nav>
              </CardContent>
            </AnimatedCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            <AnimatedCard className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-8">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                        SJ
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Coach Profile</h2>
                        <p className="text-gray-300">Update your professional information</p>
                      </div>
                      <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                        <Upload className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-white">First Name</Label>
                        <Input 
                          value={profile.firstName}
                          onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Last Name</Label>
                        <Input 
                          value={profile.lastName}
                          onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Email</Label>
                      <Input 
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-white">Phone</Label>
                        <Input 
                          value={profile.phone}
                          onChange={(e) => setProfile({...profile, phone: e.target.value})}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Specialization</Label>
                        <Input 
                          value={profile.specialization}
                          onChange={(e) => setProfile({...profile, specialization: e.target.value})}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Professional Bio</Label>
                      <Textarea 
                        value={profile.bio}
                        onChange={(e) => setProfile({...profile, bio: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-white">Location</Label>
                        <Input 
                          value={profile.location}
                          onChange={(e) => setProfile({...profile, location: e.target.value})}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Timezone</Label>
                        <Select value={profile.timezone}>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PST">Pacific Standard Time</SelectItem>
                            <SelectItem value="MST">Mountain Standard Time</SelectItem>
                            <SelectItem value="CST">Central Standard Time</SelectItem>
                            <SelectItem value="EST">Eastern Standard Time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </Button>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === "preferences" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Platform Preferences</h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">Theme</h4>
                          <p className="text-gray-400 text-sm">Choose your preferred interface theme</p>
                        </div>
                        <Select value={preferences.theme}>
                          <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="auto">Auto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">Auto-scheduling</h4>
                          <p className="text-gray-400 text-sm">Allow clients to book available slots automatically</p>
                        </div>
                        <Switch 
                          checked={preferences.autoScheduling}
                          onCheckedChange={(checked) => 
                            setPreferences({...preferences, autoScheduling: checked})
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">Client Reminders</h4>
                          <p className="text-gray-400 text-sm">Send automatic appointment reminders to clients</p>
                        </div>
                        <Switch 
                          checked={preferences.clientReminders}
                          onCheckedChange={(checked) => 
                            setPreferences({...preferences, clientReminders: checked})
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">Data Backup</h4>
                          <p className="text-gray-400 text-sm">Automatically backup client data and plans</p>
                        </div>
                        <Switch 
                          checked={preferences.dataBackup}
                          onCheckedChange={(checked) => 
                            setPreferences({...preferences, dataBackup: checked})
                          }
                        />
                      </div>
                    </div>

                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                )}

                {/* Pricing Tab */}
                {activeTab === "pricing" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Service Pricing</h2>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-white">Initial Consultation Rate</Label>
                        <div className="flex items-center space-x-2">
                          <span className="text-white">$</span>
                          <Input 
                            type="number"
                            value={pricing.consultationRate}
                            onChange={(e) => setPricing({...pricing, consultationRate: parseInt(e.target.value)})}
                            className="bg-white/10 border-white/20 text-white"
                          />
                          <span className="text-gray-400">/hour</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-white">Follow-up Session Rate</Label>
                        <div className="flex items-center space-x-2">
                          <span className="text-white">$</span>
                          <Input 
                            type="number"
                            value={pricing.followUpRate}
                            onChange={(e) => setPricing({...pricing, followUpRate: parseInt(e.target.value)})}
                            className="bg-white/10 border-white/20 text-white"
                          />
                          <span className="text-gray-400">/hour</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white">Custom Plan Creation</Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-white">$</span>
                        <Input 
                          type="number"
                          value={pricing.planCreationRate}
                          onChange={(e) => setPricing({...pricing, planCreationRate: parseInt(e.target.value)})}
                          className="bg-white/10 border-white/20 text-white"
                        />
                        <span className="text-gray-400">/plan</span>
                      </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <h4 className="text-white font-medium mb-2">Pricing Overview</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Initial Consultation:</span>
                          <span className="text-emerald-400">${pricing.consultationRate}/hour</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Follow-up Sessions:</span>
                          <span className="text-emerald-400">${pricing.followUpRate}/hour</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Custom Plans:</span>
                          <span className="text-emerald-400">${pricing.planCreationRate}/plan</span>
                        </div>
                      </div>
                    </div>

                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Pricing
                    </Button>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Security & Privacy</h2>
                    
                    <div className="space-y-6">
                      <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center space-x-3 mb-3">
                          <Shield className="w-6 h-6 text-green-400" />
                          <h4 className="text-white font-medium">Account Security</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Two-Factor Authentication</span>
                            <Badge className="bg-green-500/20 text-green-400 border-green-400/30">Enabled</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Password Strength</span>
                            <Badge className="bg-green-500/20 text-green-400 border-green-400/30">Strong</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Last Login</span>
                            <span className="text-gray-400">2 hours ago</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          Change Password
                        </Button>
                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          Download Account Data
                        </Button>
                        <Button variant="outline" className="w-full border-red-400/30 text-red-400 hover:bg-red-400/10">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </div>
  );
}