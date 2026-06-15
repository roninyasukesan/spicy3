"use client"

import type { DemoUser, ModelPhoto, ModelProfile, Story } from "@/lib/local-auth"
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
