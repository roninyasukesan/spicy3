import "server-only"

import type { NextRequest } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  canManageProfile,
  getMediaActor,
} from "@/lib/supabase/auth-server"
import type { ProfileMediaRecord } from "@/lib/media"

export async function getMediaRecord(mediaId: string) {
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin
    .from("profile_media")
    .select("*")
    .eq("id", mediaId)
    .maybeSingle()

  if (error) throw error
  return data as ProfileMediaRecord | null
}

export async function canReadMedia(
  request: NextRequest,
  media: ProfileMediaRecord
) {
  if (
    media.status === "ready" &&
    media.visibility === "public" &&
    (!media.expires_at || new Date(media.expires_at) > new Date())
  ) {
    return true
  }

  const actor = await getMediaActor(request)
  if (!actor) return false
  if (await canManageProfile(actor, media.profile_id)) return true

  return (
    media.visibility === "subscriber" &&
    (actor.planTier === "gold" || actor.planTier === "diamond")
  )
}
