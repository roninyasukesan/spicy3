import type { Model } from "@/components/model-details-modal"
import type { ModelPhoto, ModelProfile } from "@/lib/local-auth"
import { getProfileCoverImage, getProfilePhotoItems, getProfilePhotoUrls } from "@/lib/local-auth"

export function mapLocalProfileToModel(profile: ModelProfile & { email: string }): Model {
  const galleryItems = getProfilePhotoItems(profile)

  return {
    id: profile.email,
    name: profile.artisticName,
    city: profile.city,
    price: profile.priceRange,
    imageUrl: getProfileCoverImage(profile) || "/placeholder.svg?height=400&width=300",
    age: parseInt(profile.age) || 20,
    rating: 5,
    reviews: 0,
    isVerified: true,
    bio: profile.bio,
    services: profile.services,
    fetishes: profile.fetishes,
    gallery: getProfilePhotoUrls(profile),
    galleryItems,
    stories: profile.stories || [],
    characteristics: {
      hairColor: profile.characteristics.hairColor,
      ethnicity: profile.characteristics.ethnicity,
      bodyType: profile.characteristics.bodyType,
      height: profile.characteristics.height,
      ageRange: profile.characteristics.age,
      eyes: profile.characteristics.eyes,
      breasts: profile.characteristics.breasts,
      tattoos: profile.characteristics.tattoos,
      piercings: profile.characteristics.piercings,
    },
  }
}

export function getGalleryItemsFromModel(model: Pick<Model, "gallery" | "galleryItems" | "imageUrl">): ModelPhoto[] {
  if (model.galleryItems && model.galleryItems.length > 0) {
    return model.galleryItems
  }

  if (model.gallery && model.gallery.length > 0) {
    return model.gallery.map((url, index) => ({
      id: `gallery-${index}-${url.slice(0, 12)}`,
      url,
      isBlurred: false,
    }))
  }

  return [
    {
      id: "cover-fallback",
      url: model.imageUrl,
      isBlurred: false,
    },
  ]
}
