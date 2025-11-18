import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Upload, User, Building, Phone, Calendar, MapPin, Award, Users, Globe, Clock } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { DisclaimerSection, CompactDisclaimer } from "@/components/disclaimer";

export default function ProfileSetup() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isCoach = (user as any)?.userType === "coach";

  // Individual profile form data
  const [individualFormData, setIndividualFormData] = useState({
    age: "",
    height: "",
    weight: "",
    activityLevel: "",
    goal: "",
    targetCalories: "",
    targetProtein: "",
    targetCarbs: "",
    targetFats: "",
    dietaryPreferences: [] as string[],
    allergens: [] as string[],
    culturalPreferences: [] as string[],
  });

  // Coach profile form data  
  const [coachFormData, setCoachFormData] = useState({
    profileType: "",
    phoneNumber: "",
    yearsOfExperience: "",
    specializations: [] as string[],
    address: "",
    profileBio: "",
    certifications: [] as string[],
    availability: {
      monday: { start: "", end: "", available: false },
      tuesday: { start: "", end: "", available: false },
      wednesday: { start: "", end: "", available: false },
      thursday: { start: "", end: "", available: false },
      friday: { start: "", end: "", available: false },
      saturday: { start: "", end: "", available: false },
      sunday: { start: "", end: "", available: false },
    },
    languagesSpoken: [] as string[],
    trainingStyle: "",
    hourlyRate: "",
    servicesOffered: [] as string[],
    qualifications: [] as string[],
    businessLicense: "",
    organizationName: "",
    teamSize: "",
  });

  const [newPreference, setNewPreference] = useState("");
  const [newAllergen, setNewAllergen] = useState("");
  const [newCulturalPref, setNewCulturalPref] = useState("");
  const [newSpecialization, setNewSpecialization] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newService, setNewService] = useState("");
  const [newQualification, setNewQualification] = useState("");

  const commonDietaryPreferences = [
    "Vegetarian", "Vegan", "Keto", "Low-Carb", "High-Protein", "Mediterranean", "Paleo", "Gluten-Free"
  ];

  const commonAllergens = [
    "Nuts", "Dairy", "Eggs", "Soy", "Gluten", "Shellfish", "Fish", "Sesame"
  ];

  const commonCulturalPreferences = [
    "Italian", "Mexican", "Indian", "Chinese", "Japanese", "Mediterranean", "Thai", "Middle Eastern", "French", "Korean"
  ];

  // Coach-specific options
  const commonSpecializations = [
    "Weight Loss", "Strength Training", "Yoga", "Cardio Fitness", "Nutrition Counseling", 
    "Bodybuilding", "CrossFit", "Pilates", "Sports Performance", "Rehabilitation", 
    "Senior Fitness", "Youth Training", "Functional Training", "HIIT"
  ];

  const commonLanguages = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese", "Mandarin", 
    "Hindi", "Arabic", "Japanese", "Korean", "Russian"
  ];

  const commonServices = [
    "Personal Training", "Group Classes", "Nutrition Planning", "Meal Prep Guidance",
    "Online Coaching", "Fitness Assessments", "Exercise Program Design", "Lifestyle Coaching",
    "Weight Management", "Sport-Specific Training", "Injury Prevention", "Wellness Consulting"
  ];

  const trainingStyles = [
    "one-on-one", "group", "online", "hybrid", "bootcamp", "personalized"
  ];

  const profileMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = isCoach ? "/api/coach-profile" : "/api/profile";
      return await apiRequest(endpoint, "POST", data);
    },
    onSuccess: () => {
      const queryKey = isCoach ? ["/api/coach-profile"] : ["/api/profile"];
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Profile created successfully!",
        description: isCoach 
          ? "Your professional coach profile has been set up." 
          : "Your personalized nutrition profile has been set up.",
      });
      setLocation(isCoach ? "/coach-home" : "/");
    },
    onError: (error) => {
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isCoach) {
      // Validate coach form
      if (!coachFormData.profileType || !coachFormData.phoneNumber || !coachFormData.yearsOfExperience) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required coach profile information.",
          variant: "destructive",
        });
        return;
      }

      const coachData = {
        ...coachFormData,
        yearsOfExperience: parseInt(coachFormData.yearsOfExperience) || 0,
        hourlyRate: coachFormData.hourlyRate ? parseFloat(coachFormData.hourlyRate) : null,
        teamSize: coachFormData.teamSize ? parseInt(coachFormData.teamSize) : null,
      };

      profileMutation.mutate(coachData);
    } else {
      // Individual form validation and submission
      if (!individualFormData.age || !individualFormData.height || !individualFormData.weight) {
        toast({
          title: "Missing required fields",
          description: "Please fill in your basic health information.",
          variant: "destructive",
        });
        return;
      }

      const individualData = {
        ...individualFormData,
        age: parseInt(individualFormData.age) || 0,
        height: parseFloat(individualFormData.height) || 0,
        weight: parseFloat(individualFormData.weight) || 0,
        targetCalories: parseInt(individualFormData.targetCalories) || 0,
        targetProtein: parseInt(individualFormData.targetProtein) || 0,
        targetCarbs: parseInt(individualFormData.targetCarbs) || 0,
        targetFats: parseInt(individualFormData.targetFats) || 0,
      };

      profileMutation.mutate(individualData);
    }
  };

  const addToList = (list: string[], newItem: string, setter: (items: string[]) => void) => {
    if (newItem.trim() && !list.includes(newItem.trim())) {
      setter([...list, newItem.trim()]);
    }
  };

  const removeFromList = (list: string[], item: string, setter: (items: string[]) => void) => {
    setter(list.filter(i => i !== item));
  };

  const updateCoachFormData = (field: string, value: any) => {
    setCoachFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateIndividualFormData = (field: string, value: any) => {
    setIndividualFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAvailability = (day: keyof typeof coachFormData.availability, field: string, value: any) => {
    setCoachFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: { ...prev.availability[day], [field]: value }
      }
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {isCoach ? "Complete Your Coach Profile" : "Set Up Your Profile"}
            </h1>
            <p className="text-gray-600">
              {isCoach 
                ? "Help clients find you by providing your professional details and expertise."
                : "Help us personalize your nutrition and fitness journey."
              }
            </p>
          </div>

          {/* Disclaimer Section */}
          <DisclaimerSection />

          <form onSubmit={handleSubmit} className="space-y-8">
            {isCoach ? (
              // Coach Profile Form
              <>
                {/* Profile Type & Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Profile Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="profileType">Profile Type *</Label>
                        <Select value={coachFormData.profileType} onValueChange={(value) => updateCoachFormData("profileType", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select profile type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">Individual Coach</SelectItem>
                            <SelectItem value="organization">Organization/Gym</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="phoneNumber">Phone Number *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="phoneNumber"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={coachFormData.phoneNumber}
                            onChange={(e) => updateCoachFormData("phoneNumber", e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {coachFormData.profileType === "organization" && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="organizationName">Organization Name</Label>
                          <div className="relative">
                            <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="organizationName"
                              placeholder="Your gym/studio name"
                              value={coachFormData.organizationName}
                              onChange={(e) => updateCoachFormData("organizationName", e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="teamSize">Team Size</Label>
                          <div className="relative">
                            <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="teamSize"
                              type="number"
                              placeholder="Number of trainers"
                              value={coachFormData.teamSize}
                              onChange={(e) => updateCoachFormData("teamSize", e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Textarea
                          id="address"
                          placeholder="Your business/practice address"
                          value={coachFormData.address}
                          onChange={(e) => updateCoachFormData("address", e.target.value)}
                          className="pl-10 min-h-[80px]"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Experience */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="w-5 h-5" />
                      <span>Professional Experience</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="yearsOfExperience"
                            type="number"
                            placeholder="5"
                            value={coachFormData.yearsOfExperience}
                            onChange={(e) => updateCoachFormData("yearsOfExperience", e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="hourlyRate">Hourly Rate (Optional)</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          placeholder="50"
                          value={coachFormData.hourlyRate}
                          onChange={(e) => updateCoachFormData("hourlyRate", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="trainingStyle">Preferred Training Style</Label>
                      <Select value={coachFormData.trainingStyle} onValueChange={(value) => updateCoachFormData("trainingStyle", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select training style" />
                        </SelectTrigger>
                        <SelectContent>
                          {trainingStyles.map((style) => (
                            <SelectItem key={style} value={style}>
                              {style.charAt(0).toUpperCase() + style.slice(1).replace('-', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="profileBio">Professional Bio</Label>
                      <Textarea
                        id="profileBio"
                        placeholder="Tell potential clients about your background, training philosophy, and what makes you unique..."
                        value={coachFormData.profileBio}
                        onChange={(e) => updateCoachFormData("profileBio", e.target.value)}
                        className="min-h-[120px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Specializations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Specializations</CardTitle>
                    <p className="text-sm text-gray-600">What areas do you specialize in?</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {commonSpecializations.map((spec) => (
                        <Button
                          key={spec}
                          type="button"
                          variant={coachFormData.specializations.includes(spec) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const specs = coachFormData.specializations.includes(spec)
                              ? coachFormData.specializations.filter(s => s !== spec)
                              : [...coachFormData.specializations, spec];
                            updateCoachFormData("specializations", specs);
                          }}
                        >
                          {spec}
                        </Button>
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add custom specialization"
                        value={newSpecialization}
                        onChange={(e) => setNewSpecialization(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addToList(coachFormData.specializations, newSpecialization, (items) => updateCoachFormData("specializations", items));
                            setNewSpecialization("");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          addToList(coachFormData.specializations, newSpecialization, (items) => updateCoachFormData("specializations", items));
                          setNewSpecialization("");
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {coachFormData.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {coachFormData.specializations.map((spec) => (
                          <Badge key={spec} variant="secondary" className="flex items-center space-x-1">
                            <span>{spec}</span>
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeFromList(coachFormData.specializations, spec, (items) => updateCoachFormData("specializations", items))}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-center pt-6">
                  <Button type="submit" size="lg" disabled={profileMutation.isPending}>
                    {profileMutation.isPending ? "Creating Profile..." : "Complete Coach Profile"}
                  </Button>
                </div>
              </>
            ) : (
              // Individual Profile Form
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <p className="text-sm text-gray-600">Tell us about yourself to get personalized recommendations</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="age">Age *</Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder="25"
                          value={individualFormData.age}
                          onChange={(e) => updateIndividualFormData("age", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="height">Height (cm) *</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="170"
                          value={individualFormData.height}
                          onChange={(e) => updateIndividualFormData("height", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight">Weight (kg) *</Label>
                        <Input
                          id="weight"
                          type="number"
                          placeholder="70"
                          value={individualFormData.weight}
                          onChange={(e) => updateIndividualFormData("weight", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="activityLevel">Activity Level</Label>
                        <Select value={individualFormData.activityLevel} onValueChange={(value) => updateIndividualFormData("activityLevel", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select activity level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                            <SelectItem value="light">Light (light exercise 1-3 days/week)</SelectItem>
                            <SelectItem value="moderate">Moderate (moderate exercise 3-5 days/week)</SelectItem>
                            <SelectItem value="active">Active (hard exercise 6-7 days/week)</SelectItem>
                            <SelectItem value="very_active">Very Active (very hard exercise, physical job)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="goal">Primary Goal</Label>
                        <Select value={individualFormData.goal} onValueChange={(value) => updateIndividualFormData("goal", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your goal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weight_loss">Weight Loss</SelectItem>
                            <SelectItem value="weight_gain">Weight Gain</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                            <SelectItem value="general_health">General Health</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center pt-6">
                  <Button type="submit" size="lg" disabled={profileMutation.isPending}>
                    {profileMutation.isPending ? "Creating Profile..." : "Complete Profile Setup"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}