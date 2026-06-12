export const MEDIA_TYPES = [
  "photo",
  "story",
  "video",
  "audio",
  "document",
] as const

export type ProfileMediaType = (typeof MEDIA_TYPES)[number]
export type ProfileMediaVisibility = "public" | "subscriber" | "private"

export type ProfileMediaRecord = {
  id: string
  profile_id: string
  drive_file_id: string
  file_name: string
  mime_type: string
  size_bytes: number
  media_type: ProfileMediaType
  position: number
  visibility: ProfileMediaVisibility
  is_cover: boolean
  is_blurred: boolean
  status: "processing" | "ready" | "failed"
  expires_at: string | null
  created_at: string
  updated_at: string
}

export function getProfileMediaUrl(mediaId: string) {
  return `/api/media/${encodeURIComponent(mediaId)}`
}

export function isProfileMediaType(value: string): value is ProfileMediaType {
  return MEDIA_TYPES.includes(value as ProfileMediaType)
}

export function isProfileMediaVisibility(
  value: string
): value is ProfileMediaVisibility {
  return value === "public" || value === "subscriber" || value === "private"
}
