import "server-only"

import { createClient, type User } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getSupabasePublicConfig } from "@/lib/supabase/config"

export type MediaActor = {
  user: User
  role: string
  planTier: string
  profile: {
    id: string
    publicId?: string
    email: string
    displayName: string
  }
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) return null
  return authorization.slice("Bearer ".length).trim() || null
}

async function getUserFromBearer(token: string) {
  const { url, anonKey } = getSupabasePublicConfig()
  const verifier = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  const { data, error } = await verifier.auth.getUser(token)
  return error ? null : data.user
}

export async function getRequestUser(request: NextRequest) {
  const token = getBearerToken(request)
  if (token) return getUserFromBearer(token)

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  return error ? null : data.user
}

export async function getActorForUser(user: User): Promise<MediaActor> {
  const fallbackRole = String(user.app_metadata?.role || "")
  const fallbackPlan = String(user.app_metadata?.plan_tier || "free")
  const fallbackEmail = user.email || ""
  const fallbackName =
    String(user.user_metadata?.display_name || user.user_metadata?.full_name || "") ||
    fallbackEmail.split("@")[0] ||
    "Usuário"

  try {
    const admin = getSupabaseAdminClient()
    const { data, error } = await admin
      .from("profiles")
      .select("id,public_id,email,role,plan_tier,display_name,name")
      .eq("id", user.id)
      .maybeSingle()

    if (error) throw error

    return {
      user,
      role: String(data?.role || fallbackRole || "client"),
      planTier: String(data?.plan_tier || fallbackPlan),
      profile: {
        id: String(data?.id || user.id),
        publicId: data?.public_id ? String(data.public_id) : undefined,
        email: String(data?.email || fallbackEmail),
        displayName: String(data?.display_name || data?.name || fallbackName),
      },
    }
  } catch {
    return {
      user,
      role: fallbackRole || "client",
      planTier: fallbackPlan,
      profile: {
        id: user.id,
        email: fallbackEmail,
        displayName: fallbackName,
      },
    }
  }
}

export async function getAuthenticatedActor() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return getActorForUser(data.user)
}

export async function getMediaActor(
  request: NextRequest
): Promise<MediaActor | null> {
  const user = await getRequestUser(request)
  if (!user) return null

  return getActorForUser(user)
}

export async function canManageProfile(actor: MediaActor, profileId: string) {
  if (actor.role === "admin" || actor.user.id === profileId) return true

  try {
    const admin = getSupabaseAdminClient()
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("id", profileId)
      .eq("user_id", actor.user.id)
      .maybeSingle()
    return Boolean(data)
  } catch {
    return false
  }
}

export async function resolveActorProfileId(
  actor: MediaActor,
  requestedProfileId?: string | null
) {
  if (actor.role === "admin" && requestedProfileId) return requestedProfileId

  const admin = getSupabaseAdminClient()
  const { data: profileById } = await admin
    .from("profiles")
    .select("id")
    .eq("id", actor.user.id)
    .maybeSingle()

  if (profileById?.id) return String(profileById.id)

  const { data: profileByUserId } = await admin
    .from("profiles")
    .select("id")
    .eq("user_id", actor.user.id)
    .maybeSingle()

  if (!profileByUserId?.id) return null
  if (
    requestedProfileId &&
    requestedProfileId !== actor.user.id &&
    requestedProfileId !== profileByUserId.id
  ) {
    return null
  }

  return String(profileByUserId.id)
}
