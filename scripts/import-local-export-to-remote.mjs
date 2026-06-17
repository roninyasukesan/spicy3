import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { Readable } from "node:stream"
import { google } from "googleapis"
import { createClient } from "@supabase/supabase-js"

const cwd = process.cwd()
const exportPath =
  process.argv[2] || "C:\\Users\\hakun\\Downloads\\spicy-export-2026-06-17.json"
const reportDir = path.join(cwd, "output")
const localAssetBaseUrl = process.env.LOCAL_ASSET_BASE_URL || "http://localhost:3000"
const preserveExisting = !process.argv.includes("--replace-existing")
const onlyEmails = (
  process.argv.find((arg) => arg.startsWith("--only="))?.slice("--only=".length) ||
  ""
)
  .split(",")
  .map((email) => normalizeEmail(email))
  .filter(Boolean)

loadEnvFile(path.join(cwd, ".env.local"))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase admin credentials are missing in .env.local.")
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const driveContext = createDriveContext()
const exportData = JSON.parse(fs.readFileSync(exportPath, "utf8"))

fs.mkdirSync(reportDir, { recursive: true })

const report = {
  exportPath,
  preserveExisting,
  usersCreated: 0,
  usersUpdated: 0,
  profilesMigrated: 0,
  mediaUploaded: 0,
  mediaReused: 0,
  mediaRetained: 0,
  passwordOverrides: [],
  errors: [],
  profiles: [],
}

await migrate()
writeReports()

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/)
  for (const line of lines) {
    if (!line || /^\s*#/.test(line) || !line.includes("=")) continue
    const separatorIndex = line.indexOf("=")
    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1)
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase()
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function databaseRole(role) {
  if (role === "modelo") return "model"
  if (role === "cliente") return "client"
  return "admin"
}

function databasePlan(plan) {
  return plan === "vip" ? "gold" : "free"
}

function applicationMediaUrl(id) {
  return `/api/media/${id}`
}

function getRemoteMediaId(url) {
  if (!url) return null
  const match = String(url).match(/^\/api\/media\/([0-9a-f-]{36})$/i)
  return match?.[1] || null
}

function extensionForMimeType(mimeType) {
  if (mimeType === "image/png") return "png"
  if (mimeType === "image/webp") return "webp"
  if (mimeType === "image/svg+xml") return "svg"
  if (mimeType === "image/gif") return "gif"
  if (mimeType === "video/mp4") return "mp4"
  if (mimeType === "video/webm") return "webm"
  if (mimeType === "audio/mpeg") return "mp3"
  if (mimeType === "audio/ogg") return "ogg"
  if (mimeType === "audio/wav" || mimeType === "audio/x-wav") return "wav"
  return mimeType.startsWith("image/") ? "jpg" : "bin"
}

function sanitizeFileName(name) {
  return String(name || "file")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120)
}

function createPassword(email, originalPassword) {
  const password = String(originalPassword || "")
  if (password.length >= 6) {
    return { password, generated: false }
  }

  const slug = normalizeEmail(email).split("@")[0].replace(/[^a-z0-9]/gi, "")
  const digest = crypto
    .createHash("sha1")
    .update(normalizeEmail(email))
    .digest("hex")
    .slice(0, 6)

  return {
    password: `Spicy!${slug.slice(0, 8) || "user"}${digest}`,
    generated: true,
  }
}

function parseDataUrl(url) {
  const match = String(url).match(/^data:([^;,]+)?(;base64)?,([\s\S]+)$/)
  if (!match) {
    throw new Error("Invalid data URL.")
  }

  const mimeType = match[1] || "application/octet-stream"
  const encoded = match[3] || ""
  const buffer = match[2]
    ? Buffer.from(encoded, "base64")
    : Buffer.from(decodeURIComponent(encoded), "utf8")

  return { buffer, mimeType }
}

