import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { AnimatedPage } from "@/components/ui/animated-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import {
  Hash,
  Send,
  Mail,
  MessageSquare,
  Users,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Bell,
  BellRing,
} from "lucide-react";

interface Message {
  id: number;
  orgId: number;
  senderId: string;
  recipientId?: string;
  messageType: 'community' | 'dm';
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
  };
}

interface Conversation {
  participantId: string;
  participantName: string;
  participantType: 'user' | 'org_member';
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: string;
  type: 'user' | 'org_member';
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'community' | 'dm'>('community');
  const [messageInput, setMessageInput] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newDmRecipient, setNewDmRecipient] = useState<string>("");
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const isInitialMount = useRef(true); // Track initial mount to avoid spurious notifications
  const dmScrollRef = useRef<HTMLDivElement>(null);

  // Check if user is an org member
  const isOrgMember = user && (
    user.userType === 'org_owner' || 
    user.userType === 'coach' || 
    user.userType === 'org_client'
  );

  const orgId = (user as any)?.currentOrgId || (user as any)?.organizationId;
  const userId = user?.id;
  const userName = user ? `${user.firstName} ${user.lastName}` : '';

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        setNotificationsEnabled(permission === 'granted');
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Fetch community messages
  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/organizations', orgId, 'messages', 'community'],
    queryFn: async () => {
      const response = await apiRequest(
        `/api/organizations/${orgId}/messages?messageType=community&limit=100`,
        'GET'
      );
      return response.messages || [];
    },
    enabled: Boolean(orgId && isOrgMember && activeTab === 'community'),
    refetchInterval: 5000
  });

  // ALWAYS fetch DM conversations (even when not on DM tab) for real-time notifications
  const { data: conversations = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/organizations', orgId, 'messages', 'dm'],
    queryFn: async () => {
      const response = await apiRequest(
        `/api/organizations/${orgId}/messages/dm`,
        'GET'
      );
      return response.conversations || [];
    },
    enabled: Boolean(orgId && isOrgMember), // ALWAYS POLL - removed activeTab check
    refetchInterval: 3000 // Poll every 3 seconds for real-time notifications
  });

  // Fetch DM thread
  const { data: dmMessages = [], isLoading: loadingDmThread } = useQuery<Message[]>({
    queryKey: ['/api/organizations', orgId, 'messages', 'dm', selectedConversation],
    queryFn: async () => {
      const response = await apiRequest(
        `/api/organizations/${orgId}/messages/dm/${selectedConversation}`,
        'GET'
      );
      return response.messages || [];
    },
    enabled: Boolean(orgId && isOrgMember && selectedConversation),
    refetchInterval: 2000 // Faster polling for active conversation
  });

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (selectedConversation && dmMessages.length > 0) {
      const unreadMessageIds = dmMessages
        .filter(msg => msg.recipientId === userId && !msg.isRead)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        apiRequest(
          `/api/organizations/${orgId}/messages/read`,
          'PATCH',
          { messageIds: unreadMessageIds }
        ).then(() => {
          // Refresh conversations to update unread counts
          queryClient.invalidateQueries({ 
            queryKey: ['/api/organizations', orgId, 'messages', 'dm'] 
          });
        }).catch(err => {
          console.error('Failed to mark messages as read:', err);
        });
      }
    }
  }, [selectedConversation, dmMessages, userId, orgId]);

  // Fetch organization members
  const { data: orgMembers = [] } = useQuery<OrgMember[]>({
    queryKey: ['/api/organizations', orgId, 'members'],
    queryFn: async () => {
      const response = await apiRequest(
        `/api/organizations/${orgId}/members`,
        'GET'
      );
      return (response.members || []).filter((m: OrgMember) => m.id !== userId);
    },
    enabled: Boolean(orgId && isOrgMember && activeTab === 'dm')
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // Auto-scroll to bottom when opening conversation or when new messages arrive
  useEffect(() => {
    if (selectedConversation && dmMessages.length > 0 && dmScrollRef.current) {
      const scrollElement = dmScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        // Use requestAnimationFrame for smooth, reliable scrolling
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }, 50);
        });
      }
    }
  }, [selectedConversation, dmMessages]);

  // Desktop notification + sound when new unread messages
  useEffect(() => {
    // Skip notifications on initial mount to avoid spurious alerts
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setPreviousUnreadCount(totalUnread);
      return;
    }

    // Trigger notifications on ANY increase (including 0 → 1, the most important case!)
    if (totalUnread > previousUnreadCount) {
      // Play notification sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+CZSA0PVqnl8qlhGAg+ltryy3YpBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSV6y/HajDsIF2K27OajUxEKSKDf8r9pIAU0itTz0IAyBiFsxO/fmEcNEE+o5fKsYBkIPZPZ88p3KgUme8ry24k6CRdjuOvpoFIRC0mi4PK7aCAFMojT88yAMQYhbsTv4JlIDRFPqOXyrGAZCDyT2fPKdioFJnvK8tuJOgkXY7jr6aFSEQtJouDyu2ggBTKI0/PMgDEGIW7E7+CZRw0RT6jl8qxgGQg8k9nzynYqBSZ7yvLbiToJF2O46+mhUhELSaLg8rtoIAUyiNPzzIAxBiFuxO/gmUcNEU+o5fKsYBkIPJPZ88p2KgUme8ry24k6CRdjuOvpoVIRC0mi4PK7aCAFMojT88yAMQYhbsTv4JlHDRFPqOXyrGAZCDyT2fPKdioFJnvK8tuJOgkXY7jr6aFSEQtJouDyu2ggBTKI0/PMgDEGIW7E7+CZRw0RT6jl8qxgGQg8k9nzynYqBSZ7yvLbiToJF2O46+mhUhELSaLg8rtoIAUyiNPzzIAxBiFuxO/gmUcNEU+o5fKsYBkIPJPZ88p2KgUme8ry24k6CRdjuOvpoVIRC0mi4PK7aCAFMojT88yAMQYhbsTv4JlHDRFPqOXyrGAZCDyT2fPKdioFJnvK8tuJOgkXY7jr6aFSEQtJouDyu2ggBTKI0/PMgDEGIW7E7+CZRw0RT6jl8qxgGQg8k9nzynYqBSZ7yvLbiToJF2O46+mhUhELSaLg8rtoIAUyiNPzzIAxBiFuxO/gmUcNEU+o5fKsYBkIPJPZ88p2KgUme8ry24k6CRdjuOvpoVIRC0mi4PK7aCAFMojT88yAMQYhbsTv4JlHDRFPqOXyrGAZCDyT2fPKdioFJnvK8tuJOgkXY7jr6aFSEQtJouDyu2ggBTKI0/PMgDEGIW7E7+CZRw0RT6jl8qxgGQg8k9nzynYqBSZ7yvLbiToJF2O46+mhUhELSaLg8rtoIAUyiNPzzIAxBiFuxO/gmUcNEU+o5fKsYBkIPJPZ88p2KgUme8ry24k6CRdjuOvpoVIRC0mi4PK7aCAFMojT88yAMQYhbsTv4JlHDRFPqOXyrGAZCDyT2fPKdioFJnvK8tuJOgkXY7jr6aFSEQtJouDyu2ggBTKI0/PMgDEGIW7E7+CZRw0RT6jl8qxgGQg8k9nzynYqBSZ7yvLbiToJF2O46+mhUhELSaLg8rtoIAUyiNPzzIAxBiFuxO/gmUcNEU+o5fKsYBkIPJPZ88p2KgUme8ry24k6CRdjuOvpoVIRC0mi4PK7aCAFMojT88yAMQYhbsTv4JlHDRFPqOXyrGAZCDyT2fPKdioFJnvK8tuJOgkXY7jr');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio fails

      // Show desktop notification
      if (notificationsEnabled && activeTab !== 'dm') {
        const newMessages = totalUnread - previousUnreadCount;
        new Notification('New Message', {
          body: `You have ${newMessages} new message${newMessages > 1 ? 's' : ''}`,
          icon: '/favicon.ico',
          tag: 'dm-notification'
        });
      }

      // Show toast notification
      if (activeTab !== 'dm') {
        toast({
          title: "New Direct Message",
          description: `You have ${totalUnread} unread message${totalUnread > 1 ? 's' : ''}`,
          duration: 5000,
        });
      }
    }
    
    setPreviousUnreadCount(totalUnread);
  }, [totalUnread, previousUnreadCount, notificationsEnabled, activeTab, toast]);

  // Send community message
  const sendCommunityMessageMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      return apiRequest(`/api/organizations/${orgId}/messages`, 'POST', data);
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ 
        queryKey: ['/api/organizations', orgId, 'messages', 'community'] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Send DM
  const sendDmMutation = useMutation({
    mutationFn: async (data: { recipientId: string; recipientType: string; content: string }) => {
      return apiRequest(`/api/organizations/${orgId}/messages/dm`, 'POST', data);
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ 
        queryKey: ['/api/organizations', orgId, 'messages', 'dm'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/organizations', orgId, 'messages', 'dm', selectedConversation] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Format timestamp
  const formatMessageTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return formatDistanceToNow(date, { addSuffix: true });
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return `Yesterday at ${format(date, "h:mm a")}`;
    return format(date, "MMM d at h:mm a");
  };

  // Get initials
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle send community message
  const handleSendCommunityMessage = () => {
    if (!messageInput.trim()) return;
    sendCommunityMessageMutation.mutate({ content: messageInput });
  };

  // Handle send DM
  const handleSendDm = () => {
    if (!messageInput.trim()) return;
    
    const recipient = selectedConversation || newDmRecipient;
    if (!recipient) {
      toast({
        title: "Select a recipient",
        description: "Please select someone to send a message to",
        variant: "destructive"
      });
      return;
    }

    const recipientMember = orgMembers.find(m => m.id === recipient);
    if (!recipientMember) return;

    sendDmMutation.mutate({
      recipientId: recipient,
      recipientType: recipientMember.type,
      content: messageInput
    });
  };

  if (!isOrgMember || !orgId) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-gradient-to-br from-accent/20 to-primary/20">
          <Navigation />
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages Not Available</h2>
              <p className="text-gray-600">
                Messaging is only available for organization members. Join or create an organization to access this feature.
              </p>
            </div>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Card */}
            <div className="bg-white dark:bg-gray-900 rounded-t-2xl shadow-lg border-b-4 border-amber-500">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Messages</h1>
                    <p className="text-gray-600 dark:text-gray-400">Connect with your organization members</p>
                  </div>
                  {notificationsEnabled && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <BellRing className="h-5 w-5 animate-pulse" />
                      <span className="text-sm font-medium">Notifications On</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="px-6 pb-6">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-2 flex gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('community');
                      setSelectedConversation(null);
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all",
                      activeTab === 'community'
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-105"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
                    )}
                    data-testid="tab-community"
                  >
                    <Hash className="h-5 w-5" />
                    <span>Community</span>
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('dm')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all relative",
                      activeTab === 'dm'
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-105"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700",
                      totalUnread > 0 && activeTab !== 'dm' && "animate-pulse"
                    )}
                    data-testid="tab-dm"
                  >
                    <Mail className={cn("h-5 w-5", totalUnread > 0 && activeTab !== 'dm' && "animate-bounce")} />
                    <span>Direct Messages</span>
                    {totalUnread > 0 && (
                      <Badge 
                        variant="destructive" 
                        className={cn(
                          "ml-1",
                          activeTab !== 'dm' && "animate-pulse bg-red-500"
                        )}
                      >
                        {totalUnread}
                      </Badge>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-gray-900 rounded-b-2xl shadow-lg" style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}>
              {activeTab === 'community' ? (
                <div className="flex flex-col h-full">
                  {/* Community Messages */}
                  <ScrollArea className="flex-1 p-6">
                    {loadingMessages ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-16 w-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-full mb-4">
                          <MessageSquare className="h-16 w-16 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No messages yet</h3>
                        <p className="text-gray-600 dark:text-gray-400">Start the conversation by posting a message below</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message: Message) => {
                          const isOwnMessage = message.senderId === userId;
                          const senderName = isOwnMessage 
                            ? userName 
                            : message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'Unknown User';
                          
                          return (
                            <div
                              key={message.id}
                              className={cn(
                                "flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300",
                                isOwnMessage && "flex-row-reverse"
                              )}
                            >
                              <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-amber-200 dark:ring-amber-800">
                                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-semibold text-xs">
                                  {getUserInitials(senderName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={cn(
                                "flex-1 space-y-1 max-w-2xl",
                                isOwnMessage && "items-end"
                              )}>
                                <div className={cn(
                                  "flex items-center gap-2",
                                  isOwnMessage && "justify-end"
                                )}>
                                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{senderName}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatMessageTime(message.createdAt)}
                                  </span>
                                  {isOwnMessage && (
                                    message.isRead 
                                      ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                                      : <Clock className="h-3 w-3 text-gray-400" />
                                  )}
                                </div>
                                <div className={cn(
                                  "rounded-2xl px-4 py-3 shadow-sm transition-all hover:shadow-md",
                                  isOwnMessage 
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white ml-auto" 
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                                )}>
                                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex gap-3">
                      <Input
                        type="text"
                        placeholder="Post a message to the community..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendCommunityMessage();
                          }
                        }}
                        className="flex-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 transition-all focus:ring-2 focus:ring-amber-500"
                        data-testid="input-community-message"
                      />
                      <Button 
                        onClick={handleSendCommunityMessage}
                        disabled={!messageInput.trim() || sendCommunityMessageMutation.isPending}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 transition-all hover:scale-105"
                        data-testid="button-send-message"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : selectedConversation ? (
                // DM Thread View
                <div className="flex flex-col h-full">
                  {/* Thread Header */}
                  <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConversation(null)}
                      data-testid="button-back-to-conversations"
                      className="hover:bg-amber-100 dark:hover:bg-amber-900/20"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Avatar className="h-10 w-10 ring-2 ring-amber-200 dark:ring-amber-800">
                      <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-semibold">
                        {getUserInitials(
                          conversations.find(c => c.participantId === selectedConversation)?.participantName ||
                          orgMembers.find(m => m.id === selectedConversation)?.name ||
                          'Unknown'
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {conversations.find(c => c.participantId === selectedConversation)?.participantName ||
                         orgMembers.find(m => m.id === selectedConversation)?.name ||
                         'Unknown'}
                      </h3>
                    </div>
                  </div>

                  {/* DM Messages */}
                  <ScrollArea className="flex-1 p-6" ref={dmScrollRef}>
                    {loadingDmThread ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : dmMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <Mail className="h-16 w-16 mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dmMessages.map((message: Message) => {
                          const isOwnMessage = message.senderId === userId;
                          return (
                            <div
                              key={message.id}
                              className={cn(
                                "flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-200",
                                isOwnMessage && "flex-row-reverse"
                              )}
                            >
                              <Avatar className="h-8 w-8 ring-2 ring-amber-200 dark:ring-amber-800">
                                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs">
                                  {isOwnMessage ? getUserInitials(userName) : getUserInitials(
                                    conversations.find(c => c.participantId === selectedConversation)?.participantName || 'U'
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div className={cn(
                                "flex-1 space-y-1 max-w-md",
                                isOwnMessage && "items-end"
                              )}>
                                <div className={cn(
                                  "rounded-2xl px-4 py-2 shadow-sm transition-all hover:shadow-md",
                                  isOwnMessage 
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white ml-auto" 
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                                )}>
                                  <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                                </div>
                                <div className={cn(
                                  "flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-2",
                                  isOwnMessage && "justify-end"
                                )}>
                                  <span>{formatMessageTime(message.createdAt)}</span>
                                  {isOwnMessage && (
                                    message.isRead 
                                      ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                                      : <Clock className="h-3 w-3 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>

                  {/* DM Input */}
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex gap-3">
                      <Input
                        type="text"
                        placeholder="Send a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendDm();
                          }
                        }}
                        className="flex-1 bg-white dark:bg-gray-900 transition-all focus:ring-2 focus:ring-amber-500"
                        data-testid="input-dm-message"
                      />
                      <Button 
                        onClick={handleSendDm}
                        disabled={!messageInput.trim() || sendDmMutation.isPending}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 transition-all hover:scale-105"
                        data-testid="button-send-dm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // DM Conversation List
                <div className="flex flex-col h-full">
                  {/* New Conversation Selector */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <Select value={newDmRecipient} onValueChange={(value) => {
                      setNewDmRecipient(value);
                      setSelectedConversation(value);
                    }}>
                      <SelectTrigger className="bg-white dark:bg-gray-900 transition-all hover:border-amber-500" data-testid="select-dm-recipient">
                        <SelectValue placeholder="➕ Start a new conversation..." />
                      </SelectTrigger>
                      <SelectContent>
                        {orgMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.name}</span>
                              <Badge variant="outline" className="text-xs">{member.role}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conversations List */}
                  <ScrollArea className="flex-1">
                    {loadingConversations ? (
                      <div className="p-4 space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-full mb-4">
                          <Mail className="h-16 w-16 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No conversations yet</h3>
                        <p className="text-gray-600 dark:text-gray-400">Select someone above to start chatting</p>
                      </div>
                    ) : (
                      <div className="p-4 space-y-2">
                        {conversations.map((conv) => (
                          <button
                            key={conv.participantId}
                            onClick={() => setSelectedConversation(conv.participantId)}
                            className={cn(
                              "w-full p-4 rounded-xl text-left transition-all border",
                              "hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50",
                              "dark:hover:from-amber-900/20 dark:hover:to-orange-900/20",
                              "hover:border-amber-200 dark:hover:border-amber-800",
                              "hover:scale-[1.02] hover:shadow-md",
                              conv.unreadCount > 0 
                                ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 ring-2 ring-amber-200 dark:ring-amber-800"
                                : "border-transparent"
                            )}
                            data-testid={`conversation-${conv.participantId}`}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12 ring-2 ring-amber-200 dark:ring-amber-800">
                                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-semibold">
                                  {getUserInitials(conv.participantName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className={cn(
                                    "font-semibold truncate",
                                    conv.unreadCount > 0 
                                      ? "text-gray-900 dark:text-white" 
                                      : "text-gray-700 dark:text-gray-300"
                                  )}>
                                    {conv.participantName}
                                  </span>
                                  {conv.unreadCount > 0 && (
                                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white animate-pulse">
                                      {conv.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                <p className={cn(
                                  "text-sm truncate",
                                  conv.unreadCount > 0
                                    ? "text-gray-900 dark:text-white font-medium"
                                    : "text-gray-600 dark:text-gray-400"
                                )}>
                                  {conv.lastMessage}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  {formatMessageTime(conv.lastMessageAt)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
