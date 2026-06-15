"use client"

import { supabase } from "@/lib/supabase"
import type { ModelPhoto, ModelProfile, Story } from "@/lib/local-auth"
import {
  getProfileMediaUrl,
  type ProfileMediaRecord,
  type ProfileMediaType,
  type ProfileMediaVisibility,
} from "@/lib/media"

export function isRemoteMediaEnabled() {
  return process.env.NEXT_PUBLIC_REMOTE_MEDIA_ENABLED === "true"
}

type RemoteMediaHealth = {
  ready: boolean
  database?: {
    configured?: boolean
    reachable?: boolean
    profileMediaReady?: boolean
  }
  drive?: {
    configured?: boolean
    reachable?: boolean
    authMode?: "service-account" | "oauth" | null
    folderConfigured?: boolean
  }
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

async function getAccessToken() {
  const { data } = await withTimeout<{
    data: { session: { access_token?: string } | null }
  }>(
    supabase.auth.getSession() as Promise<{
      data: { session: { access_token?: string } | null }
    }>,
    5000,
    "A sessão remota demorou demais para responder."
  )
  return data.session?.access_token || null
}

export async function hasRemoteMediaSession() {
  if (!isRemoteMediaEnabled()) return false
  return Boolean(await getAccessToken())
}

async function authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    throw new Error("Faça login pelo Supabase antes de gerenciar mídia remota.")
  }

  return fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

async function requireRemoteMediaReady() {
  const response = await authorizedFetch("/api/media/health", {
    cache: "no-store",
  })
  const health = (await response.json()) as RemoteMediaHealth

  if (response.ok && health.ready) return

  if (!health.database?.configured) {
    throw new Error(
      "A mídia remota está desativada porque o Supabase do servidor não está configurado."
    )
  }
  if (!health.database?.profileMediaReady) {
    throw new Error(
      "A tabela profile_media do Supabase não está disponível para a mídia remota."
    )
  }
  if (!health.drive?.configured) {
    throw new Error(
      "Configure a autenticação e a pasta do Google Drive antes de enviar fotos."
    )
  }

  throw new Error(
    "O Google Drive não respondeu ou não permite gravar na pasta configurada."
  )
}

function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/png") return "png"
  if (mimeType === "image/webp") return "webp"
  if (mimeType === "video/mp4") return "mp4"
  if (mimeType === "video/webm") return "webm"
  if (mimeType === "audio/mpeg") return "mp3"
  if (mimeType === "audio/ogg") return "ogg"
  if (mimeType === "audio/wav" || mimeType === "audio/x-wav") return "wav"
  return mimeType.startsWith("image/") ? "jpg" : "bin"
}

export async function dataUrlToFile(dataUrl: string, originalName: string) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const baseName = originalName.replace(/\.[^.]+$/, "") || "photo"
  const mimeType = blob.type || "application/octet-stream"
  return new File([blob], `${baseName}.${extensionForMimeType(mimeType)}`, {
    type: mimeType,
  })
}

export async function uploadProfileMedia(input: {
  file: File
  profileId?: string
  mediaType: ProfileMediaType
  visibility?: ProfileMediaVisibility
  isBlurred?: boolean
  isCover?: boolean
}) {
  const formData = new FormData()
  formData.set("file", input.file)
  formData.set("mediaType", input.mediaType)
  formData.set("visibility", input.visibility || "public")
  formData.set("isBlurred", String(Boolean(input.isBlurred)))
  formData.set("isCover", String(Boolean(input.isCover)))
  if (input.profileId) formData.set("profileId", input.profileId)

  const response = await authorizedFetch("/api/media", {
    method: "POST",
    body: formData,
  })
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível enviar a mídia.")
  }

  const media = payload.media as ProfileMediaRecord
  return {
    ...media,
    url: getProfileMediaUrl(media.id),
  }
}

export async function listProfileMedia(profileId: string) {
  const response = await authorizedFetch(
    `/api/media?profileId=${encodeURIComponent(profileId)}`
  )
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível carregar as mídias.")
  }

  return (payload.media || []) as Array<ProfileMediaRecord & { url: string }>
}