async function readMediaSource(url) {
  if (!url) throw new Error("Media URL is empty.")

  if (url.startsWith("data:")) {
    return parseDataUrl(url)
  }

  if (url.startsWith("/api/media/")) {
    throw new Error("Remote media URLs should be handled before fetch.")
  }

  const resolvedUrl = url.startsWith("http://") || url.startsWith("https://")
    ? url
    : `${localAssetBaseUrl}${url.startsWith("/") ? "" : "/"}${url}`
  const response = await fetch(resolvedUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${resolvedUrl}: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const contentType =
    response.headers.get("content-type") || "application/octet-stream"
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: contentType.split(";")[0].trim(),
  }
}

function normalizePhotoItems(profile) {
  const legacyLockedUrls = new Set(
    Array.isArray(profile.lockedImageUrls)
      ? profile.lockedImageUrls.filter((value) => typeof value === "string")
      : []
  )
  const rawItems = Array.isArray(profile.photoItems)
    ? profile.photoItems
    : Array.isArray(profile.photos)
      ? profile.photos.map((url, index) => ({
          id: `photo-${index + 1}`,
          url,
        }))
      : []

  return rawItems
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      id: String(item.id || `photo-${index + 1}`),
      url: String(item.url || item),
      isBlurred: Boolean(item.isBlurred || legacyLockedUrls.has(item.url)),
      mediaType: item.mediaType === "video" ? "video" : "image",
    }))
    .filter((item) => item.url)
}

function normalizeStories(profile) {
  return Array.isArray(profile.stories)
    ? profile.stories
        .filter((story) => story && typeof story === "object" && story.mediaUrl)
        .map((story, index) => ({
          id: String(story.id || `story-${index + 1}`),
          mediaUrl: String(story.mediaUrl),
          mediaType: story.mediaType === "video" ? "video" : "image",
          duration: Number(story.duration || 5),
          createdAt: String(story.createdAt || new Date().toISOString()),
          isBlurred: Boolean(story.isBlurred),
        }))
    : []
}

function profileUpdateFromModel(profile) {
  const parsedAge = Number.parseInt(String(profile.age || ""), 10)

  return {
    name: profile.artisticName,
    display_name: profile.artisticName,
    phone: String(profile.phone || ""),
    city: String(profile.city || ""),
    age: Number.isFinite(parsedAge) ? parsedAge : null,
    bio: String(profile.bio || ""),
    services: Array.isArray(profile.services) ? profile.services : [],
    fetishes: Array.isArray(profile.fetishes) ? profile.fetishes : [],
    exclusions: Array.isArray(profile.exclusions) ? profile.exclusions : [],
    price: String(profile.priceRange || ""),
    price_range: String(profile.priceRange || ""),
    characteristics:
      profile.characteristics && typeof profile.characteristics === "object"
        ? profile.characteristics
        : {},
    gallery: profile.photoItems.map((photo) => photo.url),
    gallery_items: profile.photoItems,
    stories: profile.stories,
    voice_url: profile.voiceUrl || null,
  }
}

function createDriveContext() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = (
    process.env.GOOGLE_PRIVATE_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  )?.replace(/\\n/g, "\n")
  const oauthClientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const oauthClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const oauthRefreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  const driveId = process.env.GOOGLE_DRIVE_ID || undefined

  if (!rootFolderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is missing in .env.local.")
  }

  const auth =
    clientEmail && privateKey
      ? new google.auth.JWT({
          email: clientEmail,
          key: privateKey,
          scopes: ["https://www.googleapis.com/auth/drive"],
        })
      : oauthClientId && oauthClientSecret && oauthRefreshToken
        ? new google.auth.OAuth2(oauthClientId, oauthClientSecret)
        : null

  if (!auth) {
    throw new Error(
      "Google Drive credentials are missing in .env.local."
    )
  }

  if ("setCredentials" in auth && oauthRefreshToken) {
    auth.setCredentials({ refresh_token: oauthRefreshToken })
  }

  return {
    drive: google.drive({ version: "v3", auth }),
    rootFolderId,
    driveId,
    folderCache: new Map(),
  }
}

function escapeDriveQueryValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

