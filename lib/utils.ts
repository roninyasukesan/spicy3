import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type UserRole = "admin" | "modelo" | "cliente"

export function getRoleByEmail(email: string | null | undefined): UserRole {
  if (!email) return "cliente"
  const normalized = email.trim().toLowerCase()
  if (normalized === "admin@email.com") return "admin"
  if (normalized === "modelo@email.com") return "modelo"
  return "cliente"
}
