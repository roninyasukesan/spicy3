"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { localGetUser } from "@/lib/local-auth";
import { hasSupabaseConfig } from "@/lib/supabase";
import type { UserRole } from "@/lib/utils";

/**
 * Verifica se o usuário tem permissão para acessar a rota
 */
function checkRouteAccess(pathname: string, userRole: UserRole | undefined): boolean {
  if (!userRole) return false;

  // Admin tem acesso a tudo
  if (userRole === "admin") return true;

  // Verifica rotas específicas
  if (pathname.startsWith("/dashboard/admin")) {
    return userRole === "admin";
  }
  
  if (pathname.startsWith("/dashboard/modelo")) {
    return userRole === "modelo";
  }
  
  if (pathname.startsWith("/dashboard/cliente")) {
    return userRole === "cliente";
  }

  // Rota genérica /dashboard/chat é acessível por todos os usuários autenticados
  if (pathname.startsWith("/dashboard/chat")) {
    return true;
  }

  // Dashboard raiz - redirecionar para área específica
  if (pathname === "/dashboard") {
    return true;
  }

  // Por padrão, permitir acesso
  return true;
}

/**
 * Obtém a rota de redirecionamento baseada no role do usuário
 */
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

        // If no local user, optionally check Supabase session (when configured)
        if (!localUser && hasSupabaseConfig()) {
          const { supabase } = await import("@/lib/supabase");
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            if (active) router.replace("/cadastro");
            return;
          }
        }

        // If neither local nor Supabase session, redirect to signup
        if (!localUser) {
          if (active) router.replace("/cadastro");
          return;
        }

        // Check role-based access
        const hasAccess = checkRouteAccess(pathname, localUser.role);
        
        if (!hasAccess) {
          // Redirect to access denied or to user's default dashboard
          if (active) {
            router.replace("/dashboard/acesso-negado");
          }
          return;
        }

        // Se está na rota raiz do dashboard, redireciona para área específica
        if (pathname === "/dashboard") {
          if (active) {
            router.replace(getDefaultRouteForRole(localUser.role));
          }
          return;
        }

        // Auth OK
        if (active) setReady(true);
      } catch {
        router.replace("/cadastro");
      }
    };

    checkAuth();

    // Update on auth changes
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