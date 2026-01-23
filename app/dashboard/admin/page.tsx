"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { type UserRole } from "@/lib/utils";
import { localGetUser, getHomeContent, setHomeContent, type HomeContent, getUsers, addUser, removeUser, updateUserPlan, type DemoUser } from "@/lib/local-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [homeContent, setHomeContentState] = useState<HomeContent | null>(null);
  const [savingHome, setSavingHome] = useState(false);
  const [usersList, setUsersList] = useState<DemoUser[]>([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "cliente" as UserRole, plan: "free" as "free" | "vip" });

  useEffect(() => {
    const user = localGetUser();
    if (!user) {
      router.replace("/");
      return;
    }
    if (user.role !== "admin") {
      if (user.role === "modelo") {
        router.replace("/dashboard/modelo");
      } else {
        router.replace("/dashboard/cliente");
      }
      return;
    }
    const content = getHomeContent();
    setHomeContentState(content);
    setUsersList(getUsers());
    setRole(user.role);
    setLoading(false);
  }, [router]);

  const handleSaveHome = () => {
    if (!homeContent) return;
    setSavingHome(true);
    try {
      const updated = setHomeContent({
        heroTitle: homeContent.heroTitle,
        heroSubtitle: homeContent.heroSubtitle,
      });
      setHomeContentState(updated);
      toast({
        title: "Página atualizada",
        description: "O conteúdo da página inicial foi salvo.",
      });
    } finally {
      setSavingHome(false);
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newUser.name || !newUser.email || !newUser.password) {
        throw new Error("Preencha todos os campos");
      }
      addUser({
        ...newUser,
        plan: newUser.role === "cliente" ? newUser.plan : undefined,
      });
      setUsersList(getUsers());
      setNewUser({ name: "", email: "", password: "", role: "cliente", plan: "free" });
      toast({ title: "Usuário adicionado com sucesso" });
    } catch (error: any) {
      toast({ title: "Erro ao adicionar usuário", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = (email: string) => {
    if (email === "admin@email.com") {
      toast({ title: "Não é possível remover o admin principal", variant: "destructive" });
      return;
    }
    if (window.confirm("Tem certeza que deseja remover este usuário?")) {
      removeUser(email);
      setUsersList(getUsers());
      toast({ title: "Usuário removido com sucesso" });
    }
  };

  const handleUpdatePlan = (email: string, plan: "free" | "vip") => {
    updateUserPlan(email, plan);
    setUsersList(getUsers());
    toast({ title: "Plano atualizado com sucesso" });
  };

  if (loading || role !== "admin" || !homeContent) {
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
        <h1 className="text-3xl font-bold text-white">Dashboard Admin</h1>
        <p className="text-gray-400">
          Gerencie o conteúdo do site, usuários, pagamentos e suporte.
        </p>

        <Tabs defaultValue="editor" className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 overflow-x-auto">
            <TabsTrigger value="editor">Editor visual</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="modelos">Novos perfis</TabsTrigger>
            <TabsTrigger value="suporte">Chat de suporte</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Página inicial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  className="bg-dark-800 border-gray-700 text-white"
                  placeholder="Título da seção principal"
                  value={homeContent.heroTitle}
                  onChange={e =>
                    setHomeContentState({
                      ...homeContent,
                      heroTitle: e.target.value,
                    })
                  }
                />
                <Textarea
                  className="bg-dark-800 border-gray-700 text-white min-h-[160px]"
                  placeholder="Conteúdo da seção principal"
                  value={homeContent.heroSubtitle}
                  onChange={e =>
                    setHomeContentState({
                      ...homeContent,
                      heroSubtitle: e.target.value,
                    })
                  }
                />
                <Button
                  className="bg-primary hover:bg-primary/90 text-white"
                  onClick={handleSaveHome}
                  disabled={savingHome}
                >
                  {savingHome ? "Salvando..." : "Salvar alterações"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios" className="space-y-4">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Adicionar novo usuário</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddUser} className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Nome</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Nome"
                      className="bg-dark-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">E-mail</Label>
                    <Input
                      id="email"
                      value={newUser.email}
                      onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="bg-dark-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Senha</Label>
                    <Input
                      id="password"
                      value={newUser.password}
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Senha"
                      className="bg-dark-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-white">Papel</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: UserRole) => setNewUser({ ...newUser, role: value })}
                    >
                      <SelectTrigger className="bg-dark-800 border-gray-700 text-white">
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-800 border-gray-700 text-white">
                        <SelectItem value="cliente">Cliente</SelectItem>
                        <SelectItem value="modelo">Modelo</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan" className="text-white">Plano</Label>
                    <Select
                      value={newUser.plan}
                      onValueChange={(value: "free" | "vip") => setNewUser({ ...newUser, plan: value })}
                      disabled={newUser.role !== "cliente"}
                    >
                      <SelectTrigger className="bg-dark-800 border-gray-700 text-white">
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-800 border-gray-700 text-white">
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
                    Adicionar
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Gerenciamento de usuários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <p>Usuários ativos no sistema.</p>
                <div className="rounded-md border border-gray-800 bg-dark-950">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-300">Nome</TableHead>
                        <TableHead className="text-gray-300">E-mail</TableHead>
                        <TableHead className="text-gray-300">Papel</TableHead>
                        <TableHead className="text-gray-300">Plano</TableHead>
                        <TableHead className="text-gray-300">Senha</TableHead>
                        <TableHead className="text-gray-300 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersList.map(user => (
                        <TableRow key={user.email}>
                          <TableCell className="text-white">{user.name}</TableCell>
                          <TableCell className="text-gray-200 break-all">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                              {user.role === "admin"
                                ? "Admin"
                                : user.role === "modelo"
                                ? "Modelo"
                                : "Cliente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.role === "cliente" ? (
                              <Select
                                value={user.plan || "free"}
                                onValueChange={(value: "free" | "vip") => handleUpdatePlan(user.email, value)}
                              >
                                <SelectTrigger className="bg-dark-800 border-gray-700 text-white h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-dark-800 border-gray-700 text-white">
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="vip">VIP</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-gray-200">{user.password}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.email)}
                              disabled={user.email === "admin@email.com"}
                            >
                              Remover
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagamentos">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Pagamentos e assinaturas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-gray-300">
                <p>Resumo de faturamento, assinaturas ativas e pendências.</p>
                <p>Integração futura com gateway de pagamento.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modelos">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Verificação de novos perfis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-gray-300">
                <p>Lista de novos cadastros de modelos para aprovação.</p>
                <p>Aprovar, recusar ou solicitar ajustes no perfil.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suporte">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Suporte e chat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-gray-300">
                <p>Central para atendimento de clientes e modelos.</p>
                <p>Histórico de conversas e tickets de suporte.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
