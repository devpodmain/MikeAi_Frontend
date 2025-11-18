import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, Target, Trophy, Star } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/animated-card';

interface WaterMeterProps {
  currentIntake: number;
  targetIntake: number;
  unit?: string;
  showCelebration?: boolean;
}

export function WaterMeter({ 
  currentIntake = 0, 
  targetIntake = 2, 
  unit = 'L',
  showCelebration = false 
}: WaterMeterProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  
  const safeTarget = targetIntake || 2;
  const safeCurrent = currentIntake || 0;
  const percentage = Math.min((safeCurrent / safeTarget) * 100, 100);
  const isComplete = safeCurrent >= safeTarget;
  
  useEffect(() => {
    setIsAnimating(true);
    if (isComplete && showCelebration) {
      setShowAchievement(true);
      setTimeout(() => setShowAchievement(false), 3000);
    }
  }, [currentIntake, isComplete, showCelebration]);

  const getWaveColor = () => {
    if (percentage >= 100) return 'from-emerald-400 to-blue-500';
    if (percentage >= 75) return 'from-blue-400 to-cyan-500';
    if (percentage >= 50) return 'from-cyan-400 to-blue-400';
    return 'from-blue-300 to-cyan-400';
  };

  const getMeterColor = () => {
    if (percentage >= 100) return 'border-emerald-500';
    if (percentage >= 75) return 'border-blue-500';
    if (percentage >= 50) return 'border-cyan-500';
    return 'border-blue-400';
  };

  return (
    <AnimatedCard className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 border-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Droplets className={`w-5 h-5 ${isComplete ? 'text-emerald-600' : 'text-blue-600'}`} />
            <h3 className="font-semibold text-gray-800">Daily Water</h3>
          </div>
          {isComplete && (
            <div className="flex items-center space-x-1">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-600">Goal Reached</span>
            </div>
          )}
        </div>

        {/* Water Glass Visualization */}
        <div className="relative mx-auto mb-4" style={{ width: '80px', height: '120px' }}>
          {/* Glass Container */}
          <div className={`absolute inset-0 rounded-lg ${getMeterColor()} border-4 bg-white/20 backdrop-blur-sm`}>
            {/* Water Fill */}
            <div 
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getWaveColor()} rounded-b-md transition-all duration-500 ease-out`}
              style={{ 
                height: `${percentage}%`
              }}
            >
              {/* Wave Effect */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 rounded-full animate-pulse" />
            </div>
            
            {/* Glass Reflection */}
            <div className="absolute top-2 left-2 w-2 h-8 bg-white/40 rounded-full" />
          </div>

          {/* Measurement Lines */}
          <div className="absolute -right-8 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
            <span>{safeTarget}{unit}</span>
            <span>{(safeTarget * 0.75).toFixed(1)}</span>
            <span>{(safeTarget * 0.5).toFixed(1)}</span>
            <span>{(safeTarget * 0.25).toFixed(1)}</span>
            <span>0</span>
          </div>
        </div>

        {/* Progress Text */}
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">
            {safeCurrent.toFixed(1)}{unit} / {safeTarget}{unit}
          </div>
          <div className="text-sm text-gray-600">
            {percentage.toFixed(0)}% complete
          </div>
          {!isComplete && (
            <div className="text-xs text-blue-600 mt-1">
              {(safeTarget - safeCurrent).toFixed(1)}{unit} to go!
            </div>
          )}
        </div>


      </CardContent>
    </AnimatedCard>
  );
}

export default WaterMeter;