export async function updateProfileMedia(
  mediaId: string,
  updates: {
    position?: number
    isBlurred?: boolean
    isCover?: boolean
    visibility?: ProfileMediaVisibility
  }
) {
  const response = await authorizedFetch(
    `/api/media/${encodeURIComponent(mediaId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }
  )
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível atualizar a mídia.")
  }

  return payload.media as ProfileMediaRecord
}

export async function deleteProfileMedia(mediaId: string) {
  const response = await authorizedFetch(
    `/api/media/${encodeURIComponent(mediaId)}`,
    { method: "DELETE" }
  )
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível excluir a mídia.")
  }
}

export async function reorderProfileMedia(
  profileId: string,
  items: Array<{ id: string; position: number }>
) {
  if (items.length === 0) return

  const response = await authorizedFetch("/api/media/reorder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId, items }),
  })
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível reordenar as mídias.")
  }
}

export async function syncRemoteProfilePhotos(
  profileId: string,
  photoItems: ModelPhoto[]
) {
  return withTimeout(
    syncRemoteProfilePhotosInternal(profileId, photoItems),
    30000,
    "A sincronização das mídias demorou demais. O perfil foi mantido no modo local."
  )
}

function getRemoteMediaId(url?: string) {
  if (!url) return null
  const match = url.match(/^\/api\/media\/([0-9a-f-]{36})$/i)
  return match?.[1] || null
}

async function syncRemoteStories(
  profileId: string,
  stories: Story[],
  remoteMedia: Array<ProfileMediaRecord & { url: string }>
) {
  const remoteStories = remoteMedia.filter(
    (media) => media.media_type === "story"
  )
  const remoteById = new Map(remoteStories.map((media) => [media.id, media]))
  const retainedIds = new Set<string>()
  const uploadedIds: string[] = []
  const syncedStories: Story[] = []

  try {
    for (const [index, story] of stories.entries()) {
      const remoteId = remoteById.has(story.id)
        ? story.id
        : getRemoteMediaId(story.mediaUrl)
      const existing = remoteId ? remoteById.get(remoteId) : undefined

      if (existing) {
        retainedIds.add(existing.id)
        syncedStories.push({
          ...story,
          id: existing.id,
          mediaUrl: existing.url,
          mediaType: existing.mime_type.startsWith("video/")
            ? "video"
            : "image",
        })
        continue
      }

      if (
        !story.mediaUrl.startsWith("data:") &&
        !story.mediaUrl.startsWith("blob:")
      ) {
        syncedStories.push(story)
        continue
      }

      const file = await dataUrlToFile(
        story.mediaUrl,
        `story-${index + 1}`
      )
      const uploaded = await uploadProfileMedia({
        file,
        profileId,
        mediaType: "story",
        visibility: "public",
        isBlurred: Boolean(story.isBlurred),
      })
      uploadedIds.push(uploaded.id)
      retainedIds.add(uploaded.id)
      syncedStories.push({
        ...story,
        id: uploaded.id,
        mediaUrl: uploaded.url,
        mediaType: uploaded.mime_type.startsWith("video/")
          ? "video"
          : "image",
      })
    }

    await Promise.all(
      remoteStories
        .filter((media) => !retainedIds.has(media.id))
        .map((media) => deleteProfileMedia(media.id))
    )
    await Promise.all(
      syncedStories
        .filter((story) => retainedIds.has(story.id))
        .map((story, position) =>
          updateProfileMedia(story.id, {
            position,
            isBlurred: Boolean(story.isBlurred),
            visibility: "public",
          })
        )
    )
    await reorderProfileMedia(
      profileId,
      syncedStories
        .filter((story) => retainedIds.has(story.id))
        .map((story, position) => ({ id: story.id, position }))
    )

    return syncedStories
  } catch (error) {
    await Promise.allSettled(
      uploadedIds.map((mediaId) => deleteProfileMedia(mediaId))
    )
    throw error
  }
}

async function syncRemoteVoice(
  profileId: string,
  voiceUrl: string | undefined,
  remoteMedia: Array<ProfileMediaRecord & { url: string }>
) {
  const remoteAudio = remoteMedia.filter((media) => media.media_type === "audio")
  const existingId = getRemoteMediaId(voiceUrl)
  const existing = existingId
    ? remoteAudio.find((media) => media.id === existingId)
    : undefined

  if (existing) {
    await Promise.all(
      remoteAudio
        .filter((media) => media.id !== existing.id)
        .map((media) => deleteProfileMedia(media.id))
    )
    return existing.url
  }

  if (!voiceUrl) {
    await Promise.all(remoteAudio.map((media) => deleteProfileMedia(media.id)))
    return undefined
  }

  if (!voiceUrl.startsWith("data:") && !voiceUrl.startsWith("blob:")) {
    return voiceUrl
  }

  const file = await dataUrlToFile(voiceUrl, "audio-perfil")
  const uploaded = await uploadProfileMedia({
    file,
    profileId,
    mediaType: "audio",
    visibility: "public",
  })
  await Promise.all(
    remoteAudio.map((media) => deleteProfileMedia(media.id))
  )
  return uploaded.url
}

export async function syncRemoteProfileMedia(
  profileId: string,
  profile: ModelProfile,
  options: { preserveExisting?: boolean } = {}
) {
  await requireRemoteMediaReady()
  const remoteMedia = await listProfileMedia(profileId)
  const existingPhotos = options.preserveExisting
    ? remoteMedia
        .filter((media) => media.media_type === "photo")
        .map((media) => ({
          id: media.id,
          url: media.url,
          isBlurred: media.is_blurred,
        }))
    : []
  const profilePhotos = profile.photoItems || []
  const profilePhotoIds = new Set(profilePhotos.map((photo) => photo.id))
  const photoItems = await syncRemoteProfilePhotosInternal(
    profileId,
    options.preserveExisting
      ? [
          ...profilePhotos,
          ...existingPhotos.filter(
            (photo) => !profilePhotoIds.has(photo.id)
          ),
        ]
      : profilePhotos
  )
  const existingStories = options.preserveExisting
    ? remoteMedia
        .filter((media) => media.media_type === "story")
        .map((media) => ({
          id: media.id,
          mediaUrl: media.url,
          mediaType: media.mime_type.startsWith("video/")
            ? ("video" as const)
            : ("image" as const),
          duration: 5,
          createdAt: media.created_at,
          isBlurred: media.is_blurred,
        }))
    : []
  const profileStories = profile.stories || []
  const profileStoryIds = new Set(profileStories.map((story) => story.id))
  const stories = await syncRemoteStories(
    profileId,
    options.preserveExisting
      ? [
          ...profileStories,
          ...existingStories.filter(
            (story) => !profileStoryIds.has(story.id)
          ),
        ]
      : profileStories,
    remoteMedia
  )
  const voiceUrl = await syncRemoteVoice(
    profileId,
    profile.voiceUrl ||
      (options.preserveExisting
        ? remoteMedia.find((media) => media.media_type === "audio")?.url
        : undefined),
    remoteMedia
  )

  return {
    ...profile,
    photoItems,
    photos: photoItems.map((photo) => photo.url),
    coverImage: photoItems[0]?.url,
    stories,
    voiceUrl,
  }
}

async function syncRemoteProfilePhotosInternal(
  profileId: string,
  photoItems: ModelPhoto[]
) {
  await requireRemoteMediaReady()

  const remoteMedia = await listProfileMedia(profileId)
  const remotePhotos = remoteMedia.filter((media) => media.media_type === "photo")
  const remoteById = new Map(remotePhotos.map((media) => [media.id, media]))
  const retainedRemoteIds = new Set<string>()
  const uploadedIds: string[] = []
  const syncedItems: ModelPhoto[] = []
  let resolvedProfileId = remotePhotos[0]?.profile_id || profileId

  try {
    for (const [index, photo] of photoItems.entries()) {
      const existingRemote = remoteById.get(photo.id)

      if (existingRemote) {
        retainedRemoteIds.add(photo.id)
        syncedItems.push({
          id: photo.id,
          url: existingRemote.url,
          isBlurred: Boolean(photo.isBlurred),
        })
        continue
      }

      if (!photo.url.startsWith("data:") && !photo.url.startsWith("blob:")) {
        syncedItems.push(photo)
        continue
      }

      const compressedFile = await dataUrlToFile(
        photo.url,
        `foto-${index + 1}.jpg`
      )
      const uploaded = await uploadProfileMedia({
        file: compressedFile,
        profileId,
        mediaType: "photo",
        visibility: "public",
        isBlurred: Boolean(photo.isBlurred),
        isCover: index === 0,
      })
      uploadedIds.push(uploaded.id)
      resolvedProfileId = uploaded.profile_id
      retainedRemoteIds.add(uploaded.id)
      syncedItems.push({
        id: uploaded.id,
        url: uploaded.url,
        isBlurred: uploaded.is_blurred,
      })
    }

    const removedRemote = remotePhotos.filter(
      (media) => !retainedRemoteIds.has(media.id)
    )
    await Promise.all(removedRemote.map((media) => deleteProfileMedia(media.id)))

    const syncedRemoteItems = syncedItems.filter((photo) =>
      retainedRemoteIds.has(photo.id)
    )
    await Promise.all(
      syncedRemoteItems.map((photo, index) =>
        updateProfileMedia(photo.id, {
          position: index,
          isCover: index === 0,
          isBlurred: Boolean(photo.isBlurred),
          visibility: "public",
        })
      )
    )
    await reorderProfileMedia(
      resolvedProfileId,
      syncedRemoteItems.map((photo, position) => ({
        id: photo.id,
        position,
      }))
    )

    return syncedItems
  } catch (error) {
    await Promise.allSettled(
      uploadedIds.map((mediaId) => deleteProfileMedia(mediaId))
    )
    throw error
  }
}
