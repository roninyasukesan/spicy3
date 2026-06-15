import { redirect } from "next/navigation"
import { DashboardAuthBridge } from "@/components/dashboard-auth-bridge"
import { DashboardLocalGuard } from "@/components/dashboard-local-guard"
import type { LocalUser } from "@/lib/local-auth"
import { isRemoteDataMode } from "@/lib/remote-mode"
import { getAuthenticatedActor } from "@/lib/supabase/auth-server"

function applicationRole(role: string): LocalUser["role"] {
  if (role === "admin") return "admin"
  if (role === "model" || role === "modelo") return "modelo"
  return "cliente"
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isRemoteDataMode()) {
    return <DashboardLocalGuard>{children}</DashboardLocalGuard>
  }

  const actor = await getAuthenticatedActor()
  if (!actor) redirect("/cadastro")

  const user: LocalUser = {
    id: actor.profile.id,
    publicProfileId: actor.profile.publicId,
    email: actor.profile.email || actor.user.email || "",
    role: applicationRole(actor.role),
    name: actor.profile.displayName,
    plan: actor.planTier === "free" ? "free" : "vip",
  }

  return <DashboardAuthBridge user={user}>{children}</DashboardAuthBridge>
}
