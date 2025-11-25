import { Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTrialGuard } from '@/hooks/useTrialGuard';
import { TrialExpiredLockout } from '@/components/trial-expired-lockout';
import { EnhancedChat, type ChatMessage } from '@/components/enhanced-chat';
import { sendFitnessChat } from '@/lib/fitnessChatApi';

export default function FitnessGPT() {
  const { user } = useAuth();
  const { isLoading: trialLoading, canAccessPremium, isTrialExpired } = useTrialGuard();
  
  if (trialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }
  
  if (isTrialExpired && !canAccessPremium) {
    return <TrialExpiredLockout featureName="Fitness GPT" />;
  }

  const handleSendMessage = async (message: string, history: ChatMessage[], attachments?: File[]) => {
    const userProfile = user ? {
      id: (user as any).id,
      firstName: (user as any).firstName,
      lastName: (user as any).lastName,
    } : undefined;

    const response = await sendFitnessChat(message, userProfile, history, attachments);
    
    return {
      reply: response.reply,
      disclaimer: response.disclaimer,
    };
  };

  return (
    <EnhancedChat
      title="Fitness GPT"
      subtitle="Your AI-powered fitness & nutrition coach"
      icon={<Sparkles className="w-6 h-6 text-white" />}
      initialMessage={`Hi ${(user as any)?.firstName || 'there'}! I'm your Fitness GPT, here to help you with personalized nutrition advice, workout planning, and fitness guidance. How can I assist you today?`}
      onSendMessage={handleSendMessage}
      gradientFrom="from-blue-400"
      gradientTo="to-indigo-500"
      userGradient="from-emerald-500 to-teal-600"
      inputPlaceholder="Ask me anything about fitness, nutrition, or wellness..."
      inputTestId="input-fitness-chat"
      sendButtonTestId="button-send-fitness"
    />
  );
}
