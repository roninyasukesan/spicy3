"use client"

import {
  getPersistedLocalProfiles,
  getPersistedLocalUsers,
  getProfilePhotoItems,
  saveModelProfile,
  type DemoUser,
  type ModelProfile,
} from "@/lib/local-auth"
import {
  isRemoteMediaEnabled,
  listProfileMedia,
  syncRemoteProfileMedia,
} from "@/lib/media-client"
import type { ProfileMediaRecord } from "@/lib/media"
import {
  createRemoteUser,
  isRemoteDataEnabled,
  listRemoteUsers,
  saveRemoteProfile,
} from "@/lib/profile-client"

const MIGRATION_BACKUP_DB = "spicy-local-migration-backups"
const MIGRATION_BACKUP_STORE = "profiles"

export type LocalMigrationSnapshot = {
  users: number
  profiles: number
  photos: number
  stories: number
  videos: number
  audio: number
  pendingMedia: number
}

export type LocalMigrationReport = LocalMigrationSnapshot & {
  createdUsers: number
  linkedUsers: number
  migratedProfiles: number
  migratedMedia: number
  migratedPhotos: number
  migratedVideos: number
  errors: string[]
}

function isLocalMediaUrl(url?: string) {
  return Boolean(url?.startsWith("data:") || url?.startsWith("blob:"))
}

function countProfileMedia(profile: ModelProfile) {
  const photos = getProfilePhotoItems(profile)
  const stories = profile.stories || []
  const videos = stories.filter((story) => story.mediaType === "video").length
  const audio = profile.voiceUrl ? 1 : 0
  const pendingPhotos = photos.filter((photo) =>
    isLocalMediaUrl(photo.url)
  ).length
  const pendingVideos = stories.filter(
    (story) =>
      story.mediaType === "video" && isLocalMediaUrl(story.mediaUrl)
  ).length
  const pendingStories = stories.filter((story) =>
    isLocalMediaUrl(story.mediaUrl)
  ).length
  const pendingMedia =
    pendingPhotos +
    pendingStories +
    (isLocalMediaUrl(profile.voiceUrl) ? 1 : 0)

  return {
    photos: photos.length,
    stories: stories.length,
    videos,
    audio,
    pendingMedia,
    pendingPhotos,
    pendingVideos,
  }
}

function getMigrationPhotoItems(profile: ModelProfile) {
  const legacyLockedUrls = new Set(
    (
      profile as ModelProfile & {
        lockedImageUrls?: unknown
      }
    ).lockedImageUrls instanceof Array
      ? (
          profile as ModelProfile & {
            lockedImageUrls: unknown[]
          }
        ).lockedImageUrls.filter(
          (url): url is string => typeof url === "string"
        )
      : []
  )

  return getProfilePhotoItems(profile).map((photo) => ({
    ...photo,
    isBlurred: photo.isBlurred || legacyLockedUrls.has(photo.url),
  }))
}

export function getLocalMigrationSnapshot(): LocalMigrationSnapshot {
  const users = getPersistedLocalUsers()
  const profiles = getPersistedLocalProfiles()
  const media = profiles.reduce(
    (total, profile) => {
      const current = countProfileMedia(profile)
      total.photos += current.photos
      total.stories += current.stories
      total.videos += current.videos
      total.audio += current.audio
      total.pendingMedia += current.pendingMedia
      return total
    },
    { photos: 0, stories: 0, videos: 0, audio: 0, pendingMedia: 0 }
  )

  return {
    users: users.length,
    profiles: profiles.length,
    ...media,
  }
}

function normalizedEmail(email: string) {
  return email.trim().toLowerCase()
}

function canCreateRemoteUser(user: DemoUser) {
  return Boolean(
    user.name?.trim() &&
      user.email?.trim() &&
      user.password &&
      user.password.length >= 6
  )
}

function backupLocalProfileForMigration(
  email: string,
  profile: ModelProfile
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("O navegador não oferece backup local via IndexedDB."))
      return
    }

    const openRequest = indexedDB.open(MIGRATION_BACKUP_DB, 1)
    openRequest.onerror = () =>
      reject(openRequest.error || new Error("Falha ao abrir o backup local."))
    openRequest.onupgradeneeded = () => {
      const database = openRequest.result
      if (!database.objectStoreNames.contains(MIGRATION_BACKUP_STORE)) {
        database.createObjectStore(MIGRATION_BACKUP_STORE, {
          keyPath: "email",
        })
      }
    }
    openRequest.onsuccess = () => {
      const database = openRequest.result
      const transaction = database.transaction(
        MIGRATION_BACKUP_STORE,
        "readwrite"
      )
      const store = transaction.objectStore(MIGRATION_BACKUP_STORE)
      const normalized = normalizedEmail(email)
      const readRequest = store.get(normalized)

      readRequest.onerror = () => transaction.abort()
      readRequest.onsuccess = () => {
        if (!readRequest.result) {
          store.put({
            email: normalized,
            profile,
            backedUpAt: new Date().toISOString(),
          })
        }
      }
      transaction.oncomplete = () => {
        database.close()
        resolve()
      }
      transaction.onerror = () => {
        database.close()
        reject(
          transaction.error ||
            new Error("Não foi possível preservar as mídias locais.")
        )
      }
      transaction.onabort = () => {
        database.close()
        reject(
          transaction.error ||
            new Error("Não foi possível preservar as mídias locais.")
        )
      }
    }
  })
}

type RemoteMediaWithUrl = ProfileMediaRecord & { url: string }