async function getProfileFolderId(profileId) {
  if (driveContext.folderCache.has(profileId)) {
    return driveContext.folderCache.get(profileId)
  }

  const escapedProfileId = escapeDriveQueryValue(profileId)
  const escapedRootFolderId = escapeDriveQueryValue(driveContext.rootFolderId)
  const response = await driveContext.drive.files.list({
    q: `'${escapedRootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false and appProperties has { key='profileId' and value='${escapedProfileId}' }`,
    fields: "files(id)",
    spaces: "drive",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    ...(driveContext.driveId
      ? { corpora: "drive", driveId: driveContext.driveId }
      : {}),
  })

  const existingFolderId = response.data.files?.[0]?.id
  if (existingFolderId) {
    driveContext.folderCache.set(profileId, existingFolderId)
    return existingFolderId
  }

  const created = await driveContext.drive.files.create({
    requestBody: {
      name: `profile-${profileId}`,
      mimeType: "application/vnd.google-apps.folder",
      parents: [driveContext.rootFolderId],
      appProperties: { profileId },
    },
    fields: "id",
    supportsAllDrives: true,
  })

  const createdId = created.data.id
  if (!createdId) {
    throw new Error(`Drive folder was not created for profile ${profileId}.`)
  }

  driveContext.folderCache.set(profileId, createdId)
  return createdId
}

async function uploadDriveFile({ profileId, mediaType, buffer, mimeType, fileName }) {
  const folderId = await getProfileFolderId(profileId)
  let lastError = null

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await driveContext.drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
          appProperties: {
            profileId,
            mediaType,
          },
        },
        media: {
          mimeType,
          body: Readable.from(buffer),
        },
        fields: "id,name,mimeType,size,createdTime",
        supportsAllDrives: true,
      })

      if (!response.data.id) {
        throw new Error(`Drive upload did not return an id for ${fileName}.`)
      }

      return response.data
    } catch (error) {
      lastError = error
      if (attempt === 3) break
      await delay(1000 * attempt)
    }
  }

  throw lastError || new Error(`Drive upload failed for ${fileName}.`)
}

async function listRemoteUsers() {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (error) throw error
  return data.users || []
}

async function ensureRemoteUsers() {
  const exportedUsers = Array.isArray(exportData.storage?.users)
    ? exportData.storage.users
    : []
  const remoteUsers = await listRemoteUsers()
  const remoteByEmail = new Map(
    remoteUsers.map((user) => [normalizeEmail(user.email), user])
  )
  const profileByEmail = new Map()

  for (const inputUser of exportedUsers) {
    const normalized = normalizeEmail(inputUser.email)
    if (!normalized) continue

    const role = databaseRole(inputUser.role)
    const planTier = databasePlan(inputUser.plan || "free")
    const passwordInfo = createPassword(normalized, inputUser.password)
    let remoteUser = remoteByEmail.get(normalized)

    if (!remoteUser) {
      const created = await supabase.auth.admin.createUser({
        email: normalized,
        password: passwordInfo.password,
        email_confirm: true,
        app_metadata: {
          role,
          plan_tier: planTier,
        },
        user_metadata: {
          display_name: inputUser.name,
        },
      })

      if (created.error || !created.data.user) {
        throw created.error || new Error(`Failed to create ${normalized}.`)
      }

      remoteUser = created.data.user
      remoteByEmail.set(normalized, remoteUser)
      report.usersCreated += 1
      if (passwordInfo.generated) {
        report.passwordOverrides.push({
          email: normalized,
          password: passwordInfo.password,
        })
      }
    } else {
      const currentRole = remoteUser.app_metadata?.role
      const currentPlan = remoteUser.app_metadata?.plan_tier
      const currentName = remoteUser.user_metadata?.display_name
      if (
        currentRole !== role ||
        currentPlan !== planTier ||
        String(currentName || "") !== String(inputUser.name || "")
      ) {
        const updated = await supabase.auth.admin.updateUserById(remoteUser.id, {
          app_metadata: {
            ...(remoteUser.app_metadata || {}),
            role,
            plan_tier: planTier,
          },
          user_metadata: {
            ...(remoteUser.user_metadata || {}),
            display_name: inputUser.name,
          },
        })

        if (updated.error) throw updated.error
        remoteUser = updated.data.user || remoteUser
        remoteByEmail.set(normalized, remoteUser)
        report.usersUpdated += 1
      }
    }

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: remoteUser.id,
        user_id: remoteUser.id,
        email: normalized,
        role,
        name: inputUser.name,
        display_name: inputUser.name,
        plan_tier: inputUser.role === "cliente" ? planTier : null,
      })
      .select("id,public_id,email,role")
      .single()

    if (profileError) throw profileError
    profileByEmail.set(normalized, {
      user: remoteUser,
      profile: profileRow,
    })
  }

  return profileByEmail
}

