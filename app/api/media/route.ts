import { NextRequest, NextResponse } from "next/server"
import { deleteDriveFile, uploadDriveFile } from "@/lib/google-drive/server"
import {
  getProfileMediaUrl,
  isProfileMediaType,
  isProfileMediaVisibility,
  type ProfileMediaRecord,
} from "@/lib/media"
import { canReadMedia } from "@/lib/media-server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  getMediaActor,
  resolveActorProfileId,
} from "@/lib/supabase/auth-server"

export const runtime = "nodejs"

const MAX_FILE_SIZES: Record<string, number> = {
  photo: 12 * 1024 * 1024,
  story: 25 * 1024 * 1024,
  video: 150 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
  document: 15 * 1024 * 1024,
}

const ALLOWED_MIME_PREFIXES: Record<string, string[]> = {
  photo: ["image/"],
  story: ["image/", "video/"],
  video: ["video/"],
  audio: ["audio/"],
  document: ["application/pdf", "image/"],
}

function sanitizeFileName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120)
}

function acceptsMimeType(mediaType: string, mimeType: string) {
  return ALLOWED_MIME_PREFIXES[mediaType].some((allowed) =>
    allowed.endsWith("/") ? mimeType.startsWith(allowed) : mimeType === allowed
  )
}

function serializeMedia(media: ProfileMediaRecord) {
  return {
    ...media,
    url: getProfileMediaUrl(media.id),
  }
}

export async function GET(request: NextRequest) {
  try {
    const requestedProfileId = request.nextUrl.searchParams.get("profileId")
    if (!requestedProfileId) {
      return NextResponse.json({ error: "profileId é obrigatório." }, { status: 400 })
    }

    const actor = await getMediaActor(request)
    const profileId = actor
      ? (await resolveActorProfileId(actor, requestedProfileId)) || requestedProfileId
      : requestedProfileId
    const admin = getSupabaseAdminClient()
    const { data, error } = await admin
      .from("profile_media")
      .select("*")
      .eq("profile_id", profileId)
      .eq("status", "ready")
      .order("position", { ascending: true })

    if (error) throw error

    const visibleMedia = []
    for (const media of (data || []) as ProfileMediaRecord[]) {
      if (await canReadMedia(request, media)) {
        visibleMedia.push(serializeMedia(media))
      }
    }

    return NextResponse.json({ media: visibleMedia })
  } catch (error) {
    console.error("Failed to list profile media:", error)
    return NextResponse.json(
      { error: "Não foi possível carregar as mídias." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let uploadedDriveFileId: string | null = null

  try {
    const actor = await getMediaActor(request)
    if (!actor) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const requestedProfileId = String(formData.get("profileId") || actor.user.id)
    const profileId = await resolveActorProfileId(actor, requestedProfileId)
    const mediaType = String(formData.get("mediaType") || "photo")
    const visibility = String(formData.get("visibility") || "public")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 })
    }
    if (!profileId) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 })
    }
    if (!isProfileMediaType(mediaType)) {
      return NextResponse.json({ error: "Tipo de mídia inválido." }, { status: 400 })
    }
    if (!isProfileMediaVisibility(visibility)) {
      return NextResponse.json({ error: "Visibilidade inválida." }, { status: 400 })
    }
    if (!acceptsMimeType(mediaType, file.type)) {
      return NextResponse.json(
        { error: "Formato de arquivo não permitido." },
        { status: 415 }
      )
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZES[mediaType]) {
      return NextResponse.json(
        { error: "O arquivo excede o limite permitido." },
        { status: 413 }
      )
    }

    const admin = getSupabaseAdminClient()
    const { data: lastMedia } = await admin
      .from("profile_media")
      .select("position")
      .eq("profile_id", profileId)
      .eq("media_type", mediaType)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle()

    const driveFile = await uploadDriveFile({
      profileId,
      fileName: `${Date.now()}-${sanitizeFileName(file.name || mediaType)}`,
      mimeType: file.type,
      buffer: Buffer.from(await file.arrayBuffer()),
      mediaType,
    })
    uploadedDriveFileId = driveFile.id || null

    const isCover = formData.get("isCover") === "true"
    if (isCover) {
      await admin
        .from("profile_media")
        .update({ is_cover: false })
        .eq("profile_id", profileId)
        .eq("media_type", "photo")
    }

    const { data, error } = await admin
      .from("profile_media")
      .insert({
        profile_id: profileId,
        drive_file_id: uploadedDriveFileId,
        file_name: driveFile.name || file.name,
        mime_type: driveFile.mimeType || file.type,
        size_bytes: Number(driveFile.size || file.size),
        media_type: mediaType,
        position: Number(lastMedia?.position ?? -1) + 1,
        visibility,
        is_cover: isCover,
        is_blurred: formData.get("isBlurred") === "true",
        status: "ready",
      })
      .select("*")
      .single()

    if (error) throw error

    return NextResponse.json(
      { media: serializeMedia(data as ProfileMediaRecord) },
      { status: 201 }
    )
  } catch (error) {
    if (uploadedDriveFileId) {
      try {
        await deleteDriveFile(uploadedDriveFileId)
      } catch (cleanupError) {
        console.error("Failed to roll back Drive upload:", cleanupError)
      }
    }

    console.error("Failed to upload profile media:", error)
    return NextResponse.json(
      { error: "Não foi possível enviar a mídia." },
      { status: 500 }
    )
  }
}
