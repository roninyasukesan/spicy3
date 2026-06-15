
import { supabase } from "@/lib/supabase"
import { Message, Conversation } from "@/lib/local-chat"
import { getModelProfile, getUsers, getAllLocalProfiles } from "@/lib/local-auth"

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

type MessageRow = {
  id: string
  sender_id: string
  content: string | null
  encrypted_data: string | null
  created_at: string
  is_read: boolean
}

// Map Supabase row to Message
function mapRowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: 'unknown', // We need to infer this from context or fetch it
    content: row.content,
    encryptedData: row.encrypted_data,
    timestamp: new Date(row.created_at).getTime(),
    isRead: row.is_read
  }
}

export async function getOrCreateConversationId(userId: string, otherId: string): Promise<string | null> {
  // Check if conversation exists
  // We check both directions (A-B or B-A)
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(participant_a.eq.${userId},participant_b.eq.${otherId}),and(participant_a.eq.${otherId},participant_b.eq.${userId})`)
    .single()

  if (existing) return existing.id

  // Create new
  // Note: participant_a and participant_b order doesn't matter for uniqueness constraint if we check both ways,
  // but unique constraint is usually (participant_a, participant_b).
  // Ideally we sort them to ensure uniqueness, but the schema constraint 'unique(participant_a, participant_b)' 
  // only enforces one direction unless we have a check constraint or careful insertion.
  // For now, we just insert.
  
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({
      participant_a: userId,
      participant_b: otherId
    })
    .select('id')
    .single()

  if (error) {
    // If error is uniqueness violation, try fetching again (race condition)
    if (error.code === '23505') {
       const { data: retry } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_a.eq.${userId},participant_b.eq.${otherId}),and(participant_a.eq.${otherId},participant_b.eq.${userId})`)
        .single()
       return retry?.id || null
    }
    console.error('Error creating conversation:', error)
    return null
  }

  return newConv.id
}

export async function fetchMessages(userId: string, contactId: string): Promise<Message[]> {
  if (!hasSupabaseConfig()) return []
  
  const conversationId = await getOrCreateConversationId(userId, contactId)
  if (!conversationId) return []

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return (data || []).map((row: MessageRow) => ({
    ...mapRowToMessage(row),
    receiverId: row.sender_id === userId ? contactId : userId // Infer receiver
  }))
}

export async function sendMessageDb(senderId: string, receiverId: string, content: string): Promise<Message | null> {
  if (!hasSupabaseConfig()) return null

  const conversationId = await getOrCreateConversationId(senderId, receiverId)
  if (!conversationId) return null

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content,
      is_read: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    return null
  }

  // Update last_message_at in conversation
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  return {
    ...mapRowToMessage(data),
    receiverId: receiverId
  }
}

export async function markAsReadDb(userId: string, contactId: string) {
  if (!hasSupabaseConfig()) return

  const conversationId = await getOrCreateConversationId(userId, contactId)
  if (!conversationId) return

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId) // Mark messages NOT sent by me as read
    .eq('is_read', false)

  if (error) {
    console.error('Error marking messages as read:', error)
  }
}

export async function fetchConversationsDb(currentUserId: string): Promise<Conversation[]> {
  if (!hasSupabaseConfig()) return []

  // Fetch conversations where user is participant
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      id,
      participant_a,
      participant_b,
      last_message_at
    `)
    .or(`participant_a.eq.${currentUserId},participant_b.eq.${currentUserId}`)
    .order('last_message_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  const result: Conversation[] = []

  for (const conv of conversations) {
    const otherId = conv.participant_a === currentUserId ? conv.participant_b : conv.participant_a
    
    // Fetch last message
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!lastMsg) continue // Empty conversation

    // Count unread
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conv.id)
      .neq('sender_id', currentUserId)
      .eq('is_read', false)

    // Resolve participant details (similar logic to previous)
    let name = otherId
    let image = '/placeholder.svg'

    // Try DB profile
    const { data: dbProfile } = await supabase
      .from('profiles')
      .select('display_name, location') // Assuming location/image might be elsewhere or different columns
      // Note: Schema has 'display_name', 'city', etc. 
      // We need to check if 'image_url' exists in 'profiles' or if we need to join 'media_gallery'.
      // Schema: profiles has no 'image_url'. It has 'media_gallery'.
      // Wait, schema check:
      // create table if not exists profiles ( ... display_name text ... )
      // It does NOT have image_url. 
      // It has media_gallery table.
      // We should fetch the cover image from media_gallery.
      .eq('id', otherId)
      .single()

    // Fetch cover image
    const { data: coverImage } = await supabase
        .from('media_gallery')
        .select('url')
        .eq('profile_id', otherId)
        .eq('is_cover', true)
        .single()
        
    const profileImage = coverImage?.url 

    if (dbProfile) {
      name = dbProfile.display_name || 'Usuário'
      image = profileImage || image
    } else {
      // Fallback to local helpers
       let modelProfile = getModelProfile(otherId);
       if (!modelProfile) {
        const allProfiles = getAllLocalProfiles();
        modelProfile = allProfiles.find(p => p.artisticName === otherId || p.artisticName.toLowerCase() === otherId.toLowerCase()) || null;
      }
      const users = getUsers();
      const userProfile = users.find(u => u.email === otherId || u.name === otherId);

      if (modelProfile) {
        name = modelProfile.artisticName;
        image = modelProfile.photos?.[0] || modelProfile.coverImage || image;
      } else if (userProfile) {
        name = userProfile.name;
      }
    }

    result.push({
      id: conv.id,
      participantId: otherId,
      participantName: name,
      participantImage: image,
      lastMessage: lastMsg.content || (lastMsg.encrypted_data ? "Mensagem protegida" : ""),
      lastMessageTime: new Date(lastMsg.created_at).getTime(),
      unreadCount: unreadCount || 0
    })
  }

  return result
}
