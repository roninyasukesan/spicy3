import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { deleteDriveFile } from "@/lib/google-drive/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { getMediaActor } from "@/lib/supabase/auth-server"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{ id: string }>
}

const updateUserSchema = z.object({
  plan: z.enum(["free", "vip"]),
})

function databasePlan(plan: "free" | "vip") {
  return plan === "vip" ? "gold" : "free"
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const actor = await getMediaActor(request)
    if (!actor || actor.role !== "admin") {
      return NextResponse.json(
        { error: "Acesso restrito ao administrador." },
        { status: 403 }
      )
    }

    const parsed = updateUserSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 })
    }

    const { id } = await context.params
    const planTier = databasePlan(parsed.data.plan)
    const admin = getSupabaseAdminClient()
    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(id)
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      )
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({ plan_tier: planTier })
      .eq("id", id)
    if (profileError) throw profileError

    const { error: authError } = await admin.auth.admin.updateUserById(id, {
      app_metadata: {
        ...userData.user.app_metadata,
        plan_tier: planTier,
      },
    })
    if (authError) throw authError

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to update managed user:", error)
    return NextResponse.json(
      { error: "Não foi possível atualizar o usuário no Supabase." },
      { status: 503 }
    )
  }
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
