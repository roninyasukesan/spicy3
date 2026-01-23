export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  isRead: boolean;
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

// Helper to get current user (mocked or from local-auth)
import { localGetUser, getModelProfile, getUsers, getAllLocalProfiles } from './local-auth';

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function sendMessage(senderId: string, receiverId: string, content: string): Message {
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
    content,
    timestamp: Date.now(),
    isRead: false,
  };

  messages.push(newMessage);
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  
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
      lastMessage: lastMsg.content,
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
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    notifyChatUpdate();
  }
}
