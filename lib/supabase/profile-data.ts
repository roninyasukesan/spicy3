import type { ModelProfile } from "@/lib/local-auth"

type ProfileRow = Record<string, unknown>

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function normalizeCharacteristics(
  value: unknown
): ModelProfile["characteristics"] {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {}

  const read = (key: string) =>
    typeof source[key] === "string" ? String(source[key]) : ""

  return {
    hairColor: read("hairColor"),
    ethnicity: read("ethnicity"),
    bodyType: read("bodyType"),
    height: read("height"),
    age: read("age") || read("ageRange"),
    eyes: read("eyes"),
    breasts: read("breasts"),
    tattoos: read("tattoos"),
    piercings: read("piercings"),
  }
}

export function profileUpdateFromModel(profile: ModelProfile) {
  const age = Number.parseInt(profile.age, 10)
  const gallery = (profile.photoItems || [])
    .map((photo) => photo.url)
    .filter((url) => !url.startsWith("data:") && !url.startsWith("blob:"))

  return {
    name: profile.artisticName,
    display_name: profile.artisticName,
    phone: profile.phone,
    city: profile.city,
    age: Number.isFinite(age) ? age : null,
    bio: profile.bio,
    services: profile.services,
    fetishes: profile.fetishes,
    exclusions: profile.exclusions,
    price: profile.priceRange,
    price_range: profile.priceRange,
    characteristics: profile.characteristics,
    gallery,
    gallery_items: (profile.photoItems || []).filter(
      (photo) => !photo.url.startsWith("data:") && !photo.url.startsWith("blob:")
    ),
    stories: (profile.stories || []).filter(
      (story) =>
        !story.mediaUrl.startsWith("data:") && !story.mediaUrl.startsWith("blob:")
    ),
    voice_url:
      profile.voiceUrl &&
      !profile.voiceUrl.startsWith("data:") &&
      !profile.voiceUrl.startsWith("blob:")
        ? profile.voiceUrl
        : null,
  }
}

export function serializePublishedProfile(
  row: ProfileRow,
  media: Array<Record<string, unknown>> = []
) {
  const characteristics = normalizeCharacteristics(row.characteristics)
  const remoteGalleryItems = media
    .filter((item) => item.media_type === "photo" || item.media_type === "video")
    .map((item) => ({
      id: String(item.id),
      url: `/api/media/${String(item.id)}`,
      isBlurred: Boolean(item.is_blurred),
      mediaType: String(item.mime_type || "").startsWith("video/")
        ? ("video" as const)
        : ("image" as const),
    }))
  const remoteStories = media
    .filter((item) => item.media_type === "story")
    .map((item) => ({
      id: String(item.id),
      mediaUrl: `/api/media/${String(item.id)}`,
      mediaType: String(item.mime_type || "").startsWith("video/")
        ? ("video" as const)
        : ("image" as const),
      duration: 5,
      createdAt: String(item.created_at || new Date(0).toISOString()),
      isBlurred: Boolean(item.is_blurred),
    }))
  const remoteAudio = media.find((item) => item.media_type === "audio")
  const storedItems = Array.isArray(row.gallery_items)
    ? (row.gallery_items as Array<Record<string, unknown>>)
        .filter((item) => typeof item.url === "string")
        .map((item, index) => ({
          id: String(item.id || `gallery-${index}`),
          url: String(item.url),
          isBlurred: Boolean(item.isBlurred),
          mediaType: item.mediaType === "video" ? ("video" as const) : ("image" as const),
        }))
    : []

  return {
    id: String(row.id),
    publicId:
      typeof row.public_id === "string" && String(row.public_id).trim()
        ? String(row.public_id)
        : undefined,
    artisticName: String(row.display_name || row.name || "Perfil"),
    city: String(row.city || ""),
    age: row.age == null ? "" : String(row.age),
    bio: String(row.bio || ""),
    services: stringArray(row.services),
    fetishes: stringArray(row.fetishes),
    exclusions: stringArray(row.exclusions),
    priceRange: String(row.price_range || row.price || ""),
    characteristics,
    photoItems: remoteGalleryItems.length > 0 ? remoteGalleryItems : storedItems,
    stories:
      remoteStories.length > 0
        ? remoteStories
        : Array.isArray(row.stories)
          ? row.stories
          : [],
    voiceUrl: remoteAudio
      ? `/api/media/${String(remoteAudio.id)}`
      : typeof row.voice_url === "string"
        ? row.voice_url
        : undefined,
  }
}