async function listRemoteMedia(profileId) {
  const { data, error } = await supabase
    .from("profile_media")
    .select("*")
    .eq("profile_id", profileId)
    .eq("status", "ready")
    .order("position", { ascending: true })

  if (error) throw error

  return (data || []).map((media) => ({
    ...media,
    url: applicationMediaUrl(media.id),
  }))
}

function findReusableRemoteMedia(remoteMedia, usedIds, mediaType, mimeType, sizeBytes) {
  return (
    remoteMedia.find(
      (media) =>
        !usedIds.has(media.id) &&
        media.media_type === mediaType &&
        Number(media.size_bytes || 0) === Number(sizeBytes || 0) &&
        String(media.mime_type || "") === String(mimeType || "")
    ) || null
  )
}

async function createRemoteMedia({
  profileId,
  buffer,
  mimeType,
  mediaType,
  isBlurred,
  fileStem,
}) {
  const extension = extensionForMimeType(mimeType)
  const fileName = sanitizeFileName(`${fileStem}.${extension}`)
  const driveFile = await uploadDriveFile({
    profileId,
    mediaType,
    buffer,
    mimeType,
    fileName: `${Date.now()}-${fileName}`,
  })

  const { data, error } = await supabase
    .from("profile_media")
    .insert({
      profile_id: profileId,
      drive_file_id: driveFile.id,
      file_name: driveFile.name || fileName,
      mime_type: driveFile.mimeType || mimeType,
      size_bytes: Number(driveFile.size || buffer.byteLength),
      media_type: mediaType,
      position: 0,
      visibility: "public",
      is_cover: false,
      is_blurred: Boolean(isBlurred),
      status: "ready",
    })
    .select("*")
    .single()

  if (error) throw error

  report.mediaUploaded += 1
  return {
    ...data,
    url: applicationMediaUrl(data.id),
  }
}

async function resolveRemoteMedia({
  profileId,
  remoteMedia,
  usedIds,
  sourceId,
  sourceUrl,
  mediaType,
  isBlurred,
  fileStem,
}) {
  const explicitRemoteId =
    sourceId && remoteMedia.some((media) => media.id === sourceId)
      ? sourceId
      : getRemoteMediaId(sourceUrl)
  if (explicitRemoteId) {
    const existing = remoteMedia.find((media) => media.id === explicitRemoteId)
    if (existing) {
      usedIds.add(existing.id)
      report.mediaRetained += 1
      return {
        ...existing,
        url: applicationMediaUrl(existing.id),
        is_blurred: Boolean(isBlurred),
      }
    }
  }

  const { buffer, mimeType } = await readMediaSource(sourceUrl)
  const reusable = findReusableRemoteMedia(
    remoteMedia,
    usedIds,
    mediaType,
    mimeType,
    buffer.byteLength
  )
  if (reusable) {
    usedIds.add(reusable.id)
    report.mediaReused += 1
    return {
      ...reusable,
      url: applicationMediaUrl(reusable.id),
      is_blurred: Boolean(isBlurred),
    }
  }

  const created = await createRemoteMedia({
    profileId,
    buffer,
    mimeType,
    mediaType,
    isBlurred,
    fileStem,
  })
  usedIds.add(created.id)
  return created
}

async function updateRemoteMediaMetadata(items) {
  for (const item of items) {
    if (!item.id) continue
    const { error } = await supabase
      .from("profile_media")
      .update({
        position: item.position,
        is_blurred: Boolean(item.isBlurred),
        is_cover: Boolean(item.isCover),
        visibility: "public",
      })
      .eq("id", item.id)

    if (error) throw error
  }
}

