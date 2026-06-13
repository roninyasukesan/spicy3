import "server-only"

import { Readable } from "node:stream"
import { google, type drive_v3 } from "googleapis"

const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder"
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive"

let driveClient: drive_v3.Drive | null = null

export type GoogleDriveAuthMode = "service-account" | "oauth"

type GoogleDriveConfig = {
  authMode: GoogleDriveAuthMode
  rootFolderId: string
  driveId?: string
  clientEmail?: string
  privateKey?: string
  oauthClientId?: string
  oauthClientSecret?: string
  oauthRefreshToken?: string
}

function readGoogleDriveConfig() {
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
  const serviceAccountConfigured = Boolean(clientEmail && privateKey)
  const oauthConfigured = Boolean(
    oauthClientId && oauthClientSecret && oauthRefreshToken
  )

  return {
    clientEmail,
    privateKey,
    oauthClientId,
    oauthClientSecret,
    oauthRefreshToken,
    rootFolderId,
    driveId,
    serviceAccountConfigured,
    oauthConfigured,
  }
}

export function getGoogleDriveConfigStatus() {
  const config = readGoogleDriveConfig()
  const authMode: GoogleDriveAuthMode | null =
    config.serviceAccountConfigured
      ? "service-account"
      : config.oauthConfigured
        ? "oauth"
        : null
  const folderConfigured = Boolean(config.rootFolderId)

  return {
    configured: Boolean(authMode && folderConfigured),
    authMode,
    folderConfigured,
    serviceAccountConfigured: config.serviceAccountConfigured,
    oauthConfigured: config.oauthConfigured,
    sharedDriveConfigured: Boolean(config.driveId),
  }
}

function requireGoogleDriveConfig(): GoogleDriveConfig {
  const config = readGoogleDriveConfig()

  if (!config.rootFolderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is missing.")
  }

  if (
    config.serviceAccountConfigured &&
    config.clientEmail &&
    config.privateKey
  ) {
    return {
      authMode: "service-account",
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
      rootFolderId: config.rootFolderId,
      driveId: config.driveId,
    }
  }

  if (
    config.oauthConfigured &&
    config.oauthClientId &&
    config.oauthClientSecret &&
    config.oauthRefreshToken
  ) {
    return {
      authMode: "oauth",
      oauthClientId: config.oauthClientId,
      oauthClientSecret: config.oauthClientSecret,
      oauthRefreshToken: config.oauthRefreshToken,
      rootFolderId: config.rootFolderId,
      driveId: config.driveId,
    }
  }

  throw new Error(
    "Google Drive authentication is missing. Configure a service account or OAuth refresh token."
  )
}

export function getDriveClient() {
  if (!driveClient) {
    const config = requireGoogleDriveConfig()
    const auth =
      config.authMode === "service-account"
        ? new google.auth.JWT({
            email: config.clientEmail,
            key: config.privateKey,
            scopes: [DRIVE_SCOPE],
          })
        : new google.auth.OAuth2(
            config.oauthClientId,
            config.oauthClientSecret
          )

    if (config.authMode === "oauth") {
      auth.setCredentials({ refresh_token: config.oauthRefreshToken })
    }

    driveClient = google.drive({ version: "v3", auth })
  }

  return driveClient
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

async function getProfileFolderId(profileId: string) {
  const drive = getDriveClient()
  const { rootFolderId, driveId } = requireGoogleDriveConfig()
  const escapedProfileId = escapeDriveQueryValue(profileId)
  const escapedRootFolderId = escapeDriveQueryValue(rootFolderId)
  const response = await drive.files.list({
    q: `'${escapedRootFolderId}' in parents and mimeType = '${DRIVE_FOLDER_MIME_TYPE}' and trashed = false and appProperties has { key='profileId' and value='${escapedProfileId}' }`,
    fields: "files(id)",
    spaces: "drive",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    ...(driveId ? { corpora: "drive", driveId } : {}),
  })

  const existingFolderId = response.data.files?.[0]?.id
  if (existingFolderId) return existingFolderId

  const created = await drive.files.create({
    requestBody: {
      name: `profile-${profileId}`,
      mimeType: DRIVE_FOLDER_MIME_TYPE,
      parents: [rootFolderId],
      appProperties: { profileId },
    },
    fields: "id",
    supportsAllDrives: true,
  })

  if (!created.data.id) {
    throw new Error("Google Drive did not return the profile folder ID.")
  }

  return created.data.id
}

export async function verifyGoogleDriveConnection() {
  const drive = getDriveClient()
  const config = requireGoogleDriveConfig()
  const response = await drive.files.get({
    fileId: config.rootFolderId,
    fields: "id,name,mimeType,driveId,capabilities(canAddChildren)",
    supportsAllDrives: true,
  })

  if (response.data.mimeType !== DRIVE_FOLDER_MIME_TYPE) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID does not reference a folder.")
  }
  if (response.data.capabilities?.canAddChildren === false) {
    throw new Error("Google Drive credentials cannot add files to the folder.")
  }

  return {
    authMode: config.authMode,
    folderName: response.data.name || null,
    sharedDrive: Boolean(response.data.driveId || config.driveId),
  }
}

export type DriveUploadInput = {
  profileId: string
  fileName: string
  mimeType: string
  buffer: Buffer
  mediaType: string
}

export async function uploadDriveFile(input: DriveUploadInput) {
  const drive = getDriveClient()
  const folderId = await getProfileFolderId(input.profileId)
  const response = await drive.files.create({
    requestBody: {
      name: input.fileName,
      parents: [folderId],
      appProperties: {
        profileId: input.profileId,
        mediaType: input.mediaType,
      },
    },
    media: {
      mimeType: input.mimeType,
      body: Readable.from(input.buffer),
    },
    fields: "id,name,mimeType,size,createdTime",
    supportsAllDrives: true,
  })

  if (!response.data.id) {
    throw new Error("Google Drive did not return the uploaded file ID.")
  }

  return response.data
}

export async function deleteDriveFile(fileId: string) {
  const drive = getDriveClient()
  await drive.files.delete({
    fileId,
    supportsAllDrives: true,
  })
}

export async function getDriveFileMetadata(fileId: string) {
  const drive = getDriveClient()
  const response = await drive.files.get({
    fileId,
    fields: "id,name,mimeType,size,modifiedTime",
    supportsAllDrives: true,
  })
  return response.data
}

export async function streamDriveFile(fileId: string, range?: string | null) {
  const drive = getDriveClient()
  const response = await drive.files.get(
    {
      fileId,
      alt: "media",
      supportsAllDrives: true,
    },
    {
      responseType: "stream",
      headers: range ? { Range: range } : undefined,
    }
  )

  return {
    stream: response.data as Readable,
    headers: response.headers,
    status: response.status,
  }
}
