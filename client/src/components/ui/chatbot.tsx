import React, { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Textarea } from './textarea';
import { ScrollArea } from './scroll-area';
import { Avatar, AvatarFallback } from './avatar';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, X, Send, Bot, Brain, Sparkles, Zap, Stars, Lightbulb, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotProps {
  currentScreen: string;
  userType: 'individual' | 'coach';
  className?: string;
}

export function Chatbot({ currentScreen, userType, className }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast({
            title: "Voice Input Error",
            description: "Could not process voice input. Please try again.",
            variant: "destructive",
          });
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }

      // Initialize speech synthesis
      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
      }
    }
  }, [toast]);

  // Auto-scroll to bottom of messages only for new messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only auto-scroll if the last message is from the bot or if it's a new user message
      if (!lastMessage.isUser || inputText === '') {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [messages, inputText]);

  // Welcome message when chatbot opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = getWelcomeMessage();
      const message: Message = {
        id: Date.now().toString(),
        content: welcomeMessage,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([message]);
      
      if (speechEnabled) {
        speakText(welcomeMessage);
      }
    }
  }, [isOpen, currentScreen, userType, speechEnabled]);

  const getWelcomeMessage = () => {
    const screenContext = getScreenContext();
    
    if (userType === 'coach') {
      return `Hi! I'm MikeAI, your intelligent nutrition coaching assistant for ${screenContext}. I can help you create personalized meal plans for clients, analyze nutrition data, suggest recipe modifications, and provide evidence-based dietary guidance. What would you like to work on today?`;
    } else {
      return `Hi! I'm MikeAI, your personal nutrition companion for ${screenContext}. I can create customized meal plans based on your goals, suggest healthy recipes, track your nutrition progress, and answer questions about diet and wellness. How can I help you achieve your health goals today?`;
    }
  };

  const getScreenContext = () => {
    const contexts: Record<string, string> = {
      '/': userType === 'coach' ? 'your coach dashboard' : 'your personal dashboard',
      '/profile-setup': 'profile setup',
      '/recipes': 'the recipe library',
      '/community': 'the community section',
      '/subscription': 'subscription options',
      '/coach/login': 'coach login',
      '/auth/login': 'user login',
      '/coach/clients': 'client management',
    };
    return contexts[currentScreen] || 'the current page';
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text: string, messageId?: string) => {
    if (synthRef.current && speechEnabled) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        if (messageId) setCurrentlySpeakingId(messageId);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentlySpeakingId(null);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setCurrentlySpeakingId(null);
      };
      
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await apiRequest('/api/chatbot/message', 'POST', {
        message: inputText.trim(),
        context: {
          currentScreen,
          userType,
          screenContext: getScreenContext(),
        },
      });

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (speechEnabled) {
        speakText(data.message, botMessage.id);
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Chatbot Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 rounded-full w-20 h-20 shadow-lg z-50 p-0",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          className
        )}
      >
        <div className="relative">
          <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <Bot className="w-18 h-18 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse shadow-sm"></div>
        </div>
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 w-96 h-[600px] shadow-xl z-50 flex flex-col",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 shadow-md">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full shadow-sm"></div>
          </div>
          <div>
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">MikeAI</CardTitle>
            <p className="text-xs text-gray-600 mt-0.5">🧠 Smart Nutrition Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSpeechEnabled(!speechEnabled)}
            title={speechEnabled ? "Disable voice" : "Enable voice"}
          >
            {speechEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>
          {isSpeaking && (
            <Button
              variant="ghost"
              size="sm"
              onClick={stopSpeaking}
              title="Stop speaking"
            >
              <VolumeX className="w-4 h-4 text-red-500" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 pt-2 overflow-hidden">
        <div className="flex-1 overflow-y-auto pr-2 space-y-4" style={{ maxHeight: 'calc(600px - 180px)' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex flex-col",
                message.isUser ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm break-words",
                  message.isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/70 text-foreground border border-border shadow-sm"
                )}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
                {!message.isUser && isSpeaking && currentlySpeakingId === message.id && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    <span>Speaking...</span>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {formatTime(message.timestamp)}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-cyan-600">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg px-3 py-2 text-sm border border-blue-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span className="text-xs font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    🧠 Analyzing your question...
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex items-end gap-2 mt-3 flex-shrink-0 border-t pt-3">
          <div className="flex-1">
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about nutrition, meal planning, or app features..."
              className="min-h-[60px] max-h-[120px] resize-none text-sm"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Button
              onClick={isListening ? stopListening : startListening}
              variant="outline"
              size="sm"
              disabled={isLoading}
              title={isListening ? "Stop listening" : "Start voice input"}
              className="w-10 h-10 p-0"
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-red-500" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            <Button
              onClick={sendMessage}
              size="sm"
              disabled={!inputText.trim() || isLoading}
              className="w-10 h-10 p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Extend the Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}