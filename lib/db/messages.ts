import { supabase } from "@/lib/supabase"
import { Message } from "@/lib/local-chat"
import { getLocalPublicKey } from "@/lib/crypto"
import { getOrCreateConversationId } from "@/lib/db/chat"

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function mapRowToMessage(row: any): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: "unknown",
    content: row.content,
    encryptedData: row.encrypted_data,
    timestamp: new Date(row.created_at).getTime(),
    isRead: row.is_read
  }
}

export async function fetchUserPublicKey(userId: string): Promise<string | null> {
  const normalizedUserId = userId.toLowerCase()
  if (!hasSupabaseConfig()) return getLocalPublicKey(normalizedUserId)
  const { data } = await supabase
    .from("user_keys")
    .select("public_key")
    .eq("user_id", normalizedUserId)
    .maybeSingle()
  return data?.public_key || getLocalPublicKey(normalizedUserId)
}

export async function upsertUserPublicKey(userId: string, publicKey: string): Promise<void> {
  if (!hasSupabaseConfig()) return
  const normalizedUserId = userId.toLowerCase()
  const { data } = await supabase.auth.getSession()
  if (!data.session) return
  await supabase
    .from("user_keys")
    .upsert({ user_id: normalizedUserId, public_key: publicKey }, { onConflict: "user_id" })
}

export async function fetchMessagesDb(userId: string, contactId: string): Promise<Message[]> {
  if (!hasSupabaseConfig()) return []
  const normalizedUserId = userId.toLowerCase()
  const normalizedContactId = contactId.toLowerCase()
  const conversationId = await getOrCreateConversationId(normalizedUserId, normalizedContactId)
  if (!conversationId) return []

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching messages:", error)
    return []
  }

  return (data || []).map(row => ({
    ...mapRowToMessage(row),
    receiverId: row.sender_id === normalizedUserId ? normalizedContactId : normalizedUserId
  }))
}

export async function sendMessageDb(senderId: string, receiverId: string, encryptedData: string | null): Promise<Message | null> {
  if (!hasSupabaseConfig()) return null
  const normalizedSenderId = senderId.toLowerCase()
  const normalizedReceiverId = receiverId.toLowerCase()
  const conversationId = await getOrCreateConversationId(normalizedSenderId, normalizedReceiverId)
  if (!conversationId) return null

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: normalizedSenderId,
      content: null,
      encrypted_data: encryptedData,
      is_read: false
    })
    .select()
    .single()

  if (error) {
    console.error("Error sending message:", error)
    return null
  }

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId)

  return {
    ...mapRowToMessage(data),
    receiverId: normalizedReceiverId
  }
}

export async function markAsReadDb(userId: string, contactId: string) {
  if (!hasSupabaseConfig()) return
  const normalizedUserId = userId.toLowerCase()
  const normalizedContactId = contactId.toLowerCase()
  const conversationId = await getOrCreateConversationId(normalizedUserId, normalizedContactId)
  if (!conversationId) return

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", normalizedUserId)
    .eq("is_read", false)

  if (error) {
    console.error("Error marking messages as read:", error)
  }
}
