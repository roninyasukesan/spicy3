import { NextRequest, NextResponse } from "next/server"
import { getMediaActor } from "@/lib/supabase/auth-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function applicationRole(role: string) {
  if (role === "model") return "modelo"
  if (role === "client") return "cliente"
  return role
}

export async function GET(request: NextRequest) {
  const actor = await getMediaActor(request)
  if (!actor) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  return NextResponse.json(
    {
      user: {
        id: actor.profile.id,
        publicProfileId: actor.profile.publicId,
        email: actor.profile.email || actor.user.email || "",
        role: applicationRole(actor.role),
        name: actor.profile.displayName,
        plan: actor.planTier === "free" ? "free" : "vip",
      },
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  )
}
