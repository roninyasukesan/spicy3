import { supabase } from "./supabase";
import { getOrCreateKeyPair, importPublicKey, deriveSharedKey, encryptMessage, getLocalPublicKey } from "./crypto";
import { getModelProfile, getUsers, getAllLocalProfiles, localGetUser } from './local-auth';

export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content?: string | null;
  encryptedData?: string | null;
  timestamp: number;
  isRead: boolean;
};

export type MessageLimit = {
  contactId: string;
  count: number;
  date: string; // YYYY-MM-DD
};

export type Conversation = {
  id: string;
  participantId: string; // The "other" person
  participantName: string;
  participantImage: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
};

const CHAT_STORAGE_KEY = 'spicy_chat_messages';
const CHAT_CHANNEL_NAME = 'spicy_chat_updates';

// Helper to notify other tabs/components about chat updates
function notifyChatUpdate() {
  if (typeof window === 'undefined') return;
  const bc = new BroadcastChannel(CHAT_CHANNEL_NAME);
  bc.postMessage({ type: 'update' });
  bc.close();
  // Also dispatch local event for same-window updates
  window.dispatchEvent(new Event('storage'));
}

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function upsertUserKey(userId: string, publicKey: string) {
  if (!hasSupabaseConfig()) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  await supabase
    .from("user_keys")
    .upsert({ user_id: userId, public_key: publicKey }, { onConflict: "user_id" });
}

async function fetchUserPublicKey(userId: string): Promise<string | null> {
  if (!hasSupabaseConfig()) return getLocalPublicKey(userId);
  const { data } = await supabase
    .from("user_keys")
    .select("public_key")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.public_key || getLocalPublicKey(userId);
}

export async function prepareEncryptedMessage(senderId: string, receiverId: string, content: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const normalizedSenderId = senderId.toLowerCase();
  const normalizedReceiverId = receiverId.toLowerCase();
  const keys = await getOrCreateKeyPair(normalizedSenderId);
  await upsertUserKey(normalizedSenderId, keys.publicKey);
  const recipientKey = await fetchUserPublicKey(normalizedReceiverId);
  if (!recipientKey) return null;
  const recipientPublicKey = await importPublicKey(recipientKey);
  const sharedKey = await deriveSharedKey(keys.privateKey, recipientPublicKey);
  const payload = await encryptMessage(sharedKey, content);
  return JSON.stringify(payload);
}

export function sendMessage(senderId: string, receiverId: string, encryptedData: string | null): Message {
  if (typeof window === 'undefined') return {} as Message;

  // Normalize IDs to lowercase to avoid case mismatch
  const normalizedSenderId = senderId.toLowerCase();
  const normalizedReceiverId = receiverId.toLowerCase();

  const messagesRaw = localStorage.getItem(CHAT_STORAGE_KEY);
  const messages: Message[] = messagesRaw ? JSON.parse(messagesRaw) : [];

  const newMessage: Message = {
    id: generateId(),
    senderId: normalizedSenderId,
    receiverId: normalizedReceiverId,
    content: null,
    encryptedData: encryptedData || null,
    timestamp: Date.now(),
    isRead: false,
  };

  messages.push(newMessage);
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error("Failed to save chat messages to localStorage:", error);
  }
  
  notifyChatUpdate();
  
  return newMessage;
}