async function syncGallery(profileId, profile, remoteMedia) {
  const localPhotos = normalizePhotoItems(profile)
  const galleryRemote = remoteMedia.filter(
    (media) => media.media_type === "photo" || media.media_type === "video"
  )
  const usedIds = new Set()
  const finalItems = []

  for (const [index, photo] of localPhotos.entries()) {
    const resolved = await resolveRemoteMedia({
      profileId,
      remoteMedia: galleryRemote,
      usedIds,
      sourceId: photo.id,
      sourceUrl: photo.url,
      mediaType: photo.mediaType === "video" ? "video" : "photo",
      isBlurred: photo.isBlurred,
      fileStem:
        photo.mediaType === "video"
          ? `gallery-video-${index + 1}`
          : `gallery-photo-${index + 1}`,
    })

    finalItems.push({
      id: resolved.id,
      url: applicationMediaUrl(resolved.id),
      isBlurred: Boolean(photo.isBlurred),
      mediaType: resolved.mime_type.startsWith("video/") ? "video" : "image",
    })
  }

  if (preserveExisting) {
    for (const media of galleryRemote) {
      if (usedIds.has(media.id)) continue
      usedIds.add(media.id)
      finalItems.push({
        id: media.id,
        url: applicationMediaUrl(media.id),
        isBlurred: Boolean(media.is_blurred),
        mediaType: media.mime_type.startsWith("video/") ? "video" : "image",
      })
    }
  }

  const coverId =
    finalItems.find((item) => item.mediaType !== "video")?.id || null
  const { error: clearCoverError } = await supabase
    .from("profile_media")
    .update({ is_cover: false })
    .eq("profile_id", profileId)
  if (clearCoverError) throw clearCoverError
  await updateRemoteMediaMetadata(
    finalItems.map((item, position) => ({
      id: item.id,
      position,
      isBlurred: item.isBlurred,
      isCover: item.id === coverId,
    }))
  )

  return finalItems
}

async function syncStories(profileId, profile, remoteMedia) {
  const localStories = normalizeStories(profile)
  const remoteStories = remoteMedia.filter((media) => media.media_type === "story")
  const usedIds = new Set()
  const finalStories = []

  for (const [index, story] of localStories.entries()) {
    const resolved = await resolveRemoteMedia({
      profileId,
      remoteMedia: remoteStories,
      usedIds,
      sourceId: story.id,
      sourceUrl: story.mediaUrl,
      mediaType: "story",
      isBlurred: story.isBlurred,
      fileStem:
        story.mediaType === "video"
          ? `story-video-${index + 1}`
          : `story-image-${index + 1}`,
    })

    finalStories.push({
      id: resolved.id,
      mediaUrl: applicationMediaUrl(resolved.id),
      mediaType: resolved.mime_type.startsWith("video/") ? "video" : "image",
      duration: story.duration,
      createdAt: story.createdAt,
      isBlurred: Boolean(story.isBlurred),
    })
  }

  if (preserveExisting) {
    for (const media of remoteStories) {
      if (usedIds.has(media.id)) continue
      usedIds.add(media.id)
      finalStories.push({
        id: media.id,
        mediaUrl: applicationMediaUrl(media.id),
        mediaType: media.mime_type.startsWith("video/") ? "video" : "image",
        duration: 5,
        createdAt: media.created_at,
        isBlurred: Boolean(media.is_blurred),
      })
    }
  }

  await updateRemoteMediaMetadata(
    finalStories.map((story, position) => ({
      id: story.id,
      position,
      isBlurred: story.isBlurred,
      isCover: false,
    }))
  )

  return finalStories
}

async function syncVoice(profileId, profile, remoteMedia) {
  const remoteAudio = remoteMedia.filter((media) => media.media_type === "audio")
  const voiceUrl = typeof profile.voiceUrl === "string" ? profile.voiceUrl : ""
  const usedIds = new Set()

  if (!voiceUrl) {
    if (preserveExisting && remoteAudio[0]) {
      report.mediaRetained += 1
      return applicationMediaUrl(remoteAudio[0].id)
    }
    return undefined
  }

  const resolved = await resolveRemoteMedia({
    profileId,
    remoteMedia: remoteAudio,
    usedIds,
    sourceId: null,
    sourceUrl: voiceUrl,
    mediaType: "audio",
    isBlurred: false,
    fileStem: "voice-presentation",
  })

  await updateRemoteMediaMetadata([
    {
      id: resolved.id,
      position: 0,
      isBlurred: false,
      isCover: false,
    },
  ])

  return applicationMediaUrl(resolved.id)
}