async function reuseMatchingRemoteMedia(
  profile: ModelProfile,
  remoteMedia: RemoteMediaWithUrl[]
): Promise<ModelProfile> {
  const usedRemoteIds = new Set<string>()

  const findMatch = async (
    url: string | undefined,
    mediaType: ProfileMediaRecord["media_type"]
  ) => {
    if (!isLocalMediaUrl(url) || !url) return null

    const blob = await fetch(url).then((response) => response.blob())
    const match = remoteMedia.find(
      (media) =>
        !usedRemoteIds.has(media.id) &&
        media.media_type === mediaType &&
        media.size_bytes === blob.size &&
        media.mime_type === blob.type
    )
    if (match) usedRemoteIds.add(match.id)
    return match || null
  }

  const photoItems = []
  for (const photo of getProfilePhotoItems(profile)) {
    const match = await findMatch(photo.url, "photo")
    photoItems.push(
      match
        ? { id: match.id, url: match.url, isBlurred: photo.isBlurred }
        : photo
    )
  }

  const stories = []
  for (const story of profile.stories || []) {
    const match = await findMatch(story.mediaUrl, "story")
    stories.push(
      match
        ? {
            ...story,
            id: match.id,
            mediaUrl: match.url,
            mediaType: match.mime_type.startsWith("video/")
              ? ("video" as const)
              : ("image" as const),
          }
        : story
    )
  }

  const voiceMatch = await findMatch(profile.voiceUrl, "audio")

  return {
    ...profile,
    photoItems,
    photos: photoItems.map((photo) => photo.url),
    coverImage: photoItems[0]?.url,
    stories,
    voiceUrl: voiceMatch?.url || profile.voiceUrl,
  }
}

export async function migrateLocalInfrastructure(
  onProgress?: (message: string) => void
): Promise<LocalMigrationReport> {
  const localUsers = getPersistedLocalUsers()
  const localProfiles = getPersistedLocalProfiles()
  const snapshot = getLocalMigrationSnapshot()
  const errors: string[] = []
  let createdUsers = 0
  let linkedUsers = 0
  let migratedProfiles = 0
  let migratedMedia = 0
  let migratedPhotos = 0
  let migratedVideos = 0

  if (!isRemoteDataEnabled() || !isRemoteMediaEnabled()) {
    throw new Error(
      "Ative os modos remotos de dados e mídia antes de iniciar a migração."
    )
  }

  onProgress?.("Carregando usuários do Supabase...")
  const remoteUsers = await listRemoteUsers()
  const remoteByEmail = new Map(
    remoteUsers.map((user) => [normalizedEmail(user.email), user])
  )

  for (const localUser of localUsers) {
    const email = normalizedEmail(localUser.email)
    if (remoteByEmail.has(email)) {
      linkedUsers += 1
      continue
    }

    if (!canCreateRemoteUser(localUser)) {
      errors.push(
        `${localUser.email}: conta ausente no Supabase e sem senha local válida para criação.`
      )
      continue
    }

    try {
      onProgress?.(`Criando conta ${localUser.email} no Supabase...`)
      const created = await createRemoteUser(localUser)
      remoteByEmail.set(email, created)
      createdUsers += 1
    } catch (error) {
      errors.push(
        `${localUser.email}: ${
          error instanceof Error ? error.message : "falha ao criar a conta"
        }`
      )
    }
  }

  for (const localProfile of localProfiles) {
    const email = normalizedEmail(localProfile.email)
    const remoteUser = remoteByEmail.get(email)
    if (!remoteUser?.id) {
      errors.push(
        `${localProfile.email}: perfil sem usuário correspondente no Supabase.`
      )
      continue
    }
    if (remoteUser.role !== "modelo") {
      errors.push(
        `${localProfile.email}: o usuário correspondente não possui papel de modelo.`
      )
      continue
    }

    try {
      const mediaBefore = countProfileMedia(localProfile)
      onProgress?.(`Migrando perfil e mídias de ${localProfile.email}...`)
      await backupLocalProfileForMigration(localProfile.email, localProfile)
      const remoteMedia = await listProfileMedia(remoteUser.id)
      const preparedProfile = await reuseMatchingRemoteMedia(
        {
          ...localProfile,
          photoItems: getMigrationPhotoItems(localProfile),
        },
        remoteMedia
      )
      const migratedProfile = await syncRemoteProfileMedia(
        remoteUser.id,
        preparedProfile,
        { preserveExisting: true }
      )
      const published = await saveRemoteProfile(
        remoteUser.id,
        migratedProfile
      )
      const cachedProfile: ModelProfile = {
        ...migratedProfile,
        publicId: published.publicId,
        email: localProfile.email,
      }
      if (!saveModelProfile(localProfile.email, cachedProfile)) {
        throw new Error(
          "O perfil foi publicado, mas o cache local não pôde ser atualizado."
        )
      }
      migratedProfiles += 1
      migratedMedia += mediaBefore.pendingMedia
      migratedPhotos += mediaBefore.pendingPhotos
      migratedVideos += mediaBefore.pendingVideos
    } catch (error) {
      errors.push(
        `${localProfile.email}: ${
          error instanceof Error ? error.message : "falha ao migrar o perfil"
        }`
      )
    }
  }

  onProgress?.("Migração concluída.")
  return {
    ...snapshot,
    createdUsers,
    linkedUsers,
    migratedProfiles,
    migratedMedia,
    migratedPhotos,
    migratedVideos,
    errors,
  }
}
