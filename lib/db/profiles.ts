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
