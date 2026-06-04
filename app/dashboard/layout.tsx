"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { localGetUser } from "@/lib/local-auth";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { UserRole } from "@/lib/utils";

function checkRouteAccess(pathname: string, userRole: UserRole | undefined): boolean {
  if (!userRole) return false;

  if (userRole === "admin") return true;

  if (pathname.startsWith("/dashboard/admin")) {
    return userRole === "admin";
  }

  if (pathname.startsWith("/dashboard/modelo")) {
    return userRole === "modelo";
  }

  if (pathname.startsWith("/dashboard/cliente")) {
    return userRole === "cliente";
  }

  if (pathname.startsWith("/dashboard/chat")) {
    return true;
  }

  if (pathname === "/dashboard") {
    return true;
  }

  return true;
}

function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "modelo":
      return "/dashboard/modelo";
    case "cliente":
      return "/dashboard/cliente";
    default:
      return "/dashboard/cliente";
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      try {
        const localUser = localGetUser();

        if (!localUser && hasSupabaseConfig()) {
          const { supabase } = await import("@/lib/supabase");
          const { data } = await supabase.auth.getSession();

          if (!data.session) {
            if (active) router.replace("/cadastro");
            return;
          }
        }

        if (!localUser) {
          if (active) router.replace("/cadastro");
          return;
        }

        const hasAccess = checkRouteAccess(pathname, localUser.role);

        if (!hasAccess) {
          if (active) {
            router.replace("/dashboard/acesso-negado");
          }
          return;
        }

        if (pathname === "/dashboard") {
          if (active) {
            router.replace(getDefaultRouteForRole(localUser.role));
          }
          return;
        }

        if (active) setReady(true);
      } catch {
        router.replace("/cadastro");
      }
    };

    checkAuth();

    const onAuthChange = () => checkAuth();
    window.addEventListener("spicy-auth-change", onAuthChange);

    return () => {
      active = false;
      window.removeEventListener("spicy-auth-change", onAuthChange);
    };
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-sm text-muted-foreground">
        Verificando acesso...
      </div>
    );
  }

  return <>{children}</>;
}
