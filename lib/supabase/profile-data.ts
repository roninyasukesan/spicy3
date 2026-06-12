import type { ModelProfile } from "@/lib/local-auth"

type ProfileRow = Record<string, unknown>

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
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
  const characteristics =
    row.characteristics && typeof row.characteristics === "object"
      ? (row.characteristics as ModelProfile["characteristics"])
      : {
          hairColor: "",
          ethnicity: "",
          bodyType: "",
          height: "",
          age: "",
          eyes: "",
          breasts: "",
          tattoos: "",
          piercings: "",
        }
  const remotePhotos = media
    .filter((item) => item.media_type === "photo")
    .map((item) => ({
      id: String(item.id),
      url: `/api/media/${String(item.id)}`,
      isBlurred: Boolean(item.is_blurred),
    }))
  const storedItems = Array.isArray(row.gallery_items)
    ? (row.gallery_items as Array<Record<string, unknown>>)
        .filter((item) => typeof item.url === "string")
        .map((item, index) => ({
          id: String(item.id || `gallery-${index}`),
          url: String(item.url),
          isBlurred: Boolean(item.isBlurred),
        }))
    : []

  return {
    id: String(row.id),
    publicId: String(row.public_id),
    artisticName: String(row.display_name || row.name || "Perfil"),
    city: String(row.city || ""),
    age: row.age == null ? "" : String(row.age),
    bio: String(row.bio || ""),
    services: stringArray(row.services),
    fetishes: stringArray(row.fetishes),
    exclusions: stringArray(row.exclusions),
    priceRange: String(row.price_range || row.price || ""),
    characteristics,
    photoItems: remotePhotos.length > 0 ? remotePhotos : storedItems,
    stories: Array.isArray(row.stories) ? row.stories : [],
  }
}
