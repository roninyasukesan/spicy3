"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { type UserRole } from "@/lib/utils";
import { localGetUser } from "@/lib/local-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/lib/favorites";
import { Crown, MessageCircle, Search } from "lucide-react";

export default function ClienteDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const { count: favoriteCount } = useFavorites();

  useEffect(() => {
    const user = localGetUser();
    if (!user) {
      router.replace("/");
      return;
    }
    if (user.role !== "cliente") {
      if (user.role === "admin") {
        router.replace("/dashboard/admin");
      } else {
        router.replace("/dashboard/modelo");
      }
      return;
    }
    setRole(user.role);
    setLoading(false);
  }, [router]);

  if (loading || role !== "cliente") {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center text-gray-200">
        Carregando painel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard Cliente</h1>
            <p className="text-gray-400">
              Acompanhe suas curtidas, modelos favoritas e assinaturas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/busca")}
              className="border-gray-700 text-gray-300"
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar modelos
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/chat")}
              className="border-gray-700 text-gray-300"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Mensagens
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/vip")}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Crown className="mr-2 h-4 w-4" />
              Planos VIP
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Curtidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-300">
              <p>Total de curtidas em perfis</p>
              <p className="text-3xl font-bold text-primary-400">0</p>
            </CardContent>
          </Card>

          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Modelos favoritas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-300">
              <p>Quantidade de modelos adicionadas aos favoritos</p>
              <p className="text-3xl font-bold text-primary-400">{favoriteCount}</p>
            </CardContent>
          </Card>

          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Assinaturas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-300">
              <p>Planos ativos e histórico de assinaturas</p>
              <Button
                type="button"
                onClick={() => router.push("/vip")}
                className="mt-2 bg-primary hover:bg-primary/90 text-white"
              >
                Gerenciar assinaturas
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
