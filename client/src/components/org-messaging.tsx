import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Hash,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  Mail,
  ArrowLeft,
} from "lucide-react";

interface Message {
  id: number;
  orgId: number;
  senderId: string;
  recipientId?: string;
  messageType: 'community' | 'dm';
  content: string;
  attachments?: any;
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

interface OrgMessagingProps {
  userType: 'org_owner' | 'coach' | 'org_client';
  orgId?: number;
  className?: string;
  embedded?: boolean;
}

export function OrgMessaging({ userType, orgId, className, embedded = false }: OrgMessagingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState("");
  const [activeTab, setActiveTab] = useState<'community' | 'dm'>('community');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newDmRecipient, setNewDmRecipient] = useState<string>("");

  // Get organization ID from prop or user context
  const organizationId = orgId || (user as any)?.currentOrgId || (user as any)?.organizationId;
  const userId = user?.id;
  const userName = `${user?.firstName} ${user?.lastName}`;

  // Everyone can now send messages!
  const canSendMessages = true;

  // Fetch community messages
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['/api/organizations', organizationId, 'messages', 'community'],
    queryFn: async () => {
      const response = await apiRequest(
        `/api/organizations/${organizationId}/messages?messageType=community&limit=100`,
        'GET'
      );
      return response.messages || [];
    },
    enabled: !!organizationId && activeTab === 'community',
    refetchInterval: 5000
  });

  // Fetch DM conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/organizations', organizationId, 'messages', 'dm'],
    queryFn: async () => {
      const response = await apiRequest(
        `/api/organizations/${organizationId}/messages/dm`,
        'GET'
      );
      return response.conversations || [];
    },
    enabled: !!organizationId && activeTab === 'dm',
    refetchInterval: 5000
  });

  // Fetch DM thread with selected participant
  const { data: dmMessages = [], isLoading: loadingDmThread } = useQuery({
    queryKey: ['/api/organizations', organizationId, 'messages', 'dm', selectedConversation],
    queryFn: async () => {
      const response = await apiRequest(
        `/api/organizations/${organizationId}/messages/dm/${selectedConversation}`,
        'GET'
      );
      return response.messages || [];
    },
    enabled: !!organizationId && !!selectedConversation,
    refetchInterval: 3000
  });

  // Fetch organization members for DM recipient selection
  const { data: orgMembers = [] } = useQuery<OrgMember[]>({
    queryKey: ['/api/organizations', organizationId, 'members'],
    queryFn: async () => {
      const response = await apiRequest(
        `/api/organizations/${organizationId}/members`,
        'GET'
      );
      return (response.members || []).filter((m: OrgMember) => m.id !== userId);
    },
    enabled: !!organizationId && activeTab === 'dm'
  });

  // Send community message mutation
  const sendCommunityMessageMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      return apiRequest(`/api/organizations/${organizationId}/messages`, 'POST', data);
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ 
        queryKey: ['/api/organizations', organizationId, 'messages', 'community'] 
      });
      scrollToBottom();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Send DM mutation
  const sendDmMutation = useMutation({
    mutationFn: async (data: { recipientId: string; recipientType: string; content: string }) => {
      return apiRequest(`/api/organizations/${organizationId}/messages/dm`, 'POST', data);
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ 
        queryKey: ['/api/organizations', organizationId, 'messages', 'dm'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/organizations', organizationId, 'messages', 'dm', selectedConversation] 
      });
      scrollToBottom();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageIds: number[]) => {
      return apiRequest(`/api/organizations/${organizationId}/messages/read`, 'PATCH', { messageIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/organizations', organizationId, 'messages', 'dm'] 
      });
    }
  });

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, dmMessages]);

  // Mark DM messages as read when conversation is opened
  useEffect(() => {
    if (selectedConversation && dmMessages.length > 0) {
      // Find unread messages sent TO the current user
      const unreadMessages = dmMessages.filter(
        (msg: Message) => !msg.isRead && msg.recipientId === userId
      );
      
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map((msg: Message) => msg.id);
        markAsReadMutation.mutate(messageIds);
      }
    }
  }, [selectedConversation, dmMessages, userId]);

  // Format message timestamp
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

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle sending community message
  const handleSendCommunityMessage = () => {
    if (!messageInput.trim()) return;
    sendCommunityMessageMutation.mutate({ content: messageInput });
  };

  // Handle sending DM
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

  // Render community tab
  const renderCommunityTab = () => (
    <div className="flex flex-col h-full">
      {/* Community Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Hash className="h-6 w-6 text-primary" />
          <div>
            <h3 className="font-semibold text-lg">Community</h3>
            <p className="text-xs text-gray-500">
              Share updates and announcements with your organization
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 min-h-0 p-6">
        {loadingMessages ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
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
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-8">
            <MessageSquare className="h-16 w-16 mb-4 text-gray-400" />
            <p className="text-xl font-medium">No messages yet</p>
            <p className="text-sm mt-2">
              Start the conversation by posting a message below
            </p>
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
                    "flex items-start gap-3",
                    isOwnMessage && "flex-row-reverse"
                  )}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {getUserInitials(senderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "flex-1 space-y-1",
                    isOwnMessage && "items-end"
                  )}>
                    <div className={cn(
                      "flex items-center gap-2",
                      isOwnMessage && "justify-end"
                    )}>
                      <span className="font-medium text-sm">{senderName}</span>
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(message.createdAt)}
                      </span>
                      {isOwnMessage && (
                        message.isRead 
                          ? <CheckCircle2 className="h-3 w-3 text-blue-500" />
                          : <Clock className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <div className={cn(
                      "rounded-lg px-4 py-2 max-w-2xl",
                      isOwnMessage 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t p-4 bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="flex gap-2">
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
            className="flex-1"
            data-testid="input-community-message"
          />
          <Button 
            onClick={handleSendCommunityMessage}
            disabled={!messageInput.trim() || sendCommunityMessageMutation.isPending}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Render DM conversation list
  const renderDmConversationList = () => (
    <div className="flex flex-col h-full">
      {/* DM Header */}
      <div className="border-b px-6 py-4 bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">Direct Messages</h3>
              <p className="text-xs text-gray-500">Private conversations</p>
            </div>
          </div>
        </div>
      </div>

      {/* New DM Section */}
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
        <div className="flex gap-2">
          <Select value={newDmRecipient} onValueChange={(value) => {
            setNewDmRecipient(value);
            setSelectedConversation(value);
          }}>
            <SelectTrigger className="flex-1" data-testid="select-dm-recipient">
              <SelectValue placeholder="Start a new conversation..." />
            </SelectTrigger>
            <SelectContent>
              {orgMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 min-h-0">
        {loadingConversations ? (
          <div className="p-4 space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
            <Mail className="h-16 w-16 mb-4 text-gray-400" />
            <p className="text-lg font-medium">No conversations yet</p>
            <p className="text-sm mt-2">Select someone above to start chatting</p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conv) => (
              <button
                key={conv.participantId}
                onClick={() => setSelectedConversation(conv.participantId)}
                className={cn(
                  "w-full p-4 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                  selectedConversation === conv.participantId && "bg-gray-100 dark:bg-gray-800"
                )}
                data-testid={`conversation-${conv.participantId}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(conv.participantName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm truncate">{conv.participantName}</span>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="ml-2">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatMessageTime(conv.lastMessageAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // Render DM thread
  const renderDmThread = () => {
    const participant = conversations.find(c => c.participantId === selectedConversation) ||
                        orgMembers.find(m => m.id === selectedConversation);
    const participantName = participant && 'participantName' in participant 
      ? participant.participantName 
      : participant && 'name' in participant 
      ? participant.name 
      : 'Unknown';

    return (
      <div className="flex flex-col h-full">
        {/* DM Thread Header */}
        <div className="border-b px-6 py-4 flex items-center gap-3 bg-white dark:bg-gray-900 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedConversation(null)}
            data-testid="button-back-to-conversations"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getUserInitials(participantName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{participantName}</h3>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 min-h-0 p-6">
          {loadingDmThread ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : dmMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-8">
              <MessageSquare className="h-16 w-16 mb-4 text-gray-400" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm mt-2">Send a message to start the conversation</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dmMessages.map((message: Message) => {
                const isOwnMessage = message.senderId === userId;
                const senderName = isOwnMessage 
                  ? userName 
                  : message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : participantName;
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start gap-3",
                      isOwnMessage && "flex-row-reverse"
                    )}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(senderName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "flex-1 space-y-1 max-w-xs",
                      isOwnMessage && "items-end"
                    )}>
                      <div className={cn(
                        "rounded-lg px-4 py-2",
                        isOwnMessage 
                          ? "bg-primary text-primary-foreground ml-auto" 
                          : "bg-gray-100 dark:bg-gray-800"
                      )}>
                        <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 text-xs text-gray-500 px-1",
                        isOwnMessage && "justify-end"
                      )}>
                        <span>{formatMessageTime(message.createdAt)}</span>
                        {isOwnMessage && (
                          message.isRead 
                            ? <CheckCircle2 className="h-3 w-3 text-blue-500" />
                            : <Clock className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex gap-2">
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
              className="flex-1"
              data-testid="input-dm-message"
            />
            <Button 
              onClick={handleSendDm}
              disabled={!messageInput.trim() || sendDmMutation.isPending}
              data-testid="button-send-dm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Main content
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'community' | 'dm')} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="community" data-testid="tab-community">
            <Hash className="h-4 w-4 mr-2" />
            Community
          </TabsTrigger>
          <TabsTrigger value="dm" data-testid="tab-dm">
            <Mail className="h-4 w-4 mr-2" />
            Direct Messages
            {conversations.reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5">
                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="community" className="flex-1 mt-0">
          {renderCommunityTab()}
        </TabsContent>
        
        <TabsContent value="dm" className="flex-1 mt-0">
          {selectedConversation ? renderDmThread() : renderDmConversationList()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
