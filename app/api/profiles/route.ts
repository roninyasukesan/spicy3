import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { serializePublishedProfile } from "@/lib/supabase/profile-data"

export const runtime = "nodejs"

export async function GET() {
  try {
    const admin = getSupabaseAdminClient()
    const { data: rows, error } = await admin
      .from("profiles")
      .select(
        "id,public_id,role,name,display_name,city,age,bio,services,fetishes,exclusions,price,price_range,characteristics,gallery_items,stories"
      )
      .limit(100)

    if (error) throw error

    const modelRows = (rows || []).filter((row) =>
      ["model", "modelo"].includes(String(row.role || "").toLowerCase())
    )
    const profileIds = modelRows.map((row) => String(row.id))
    let media: Array<Record<string, unknown>> = []

    if (profileIds.length > 0) {
      const { data: mediaRows, error: mediaError } = await admin
        .from("profile_media")
        .select("id,profile_id,media_type,position,is_blurred,is_cover")
        .in("profile_id", profileIds)
        .eq("status", "ready")
        .eq("visibility", "public")
        .order("position", { ascending: true })

      if (!mediaError) media = mediaRows || []
    }

    return NextResponse.json({
      profiles: modelRows.map((row) =>
        serializePublishedProfile(
          row,
          media.filter((item) => item.profile_id === row.id)
        )
      ),
    })
  } catch (error) {
    console.error("Failed to list published profiles:", error)
    return NextResponse.json(
      {
        error:
          "O banco de perfis não está disponível. Verifique a URL, a service role e a migração.",
      },
      { status: 503 }
    )
  }
}
