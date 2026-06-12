import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  canManageProfile,
  getMediaActor,
} from "@/lib/supabase/auth-server"

export async function PATCH(request: NextRequest) {
  try {
    const actor = await getMediaActor(request)
    if (!actor) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }

    const body = await request.json()
    const profileId = String(body.profileId || "")
    const items = Array.isArray(body.items) ? body.items : []

    if (!profileId || !(await canManageProfile(actor, profileId))) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }
    if (
      items.length === 0 ||
      items.some(
        (item: unknown) =>
          typeof item !== "object" ||
          item === null ||
          typeof (item as { id?: unknown }).id !== "string" ||
          !Number.isInteger((item as { position?: unknown }).position)
      )
    ) {
      return NextResponse.json(
        { error: "Lista de ordenação inválida." },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdminClient()
    const ids = items.map((item: { id: string }) => item.id)
    const { data: ownedMedia, error: ownershipError } = await admin
      .from("profile_media")
      .select("id")
      .eq("profile_id", profileId)
      .in("id", ids)

    if (ownershipError) throw ownershipError
    if ((ownedMedia || []).length !== ids.length) {
      return NextResponse.json(
        { error: "Uma ou mais mídias não pertencem ao perfil." },
        { status: 403 }
      )
    }

    const results = await Promise.all(
      items.map((item: { id: string; position: number }) =>
        admin
          .from("profile_media")
          .update({ position: item.position })
          .eq("id", item.id)
          .eq("profile_id", profileId)
      )
    )
    const failed = results.find((result) => result.error)
    if (failed?.error) throw failed.error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to reorder profile media:", error)
    return NextResponse.json(
      { error: "Não foi possível reordenar as mídias." },
      { status: 500 }
    )
  }
}