async function migrateProfile(profile, remoteUserRecord) {
  const profileId = remoteUserRecord.user.id
  const remoteMedia = await listRemoteMedia(profileId)
  const photoItems = await syncGallery(profileId, profile, remoteMedia)
  const stories = await syncStories(profileId, profile, remoteMedia)
  const voiceUrl = await syncVoice(profileId, profile, remoteMedia)

  const publishedProfile = {
    artisticName: String(profile.artisticName || remoteUserRecord.user.user_metadata?.display_name || remoteUserRecord.profile.email),
    phone: String(profile.phone || ""),
    city: String(profile.city || ""),
    age: String(profile.age || ""),
    bio: String(profile.bio || ""),
    services: Array.isArray(profile.services) ? profile.services : [],
    fetishes: Array.isArray(profile.fetishes) ? profile.fetishes : [],
    exclusions: Array.isArray(profile.exclusions) ? profile.exclusions : [],
    priceRange: String(profile.priceRange || ""),
    characteristics:
      profile.characteristics && typeof profile.characteristics === "object"
        ? profile.characteristics
        : {},
    photoItems,
    photos: photoItems.map((item) => item.url),
    coverImage: photoItems[0]?.url || "",
    stories,
    voiceUrl,
  }

  const { error } = await supabase
    .from("profiles")
    .update(profileUpdateFromModel(publishedProfile))
    .eq("id", profileId)

  if (error) throw error

  report.profilesMigrated += 1
  report.profiles.push({
    email: normalizeEmail(profile.email),
    profileId,
    photos: photoItems.length,
    stories: stories.length,
    hasVoice: Boolean(voiceUrl),
  })
}

async function migrate() {
  const profileByEmail = await ensureRemoteUsers()
  const exportedProfiles = Array.isArray(exportData.storage?.profiles)
    ? exportData.storage.profiles
    : []

  for (const profile of exportedProfiles) {
    const normalized = normalizeEmail(profile.email)
    if (onlyEmails.length > 0 && !onlyEmails.includes(normalized)) continue
    const remoteUserRecord = profileByEmail.get(normalized)
    if (!remoteUserRecord) {
      report.errors.push(`${normalized}: remote user was not created.`)
      continue
    }
    if (remoteUserRecord.profile.role !== "model") {
      report.errors.push(`${normalized}: remote profile role is not model.`)
      continue
    }

    try {
      console.log(`Migrating ${normalized}...`)
      await migrateProfile(profile, remoteUserRecord)
    } catch (error) {
      report.errors.push(
        `${normalized}: ${
          error instanceof Error
            ? error.stack || error.message
            : JSON.stringify(error)
        }`
      )
    }
  }
}

function writeReports() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const reportPath = path.join(reportDir, `remote-import-report-${stamp}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  if (report.passwordOverrides.length > 0) {
    const csvPath = path.join(
      reportDir,
      `remote-import-password-overrides-${stamp}.csv`
    )
    const csv = [
      "email,password",
      ...report.passwordOverrides.map(
        (item) => `${item.email},${item.password}`
      ),
    ].join("\n")
    fs.writeFileSync(csvPath, csv)
    console.log(`Password overrides written to ${csvPath}`)
  }

  console.log(`Report written to ${reportPath}`)
  console.log(
    JSON.stringify(
      {
        usersCreated: report.usersCreated,
        usersUpdated: report.usersUpdated,
        profilesMigrated: report.profilesMigrated,
        mediaUploaded: report.mediaUploaded,
        mediaReused: report.mediaReused,
        mediaRetained: report.mediaRetained,
        errors: report.errors.length,
      },
      null,
      2
    )
  )
}
