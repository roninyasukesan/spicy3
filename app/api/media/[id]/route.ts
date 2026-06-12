import { Readable } from "node:stream"
import { NextRequest, NextResponse } from "next/server"
import {
  deleteDriveFile,
  getDriveFileMetadata,
  streamDriveFile,
} from "@/lib/google-drive/server"
import {
  isProfileMediaVisibility,
  type ProfileMediaRecord,
} from "@/lib/media"
import { canReadMedia, getMediaRecord } from "@/lib/media-server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  canManageProfile,
  getMediaActor,
} from "@/lib/supabase/auth-server"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{ id: string }>
}

function contentDisposition(fileName: string) {
  const safeName = fileName.replace(/["\r\n]/g, "_")
  return `inline; filename="${safeName}"`
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const media = await getMediaRecord(id)
    if (!media) {
      return NextResponse.json({ error: "Mídia não encontrada." }, { status: 404 })
    }
    if (!(await canReadMedia(request, media))) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }

    const metadata = await getDriveFileMetadata(media.drive_file_id)
    const range = request.headers.get("range")
    const download = await streamDriveFile(media.drive_file_id, range)
    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Cache-Control":
        media.visibility === "public"
          ? "public, max-age=300, stale-while-revalidate=3600"
          : "private, no-store",
      "Content-Disposition": contentDisposition(media.file_name),
      "Content-Type": metadata.mimeType || media.mime_type,
    })

    const contentLength = download.headers["content-length"]
    const contentRange = download.headers["content-range"]
    if (contentLength) headers.set("Content-Length", String(contentLength))
    if (contentRange) headers.set("Content-Range", String(contentRange))

    return new Response(Readable.toWeb(download.stream) as ReadableStream, {
      status: range ? 206 : download.status,
      headers,
    })
  } catch (error) {
    console.error("Failed to stream profile media:", error)
    return NextResponse.json(
      { error: "Não foi possível carregar a mídia." },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const media = await getMediaRecord(id)
    if (!media) {
      return NextResponse.json({ error: "Mídia não encontrada." }, { status: 404 })
    }

    const actor = await getMediaActor(request)
    if (!actor) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }
    if (!(await canManageProfile(actor, media.profile_id))) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (typeof body.isBlurred === "boolean") updates.is_blurred = body.isBlurred
    if (typeof body.isCover === "boolean") updates.is_cover = body.isCover
    if (Number.isInteger(body.position) && body.position >= 0) {
      updates.position = body.position
    }
    if (typeof body.visibility === "string") {
      if (!isProfileMediaVisibility(body.visibility)) {
        return NextResponse.json(
          { error: "Visibilidade inválida." },
          { status: 400 }
        )
      }
      updates.visibility = body.visibility
    }

    const admin = getSupabaseAdminClient()
    if (body.isCover === true) {
      await admin
        .from("profile_media")
        .update({ is_cover: false })
        .eq("profile_id", media.profile_id)
        .eq("media_type", "photo")
    }

    const { data, error } = await admin
      .from("profile_media")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error
    return NextResponse.json({ media: data as ProfileMediaRecord })
  } catch (error) {
    console.error("Failed to update profile media:", error)
    return NextResponse.json(
      { error: "Não foi possível atualizar a mídia." },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const media = await getMediaRecord(id)
    if (!media) {
      return NextResponse.json({ error: "Mídia não encontrada." }, { status: 404 })
    }

    const actor = await getMediaActor(request)
    if (!actor) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }
    if (!(await canManageProfile(actor, media.profile_id))) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }

    await deleteDriveFile(media.drive_file_id)
    const admin = getSupabaseAdminClient()
    const { error } = await admin.from("profile_media").delete().eq("id", id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to delete profile media:", error)
    return NextResponse.json(
      { error: "Não foi possível excluir a mídia." },
      { status: 500 }
    )
  }
}
