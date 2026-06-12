import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // separate diacritics
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/\s+/g, '-') // spaces to dashes
    .replace(/[^\w-]+/g, '') // remove non-word chars
    .replace(/--+/g, '-'); // multiple dashes to single
}

export function getPublicProfileSlug(name: string, uniqueId: string): string {
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      uniqueId
    )
  ) {
    return uniqueId.toLowerCase()
  }

  const nameSlug = slugify(name || "perfil")
  const uniquePart = slugify(uniqueId.split("@")[0] || uniqueId)

  if (!uniquePart || uniquePart === nameSlug) {
    return nameSlug
  }

  return `${nameSlug}-${uniquePart}`
}

export function getProfileSearchPath(name: string, uniqueId: string): string {
  return `/busca?perfil=${encodeURIComponent(getPublicProfileSlug(name, uniqueId))}`
}

export type UserRole = "admin" | "modelo" | "cliente"

export function getRoleByEmail(email: string | null | undefined): UserRole {
  if (!email) return "cliente"
  const normalized = email.trim().toLowerCase()
  if (normalized === "admin@email.com") return "admin"
  if (normalized === "modelo@email.com") return "modelo"
  return "cliente"
}
