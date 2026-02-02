"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { localGetUser, getModelProfile, getUsers } from "@/lib/local-auth";
import { type Conversation, type Message } from "@/lib/local-chat";
import { fetchConversationsService, fetchMessagesService, sendMessageService, markAsReadService } from "@/lib/chat-service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User as UserIcon, MoreVertical, Phone, Video, ChevronLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

import { VideoCallModal } from "./video-call-modal";
import { SubscriptionModal } from "@/components/subscription-modal";
import { useToast } from "@/hooks/use-toast";
import { ChatMessages } from "./chat-messages";
import { supabase } from "@/lib/supabase";
import { getOrCreateKeyPair } from "@/lib/crypto";
import { upsertUserPublicKey } from "@/lib/db/messages";
import { getOrCreateConversationId } from "@/lib/db/chat";

export default function ChatLayout({ mode = "full" }: { mode?: "full" | "floating" }) {
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
  const [isCallActive, setIsCallActive] = useState(false);

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
    const userId = (user.id || user.email).toLowerCase();
    loadConversations(userId);
    const handleAuthChange = () => {
      const nextUser = localGetUser();
      if (!nextUser) return;
      setCurrentUser(nextUser);
      const nextId = (nextUser.id || nextUser.email).toLowerCase();
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
    const userId = (currentUser.id || currentUser.email).toLowerCase();
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
      const userId = (currentUser.id || currentUser.email).toLowerCase();
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

    const userId = (currentUser.id || currentUser.email).toLowerCase();
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
  const currentUserId = currentUser?.id || currentUser?.email;
  const normalizedCurrentUserId = currentUserId ? currentUserId.toLowerCase() : null;

  useEffect(() => {
    if (!normalizedCurrentUserId) return;
    const run = async () => {
      const keys = await getOrCreateKeyPair(normalizedCurrentUserId);
      await upsertUserPublicKey(normalizedCurrentUserId, keys.publicKey);
    };
    run();
  }, [normalizedCurrentUserId]);

  useEffect(() => {
    if (!normalizedCurrentUserId || !activeConversationId) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let active = true;

    const setup = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session || !active) return;
      const conversationId = await getOrCreateConversationId(normalizedCurrentUserId, activeConversationId);
      if (!conversationId || !active) return;

      channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
          (payload) => {
            const row = payload.new as any;
            const nextMessage: Message = {
              id: row.id,
              senderId: row.sender_id,
              receiverId: row.sender_id === normalizedCurrentUserId ? activeConversationId : normalizedCurrentUserId,
              content: row.content,
              encryptedData: row.encrypted_data,
              timestamp: new Date(row.created_at).getTime(),
              isRead: row.is_read
            };
            setMessages(prev => prev.some(msg => msg.id === nextMessage.id) ? prev : [...prev, nextMessage]);
          }
        )
        .subscribe();
    };

    setup();

    return () => {
      active = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [normalizedCurrentUserId, activeConversationId]);

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

  const isLoading = !currentUser;

  const isFloating = mode === "floating";

  return (
    <div className="flex h-full bg-dark-950 border border-gray-800 rounded-lg overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="text-white">Carregando...</div>
        </div>
      )}
      
      {isCallActive && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col">
          
          <div className="flex items-center justify-between p-4 bg-black/50 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {callMode === "video" ? "Chamada de Vídeo" : "Chamada de Áudio"}
                </h2>
                <p className="text-sm text-gray-300">
                  {activeParticipant?.participantName || "Em chamada..."}
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setIsCallActive(false);
                setIsCallModalOpen(false);
                setIncomingCall(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              ✕ Fechar
            </Button>
          </div>
          
          
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-4xl h-full bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-400">Área da chamada de vídeo</p>
                <p className="text-sm text-gray-500 mt-2">Chat disponível abaixo</p>
              </div>
            </div>
          </div>
        </div>
      )}

      
      <div className={cn(
        "flex h-full transition-all duration-300",
        isCallActive ? "mt-0 h-1/3 border-t border-gray-800" : ""
      )}>
        
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

      
      <div className={cn(
        "flex-1 flex flex-col bg-dark-950 h-full min-w-0",
        !activeConversationId ? "hidden md:flex" : "flex"
      )}>
        {activeConversationId ? (
          <div>
            
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

            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative" ref={scrollRef}>
              {messages.length === 0 && (
                 <div className="text-center text-gray-500 mt-10">
                   <p>Inicie a conversa com {activeParticipant?.participantName}</p>
                   <p className="text-sm">Envie um "Olá" para começar.</p>
                 </div>
              )}
              {normalizedCurrentUserId && <ChatMessages messages={messages} currentUserId={normalizedCurrentUserId} />}
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
          </div>
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
      
      
    </div>
  );
}
