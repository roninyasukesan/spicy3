
import { supabase } from "@/lib/supabase"

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function fetchFavoritesDb(userId: string): Promise<string[]> {
  if (!hasSupabaseConfig()) return []

  const { data, error } = await supabase
    .from('favorites')
    .select('model_id')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching favorites:', error)
    return []
  }

  return (data || []).map((row: any) => row.model_id)
}

export async function toggleFavoriteDb(userId: string, profileId: string): Promise<boolean> {
  if (!hasSupabaseConfig()) return false

  // Check if exists
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('model_id', profileId)
    .single()

  if (existing) {
    // Remove
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id)
    
    if (error) console.error('Error removing favorite:', error)
    return false
  } else {
    // Add
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        model_id: profileId
      })
    
    if (error) console.error('Error adding favorite:', error)
    return true
  }
}
