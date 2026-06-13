import { NextRequest, NextResponse } from "next/server"
import {
  getGoogleDriveConfigStatus,
  verifyGoogleDriveConnection,
} from "@/lib/google-drive/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getRequestUser } from "@/lib/supabase/auth-server"
import { hasSupabaseAdminConfig } from "@/lib/supabase/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const HEALTH_CHECK_TIMEOUT_MS = 8000

async function withTimeout<T>(
  operation: PromiseLike<T>,
  message: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(message)),
          HEALTH_CHECK_TIMEOUT_MS
        )
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function GET(request: NextRequest) {
  const user = await withTimeout(
    getRequestUser(request),
    "Supabase authentication health check timed out."
  ).catch(() => null)

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const databaseConfigured = hasSupabaseAdminConfig()
  const driveConfig = getGoogleDriveConfigStatus()

  const [databaseCheck, driveCheck] = await Promise.allSettled([
    databaseConfigured
      ? withTimeout(
          getSupabaseAdminClient().from("profile_media").select("id").limit(1),
          "Supabase media health check timed out."
        )
      : Promise.reject(new Error("Supabase admin configuration is missing.")),
    driveConfig.configured
      ? withTimeout(
          verifyGoogleDriveConnection(),
          "Google Drive health check timed out."
        )
      : Promise.reject(new Error("Google Drive configuration is missing.")),
  ])

  const databaseReady =
    databaseCheck.status === "fulfilled" && !databaseCheck.value.error
  const driveReady = driveCheck.status === "fulfilled"
  const ready = databaseReady && driveReady

  return NextResponse.json(
    {
      ready,
      remoteMediaEnabled:
        process.env.NEXT_PUBLIC_REMOTE_MEDIA_ENABLED === "true",
      database: {
        configured: databaseConfigured,
        reachable: databaseReady,
        profileMediaReady: databaseReady,
      },
      drive: {
        configured: driveConfig.configured,
        reachable: driveReady,
        authMode: driveConfig.authMode,
        folderConfigured: driveConfig.folderConfigured,
        sharedDriveConfigured: driveConfig.sharedDriveConfigured,
      },
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  )
}
