"use client"

import { useLayoutEffect, useState } from "react"
import {
  cacheAuthenticatedUser,
  type LocalUser,
} from "@/lib/local-auth"

export function DashboardAuthBridge({
  user,
  children,
}: {
  user: LocalUser
  children: React.ReactNode
}) {
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    cacheAuthenticatedUser(user)
    setReady(true)
  }, [user])

  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-sm text-muted-foreground">
        Verificando acesso...
      </div>
    )
  }

  return <>{children}</>
}
