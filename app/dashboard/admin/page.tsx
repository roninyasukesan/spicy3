"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { getProfileSearchPath, type UserRole } from "@/lib/utils";
import { localGetUser, getHomeContent, setHomeContent, type HomeContent, getUsers, addUser, removeUser, removeModelProfile, updateUserPlan, type DemoUser, exportAllLocalData, getAllLocalProfiles, type ModelProfile } from "@/lib/local-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Database,
  Download,
  Eye,
  LayoutDashboard,
  LoaderCircle,
  MessageSquare,
  Search,
  Settings,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  deleteProfileMedia,
  isRemoteMediaEnabled,
  listProfileMedia,
} from "@/lib/media-client";
import {
  createRemoteUser,
  deleteRemoteUser,
  fetchPublishedProfiles,
  isRemoteDataEnabled,
  listRemoteUsers,
  updateRemoteUserPlan,
} from "@/lib/profile-client";
import { LocalInfrastructureMigration } from "@/components/admin/local-infrastructure-migration";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [homeContent, setHomeContentState] = useState<HomeContent | null>(null);
  const [savingHome, setSavingHome] = useState(false);
  const [usersList, setUsersList] = useState<DemoUser[]>([]);
  const [allModels, setAllModels] = useState<(ModelProfile & { email: string })[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"todos" | UserRole>("todos");
  const [modelSearch, setModelSearch] = useState("");
  const [modelFilter, setModelFilter] = useState<"todos" | "com-fotos" | "com-stories">("todos");
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "cliente" as UserRole, plan: "free" as "free" | "vip" });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userPendingRemoval, setUserPendingRemoval] = useState<DemoUser | null>(null);
  const [modelPendingRemoval, setModelPendingRemoval] = useState<(ModelProfile & { email: string }) | null>(null);
  const [isRemovingUser, setIsRemovingUser] = useState(false);

  const refreshAdminData = () => {
    setUsersList(getUsers());
    setAllModels(getAllLocalProfiles());
  };

  useEffect(() => {
    let active = true;

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
    if (!isRemoteDataEnabled()) refreshAdminData();
    setRole(user.role);

    const loadRemoteData = async () => {
      if (!isRemoteDataEnabled()) {
        if (active) setLoading(false);
        return;
      }

      try {
        const [remoteUsers, publishedProfiles] = await Promise.all([
          listRemoteUsers(),
          fetchPublishedProfiles(),
        ]);
        const usersById = new Map(
          remoteUsers
            .filter((candidate) => candidate.id)
            .map((candidate) => [candidate.id as string, candidate])
        );

        const remoteModels = publishedProfiles.flatMap((published) => {
          const linkedUser = usersById.get(published.id);
          if (!linkedUser?.email) return [];
          return [{
            ...published,
            phone: "",
            photos: published.photoItems.map((photo) => photo.url),
            coverImage: published.photoItems[0]?.url,
            email: linkedUser.email,
          }];
        });

        if (active) {
          setUsersList(remoteUsers);
          setAllModels(remoteModels);
        }
      } catch (error) {
        console.error("Falha ao carregar a gestão remota:", error);
        if (active) {
          toast({
            title: "Supabase indisponível",
            description:
              error instanceof Error
                ? error.message
                : "Não foi possível carregar a gestão remota.",
            variant: "destructive",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadRemoteData();

    return () => {
      active = false;
    };
  }, [router, toast]);

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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingUser) return;

    setIsAddingUser(true);
    try {
      const userToCreate: DemoUser = {
        ...newUser,
        plan: newUser.role === "cliente" ? newUser.plan : undefined,
      };
      const managedUser = isRemoteDataEnabled()
        ? await createRemoteUser(userToCreate)
        : userToCreate;
      if (isRemoteDataEnabled()) {
        setUsersList((current) => [...current, managedUser]);
        if (managedUser.role === "modelo") {
          setAllModels((current) => [
            ...current,
            {
              publicId: managedUser.publicProfileId,
              artisticName: managedUser.name,
              phone: "",
              city: "",
              age: "",
              bio: "",
              services: [],
              fetishes: [],
              exclusions: [],
              priceRange: "",
              characteristics: {
                hairColor: "",
                ethnicity: "",
                bodyType: "",
                height: "",
                age: "",
                eyes: "",
                breasts: "",
                tattoos: "",
                piercings: "",
              },
              photoItems: [],
              photos: [],
              stories: [],
              email: managedUser.email,
            },
          ]);
        }
      } else {
        setUsersList(addUser(managedUser));
        setAllModels(getAllLocalProfiles());
      }
      setNewUser({ name: "", email: "", password: "", role: "cliente", plan: "free" });
      toast({
        title: "Usuário adicionado",
        description: isRemoteDataEnabled()
          ? "A conta e o perfil foram criados no Supabase."
          : "Conta criada somente neste navegador. A publicação remota está desativada.",
      });
    } catch (error) {
      toast({
        title: "Erro ao adicionar usuário",
        description: error instanceof Error ? error.message : "Não foi possível adicionar o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userPendingRemoval || isRemovingUser) return;

    const currentUser = localGetUser();
    if (currentUser?.email.toLowerCase() === userPendingRemoval.email.toLowerCase()) {
      toast({
        title: "Não é possível remover a conta atual",
        description: "Entre com outro administrador antes de remover esta conta.",
        variant: "destructive",
      });
      setUserPendingRemoval(null);
      return;
    }

    setIsRemovingUser(true);
    try {
      if (isRemoteDataEnabled()) {
        if (!userPendingRemoval.id) {
          throw new Error("O usuário não possui um identificador remoto.")
        }
        await deleteRemoteUser(userPendingRemoval.id);
      } else if (
        userPendingRemoval.role === "modelo" &&
        userPendingRemoval.id &&
        isRemoteMediaEnabled()
      ) {
        const remoteMedia = await listProfileMedia(userPendingRemoval.id);
        await Promise.all(
          remoteMedia.map((media) => deleteProfileMedia(media.id))
        );
      }

      if (isRemoteDataEnabled()) {
        setUsersList((current) =>
          current.filter((user) => user.id !== userPendingRemoval.id)
        );
        setAllModels((current) =>
          current.filter(
            (model) =>
              model.email.toLowerCase() !==
              userPendingRemoval.email.toLowerCase()
          )
        );
      } else {
        setUsersList(removeUser(userPendingRemoval.email));
        setAllModels(getAllLocalProfiles());
      }
      toast({
        title: "Usuário removido",
        description:
          isRemoteDataEnabled()
            ? `${userPendingRemoval.name} foi removido do Supabase e suas mídias foram excluídas do Drive.`
            : userPendingRemoval.role === "modelo"
            ? `${userPendingRemoval.name}, sua conta e seu perfil foram excluídos.`
            : `${userPendingRemoval.name} não pode mais acessar a plataforma.`,
      });
      setUserPendingRemoval(null);
    } catch (error) {
      toast({
        title: "Erro ao remover usuário",
        description: error instanceof Error ? error.message : "Não foi possível remover o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsRemovingUser(false);
    }
  };

  const requestModelRemoval = (model: ModelProfile & { email: string }) => {
    const linkedUser = usersList.find(
      (user) => user.email.toLowerCase() === model.email.toLowerCase()
    );

    if (linkedUser) {
      setUserPendingRemoval(linkedUser);
      return;
    }

    setModelPendingRemoval(model);
  };

  const handleDeleteModel = () => {
    if (!modelPendingRemoval || isRemovingUser) return;

    setIsRemovingUser(true);
    try {
      removeModelProfile(modelPendingRemoval.email);
      setAllModels(getAllLocalProfiles());
      toast({
        title: "Modelo excluída",
        description: `${modelPendingRemoval.artisticName} e suas mídias locais foram removidas.`,
      });
      setModelPendingRemoval(null);
    } catch (error) {
      toast({
        title: "Erro ao excluir modelo",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível excluir o perfil da modelo.",
        variant: "destructive",
      });
    } finally {
      setIsRemovingUser(false);
    }
  };

  const handleUpdatePlan = async (user: DemoUser, plan: "free" | "vip") => {
    try {
      if (isRemoteDataEnabled()) {
        if (!user.id) throw new Error("Usuário sem identificador do Supabase.");
        await updateRemoteUserPlan(user.id, plan);
        setUsersList((current) =>
          current.map((item) =>
            item.id === user.id ? { ...item, plan } : item
          )
        );
      } else {
        updateUserPlan(user.email, plan);
        refreshAdminData();
      }
      toast({ title: "Plano atualizado com sucesso" });
    } catch (error) {
      toast({
        title: "Erro ao atualizar plano",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o plano.",
        variant: "destructive",
      });
    }
  };

  const getDashboardRouteForRole = (user: DemoUser) => {
    if (user.role === "admin") return "/dashboard/admin";
    if (user.role === "modelo") return `/dashboard/admin/editar-modelo?email=${encodeURIComponent(user.email)}`;
    return "/dashboard/cliente";
  };

  const handleExportData = () => {
    const data = exportAllLocalData();
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `spicy-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Dados exportados",
      description: "O arquivo JSON foi gerado com sucesso.",
    });
  };

  const handleOpenModelWorkspace = () => {
    const firstModel = allModels[0];
    if (!firstModel) {
      toast({
        title: "Nenhuma modelo encontrada",
        description: "Cadastre ou carregue um perfil de modelo para abrir a área de edição.",
        variant: "destructive",
      });
      return;
    }

    router.push(`/dashboard/admin/editar-modelo?email=${encodeURIComponent(firstModel.email)}`);
  };

  if (loading || role !== "admin" || !homeContent) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center text-gray-200">
        Carregando painel...
      </div>
    );
  }

  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const filteredUsers = usersList.filter((user) => {
    const matchesSearch =
      !normalizedUserSearch ||
      user.name.toLowerCase().includes(normalizedUserSearch) ||
      user.email.toLowerCase().includes(normalizedUserSearch);

    const matchesRole = userRoleFilter === "todos" || user.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const normalizedModelSearch = modelSearch.trim().toLowerCase();
  const filteredModels = allModels.filter((model) => {
    const matchesSearch =
      !normalizedModelSearch ||
      model.artisticName.toLowerCase().includes(normalizedModelSearch) ||
      model.email.toLowerCase().includes(normalizedModelSearch) ||
      model.city.toLowerCase().includes(normalizedModelSearch);

    if (modelFilter === "com-fotos") {
      return matchesSearch && (model.photoItems?.length || model.photos?.length || 0) > 0;
    }

    if (modelFilter === "com-stories") {
      return matchesSearch && (model.stories?.length || 0) > 0;
    }

    return matchesSearch;
  });

  const adminCount = usersList.filter((user) => user.role === "admin").length;
  const modelUserCount = usersList.filter((user) => user.role === "modelo").length;
  const clientCount = usersList.filter((user) => user.role === "cliente").length;
  const totalPhotos = allModels.reduce((sum, model) => sum + (model.photoItems?.length || model.photos?.length || 0), 0);
  const totalStories = allModels.reduce((sum, model) => sum + (model.stories?.length || 0), 0);

  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard Admin</h1>
              <p className="text-gray-400">
                Gerencie usuários, modelos, conteúdo, exportação e acessos globais do sistema.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card className="bg-dark-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Usuários</p>
                    <p className="text-2xl font-bold text-white">{usersList.length}</p>
                  </div>
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-dark-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Modelos</p>
                    <p className="text-2xl font-bold text-white">{allModels.length}</p>
                  </div>
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-dark-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Clientes</p>
                    <p className="text-2xl font-bold text-white">{clientCount}</p>
                  </div>
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-dark-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Fotos</p>
                    <p className="text-2xl font-bold text-white">{totalPhotos}</p>
                  </div>
                  <Eye className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-dark-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Stories</p>
                    <p className="text-2xl font-bold text-white">{totalStories}</p>
                  </div>
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="editor" className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 overflow-x-auto">
            <TabsTrigger value="editor">Editor visual</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="modelos">Modelos</TabsTrigger>
            <TabsTrigger value="suporte">Chat de suporte</TabsTrigger>
            <TabsTrigger value="sistema">Sistema</TabsTrigger>
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
                <CardDescription className="text-gray-400">
                  Crie admins, modelos e clientes diretamente pelo painel central.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddUser} className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Nome</Label>
                    <Input
                      id="name"
                      name="name"
                      autoComplete="name"
                      required
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
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
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
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                      value={newUser.password}
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Mínimo de 6 caracteres"
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
                  <Button type="submit" disabled={isAddingUser} className="bg-primary hover:bg-primary/90 text-white">
                    {isAddingUser ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    {isAddingUser ? "Adicionando..." : "Adicionar"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Gerenciamento de usuários</CardTitle>
                <CardDescription className="text-gray-400">
                  Busque, filtre e entre nos painéis conforme o papel de cada usuário.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Buscar por nome ou e-mail"
                      className="pl-10 bg-dark-800 border-gray-700 text-white"
                    />
                  </div>
                  <Select value={userRoleFilter} onValueChange={(value: "todos" | UserRole) => setUserRoleFilter(value)}>
                    <SelectTrigger className="bg-dark-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-800 border-gray-700 text-white">
                      <SelectItem value="todos">Todos os papéis</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="modelo">Modelos</SelectItem>
                      <SelectItem value="cliente">Clientes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-gray-700 text-gray-300">{adminCount} admins</Badge>
                  <Badge variant="outline" className="border-gray-700 text-gray-300">{modelUserCount} modelos</Badge>
                  <Badge variant="outline" className="border-gray-700 text-gray-300">{clientCount} clientes</Badge>
                  <Badge variant="outline" className="border-primary/40 text-primary">{filteredUsers.length} visíveis</Badge>
                </div>
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
                      {filteredUsers.map(user => (
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
                                onValueChange={(value: "free" | "vip") => void handleUpdatePlan(user, value)}
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
                          <TableCell className="font-mono text-gray-500">
                            {isRemoteDataEnabled() ? "Protegida pelo Supabase" : user.password}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                onClick={() => router.push(getDashboardRouteForRole(user))}
                              >
                                Abrir Painel
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setUserPendingRemoval(user)}
                                disabled={user.email === "admin@email.com"}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                            Nenhum usuário encontrado.
                          </TableCell>
                        </TableRow>
                      )}
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
                <CardTitle className="text-white">Gerenciamento de Modelos</CardTitle>
                <CardDescription className="text-gray-400">
                  Visualize, filtre e abra rapidamente edição, perfil público e conteúdos salvos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder="Buscar modelo por nome, e-mail ou cidade"
                      className="pl-10 bg-dark-800 border-gray-700 text-white"
                    />
                  </div>
                  <Select value={modelFilter} onValueChange={(value: "todos" | "com-fotos" | "com-stories") => setModelFilter(value)}>
                    <SelectTrigger className="bg-dark-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-800 border-gray-700 text-white">
                      <SelectItem value="todos">Todos os modelos</SelectItem>
                      <SelectItem value="com-fotos">Com fotos</SelectItem>
                      <SelectItem value="com-stories">Com stories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-gray-700 text-gray-300">{allModels.length} modelos totais</Badge>
                  <Badge variant="outline" className="border-gray-700 text-gray-300">{totalPhotos} fotos</Badge>
                  <Badge variant="outline" className="border-gray-700 text-gray-300">{totalStories} stories</Badge>
                  <Badge variant="outline" className="border-primary/40 text-primary">{filteredModels.length} visíveis</Badge>
                </div>
                <div className="rounded-md border border-gray-800 bg-dark-950 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-300">Nome Artístico</TableHead>
                        <TableHead className="text-gray-300">E-mail</TableHead>
                        <TableHead className="text-gray-300">Cidade</TableHead>
                        <TableHead className="text-gray-300">Fotos</TableHead>
                        <TableHead className="text-gray-300">Stories</TableHead>
                        <TableHead className="text-gray-300 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredModels.map(model => (
                        <TableRow key={model.email}>
                          <TableCell className="text-white font-medium">{model.artisticName}</TableCell>
                          <TableCell className="text-gray-400">{model.email}</TableCell>
                          <TableCell className="text-gray-400">{model.city}</TableCell>
                          <TableCell className="text-gray-400">
                            <Badge variant="outline" className="border-gray-700 text-gray-300">
                              {(model.photoItems?.length || model.photos?.length || 0)} fotos
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400">
                            <Badge variant="outline" className="border-gray-700 text-gray-300">
                              {(model.stories?.length || 0)} stories
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                onClick={() => router.push(`/dashboard/admin/editar-modelo?email=${encodeURIComponent(model.email)}`)}
                              >
                                Editar Conteudo
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-300 hover:text-white hover:bg-dark-800"
                                onClick={() =>
                                  router.push(
                                    getProfileSearchPath(
                                      model.artisticName,
                                      model.publicId || model.email
                                    )
                                  )
                                }
                              >
                                Ver Publico
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => requestModelRemoval(model)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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

          <TabsContent value="sistema">
            <div className="space-y-6">
              <LocalInfrastructureMigration />
              <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-dark-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Exportar Dados
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Baixe todos os dados do LocalStorage para migração futura.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-dark-800 rounded-lg border border-gray-700">
                    <ul className="text-sm text-gray-300 space-y-2">
                      <li className="flex items-center gap-2">• Lista de Usuários e Senhas</li>
                      <li className="flex items-center gap-2">• Perfis de Modelos e Fotos (Base64)</li>
                      <li className="flex items-center gap-2">• Conteúdo da Home Page</li>
                      <li className="flex items-center gap-2">• Histórico de Chat e Favoritos</li>
                    </ul>
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
                    onClick={handleExportData}
                  >
                    <Download className="h-4 w-4" />
                    Baixar Backup JSON
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-dark-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Manutenção
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Ações de limpeza e diagnóstico do sistema.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline"
                    className="w-full border-gray-700 text-gray-300 hover:bg-dark-800"
                    onClick={() => {
                      if (confirm("Isso apagará apenas os dados salvos no navegador. Deseja continuar?")) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                  >
                    Limpar Armazenamento Local
                  </Button>
                </CardContent>
              </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog
        open={Boolean(userPendingRemoval)}
        onOpenChange={(open) => {
          if (!open && !isRemovingUser) setUserPendingRemoval(null);
        }}
      >
        <AlertDialogContent className="border-gray-800 bg-dark-900 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              A conta de {userPendingRemoval?.name} ({userPendingRemoval?.email}) perderá o acesso.
              {userPendingRemoval?.role === "modelo"
                ? " O perfil, as fotos e os stories locais também serão excluídos."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isRemovingUser}
              className="border-gray-700 bg-transparent text-gray-200 hover:bg-dark-800 hover:text-white"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isRemovingUser}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isRemovingUser && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {isRemovingUser ? "Removendo..." : "Remover usuário"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(modelPendingRemoval)}
        onOpenChange={(open) => {
          if (!open && !isRemovingUser) setModelPendingRemoval(null);
        }}
      >
        <AlertDialogContent className="border-gray-800 bg-dark-900 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              O perfil de {modelPendingRemoval?.artisticName}, suas fotos e seus stories locais serão removidos da plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isRemovingUser}
              className="border-gray-700 bg-transparent text-gray-200 hover:bg-dark-800 hover:text-white"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteModel}
              disabled={isRemovingUser}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isRemovingUser && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {isRemovingUser ? "Excluindo..." : "Excluir modelo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="border-t border-gray-800 bg-dark-950 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Spicy Dashboard - Painel Administrativo de Controle
        </div>
      </footer>
    </div>
  );
}