export function getMessages(userId: string, contactId: string): Message[] {
  if (typeof window === 'undefined') return [];
  
  // Normalize IDs
  const normalizedUserId = userId.toLowerCase();
  const normalizedContactId = contactId.toLowerCase();

  const messagesRaw = localStorage.getItem(CHAT_STORAGE_KEY);
  const messages: Message[] = messagesRaw ? JSON.parse(messagesRaw) : [];

  const filtered = messages
    .filter(m => 
      (m.senderId === normalizedUserId && m.receiverId === normalizedContactId) ||
      (m.senderId === normalizedContactId && m.receiverId === normalizedUserId)
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  return filtered;
}

export function getConversations(currentUserId: string): Conversation[] {
  if (typeof window === 'undefined') return [];

  const normalizedCurrentUserId = currentUserId.toLowerCase();

  const messagesRaw = localStorage.getItem(CHAT_STORAGE_KEY);
  const messages: Message[] = messagesRaw ? JSON.parse(messagesRaw) : [];

  // Find all unique contacts
  const contactMap = new Map<string, Message>();
  
  messages.forEach(m => {
    // Ensure message IDs are also treated as lowercase just in case legacy data exists
    const mSender = m.senderId.toLowerCase();
    const mReceiver = m.receiverId.toLowerCase();

    if (mSender === normalizedCurrentUserId || mReceiver === normalizedCurrentUserId) {
      const otherId = mSender === normalizedCurrentUserId ? mReceiver : mSender;
      const existing = contactMap.get(otherId);
      if (!existing || m.timestamp > existing.timestamp) {
        contactMap.set(otherId, m);
      }
    }
  });

  // Need to fetch profile info for these contacts. 
  // In a real app, this would be a DB join. Here we'll try to get from local-auth or mocks.
  
  return Array.from(contactMap.entries()).map(([contactId, lastMsg]) => {
    // Try to find model profile by ID (email)
    let modelProfile = getModelProfile(contactId);
    
    // If not found by ID, try to find by artisticName (legacy/fuzzy match)
    if (!modelProfile) {
        const allProfiles = getAllLocalProfiles();
        modelProfile = allProfiles.find(p => p.artisticName === contactId || p.artisticName.toLowerCase() === contactId.toLowerCase()) || null;
    }

    // Try to find generic user
    const users = getUsers();
    const userProfile = users.find(u => u.email === contactId || u.name === contactId);

    // Default name strategy:
    // 1. If it looks like an email, truncate.
    // 2. If it doesn't contain '@', assume it's a name and use it directly.
    let name = contactId.includes('@') ? `Usuário ${contactId.split('@')[0]}` : contactId;
    let image = '/placeholder.svg';

    if (modelProfile) {
      name = modelProfile.artisticName;
      if (modelProfile.photos && modelProfile.photos.length > 0) {
        image = modelProfile.photos[0];
      } else if (modelProfile.coverImage) {
        image = modelProfile.coverImage;
      }
    } else if (userProfile) {
      name = userProfile.name;
    }

    return {
      id: contactId, // Using contactId as conversation ID for simplicity in this mock
      participantId: contactId,
      participantName: name,
      participantImage: image,
      lastMessage: lastMsg.content || (lastMsg.encryptedData ? "Mensagem protegida" : ""),
      lastMessageTime: lastMsg.timestamp,
      unreadCount: (lastMsg.senderId !== currentUserId && !lastMsg.isRead) ? 1 : 0
    };
  }).sort((a, b) => b.lastMessageTime - a.lastMessageTime);
}

export function markAsRead(userId: string, contactId: string) {
  if (typeof window === 'undefined') return;

  const messagesRaw = localStorage.getItem(CHAT_STORAGE_KEY);
  let messages: Message[] = messagesRaw ? JSON.parse(messagesRaw) : [];
  
  let changed = false;
  messages = messages.map(m => {
    if (m.senderId === contactId && m.receiverId === userId && !m.isRead) {
      changed = true;
      return { ...m, isRead: true };
    }
    return m;
  });

  if (changed) {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save chat messages to localStorage:", error);
    }
    notifyChatUpdate();
  }
}

// ==================== LIMITE ANTI-SPAM ====================

const MESSAGE_LIMITS_KEY = 'spicy_message_limits';
const FREE_PLAN_DAILY_LIMIT = 10;

/**
 * Obtém a data atual no formato YYYY-MM-DD
 */
function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Obtém os limites de mensagem do localStorage
 */
function getMessageLimits(userId: string): MessageLimit[] {
  if (typeof window === 'undefined') return [];
  
  const key = `${MESSAGE_LIMITS_KEY}_${userId.toLowerCase()}`;
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  
  try {
    return JSON.parse(raw) as MessageLimit[];
  } catch {
    return [];
  }
}

