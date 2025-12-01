import { useState, useEffect } from 'react';
import { Pill, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTrialGuard } from '@/hooks/useTrialGuard';
import { TrialExpiredLockout } from '@/components/trial-expired-lockout';
import { SubscriptionRequiredLockout } from '@/components/subscription-required-lockout';
import { useToast } from '@/hooks/use-toast';
import { EnhancedChat, type ChatMessage } from '@/components/enhanced-chat';
import { getSupplementSuggestions } from '@/lib/supplementsApi';

export default function SupplementsSuggest() {
  const { user } = useAuth();
  const { isLoading: trialLoading, canAccessSubscriptionOnly, isTrialExpired } = useTrialGuard();
  
  if (trialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }
  
  if (isTrialExpired) {
    return <TrialExpiredLockout featureName="Supplements AI" />;
  }
  
  if (!canAccessSubscriptionOnly) {
    return <SubscriptionRequiredLockout featureName="Supplements AI" />;
  }
  const { toast } = useToast();
  const [showTCModal, setShowTCModal] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const hasAgreed = localStorage.getItem('supplements_tc_agreed');
    if (hasAgreed === 'true') {
      setShowTCModal(false);
      setShowChat(true);
    }
  }, []);

  const handleAcceptTerms = () => {
    if (agreedToTerms) {
      localStorage.setItem('supplements_tc_agreed', 'true');
      setShowTCModal(false);
      setShowChat(true);
    }
  };

  const handleSendMessage = async (message: string, history: ChatMessage[], attachments?: File[]) => {
    const hasAgreed = localStorage.getItem('supplements_tc_agreed');
    if (hasAgreed !== 'true') {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions first.",
        variant: "destructive",
      });
      throw new Error("Terms not accepted");
    }

    const userProfile = user ? {
      id: (user as any).id,
      firstName: (user as any).firstName,
      lastName: (user as any).lastName,
      age: (user as any)?.age,
      sex: (user as any)?.sex,
      dietaryPreferences: (user as any)?.dietaryPreferences || [],
    } : undefined;

    const response = await getSupplementSuggestions(message, userProfile, history, attachments);

    console.log("=== SUPPLEMENTS RESPONSE RECEIVED ===");
    console.log("Full response:", response);
    console.log("Plan summary:", response.plan_summary);
    console.log("Suggestions count:", response.suggestions?.length);

    // Format the response as markdown
    let formattedReply = response.plan_summary || "I apologize, but I couldn't generate supplement suggestions at this time.";
    
    // Add supplement cards if available
    if (response.suggestions && response.suggestions.length > 0) {
      formattedReply += "\n\n---\n\n## Recommended Supplements\n\n";
      
      response.suggestions.forEach((supp, index) => {
        formattedReply += `### ${index + 1}. ${supp.category}\n\n`;
        formattedReply += `**Evidence:** ${supp.evidence_summary}\n\n`;
        formattedReply += `**How to Use:** ${supp.suggested_use_notes}\n\n`;
        
        if (supp.brand_examples && supp.brand_examples.length > 0) {
          formattedReply += `**Recommended Brands:**\n\n`;
          supp.brand_examples.forEach((brand) => {
            formattedReply += `- [${brand.brand} - ${brand.product_line}](${brand.link}) - ${brand.why}\n`;
          });
          formattedReply += "\n";
        }
      });
    }

    return {
      reply: formattedReply,
      disclaimer: response.disclaimer,
      additionalData: response.safetyNotes,
    };
  };

  const warningBanner = (
    <div className="mt-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-2 flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-800 dark:text-amber-300">
        Always consult your healthcare provider before starting any supplement.
      </p>
    </div>
  );

  return (
    <>
      {/* Terms & Conditions Modal */}
      <Dialog open={showTCModal} onOpenChange={() => {
        // Prevent closing modal unless terms are accepted
        return;
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              Important: Supplements Guidance Terms & Conditions
            </DialogTitle>
            <DialogDescription className="text-base">
              Please read and accept these terms before using the supplements suggestion feature.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Educational Purpose Only
              </h3>
              <p className="text-sm text-amber-800">
                This tool provides general supplement suggestions for educational purposes only. It is <strong>NOT</strong> medical advice and should not be used as a substitute for professional healthcare guidance.
              </p>
            </div>

            <div className="space-y-2 text-sm text-slate-700">
              <h4 className="font-semibold">Important Disclaimers:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Always consult your doctor or healthcare provider before starting any supplement regimen</li>
                <li>Supplements can interact with medications and medical conditions</li>
                <li>Individual responses to supplements vary significantly</li>
                <li>Dosage recommendations are general guidelines only</li>
                <li>Quality and purity of supplements can vary between brands</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">⚠️ Risk Warnings:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-red-800">
                <li>Some supplements may cause adverse reactions or allergic responses</li>
                <li>Supplements are not regulated as strictly as medications</li>
                <li>Taking too much of certain supplements can be harmful</li>
                <li>Pregnant, nursing, or taking medications? Consult your doctor first</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📋 User Responsibilities:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-blue-800">
                <li>You are responsible for verifying all supplement information</li>
                <li>You must consult healthcare professionals before taking supplements</li>
                <li>Monitor your body's response and discontinue if adverse effects occur</li>
                <li>Research the quality and reputation of supplement brands</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center space-x-2 py-4 border-t">
            <Checkbox 
              id="terms" 
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              data-testid="checkbox-tc-agree"
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand and accept these terms and conditions. I acknowledge that this is for educational purposes only.
            </label>
          </div>

          <DialogFooter>
            <Button
              onClick={handleAcceptTerms}
              disabled={!agreedToTerms}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              data-testid="button-accept-tc"
            >
              I Understand and Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Chat Interface */}
      {showChat && (
        <EnhancedChat
          title="Supplements Suggestion"
          subtitle="Educational guidance - not medical advice"
          icon={<Pill className="w-6 h-6 text-white" />}
          initialMessage={`Hi ${(user as any)?.firstName || 'there'}! I can help you explore supplement options based on your goals and health profile. Remember, this is for educational purposes only - always consult your healthcare provider before starting any supplement regimen.`}
          onSendMessage={handleSendMessage}
          gradientFrom="from-blue-400"
          gradientTo="to-indigo-500"
          userGradient="from-emerald-500 to-teal-600"
          warningBanner={warningBanner}
          inputPlaceholder="Ask about supplements for your goals..."
          inputTestId="input-supplement-chat"
          sendButtonTestId="button-send-supplement"
        />
      )}
    </>
  );
}
