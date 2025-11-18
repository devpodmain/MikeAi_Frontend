import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Smartphone, Download } from "lucide-react";
import { AnimatedCard } from "@/components/ui/animated-card";

export function MobileAppBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatedCard className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none shadow-lg">
      <div className="p-4">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 text-white/70 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-bold text-lg">ACTIV Mobile</h3>
              <Badge className="bg-green-500 text-white text-xs">NEW</Badge>
            </div>
            <p className="text-sm opacity-90">
              Experience our full-featured mobile app with camera scanning, offline mode & push notifications
            </p>
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            className="bg-white text-blue-600 hover:bg-gray-100"
            onClick={() => window.location.href = '/mobile'}
          >
            <Download className="w-4 h-4 mr-1" />
            Try Now
          </Button>
        </div>
      </div>
    </AnimatedCard>
  );
}