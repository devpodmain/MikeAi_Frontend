import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Bot, User, Mic, MicOff, Paperclip, Volume2, VolumeX, X, ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  additionalData?: any;
}

interface EnhancedChatProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  initialMessage: string;
  onSendMessage: (message: string, history: ChatMessage[], attachments?: File[]) => Promise<{ reply: string; disclaimer?: string; additionalData?: any }>;
  gradientFrom: string;
  gradientTo: string;
  userGradient: string;
  warningBanner?: React.ReactNode;
  inputPlaceholder?: string;
  inputTestId?: string;
  sendButtonTestId?: string;
}

export function EnhancedChat({
  title,
  subtitle,
  icon,
  initialMessage,
  onSendMessage,
  gradientFrom,
  gradientTo,
  userGradient,
  warningBanner,
  inputPlaceholder = "Type your message...",
  inputTestId = "input-chat",
  sendButtonTestId = "button-send",
}: EnhancedChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: initialMessage,
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastDisclaimer, setLastDisclaimer] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + ' ' + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice input error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [toast]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleTextToSpeech = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      content: initialMessage,
      isUser: false,
      timestamp: new Date(),
    }]);
    setLastDisclaimer(null);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && attachments.length === 0) return;
    if (isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    const messageToSend = inputText.trim();
    const filesToSend = [...attachments];
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Get last 2 conversation pairs (4 messages) for context
      const recentMessages = messages.slice(-4);
      
      const response = await onSendMessage(messageToSend, recentMessages, filesToSend);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.reply,
        isUser: false,
        timestamp: new Date(),
        additionalData: response.additionalData,
      };

      setMessages(prev => [...prev, botMessage]);
      if (response.disclaimer) {
        setLastDisclaimer(response.disclaimer);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive",
      });
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col">
      {/* Enhanced Header */}
      <div className="border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/user-home">
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-lg`}>
                {icon}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearChat}
                className="rounded-full"
                data-testid="button-clear-chat"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {warningBanner}
        </div>
      </div>

      {/* Chat Container - Full height with proper spacing */}
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4">
        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-4 py-6">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}
                data-testid={`message-${message.isUser ? 'user' : 'bot'}-${message.id}`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                  message.isUser 
                    ? `bg-gradient-to-br ${userGradient}` 
                    : `bg-gradient-to-br ${gradientFrom} ${gradientTo}`
                }`}>
                  {message.isUser ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className={`max-w-[75%] ${message.isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                  <Card className={`p-4 shadow-sm ${
                    message.isUser
                      ? `bg-gradient-to-br ${userGradient} border-transparent text-white`
                      : 'bg-white/95 dark:bg-slate-800/95 border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm'
                  }`}>
                    {message.isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-white">
                        {message.content}
                      </p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-strong:text-slate-900 dark:prose-strong:text-white prose-ul:text-slate-700 dark:prose-ul:text-slate-300">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/20 dark:border-slate-700/20">
                      <p className={`text-xs ${message.isUser ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {!message.isUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTextToSpeech(message.content)}
                          className="h-6 px-2"
                        >
                          {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        </Button>
                      )}
                    </div>
                  </Card>

                  {/* Additional Data Display */}
                  {!message.isUser && message.additionalData && (
                    <Card className="p-3 bg-amber-50/90 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 w-full backdrop-blur-sm">
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        {message.additionalData}
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3" data-testid="loading-indicator">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center flex-shrink-0`}>
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <Card className="p-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-slate-600 dark:text-slate-400">Thinking...</span>
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Enhanced Input Area - Fixed at bottom */}
        <div className="pb-6">
          <div className="bg-white/95 dark:bg-slate-900/95 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl backdrop-blur-sm">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                      <Paperclip className="w-3 h-3" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{file.name}</span>
                      <button onClick={() => removeAttachment(index)} className="text-slate-500 hover:text-slate-700">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={inputPlaceholder}
                    className="min-h-[60px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-base"
                    data-testid={inputTestId}
                  />
                </div>
                <div className="flex gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full"
                    data-testid="button-attachment"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleVoiceInput}
                    className={`rounded-full ${isListening ? 'bg-red-100 dark:bg-red-950' : ''}`}
                    data-testid="button-voice"
                  >
                    {isListening ? <MicOff className="w-4 h-4 text-red-600" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!inputText.trim() && attachments.length === 0) || isLoading}
                    className={`rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:opacity-90`}
                    size="icon"
                    data-testid={sendButtonTestId}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
              {lastDisclaimer && (
                <div className="mt-3 p-2 bg-amber-50/90 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-400 backdrop-blur-sm">
                  {lastDisclaimer}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
