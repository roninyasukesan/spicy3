
import { Message, Conversation, getMessages, getConversations, sendMessage, markAsRead, prepareEncryptedMessage } from "./local-chat";
import { fetchConversationsDb } from "./db/chat";
import { fetchMessagesDb, sendMessageDb, markAsReadDb } from "./db/messages";
import { supabase } from "./supabase";

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Check if current user is a Supabase user (by checking ID format or source)
// For simplicity, we assume if we are connected to Supabase and the user has a UUID-like ID (or just we are in that mode), we use DB.
// But we can also pass the 'isSupabase' flag.
// Actually, the best way is to check if the current session exists in Supabase client.
async function isSupabaseSession(): Promise<boolean> {
  if (!hasSupabaseConfig()) return false;
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function fetchConversationsService(userId: string): Promise<Conversation[]> {
  const isDb = await isSupabaseSession();
  if (isDb) {
    return fetchConversationsDb(userId);
  }
  return getConversations(userId);
}

export async function fetchMessagesService(userId: string, contactId: string): Promise<Message[]> {
  const isDb = await isSupabaseSession();
  if (isDb) {
    return fetchMessagesDb(userId, contactId);
  }
  return getMessages(userId, contactId);
}

export async function sendMessageService(senderId: string, receiverId: string, content: string): Promise<Message | null> {
  const encryptedData = await prepareEncryptedMessage(senderId, receiverId, content);
  const isDb = await isSupabaseSession();
  if (isDb) {
    return sendMessageDb(senderId, receiverId, encryptedData);
  }
  return sendMessage(senderId, receiverId, encryptedData);
}

export async function markAsReadService(userId: string, contactId: string): Promise<void> {
  const isDb = await isSupabaseSession();
  if (isDb) {
    return markAsReadDb(userId, contactId);
  }
  return markAsRead(userId, contactId);
}
