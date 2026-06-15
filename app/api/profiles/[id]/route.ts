import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { ModelProfile } from "@/lib/local-auth"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  getMediaActor,
  resolveActorProfileId,
} from "@/lib/supabase/auth-server"
import {
  profileUpdateFromModel,
  serializePublishedProfile,
} from "@/lib/supabase/profile-data"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{ id: string }>
}

const profileSchema = z.object({
  publicId: z.string().uuid().optional(),
  artisticName: z.string().trim().min(1).max(120),
  phone: z.string().max(40),
  city: z.string().max(120),
  age: z.string().max(10),
  bio: z.string().max(5000),
  services: z.array(z.string().max(120)).max(100),
  fetishes: z.array(z.string().max(120)).max(100),
  exclusions: z.array(z.string().max(120)).max(100),
  priceRange: z.string().max(120),
  characteristics: z
    .object({
      hairColor: z.string().max(120).optional(),
      ethnicity: z.string().max(120).optional(),
      bodyType: z.string().max(120).optional(),
      height: z.string().max(120).optional(),
      age: z.string().max(120).optional(),
      ageRange: z.string().max(120).optional(),
      eyes: z.string().max(120).optional(),
      breasts: z.string().max(120).optional(),
      tattoos: z.string().max(120).optional(),
      piercings: z.string().max(120).optional(),
    })
    .transform((value) => ({
      hairColor: value.hairColor || "",
      ethnicity: value.ethnicity || "",
      bodyType: value.bodyType || "",
      height: value.height || "",
      age: value.age || value.ageRange || "",
      eyes: value.eyes || "",
      breasts: value.breasts || "",
      tattoos: value.tattoos || "",
      piercings: value.piercings || "",
    })),
  photos: z.array(z.string()).optional(),
  photoItems: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        isBlurred: z.boolean().optional(),
      })
    )
    .optional(),
  coverImage: z.string().optional(),
  voiceUrl: z.string().optional(),
  email: z.string().optional(),
  stories: z.array(z.any()).optional(),
})

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const parsedId = z.string().uuid().safeParse(id)
    if (!parsedId.success) {
      return NextResponse.json({ error: "Perfil inválido." }, { status: 400 })
    }

    const admin = getSupabaseAdminClient()
    const { data, error } = await admin
      .from("profiles")
      .select(
        "id,public_id,name,display_name,city,age,bio,services,fetishes,exclusions,price,price_range,characteristics,gallery_items,stories,voice_url"
      )
      .or(`id.eq.${parsedId.data},public_id.eq.${parsedId.data}`)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 })
    }

    const { data: media } = await admin
      .from("profile_media")
      .select(
        "id,profile_id,media_type,mime_type,position,is_blurred,is_cover,created_at"
      )
      .eq("profile_id", data.id)
      .eq("status", "ready")
      .eq("visibility", "public")
      .order("position", { ascending: true })

    return NextResponse.json({
      profile: serializePublishedProfile(data, media || []),
    })
  } catch (error) {
    console.error("Failed to load published profile:", error)
    return NextResponse.json(
      { error: "Não foi possível carregar o perfil publicado." },
      { status: 503 }
    )
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const actor = await getMediaActor(request)
    if (!actor) {
      return NextResponse.json({ error: "Não autenticado no Supabase." }, { status: 401 })
    }

    const { id } = await context.params
    const profileId = await resolveActorProfileId(actor, id)
    if (!profileId) {
      return NextResponse.json({ error: "Acesso negado ao perfil." }, { status: 403 })
    }

    const body = await request.json()
    const parsed = profileSchema.safeParse(body.profile)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Os dados do perfil são inválidos." },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdminClient()
    const { data, error } = await admin
      .from("profiles")
      .update(profileUpdateFromModel(parsed.data as ModelProfile))
      .eq("id", profileId)
      .select(
        "id,public_id,name,display_name,city,age,bio,services,fetishes,exclusions,price,price_range,characteristics,gallery_items,stories,voice_url"
      )
      .single()

    if (error) throw error
    return NextResponse.json({
      profile: serializePublishedProfile(data),
    })
  } catch (error) {
    console.error("Failed to update profile:", error)
    return NextResponse.json(
      { error: "Não foi possível publicar o perfil no Supabase." },
      { status: 503 }
    )
  }
}
