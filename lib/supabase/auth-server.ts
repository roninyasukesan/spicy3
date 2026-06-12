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

export async function getMediaActor(
  request: NextRequest
): Promise<MediaActor | null> {
  const user = await getRequestUser(request)
  if (!user) return null

  const fallbackRole = String(user.app_metadata?.role || "")
  const fallbackPlan = String(user.app_metadata?.plan_tier || "free")

  try {
    const admin = getSupabaseAdminClient()
    const { data } = await admin
      .from("profiles")
      .select("role,plan_tier")
      .eq("id", user.id)
      .maybeSingle()

    return {
      user,
      role: String(data?.role || fallbackRole || "client"),
      planTier: String(data?.plan_tier || fallbackPlan),
    }
  } catch {
    return {
      user,
      role: fallbackRole || "client",
      planTier: fallbackPlan,
    }
  }
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
