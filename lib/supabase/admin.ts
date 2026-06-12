import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getSupabasePublicConfig } from "@/lib/supabase/config"

let adminClient: SupabaseClient | null = null

export function getSupabaseAdminClient() {
  if (!adminClient) {
    const { url } = getSupabasePublicConfig()
    const serviceRoleKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      throw new Error(
        "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is missing."
      )
    }

    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return adminClient
}