/**
 * Salva os limites de mensagem no localStorage
 */
function saveMessageLimits(userId: string, limits: MessageLimit[]) {
  if (typeof window === 'undefined') return;
  
  const key = `${MESSAGE_LIMITS_KEY}_${userId.toLowerCase()}`;
  try {
    localStorage.setItem(key, JSON.stringify(limits));
  } catch (error) {
    console.error("Failed to save message limits to localStorage:", error);
  }
}

/**
 * Incrementa o contador de mensagens para um contato específico
 */
function incrementMessageCount(userId: string, contactId: string) {
  const today = getTodayString();
  const limits = getMessageLimits(userId);
  
  const normalizedContactId = contactId.toLowerCase();
  const existingLimit = limits.find(l => l.contactId === normalizedContactId && l.date === today);
  
  if (existingLimit) {
    existingLimit.count++;
  } else {
    // Remove limites de dias anteriores para este contato
    const filteredLimits = limits.filter(l => l.contactId !== normalizedContactId || l.date === today);
    filteredLimits.push({
      contactId: normalizedContactId,
      count: 1,
      date: today
    });
    saveMessageLimits(userId, filteredLimits);
    return;
  }
  
  saveMessageLimits(userId, limits);
}

/**
 * Obtém o número de mensagens enviadas hoje para um contato
 */
function getMessagesCountToday(userId: string, contactId: string): number {
  const today = getTodayString();
  const limits = getMessageLimits(userId);
  
  const normalizedContactId = contactId.toLowerCase();
  const limit = limits.find(l => l.contactId === normalizedContactId && l.date === today);
  
  return limit ? limit.count : 0;
}

/**
 * Verifica se o usuário pode enviar mais mensagens para um contato
 * @returns { canSend: boolean, remaining: number, limit: number }
 */
export function canSendMessage(userId: string, contactId: string): { 
  canSend: boolean; 
  remaining: number; 
  limit: number;
  isVip: boolean;
} {
  const user = localGetUser();
  
  // Usuários VIP não têm limite
  if (user?.plan === "vip") {
    return {
      canSend: true,
      remaining: Infinity,
      limit: Infinity,
      isVip: true
    };
  }
  
  // Usuários free têm limite diário
  const sentToday = getMessagesCountToday(userId, contactId);
  const remaining = Math.max(0, FREE_PLAN_DAILY_LIMIT - sentToday);
  
  return {
    canSend: remaining > 0,
    remaining,
    limit: FREE_PLAN_DAILY_LIMIT,
    isVip: false
  };
}

/**
 * Obtém o número de mensagens restantes para hoje
 */
export function getRemainingMessages(userId: string, contactId: string): number {
  const result = canSendMessage(userId, contactId);
  return result.remaining;
}

/**
 * Versão estendida do sendMessage que respeita os limites
 */
export function sendMessageWithLimit(senderId: string, receiverId: string, encryptedData: string | null): {
  success: boolean;
  message?: Message;
  error?: string;
  limitInfo?: { remaining: number; limit: number };
} {
  // Verifica se pode enviar
  const limitCheck = canSendMessage(senderId, receiverId);
  
  if (!limitCheck.canSend) {
    return {
      success: false,
      error: `Limite diário atingido. Você pode enviar apenas ${limitCheck.limit} mensagens por dia para cada contato no plano gratuito. Faça upgrade para VIP para mensagens ilimitadas.`,
      limitInfo: {
        remaining: limitCheck.remaining,
        limit: limitCheck.limit
      }
    };
  }
  
  // Envia a mensagem
  const message = sendMessage(senderId, receiverId, encryptedData);
  
  // Incrementa o contador
  incrementMessageCount(senderId, receiverId);
  
  return {
    success: true,
    message,
    limitInfo: {
      remaining: limitCheck.remaining - 1,
      limit: limitCheck.limit
    }
  };
}