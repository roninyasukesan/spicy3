"use client"

import {
  getAllLocalProfiles,
  type DemoUser,
  type ModelPhoto,
  type ModelProfile,
  type Story,
} from "@/lib/local-auth"
import { supabase } from "@/lib/supabase"

export type PublishedProfile = {
  id: string
  publicId: string
  artisticName: string
  city: string
  age: string
  bio: string
  services: string[]
  fetishes: string[]
  exclusions: string[]
  priceRange: string
  characteristics: ModelProfile["characteristics"]
  photoItems: ModelPhoto[]
  stories: Story[]
  voiceUrl?: string
}

export function isRemoteDataEnabled() {
  return process.env.NEXT_PUBLIC_REMOTE_DATA_ENABLED === "true"
}

export type ProfileSource = ModelProfile & { email: string }

function normalizeCharacteristics(
  value?: Partial<ModelProfile["characteristics"]> & { ageRange?: string }
): ModelProfile["characteristics"] {
  return {
    hairColor: value?.hairColor || "",
    ethnicity: value?.ethnicity || "",
    bodyType: value?.bodyType || "",
    height: value?.height || "",
    age: value?.age || value?.ageRange || "",
    eyes: value?.eyes || "",
    breasts: value?.breasts || "",
    tattoos: value?.tattoos || "",
    piercings: value?.piercings || "",
  }
}

export function mapPublishedProfileToSource(
  published: PublishedProfile
): ProfileSource {
  return {
    publicId: published.publicId,
    artisticName: published.artisticName,
    phone: "",
    city: published.city,
    age: published.age,
    bio: published.bio,
    services: published.services,
    fetishes: published.fetishes,
    exclusions: published.exclusions,
    priceRange: published.priceRange,
    characteristics: normalizeCharacteristics(published.characteristics),
    photos: published.photoItems.map((photo) => photo.url),
    photoItems: published.photoItems,
    coverImage: published.photoItems[0]?.url,
    voiceUrl: published.voiceUrl,
    email: published.id,
    stories: published.stories,
  }
}

export function dedupeProfileSources(
  profileSources: ProfileSource[]
): ProfileSource[] {
  return Array.from(
    new Map(
      profileSources.map((candidate) => [
        candidate.publicId || candidate.email,
        candidate,
      ])
    ).values()
  )
}

export async function loadProfileSources(): Promise<ProfileSource[]> {
  if (isRemoteDataEnabled()) {
    try {
      const publishedProfiles = await fetchPublishedProfiles()
      return dedupeProfileSources(
        publishedProfiles.map(mapPublishedProfileToSource)
      )
    } catch (error) {
      console.error("Failed to load published profiles, using local cache:", error)
    }
  }

  return dedupeProfileSources(getAllLocalProfiles())
}

async function authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) {
    throw new Error(
      "A sessão atual é local. Entre com uma conta do Supabase para publicar alterações."
    )
  }

  return fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

async function readPayload(response: Response) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || "A operação remota não pôde ser concluída.")
  }
  return payload
}

export async function saveRemoteProfile(profileId: string, profile: ModelProfile) {
  const response = await authorizedFetch(
    `/api/profiles/${encodeURIComponent(profileId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    }
  )
  const payload = await readPayload(response)
  return payload.profile as PublishedProfile
}

export async function fetchPublishedProfiles(): Promise<PublishedProfile[]> {
  if (!isRemoteDataEnabled()) return []

  const response = await fetch("/api/profiles", { cache: "no-store" })
  const payload = await readPayload(response)
  return (payload.profiles || []) as PublishedProfile[]
}

export async function fetchPublishedProfile(profileId: string) {
  if (!isRemoteDataEnabled()) return null

  const response = await fetch(
    `/api/profiles/${encodeURIComponent(profileId)}`,
    { cache: "no-store" }
  )
  const payload = await readPayload(response)
  return payload.profile as PublishedProfile
}

export async function createRemoteUser(user: DemoUser) {
  const response = await authorizedFetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  })
  const payload = await readPayload(response)
  return payload.user as DemoUser
}

export async function listRemoteUsers() {
  const response = await authorizedFetch("/api/admin/users")
  const payload = await readPayload(response)
  return (payload.users || []) as DemoUser[]
}

export async function deleteRemoteUser(userId: string) {
  const response = await authorizedFetch(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  )
  await readPayload(response)
}

export async function updateRemoteUserPlan(
  userId: string,
  plan: "free" | "vip"
) {
  const response = await authorizedFetch(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    }
  )
  await readPayload(response)
}
