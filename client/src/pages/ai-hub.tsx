import { Link } from 'wouter';
import { Brain, Pill, UtensilsCrossed, Dumbbell, Sparkles, Lock } from 'lucide-react';
import Navigation from '@/components/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

interface Payment {
  id: number;
  expiresAt: string;
}


export default function AIHub() {
  const { user } = useAuth();
  
  // Check if user has active purchase (not expired)
  const { data: activePayment } = useQuery<Payment>({
    queryKey: ['/api/user/active-payment'],
    retry: false,
  });
  
  const hasPlus = Boolean(activePayment);
  
  const aiFeatures = [
    {
      id: 'fitness-gpt',
      title: 'Fitness GPT',
      description: 'Get personalized fitness guidance, workout tips, and expert advice powered by AI',
      icon: Brain,
      gradient: 'from-blue-500 to-indigo-600',
      hoverGradient: 'hover:from-blue-600 hover:to-indigo-700',
      href: '/fitness-gpt',
      testId: 'card-fitness-gpt',
      requiresPlus: true
    },
    {
      id: 'supplements',
      title: 'Supplements AI',
      description: 'Evidence-based supplement recommendations tailored to your health and fitness goals',
      icon: Pill,
      gradient: 'from-purple-500 to-pink-600',
      hoverGradient: 'hover:from-purple-600 hover:to-pink-700',
      href: '/supplements-suggest',
      testId: 'card-supplements',
      requiresPlus: true
    },
    {
      id: 'meal-plan',
      title: 'Meal Planner',
      description: 'Create personalized meal plans with AI-powered recipe suggestions and nutrition tracking',
      icon: UtensilsCrossed,
      gradient: 'from-orange-500 to-amber-600',
      hoverGradient: 'hover:from-orange-600 hover:to-amber-700',
      href: '/meal-plan',
      testId: 'card-meal-plan'
    },
    {
      id: 'workout-plan',
      title: 'Workout Plans',
      description: 'Smart workout plans designed for your fitness level, goals, and available equipment',
      icon: Dumbbell,
      gradient: 'from-green-500 to-emerald-600',
      hoverGradient: 'hover:from-green-600 hover:to-emerald-700',
      href: '/workouts',
      testId: 'card-workout-plan'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-12 h-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">AI Hub</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your personal AI-powered fitness and nutrition assistant. Choose a feature to get started.
          </p>
        </div>

        {/* AI Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {aiFeatures.map((feature) => {
            const Icon = feature.icon;
            const isLocked = feature.requiresPlus && !hasPlus;
            
            const content = (
              <div
                className={`
                  group relative overflow-hidden rounded-2xl 
                  bg-gradient-to-br ${feature.gradient} ${isLocked ? '' : feature.hoverGradient}
                  p-8 ${isLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                  transform transition-all duration-300 ease-out
                  ${isLocked ? '' : 'hover:scale-105 hover:shadow-2xl'}
                  border-2 border-white/20
                `}
                data-testid={feature.testId}
              >
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 bg-white/0 ${isLocked ? '' : 'group-hover:bg-white/10'} transition-all duration-300`} />
                
                {/* Plus Badge for locked features */}
                {isLocked && (
                  <div className="absolute top-4 right-4 z-20">
                    <Badge className="bg-yellow-500 text-yellow-900 font-semibold">
                      <Lock className="w-3 h-3 mr-1" />
                      PLUS
                    </Badge>
                  </div>
                )}
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className={`p-3 bg-white/20 rounded-xl backdrop-blur-sm ${isLocked ? '' : 'group-hover:bg-white/30'} transition-colors`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  
                  <p className="text-white/90 text-base leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Arrow indicator or Upgrade prompt */}
                  {isLocked ? (
                    <div className="mt-6 flex items-center text-white">
                      <Link href="/subscription">
                        <span className="font-semibold underline hover:text-yellow-200 transition-colors cursor-pointer">
                          Upgrade to unlock
                        </span>
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-6 flex items-center text-white/80 group-hover:text-white group-hover:translate-x-2 transition-all">
                      <span className="font-semibold mr-2">Get Started</span>
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M13 7l5 5m0 0l-5 5m5-5H6" 
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Decorative gradient overlay */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl transform -translate-x-12 translate-y-12" />
              </div>
            );
            
            return (
              <div key={feature.id}>
                {isLocked ? (
                  content
                ) : (
                  <Link href={feature.href}>
                    {content}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            All AI features are powered by advanced machine learning models to provide personalized recommendations
          </p>
        </div>
      </div>
    </div>
  );
}
