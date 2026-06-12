import { NextRequest, NextResponse } from "next/server"
import { deleteDriveFile } from "@/lib/google-drive/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getMediaActor } from "@/lib/supabase/auth-server"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const actor = await getMediaActor(request)
    if (!actor || actor.role !== "admin") {
      return NextResponse.json({ error: "Acesso restrito ao administrador." }, { status: 403 })
    }

    const { id } = await context.params
    if (id === actor.user.id) {
      return NextResponse.json(
        { error: "O administrador não pode excluir a própria sessão." },
        { status: 400 }
      )
    }

    const admin = getSupabaseAdminClient()
    const { data: mediaRows } = await admin
      .from("profile_media")
      .select("drive_file_id")
      .eq("profile_id", id)

    for (const media of mediaRows || []) {
      try {
        await deleteDriveFile(String(media.drive_file_id))
      } catch (error) {
        console.error("Failed to delete Drive file during user removal:", error)
      }
    }

    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to delete managed user:", error)
    return NextResponse.json(
      { error: "Não foi possível excluir o usuário no Supabase." },
      { status: 503 }
    )
  }
}
