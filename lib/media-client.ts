"use client"

import { supabase } from "@/lib/supabase"
import type { ModelPhoto } from "@/lib/local-auth"
import {
  getProfileMediaUrl,
  type ProfileMediaRecord,
  type ProfileMediaType,
  type ProfileMediaVisibility,
} from "@/lib/media"

export function isRemoteMediaEnabled() {
  return process.env.NEXT_PUBLIC_REMOTE_MEDIA_ENABLED === "true"
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
  const { data } = await withTimeout(
    supabase.auth.getSession(),
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

export async function dataUrlToFile(dataUrl: string, originalName: string) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const baseName = originalName.replace(/\.[^.]+$/, "") || "photo"
  return new File([blob], `${baseName}.jpg`, {
    type: blob.type || "image/jpeg",
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

async function syncRemoteProfilePhotosInternal(
  profileId: string,
  photoItems: ModelPhoto[]
) {
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
