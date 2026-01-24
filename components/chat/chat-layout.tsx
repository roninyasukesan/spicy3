"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { localGetUser, getModelProfile, getUsers } from "@/lib/local-auth";
import { type Conversation, type Message } from "@/lib/local-chat";
import { fetchConversationsService, fetchMessagesService, sendMessageService, markAsReadService } from "@/lib/chat-service";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User as UserIcon, MoreVertical, Phone, Video, ChevronLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

import { VideoCallModal } from "./video-call-modal";
import { SubscriptionModal } from "@/components/subscription-modal";
import { useToast } from "@/hooks/use-toast";

export function ChatLayout({ mode = "full" }: { mode?: "full" | "floating" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialContactId = searchParams.get("contactId") ?? searchParams.get("modelId");
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialContactId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Call States
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callMode, setCallMode] = useState<"video" | "audio">("video");
  const [incomingCall, setIncomingCall] = useState<any>(null);

  // Listen for incoming calls
  useEffect(() => {
    if (!currentUser) return;
    const bc = new BroadcastChannel("spicy_signaling");
    bc.onmessage = (event) => {
      const data = event.data;
      if (data.type === "offer" && data.target === currentUser.email) {
        setIncomingCall(data);
        // Na prática, poderiamos inferir o modo da chamada, mas vamos padronizar video
        setCallMode("video"); 
        setIsCallModalOpen(true);
      }
    };
    return () => bc.close();
  }, [currentUser]);

  // Sync activeConversationId with URL search params
  useEffect(() => {
    if (initialContactId) {
      setActiveConversationId(initialContactId);
    }
  }, [initialContactId]);

  // Initial Load
  useEffect(() => {
    const user = localGetUser();
    if (!user) {
      // Redirect to login if not authenticated (or handle gracefully)
      // router.push("/login");
      return;
    }
    setCurrentUser(user);
    const userId = user.id || user.email;
    loadConversations(userId);
    const handleAuthChange = () => {
      const nextUser = localGetUser();
      if (!nextUser) return;
      setCurrentUser(nextUser);
      const nextId = nextUser.id || nextUser.email;
      loadConversations(nextId);
      if (activeConversationId) {
        loadMessages(nextId, activeConversationId);
      }
    };
    
    // Listen for storage events (multi-tab sync) and BroadcastChannel
    const handleStorage = () => {
      loadConversations(userId);
      if (activeConversationId) {
        loadMessages(userId, activeConversationId);
      }
    };
    
    window.addEventListener("storage", handleStorage);
    window.addEventListener("spicy-auth-change", handleAuthChange);
    
    // BroadcastChannel for more reliable sync
    const bc = new BroadcastChannel("spicy_chat_updates");
    bc.onmessage = (event) => {
      if (event.data.type === "update") {
        handleStorage();
      }
    };

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("spicy-auth-change", handleAuthChange);
      bc.close();
    };
  }, [activeConversationId]);

  // Poll for new messages (simulate real-time)
  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.id || currentUser.email;
    const interval = setInterval(() => {
      loadConversations(userId);
      if (activeConversationId) {
        loadMessages(userId, activeConversationId);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentUser, activeConversationId]);

  // Load Messages when active conversation changes
  useEffect(() => {
    if (currentUser && activeConversationId) {
      const userId = currentUser.id || currentUser.email;
      loadMessages(userId, activeConversationId);
      markAsReadService(userId, activeConversationId);
      // Refresh conversations to update unread count
      loadConversations(userId);
    }
  }, [activeConversationId, currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversations = async (userId: string) => {
    try {
      const convs = await fetchConversationsService(userId);
      setConversations(convs);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
    
    // If we have an initialContactId but no conversation yet, we might need to "fake" one in the UI
    // or just let the user send the first message to create it.
  };

  const loadMessages = async (userId: string, contactId: string) => {
    try {
      const msgs = await fetchMessagesService(userId, contactId);
      setMessages(msgs);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages([]);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !currentUser || !activeConversationId) return;
    if (!hasChatAccess) {
      setShowSubscriptionModal(true);
      toast({
        title: "Assinatura necessária",
        description: "Assine VIP para enviar mensagens.",
        variant: "destructive",
      });
      return;
    }

    const userId = currentUser.id || currentUser.email;
    try {
      await sendMessageService(userId, activeConversationId, newMessage);
      setNewMessage("");
      loadMessages(userId, activeConversationId);
      loadConversations(userId);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // If initialContactId is provided but not in conversations list, we should probably select it
  // This allows starting a chat with a new person
  const resolveParticipant = (id: string) => {
    const existing = conversations.find(c => c.participantId === id);
    if (existing) return existing;

    // Try to find profile
    const model = getModelProfile(id);
    if (model) return { 
      participantId: id, 
      participantName: model.artisticName, 
      participantImage: model.photos?.[0] || model.coverImage || "/placeholder.svg" 
    };
    
    const users = getUsers();
    const user = users.find(u => u.email === id);
    if (user) return { 
      participantId: id, 
      participantName: user.name, 
      participantImage: "/placeholder.svg" 
    };

    return { 
      participantId: id, 
      participantName: id, 
      participantImage: "/placeholder.svg" 
    };
  };

  const activeParticipant = activeConversationId ? resolveParticipant(activeConversationId) : null;
  const newParticipant = initialContactId ? resolveParticipant(initialContactId) : null;
  const hasChatAccess = currentUser?.role !== "cliente" || currentUser?.plan === "vip" || currentUser?.subscribedModelIds?.includes(activeConversationId || "");

  const handleBack = () => {
    if (!currentUser) {
      router.push("/");
      return;
    }
    
    if (currentUser.role === "admin") router.push("/dashboard/admin");
    else if (currentUser.role === "modelo") router.push("/dashboard/modelo");
    else if (currentUser.role === "cliente") router.push("/dashboard/cliente");
    else router.push("/");
  };

  if (!currentUser) return <div className="p-8 text-white">Carregando...</div>;

  const isFloating = mode === "floating";

  return (
    <div className="flex h-full bg-dark-950 border border-gray-800 rounded-lg overflow-hidden relative">
      {/* Sidebar - Conversations List */}
      <div className={cn(
        "bg-dark-900 flex flex-col h-full",
        !isFloating && "w-full md:w-80 border-r border-gray-800 shrink-0",
        activeConversationId ? (isFloating ? "hidden" : "hidden md:flex") : "flex w-full"
      )}>
        <div className="p-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            {!isFloating && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="-ml-2 text-gray-400 hover:text-white shrink-0" 
                onClick={handleBack}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white">Mensagens</h2>
              {currentUser && (
                <p className="text-xs text-gray-500 truncate" title={currentUser.email}>
                  {currentUser.email}
                </p>
              )}
            </div>
          </div>
          <Input placeholder="Buscar conversas..." className="bg-dark-800 border-gray-700" />
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {conversations.length === 0 && !initialContactId && (
              <div className="p-8 text-center text-gray-500">
                Nenhuma conversa ainda.
              </div>
            )}
            
            {/* If starting new chat that doesn't exist yet */}
            {initialContactId && !conversations.find(c => c.participantId === initialContactId) && (
               <button
               onClick={() => setActiveConversationId(initialContactId)}
               className={cn(
                 "flex items-center gap-3 p-4 hover:bg-dark-800 transition-colors text-left border-b border-gray-800/50",
                 activeConversationId === initialContactId ? "bg-dark-800" : ""
               )}
             >
               <Avatar>
                 <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
               </Avatar>
               <div className="flex-1 overflow-hidden">
                 <div className="flex justify-between items-center mb-1">
                   <span className="font-medium text-white truncate">{initialContactId}</span>
                   <span className="text-xs text-gray-500">Novo</span>
                 </div>
                 <p className="text-sm text-gray-400 truncate">Iniciar conversa...</p>
               </div>
             </button>
            )}

            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversationId(conv.participantId)}
                className={cn(
                  "flex items-center gap-3 p-4 hover:bg-dark-800 transition-colors text-left border-b border-gray-800/50",
                  activeConversationId === conv.participantId ? "bg-dark-800" : ""
                )}
              >
                <Avatar>
                  <AvatarImage src={conv.participantImage} />
                  <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-white truncate">{conv.participantName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(conv.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className={cn("text-sm truncate", conv.unreadCount > 0 ? "text-white font-semibold" : "text-gray-400")}>
                    {conv.lastMessage}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {conv.unreadCount}
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-dark-950 h-full min-w-0",
        !activeConversationId ? "hidden md:flex" : "flex"
      )}>
        {activeConversationId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-dark-900 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("text-gray-400 -ml-2 mr-2 hover:text-white hover:bg-dark-800", "md:hidden flex shrink-0")} 
                  onClick={() => setActiveConversationId(null)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Avatar className="shrink-0">
                  <AvatarImage src={activeParticipant?.participantImage} />
                  <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white truncate">{activeParticipant?.participantName || activeConversationId}</h3>
                  <p className="text-xs text-green-500 flex items-center gap-1 truncate">
                    <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span> Online agora
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-white"
                  onClick={() => {
                    setCallMode("audio");
                    setIncomingCall(null);
                    setIsCallModalOpen(true);
                  }}
                >
                  <Phone className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-white"
                  onClick={() => {
                    setCallMode("video");
                    setIncomingCall(null);
                    setIsCallModalOpen(true);
                  }}
                >
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative" ref={scrollRef}>
              {messages.length === 0 && (
                 <div className="text-center text-gray-500 mt-10">
                   <p>Inicie a conversa com {activeParticipant?.participantName}</p>
                   <p className="text-sm">Envie um "Olá" para começar.</p>
                 </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.senderId === currentUser.email;
                return (
                  <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] md:max-w-[70%] rounded-2xl p-3 text-sm shadow-sm overflow-hidden",
                      isMe ? "bg-primary-600 text-white rounded-br-none" : "bg-dark-800 text-gray-200 rounded-bl-none"
                    )}>
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                      <p className={cn("text-[10px] mt-1 text-right", isMe ? "text-primary-200" : "text-gray-500")}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {isMe && (
                           <span className="ml-1">{msg.isRead ? "✓✓" : "✓"}</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
              {!hasChatAccess && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="text-center text-white space-y-2 px-6">
                    <p className="text-lg font-semibold">Chat VIP</p>
                    <p className="text-sm text-gray-300">Assine VIP para acessar mensagens.</p>
                    <Button onClick={() => setShowSubscriptionModal(true)} className="bg-primary-600 hover:bg-primary-700">
                      Assinar VIP
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-dark-900 border-t border-gray-800">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..." 
                  className="bg-dark-800 border-gray-700 text-white"
                  disabled={!hasChatAccess}
                />
                <Button type="submit" className="bg-primary-600 hover:bg-primary-700" disabled={!newMessage.trim() || !hasChatAccess}>
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
            <div className="bg-dark-800 p-6 rounded-full mb-4">
              <Send className="h-12 w-12 text-primary-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Suas Mensagens</h3>
            <p className="max-w-md text-center">
              Selecione uma conversa ao lado para visualizar ou inicie um novo chat através do perfil de uma modelo.
            </p>
          </div>
        )}
      </div>
      
      {isCallModalOpen && currentUser && (
        <VideoCallModal 
          currentUser={currentUser}
          activeContact={activeParticipant ? {
            id: activeParticipant.participantId,
            name: activeParticipant.participantName,
            image: activeParticipant.participantImage
          } : null}
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          isIncoming={!!incomingCall}
          incomingCallData={incomingCall}
          mode={callMode}
        />
      )}
      {activeConversationId && (
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          modelName={activeParticipant?.participantName || activeConversationId}
          modelId={activeConversationId}
          onSuccess={() => setShowSubscriptionModal(false)}
        />
      )}
    </div>
  );
}
