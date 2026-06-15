import { redirect } from "next/navigation"
import { isRemoteDataMode } from "@/lib/remote-mode"
import { getAuthenticatedActor } from "@/lib/supabase/auth-server"

export default async function ModeloLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (isRemoteDataMode()) {
    const actor = await getAuthenticatedActor()
    if (!actor) redirect("/cadastro")
    if (!["model", "modelo"].includes(actor.role)) {
      redirect("/dashboard/acesso-negado")
    }
  }

  return <>{children}</>
}
