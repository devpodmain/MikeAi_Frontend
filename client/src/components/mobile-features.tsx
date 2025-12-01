import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Camera, 
  Mic, 
  Vibrate, 
  Bell, 
  MapPin, 
  Smartphone,
  Wifi,
  Battery,
  Signal,
  Share2,
  Download,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  Zap
} from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";
import { AnimatedButton } from "@/components/ui/animated-button";

// Mobile-specific features and capabilities
export function MobileFeatures() {
  const [hasCamera, setHasCamera] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  useEffect(() => {
    // Check for camera availability
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setHasCamera(true);
    }

    // Check notification permission
    if ('Notification' in window) {
      setHasNotifications(Notification.permission === 'granted');
    }

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Battery API (if supported)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="space-y-6 pb-20">
      {/* Mobile Device Status */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Mobile Features</h1>
            <p className="opacity-90">Native app capabilities</p>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-5 h-5" />
            ) : (
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs">!</span>
              </div>
            )}
            {batteryLevel && (
              <div className="flex items-center space-x-1">
                <Battery className="w-4 h-4" />
                <span className="text-sm">{batteryLevel}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Camera Features */}
      <div className="px-4">
        <AnimatedCard className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Food Scanner</h3>
              <p className="text-sm text-gray-600">AI-powered nutrition analysis</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <AnimatedButton 
                variant="outline" 
                className="h-20 flex flex-col space-y-2"
                disabled={!hasCamera}
              >
                <Camera className="w-6 h-6" />
                <span className="text-sm">Take Photo</span>
              </AnimatedButton>
              
              <AnimatedButton 
                variant="outline" 
                className="h-20 flex flex-col space-y-2"
              >
                <div className="w-6 h-6 bg-gray-300 rounded" />
                <span className="text-sm">From Gallery</span>
              </AnimatedButton>
            </div>
            
            {!hasCamera && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700">
                  Camera access required for food scanning. Please allow camera permissions.
                </p>
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>

      {/* Push Notifications */}
      <div className="px-4">
        <AnimatedCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Smart Notifications</h3>
                <p className="text-sm text-gray-600">Meal reminders & progress updates</p>
              </div>
            </div>
            <Badge variant={hasNotifications ? "default" : "secondary"}>
              {hasNotifications ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Meal Reminders</p>
                <p className="text-xs text-gray-500">Get reminded to log your meals</p>
              </div>
              <div className="w-10 h-6 bg-blue-500 rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Progress Updates</p>
                <p className="text-xs text-gray-500">Weekly nutrition summaries</p>
              </div>
              <div className="w-10 h-6 bg-blue-500 rounded-full"></div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Achievement Alerts</p>
                <p className="text-xs text-gray-500">Celebrate your milestones</p>
              </div>
              <div className="w-10 h-6 bg-gray-200 rounded-full"></div>
            </div>
          </div>
          
          {!hasNotifications && (
            <div className="mt-4">
              <Button 
                className="w-full" 
                onClick={() => {
                  if ('Notification' in window) {
                    Notification.requestPermission().then(permission => {
                      setHasNotifications(permission === 'granted');
                    });
                  }
                }}
              >
                Enable Notifications
              </Button>
            </div>
          )}
        </AnimatedCard>
      </div>

      {/* Voice Commands */}
      <div className="px-4">
        <AnimatedCard className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Mic className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Voice Commands</h3>
              <p className="text-sm text-gray-600">Hands-free meal logging</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-sm mb-1">Try saying:</p>
              <div className="space-y-1 text-xs text-gray-600">
                <p>"Log breakfast: oatmeal with berries"</p>
                <p>"How many calories today?"</p>
                <p>"Find healthy dinner recipes"</p>
                <p>"Set reminder for lunch at 1 PM"</p>
              </div>
            </div>
            
            <AnimatedButton className="w-full" variant="outline">
              <Mic className="w-4 h-4 mr-2" />
              Start Voice Command
            </AnimatedButton>
          </div>
        </AnimatedCard>
      </div>

      {/* Offline Mode */}
      <div className="px-4">
        <AnimatedCard className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isOnline ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {isOnline ? (
                <Wifi className="w-6 h-6 text-green-600" />
              ) : (
                <Smartphone className="w-6 h-6 text-orange-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">Offline Mode</h3>
              <p className="text-sm text-gray-600">
                {isOnline ? "Connected - All features available" : "Offline - Limited features"}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Meal logging</span>
              <Badge variant={isOnline ? "default" : "secondary"}>
                {isOnline ? "Available" : "Cached"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Recipe browsing</span>
              <Badge variant={isOnline ? "default" : "secondary"}>
                {isOnline ? "Available" : "Cached"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">AI meal planning</span>
              <Badge variant={isOnline ? "default" : "outline"}>
                {isOnline ? "Available" : "Requires connection"}
              </Badge>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* App Installation */}
      <div className="px-4">
        <AnimatedCard className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Download className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Install App</h3>
              <p className="text-sm text-gray-600">Add to home screen for better experience</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-xs font-medium">Faster Loading</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Bell className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-xs font-medium">Push Notifications</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Smartphone className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-xs font-medium">Offline Access</p>
              </div>
            </div>
            
            <Button className="w-full" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Add to Home Screen
            </Button>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}

// Mobile-specific utility functions
export const mobileUtils = {
  // Check if device is mobile
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // Check if app is installed (PWA)
  isInstalled: () => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true;
  },

  // Vibrate device (if supported)
  vibrate: (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },

  // Share content (if supported)
  share: async (data: { title?: string; text?: string; url?: string }) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (err) {
        console.error('Error sharing:', err);
        return false;
      }
    }
    return false;
  },

  // Request notification permission
  requestNotificationPermission: async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  // Get device orientation
  getOrientation: () => {
    return window.screen.orientation?.type || 'unknown';
  },

  // Install prompt for PWA
  installPrompt: null as any,
  installApp: async () => {
    if (mobileUtils.installPrompt) {
      mobileUtils.installPrompt.prompt();
      const result = await mobileUtils.installPrompt.userChoice;
      return result.outcome === 'accepted';
    }
    return false;
  }
};

// Setup install prompt listener - let browser show default install banner
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    mobileUtils.installPrompt = e;
  });
}