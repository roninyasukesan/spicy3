"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { localGetUser } from "@/lib/local-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function AcessoNegadoPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const user = localGetUser();
    if (user) {
      setUserName(user.name);
      setUserRole(user.role);
    }
  }, []);

  const handleGoBack = () => {
    const user = localGetUser();
    if (user) {
      // Redireciona para a área correta baseada no role
      switch (user.role) {
        case "admin":
          router.push("/dashboard/admin");
          break;
        case "modelo":
          router.push("/dashboard/modelo");
          break;
        case "cliente":
          router.push("/dashboard/cliente");
          break;
        default:
          router.push("/");
      }
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Acesso Negado</CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta área
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="mb-2">
              <strong>Usuário:</strong> {userName || "Não identificado"}
            </p>
            <p>
              <strong>Tipo de conta:</strong>{" "}
              {userRole === "admin" && "Administrador"}
              {userRole === "modelo" && "Modelo"}
              {userRole === "cliente" && "Cliente"}
              {!userRole && "Desconhecido"}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
            <p>
              Esta página está restrita a usuários com permissões específicas. 
              Se você acredita que deveria ter acesso, entre em contato com o suporte.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={handleGoBack} className="w-full" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para minha área
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push("/")} 
            className="w-full"
          >
            Ir para página inicial
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}