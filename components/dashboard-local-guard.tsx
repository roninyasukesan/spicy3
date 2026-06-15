"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { localGetUser } from "@/lib/local-auth"
import type { UserRole } from "@/lib/utils"

function checkRouteAccess(pathname: string, userRole: UserRole | undefined) {
  if (!userRole) return false
  if (userRole === "admin") return true
  if (pathname.startsWith("/dashboard/admin")) return false
  if (pathname.startsWith("/dashboard/modelo")) return userRole === "modelo"
  if (pathname.startsWith("/dashboard/cliente")) return userRole === "cliente"
  return pathname.startsWith("/dashboard/chat") || pathname === "/dashboard"
}

export function DashboardLocalGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const user = localGetUser()
    if (!user) {
      router.replace("/cadastro")
      return
    }
    if (!checkRouteAccess(pathname, user.role)) {
      router.replace("/dashboard/acesso-negado")
      return
    }
    setReady(true)
  }, [pathname, router])

  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-sm text-muted-foreground">
        Verificando acesso...
      </div>
    )
  }

  return <>{children}</>
}
