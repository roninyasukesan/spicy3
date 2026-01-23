import { supabase } from "@/lib/supabase"

export type DbProfile = {
  id: string
  name: string
  city: string
  price: string
  image_url: string | null
  age: number | null
  rating: number | null
  reviews: number | null
  is_verified: boolean | null
  bio: string | null
  services: string[] | null
  fetishes: string[] | null
  gallery: string[] | null
  characteristics: {
    hairColor?: string
    ethnicity?: string
    bodyType?: string
    height?: string
    ageRange?: string
    eyes?: string
    breasts?: string
    tattoos?: string
    piercings?: string
  } | null
}

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function fetchProfiles(): Promise<DbProfile[]> {
  if (!hasSupabaseConfig()) return []
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,name,city,price,image_url,age,rating,reviews,is_verified,bio,services,fetishes,gallery,characteristics"
    )
    .limit(50)
  if (error) return []
  return data ?? []
}

export type ProfilesFilterInput = {
  cities?: string[]
  services?: string[]
  fetishes?: string[]
}

export async function fetchProfilesFiltered(filters: ProfilesFilterInput): Promise<DbProfile[]> {
  if (!hasSupabaseConfig()) return []
  let q = supabase
    .from("profiles")
    .select(
      "id,name,city,price,image_url,age,rating,reviews,is_verified,bio,services,fetishes,gallery,characteristics"
    )
  if (filters.cities && filters.cities.length > 0) {
    q = q.in("city", filters.cities)
  }
  if (filters.services && filters.services.length > 0) {
    q = q.contains("services", filters.services)
  }
  if (filters.fetishes && filters.fetishes.length > 0) {
    q = q.contains("fetishes", filters.fetishes)
  }
  const { data, error } = await q.limit(50)
  if (error) return []
  return data ?? []
}

export async function fetchProfileById(id: string): Promise<DbProfile | null> {
  // Check local storage first (client-side only)
  if (typeof window !== "undefined") {
    try {
      const { getModelProfile } = await import("@/lib/local-auth");
      // Decode ID in case it's an email with special chars
      const decodedId = decodeURIComponent(id);
      const local = getModelProfile(decodedId);
      
      if (local) {
        return {
          id: id,
          name: local.artisticName,
          city: local.city,
          price: local.priceRange,
          image_url: local.photos?.[0] || null,
          age: parseInt(local.age) || 25,
          rating: 5.0,
          reviews: 0,
          is_verified: true,
          bio: local.bio,
          services: local.services,
          fetishes: local.fetishes,
          gallery: local.photos || [],
          characteristics: local.characteristics
        };
      }
    } catch (e) {
      console.error("Error fetching local profile:", e);
    }
  }

  if (!hasSupabaseConfig()) return null
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,name,city,price,image_url,age,rating,reviews,is_verified,bio,services,fetishes,gallery,characteristics"
    )
    .eq("id", id)
    .single()
  if (error) return null
  return data ?? null
}
