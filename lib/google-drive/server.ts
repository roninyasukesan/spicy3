import "server-only"

import { Readable } from "node:stream"
import { google, type drive_v3 } from "googleapis"

const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder"

let driveClient: drive_v3.Drive | null = null

function requireGoogleDriveConfig() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  if (!clientEmail || !privateKey || !rootFolderId) {
    throw new Error("Google Drive service account configuration is missing.")
  }

  return {
    clientEmail,
    privateKey,
    rootFolderId,
    driveId: process.env.GOOGLE_DRIVE_ID || undefined,
  }
}

function getDriveClient() {
  if (!driveClient) {
    const { clientEmail, privateKey } = requireGoogleDriveConfig()
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/drive"],
    })
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
