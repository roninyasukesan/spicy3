
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SignupOptions } from "@/components/signup-options";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  cacheAuthenticatedUser,
  localSignIn,
  type LocalUser,
} from "@/lib/local-auth";
import { isRemoteDataEnabled } from "@/lib/profile-client";

type LoginFormProps = {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let loggedUser: LocalUser | null = null;

      // 1. Try Supabase Auth first
      if (isRemoteDataEnabled()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const response = await fetch("/api/auth/me", { cache: "no-store" });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok || !payload.user) {
            await supabase.auth.signOut();
            throw new Error(
              payload.error || "Não foi possível validar o perfil desta conta."
            );
          }

          loggedUser = payload.user as LocalUser;
          cacheAuthenticatedUser(loggedUser);
        }
      }

      // 2. Fallback to Local Auth if not logged in via Supabase
      if (!loggedUser && !isRemoteDataEnabled()) {
        const { user } = await localSignIn(email, password);
        loggedUser = user;
      }

      if (!loggedUser) {
        throw new Error("O Supabase não retornou uma sessão válida.");
      }

      const role = loggedUser.role;

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta.",
      });

      if (role === "admin") {
        router.push("/dashboard/admin");
      } else if (role === "modelo") {
        router.push("/dashboard/modelo");
      } else {
        router.push("/dashboard/cliente");
      }
      onSuccess?.()
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Erro ao entrar",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    toast({
      title: "Login com Google indisponível",
      description: "Use e-mail e senha para entrar no modo local.",
      variant: "destructive",
    });
  };

  return (
    <div className="bg-dark-900 border-none p-6 w-full max-w-md mx-auto rounded-lg">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-white">Acesse sua Conta</h2>
        <p className="text-gray-400">Bem-vindo de volta. Entre para continuar.</p>
      </div>
      
      <div className="space-y-6">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2 bg-dark-800 hover:bg-dark-700 text-white border-gray-700 h-12"
          onClick={handleGoogleLogin}
        >
          <Image src="/google-icon.svg" alt="Google" width={20} height={20} />
          Continuar com Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-800"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-dark-900 px-4 text-gray-500">OU ENTRE COM E-MAIL</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300 ml-1">E-mail</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 bg-dark-800 border-gray-800 text-white h-12 focus:border-red-600/50 transition-all"
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="password" className="text-gray-300">Senha</Label>
              <Link href="/recuperar-senha" className="text-sm text-red-600 hover:text-red-500 transition-colors">
                Esqueceu sua senha?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 bg-dark-800 border-gray-800 text-white h-12 focus:border-red-600/50 transition-all"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white h-12 font-bold text-lg mt-2" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-400 pt-2">
          Não tem uma conta?{" "}
          <Link href="/cadastro" className="text-red-600 hover:text-red-500 transition-colors font-medium">
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}
