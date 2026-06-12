"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { compressImage } from "@/lib/image-utils";
import { Header } from "@/components/header";
import { type UserRole, cn, getProfileSearchPath } from "@/lib/utils";
import { createPublicProfileId, localGetUser, getAllLocalProfiles, getModelProfile, saveModelProfile, getProfilePhotoItems, type ModelPhoto, type ModelProfile, type Story } from "@/lib/local-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, Trash2, Image as ImageIcon, Film, GripVertical, Lock, LockOpen, Star, PlayCircle, LoaderCircle, CheckCircle2, Eye } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { FETISH_CATEGORIES } from "@/lib/fetishes";
import { PHYSICAL_CHARACTERISTICS, type PhysicalCharacteristics } from "@/lib/physical-characteristics";
import { AudioPlayerWave } from "@/components/ui/audio-player-wave";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import Image from "next/image";
import {
  isRemoteMediaEnabled,
  syncRemoteProfilePhotos,
} from "@/lib/media-client";
import {
  fetchPublishedProfile,
  isRemoteDataEnabled,
  saveRemoteProfile,
} from "@/lib/profile-client";

const SERVICES_LIST = ["Acompanhante", "Massagem", "Jantar", "Eventos", "Viagens", "Fetiches"];
type SaveStatus = "idle" | "compressing" | "saving" | "success";

export default function ModeloDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [editingEmail, setEditingEmail] = useState("");
  const [editingName, setEditingName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const [draggedStoryId, setDraggedStoryId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [previewMedia, setPreviewMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const saveInFlightRef = useRef(false);
  const saveResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [profile, setProfile] = useState<ModelProfile>({
    artisticName: "",
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
      piercings: ""
    }
  });

  useEffect(() => {
    const user = localGetUser();

    if (!user) {
      router.replace("/");
      return;
    }

    if (user.role !== "modelo") {
      if (user.role === "admin") {
        router.replace("/dashboard/admin");
      } else {
        router.replace("/dashboard/cliente");
      }
      return;
    }

    setRole(user.role);
    setEditingEmail(user.email);

    const savedProfile =
      getModelProfile(user.email) ||
      getAllLocalProfiles().find((candidate) => candidate.email === user.email) ||
      null;

    if (savedProfile) {
      setProfile(savedProfile);
      setEditingName(savedProfile.artisticName || user.email);
    } else {
      setProfile((p) => ({ ...p, artisticName: user.name }));
      setEditingName(user.name);
    }

    if (!isRemoteDataEnabled() || !user.id) {
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const published = await fetchPublishedProfile(user.id!);
        if (!published) return;

        const remoteProfile: ModelProfile = {
          ...published,
          phone: savedProfile?.phone || "",
          photos: published.photoItems.map((photo) => photo.url),
          coverImage: published.photoItems[0]?.url,
          email: user.email,
        };
        saveModelProfile(user.email, remoteProfile);
        setProfile(remoteProfile);
        setEditingName(remoteProfile.artisticName || user.email);
      } catch (error) {
        console.error("Falha ao carregar o perfil publicado:", error);
        toast({
          title: "Perfil remoto indisponível",
          description:
            error instanceof Error
              ? error.message
              : "Foi carregada apenas a cópia local do perfil.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    return () => {
      if (saveResetTimerRef.current) {
        clearTimeout(saveResetTimerRef.current);
      }
    };
  }, []);

  const currentPhotoItems = getProfilePhotoItems(profile);
  const isSaving = saveStatus === "compressing" || saveStatus === "saving";
  const saveButtonLabel =
    saveStatus === "compressing"
      ? "Comprimindo e preparando..."
      : saveStatus === "saving"
        ? "Salvando perfil..."
        : saveStatus === "success"
          ? "Salvo com sucesso"
        : "Salvar Alterações";
  const saveButtonClassName = cn(
    "min-w-48 bg-primary text-white transition-all duration-300 hover:bg-primary/90",
    (saveStatus === "compressing" || saveStatus === "saving") &&
      "animate-pulse scale-[0.98] bg-amber-600 hover:bg-amber-600 shadow-lg shadow-amber-950/30",
    saveStatus === "success" && "bg-emerald-600 hover:bg-emerald-600"
  );

  const updatePhotoItems = (photoItems: ModelPhoto[]) => {
    setProfile((prev) => ({
      ...prev,
      photoItems,
      photos: photoItems.map((photo) => photo.url),
      coverImage: photoItems[0]?.url,
    }));
  };

  const handleSaveProfile = async (): Promise<boolean> => {
    const user = localGetUser();
    if (saveInFlightRef.current) return false;

    if (!user) {
      toast({
        title: "Sessão não encontrada",
        description: "Entre novamente para salvar as alterações.",
        variant: "destructive",
      });
      return false;
    }

    const targetEmail = editingEmail || user.email;
    if (!targetEmail) {
      toast({
        title: "Perfil sem identificador",
        description: "Não foi possível identificar o perfil que deve ser salvo.",
        variant: "destructive",
      });
      return false;
    }

    saveInFlightRef.current = true;
    if (saveResetTimerRef.current) {
      clearTimeout(saveResetTimerRef.current);
      saveResetTimerRef.current = null;
    }
    setSaveStatus("saving");

    try {
      let profileToSave: ModelProfile = {
        ...profile,
        publicId: profile.publicId || createPublicProfileId(),
        photoItems: currentPhotoItems,
        photos: currentPhotoItems.map((photo) => photo.url),
        coverImage: currentPhotoItems[0]?.url,
      };
      const success = saveModelProfile(targetEmail, profileToSave);

      if (!success) {
        throw new Error(
          "O limite de armazenamento foi atingido. Tente remover algumas fotos."
        );
      }

      if (isRemoteDataEnabled()) {
        if (!user.id) {
          throw new Error(
            "A conta atual não possui vínculo com um usuário do Supabase."
          );
        }

        const published = await saveRemoteProfile(user.id, profileToSave);
        profileToSave = {
          ...profileToSave,
          publicId: published.publicId,
        };

        if (isRemoteMediaEnabled()) {
          const syncedPhotoItems = await syncRemoteProfilePhotos(
            user.id,
            currentPhotoItems
          );
          profileToSave = {
            ...profileToSave,
            photoItems: syncedPhotoItems,
            photos: syncedPhotoItems.map((photo) => photo.url),
            coverImage: syncedPhotoItems[0]?.url,
          };
        }

        if (!saveModelProfile(targetEmail, profileToSave)) {
          throw new Error(
            "O perfil foi publicado, mas a cópia local não pôde ser atualizada."
          );
        }
      }

      setProfile(profileToSave);
      await new Promise(resolve => setTimeout(resolve, 350));
      setSaveStatus("success");
      saveInFlightRef.current = false;
      toast({
        title: "Alterações salvas!",
        description: isRemoteDataEnabled()
          ? isRemoteMediaEnabled()
            ? "Perfil e fotos foram publicados para todos os usuários autorizados."
            : "Perfil publicado no Supabase. As fotos continuam somente neste navegador."
          : "Alterações salvas somente neste navegador. A publicação remota está desativada.",
      });
      saveResetTimerRef.current = setTimeout(() => {
        setSaveStatus("idle");
        saveResetTimerRef.current = null;
      }, 1400);

      return true;
    } catch (error) {
      saveInFlightRef.current = false;
      setSaveStatus("idle");
      toast({
        title: "Erro ao salvar perfil",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleViewPublicProfile = async () => {
    const saved = await handleSaveProfile();
    if (!saved) return;

    const targetEmail = editingEmail || localGetUser()?.email || "";
    const savedProfile = getModelProfile(targetEmail);
    router.push(
      getProfileSearchPath(
        savedProfile?.artisticName || profile.artisticName || editingName || targetEmail,
        savedProfile?.publicId || profile.publicId || targetEmail
      )
    );
  };

  const toggleService = (service: string) => {
    setProfile(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const toggleFetish = (fetish: string) => {
    setProfile(prev => ({
      ...prev,
      fetishes: prev.fetishes.includes(fetish)
        ? prev.fetishes.filter(f => f !== fetish)
        : [...prev.fetishes, fetish]
    }));
  };

  const toggleExclusion = (exclusion: string) => {
    setProfile(prev => ({
      ...prev,
      exclusions: prev.exclusions.includes(exclusion)
        ? prev.exclusions.filter(e => e !== exclusion)
        : [...prev.exclusions, exclusion]
    }));
  };

  const setCharacteristic = (category: keyof PhysicalCharacteristics, value: string) => {
    setProfile(prev => ({
      ...prev,
      characteristics: {
        ...prev.characteristics,
        [category]: value
      }
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const processFiles = async (files: File[]) => {
    let addedCount = 0;

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      
      try {
        const compressedDataUrl = await compressImage(file, 900, 900, 0.55);
        const nextPhoto: ModelPhoto = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          url: compressedDataUrl,
          isBlurred: false,
        };
        
        setProfile((prev) => {
          const prevPhotoItems = getProfilePhotoItems(prev);
          const nextPhotoItems = [
            ...prevPhotoItems,
            nextPhoto,
          ];

          return {
            ...prev,
            photoItems: nextPhotoItems,
            photos: nextPhotoItems.map((photo) => photo.url),
            coverImage: nextPhotoItems[0]?.url,
          };
        });
        addedCount += 1;
      } catch (error) {
        console.error("Erro ao processar imagem:", error);
        toast({ 
          title: "Erro ao processar imagem", 
          description: error instanceof Error ? error.message : "Não foi possível processar uma das imagens.",
          variant: "destructive" 
        });
      }
    }

    if (addedCount > 0) {
      toast({
        title: `${addedCount} foto${addedCount > 1 ? "s" : ""} pronta${addedCount > 1 ? "s" : ""} para salvar`,
        description: "Revise capa, ordem e cadeado e clique em Salvar Alterações.",
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleVoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setProfile(prev => ({
            ...prev,
            voiceUrl: reader.result as string
          }));
          toast({ title: "Áudio adicionado com sucesso!" });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processStoryFiles = async (files: File[]) => {
    for (const file of files) {
      // Allow image and video
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
      
      try {
        let mediaUrl = "";
        
        if (file.type.startsWith('image/')) {
          mediaUrl = await compressImage(file, 720, 1280, 0.5);
        } else {
          // For videos we still use FileReader for now
          mediaUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }

        const newStory: Story = {
          id: Date.now().toString() + Math.random().toString().slice(2),
          mediaUrl: mediaUrl,
          mediaType: file.type.startsWith('video/') ? 'video' : 'image',
          duration: 5,
          createdAt: new Date().toISOString()
        };
        
        setProfile(prev => ({
          ...prev,
          stories: [...(prev.stories || []), newStory]
        }));
      } catch (error) {
        console.error("Erro ao processar story:", error);
      }
    }
    toast({ title: "Stories adicionados!" });
  };

  const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processStoryFiles(Array.from(e.target.files));
    }
  };

  const removePhoto = (index: number) => {
    updatePhotoItems(currentPhotoItems.filter((_, i) => i !== index));
  };

  const setFeaturedPhoto = (index: number) => {
    const nextItems = [...currentPhotoItems];
    const [featured] = nextItems.splice(index, 1);
    if (!featured) return;
    nextItems.unshift(featured);
    updatePhotoItems(nextItems);
  };

  const togglePhotoBlur = (index: number) => {
    updatePhotoItems(
      currentPhotoItems.map((photo, photoIndex) =>
        photoIndex === index ? { ...photo, isBlurred: !photo.isBlurred } : photo
      )
    );
  };

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const nextItems = [...currentPhotoItems];
    const [movedPhoto] = nextItems.splice(fromIndex, 1);
    if (!movedPhoto) return;
    nextItems.splice(toIndex, 0, movedPhoto);
    updatePhotoItems(nextItems);
  };

  const removeStory = (id: string) => {
    setProfile(prev => ({
      ...prev,
      stories: (prev.stories || []).filter(s => s.id !== id)
    }));
  };

  const toggleStoryBlur = (id: string) => {
    setProfile(prev => ({
      ...prev,
      stories: (prev.stories || []).map(s => 
        s.id === id ? { ...s, isBlurred: !s.isBlurred } : s
      )
    }));
  };

  const moveStory = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setProfile(prev => {
      const nextStories = [...(prev.stories || [])];
      const [movedStory] = nextStories.splice(fromIndex, 1);
      if (!movedStory) return prev;
      nextStories.splice(toIndex, 0, movedStory);
      return { ...prev, stories: nextStories };
    });
  };

  const removeVoice = () => {
    setProfile(prev => ({
      ...prev,
      voiceUrl: undefined
    }));
  };

  if (loading || !role) {
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
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Dashboard Modelo
            </h1>
            <p className="text-gray-400">
              Gerencie seu perfil, fotos e preferências.
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="border-gray-700 text-gray-300"
              onClick={handleViewPublicProfile}
              disabled={isSaving}
            >
              Visualizar Perfil Público
            </Button>
            <Button 
              type="button"
              onClick={() => void handleSaveProfile()}
              disabled={isSaving}
              className={saveButtonClassName}
            >
              {(saveStatus === "compressing" || saveStatus === "saving") && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {saveStatus === "success" && <CheckCircle2 className="mr-2 h-4 w-4" />}
              {saveButtonLabel}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-dark-900 border-gray-800">
            <TabsTrigger value="dashboard">Visão Geral</TabsTrigger>
            <TabsTrigger value="profile">Editar Perfil</TabsTrigger>
            <TabsTrigger value="media">Gerenciar Mídia</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-dark-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Mensagens</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-gray-300">
                  <p>Acesse suas conversas com clientes.</p>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => router.push('/dashboard/chat')}
                  >
                    Abrir Chat
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-dark-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Assinatura atual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-gray-300">
                  <p>Plano: VIP Modelo Mensal</p>
                  <p>Status: Ativa</p>
                  <Button className="mt-2 bg-primary hover:bg-primary/90 text-white">
                    Gerenciar assinatura
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-dark-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Acesso Rápido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col gap-2 border-gray-800 bg-dark-800 hover:bg-dark-700"
                      onClick={() => {
                        const tabsList = document.querySelector('[role="tablist"]');
                        const mediaTab = tabsList?.querySelector('[value="media"]') as HTMLButtonElement;
                        mediaTab?.click();
                      }}
                    >
                      <ImageIcon className="h-6 w-6 text-primary" />
                      <span>Gerenciar Mídia</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col gap-2 border-gray-800 bg-dark-800 hover:bg-dark-700"
                      onClick={() => {
                        const tabsList = document.querySelector('[role="tablist"]');
                        const profileTab = tabsList?.querySelector('[value="profile"]') as HTMLButtonElement;
                        profileTab?.click();
                      }}
                    >
                      <Star className="h-6 w-6 text-amber-500" />
                      <span>Editar Perfil</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-dark-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-dark-800 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-white">1.2k</p>
                      <p className="text-xs text-gray-500">Visualizações</p>
                    </div>
                    <div className="bg-dark-800 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">85</p>
                      <p className="text-xs text-gray-500">Favoritos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white">Nome Artístico</Label>
                  <Input 
                    value={profile.artisticName} 
                    onChange={e => setProfile({...profile, artisticName: e.target.value})}
                    className="bg-dark-800 border-gray-700 text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Telefone</Label>
                  <Input 
                    value={profile.phone} 
                    onChange={e => setProfile({...profile, phone: e.target.value})}
                    className="bg-dark-800 border-gray-700 text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Cidade</Label>
                  <Input 
                    value={profile.city} 
                    onChange={e => setProfile({...profile, city: e.target.value})}
                    className="bg-dark-800 border-gray-700 text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Idade</Label>
                  <Input 
                    value={profile.age} 
                    onChange={e => setProfile({...profile, age: e.target.value})}
                    className="bg-dark-800 border-gray-700 text-white" 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white">Bio / Descrição</Label>
                  <Textarea 
                    value={profile.bio} 
                    onChange={e => setProfile({...profile, bio: e.target.value})}
                    className="bg-dark-800 border-gray-700 text-white min-h-[100px]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Faixa de Preço (Ex: 150-300)</Label>
                  <Input 
                    value={profile.priceRange} 
                    onChange={e => setProfile({...profile, priceRange: e.target.value})}
                    className="bg-dark-800 border-gray-700 text-white" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Características Físicas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {Object.entries(PHYSICAL_CHARACTERISTICS).map(([key, data]) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-white">{data.label}</Label>
                    <Select 
                      value={profile.characteristics[key as keyof PhysicalCharacteristics]} 
                      onValueChange={(val) => setCharacteristic(key as keyof PhysicalCharacteristics, val)}
                    >
                      <SelectTrigger className="bg-dark-800 border-gray-700 text-white">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-800 border-gray-700 text-white">
                        {data.options.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Serviços e Fetiches</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-white text-lg">Serviços</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {SERVICES_LIST.map(service => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`srv-${service}`} 
                          checked={profile.services.includes(service)}
                          onCheckedChange={() => toggleService(service)}
                          className="border-gray-500 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor={`srv-${service}`} className="text-gray-300 cursor-pointer">{service}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-white text-lg">Faz</Label>
                  <div className="space-y-4">
                    {Object.entries(FETISH_CATEGORIES).filter(([k]) => k !== 'exclusion').map(([key, category]) => (
                      <div key={key}>
                        <h4 className="text-gray-400 mb-2 font-medium">{category.label}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {category.options.map(fetish => (
                            <div key={fetish} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`ft-${fetish}`}
                                checked={profile.fetishes.includes(fetish)}
                                onCheckedChange={() => toggleFetish(fetish)}
                                className="border-gray-500 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <Label htmlFor={`ft-${fetish}`} className="text-gray-300 text-sm cursor-pointer">{fetish}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                 <div className="space-y-3">
                  <Label className="text-white text-lg">Não faz</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {FETISH_CATEGORIES.exclusion.options.map(exclusion => (
                      <div key={exclusion} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`ex-${exclusion}`}
                          checked={profile.exclusions.includes(exclusion)}
                          onCheckedChange={() => toggleExclusion(exclusion)}
                          className="border-red-500 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                        />
                        <Label htmlFor={`ex-${exclusion}`} className="text-gray-300 text-sm cursor-pointer">{exclusion}</Label>
                      </div>
                    ))}
                  </div>
                </div>

              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                type="button"
                onClick={() => void handleSaveProfile()}
                size="lg" 
                disabled={isSaving}
                className={saveButtonClassName}
              >
                {(saveStatus === "compressing" || saveStatus === "saving") && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {saveStatus === "success" && <CheckCircle2 className="mr-2 h-4 w-4" />}
                {saveButtonLabel}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Gerenciamento de Mídia</CardTitle>
                <p className="text-sm text-gray-400">
                  Organize suas fotos e stories. Arraste para reordenar e use o cadeado para conteúdo VIP.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Áudio / Voz */}
                <div className="space-y-3">
                  <Label className="text-white text-lg">Apresentação de Voz</Label>
                  <p className="text-sm text-gray-400">Adicione uma mensagem de voz para seus clientes.</p>
                  
                  {profile.voiceUrl ? (
                    <AudioPlayerWave 
                      src={profile.voiceUrl} 
                      onRemove={removeVoice} 
                    />
                  ) : (
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:bg-dark-800 transition-colors">
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={handleVoiceUpload}
                        className="hidden"
                        id="voice-upload"
                      />
                      <Label htmlFor="voice-upload" className="cursor-pointer flex flex-col items-center gap-2">
                        <span className="bg-primary/20 text-primary p-3 rounded-full">
                          🎤
                        </span>
                        <span className="text-white font-medium">Clique para enviar áudio</span>
                        <span className="text-xs text-gray-500">MP3, WAV ou OGG (Max 5MB)</span>
                      </Label>
                    </div>
                  )}
                </div>

                {/* Fotos */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-white text-lg">Galeria de Fotos</Label>
                    <span className="text-xs text-gray-400">
                      {currentPhotoItems.length} fotos
                    </span>
                  </div>
                  
                  {/* Área de Drag & Drop */}
                  <div 
                    className={`
                      border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
                      ${isDragging 
                        ? 'border-primary bg-primary/10 scale-[1.01]' 
                        : 'border-gray-700 hover:bg-dark-800 hover:border-gray-500'
                      }
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className={`p-4 rounded-full ${isDragging ? 'bg-primary/20 text-primary' : 'bg-gray-800 text-gray-400'}`}>
                        {isDragging ? <Upload className="h-8 w-8 animate-bounce" /> : <ImageIcon className="h-8 w-8" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-medium text-lg">
                          {isDragging ? 'Solte as fotos aqui' : 'Escolha fotos'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {currentPhotoItems.length === 0 
                            ? "Nenhuma foto selecionada" 
                            : "Arraste para enviar, reordenar e definir a cadeado"
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grid de Visualização */}
                  {currentPhotoItems.length > 0 && (
                    <div className="space-y-2 animate-in fade-in duration-500">
                      <Label className="text-gray-300">Fotos Selecionadas</Label>
                      <p className="text-xs text-gray-500">
                        A primeira foto é a foto de capa. Arraste os cards para reordenar e use o cadeado para aplicar blur ao cliente.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {currentPhotoItems.map((photo, index) => (
                          <div
                            key={photo.id}
                            draggable
                            onDragStart={() => setDraggedPhotoId(photo.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (!draggedPhotoId) return;
                              const fromIndex = currentPhotoItems.findIndex((item) => item.id === draggedPhotoId);
                              movePhoto(fromIndex, index);
                              setDraggedPhotoId(null);
                            }}
                            onDragEnd={() => setDraggedPhotoId(null)}
                            onClick={() => setPreviewMedia({ url: photo.url, type: 'image' })}
                            className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-700 group shadow-sm hover:shadow-md transition-all cursor-zoom-in"
                          >
                            <Image src={photo.url} alt={`Foto ${index + 1}`} fill sizes="(max-width: 768px) 50vw, 20vw" className={`${photo.isBlurred ? "blur-md " : ""}object-cover transition-transform duration-300 group-hover:scale-105`} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <Eye className="h-8 w-8 text-white/70" />
                            </div>
                            <div className="absolute left-2 top-2 flex items-center gap-2 z-20">
                              <div className="cursor-grab active:cursor-grabbing rounded-full bg-black/70 p-1.5 text-white hover:bg-primary transition-colors shadow-lg">
                                <GripVertical className="h-4 w-4" />
                              </div>
                              {index === 0 && (
                                <span className="rounded bg-primary px-2 py-1 text-[10px] font-semibold text-white shadow-lg">
                                  <Star className="mr-1 inline h-3 w-3" />
                                  Capa
                                </span>
                              )}
                            </div>
                            <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePhoto(index);
                                }}
                                className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePhotoBlur(index);
                                }}
                                className={cn(
                                  "h-8 w-8 rounded-full transition-all duration-200 shadow-lg hover:scale-110",
                                  photo.isBlurred 
                                    ? "bg-amber-500 text-black opacity-100" 
                                    : "bg-black/70 text-white opacity-0 group-hover:opacity-100"
                                )}
                              >
                                {photo.isBlurred ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                              </Button>
                            </div>
                            
                            <div className="absolute bottom-2 left-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-20">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFeaturedPhoto(index);
                                }}
                                className="w-full bg-black/70 text-white hover:bg-black backdrop-blur-sm"
                              >
                                Definir como Capa
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Stories */}
                <div className="space-y-4 pt-6 border-t border-gray-800">
                  <div className="flex justify-between items-center">
                    <Label className="text-white text-lg">Stories (24h)</Label>
                    <span className="text-xs text-gray-400">
                      {profile.stories?.length || 0} stories
                    </span>
                  </div>

                  {/* Upload de Stories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:bg-dark-800 transition-colors cursor-pointer" onClick={() => storyInputRef.current?.click()}>
                      <Input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleStoryUpload}
                        className="hidden"
                        ref={storyInputRef}
                      />
                      <div className="flex flex-col items-center gap-2">
                        <span className="bg-primary/20 text-primary p-2 rounded-full">
                          <PlayCircle className="h-5 w-5" />
                        </span>
                        <span className="text-white font-medium text-sm">Adicionar Stories</span>
                        <span className="text-xs text-gray-500">Imagens ou Vídeos</span>
                      </div>
                    </div>
                  </div>

                  {/* Grid de Stories com Drag & Drop */}
                  {profile.stories && profile.stories.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">
                        Arraste para reordenar a sequência de visualização.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {profile.stories.map((story, index) => (
                          <div
                            key={story.id}
                            draggable
                            onDragStart={() => setDraggedStoryId(story.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (!draggedStoryId) return;
                              const fromIndex = profile.stories?.findIndex((s) => s.id === draggedStoryId);
                              if (fromIndex !== undefined && fromIndex !== -1) {
                                moveStory(fromIndex, index);
                              }
                              setDraggedStoryId(null);
                            }}
                            onDragEnd={() => setDraggedStoryId(null)}
                            onClick={() => setPreviewMedia({ url: story.mediaUrl, type: story.mediaType })}
                            className="relative aspect-[9/16] rounded-lg overflow-hidden border border-gray-700 group bg-black shadow-sm cursor-zoom-in"
                          >
                            {story.mediaType === 'image' ? (
                              <Image 
                                src={story.mediaUrl} 
                                alt={`Story ${index + 1}`} 
                                fill 
                                className={cn("object-cover", story.isBlurred && "blur-md")} 
                              />
                            ) : (
                              <video 
                                src={story.mediaUrl} 
                                className={cn("w-full h-full object-cover", story.isBlurred && "blur-md")} 
                              />
                            )}
                            
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <Eye className="h-8 w-8 text-white/70" />
                            </div>
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="absolute left-1.5 top-1.5 z-20">
                              <div className="cursor-grab active:cursor-grabbing rounded-full bg-black/70 p-1 text-white hover:bg-primary transition-colors shadow-lg">
                                <GripVertical className="h-3 w-3" />
                              </div>
                            </div>

                            <div className="absolute top-1.5 right-1.5 flex flex-col gap-1.5 z-20">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeStory(story.id);
                                }}
                                className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStoryBlur(story.id);
                                }}
                                className={cn(
                                  "h-6 w-6 rounded-full transition-all duration-200 shadow-lg hover:scale-110",
                                  story.isBlurred 
                                    ? "bg-amber-500 text-black opacity-100" 
                                    : "bg-black/70 text-white opacity-0 group-hover:opacity-100"
                                )}
                              >
                                {story.isBlurred ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
                              </Button>
                            </div>

                            <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] px-1 rounded z-20 backdrop-blur-sm">
                               {story.mediaType === 'video' ? "VÍDEO" : "FOTO"}
                            </div>

                            {story.isBlurred && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 z-10">
                                <Lock className="h-5 w-5 text-white/70" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                type="button"
                onClick={() => void handleSaveProfile()}
                size="lg" 
                disabled={isSaving}
                className={saveButtonClassName}
              >
                {(saveStatus === "compressing" || saveStatus === "saving") && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {saveStatus === "success" && <CheckCircle2 className="mr-2 h-4 w-4" />}
                {saveButtonLabel}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Media Preview Modal */}
      <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
        <DialogContent className="max-w-3xl bg-dark-900 border-gray-800 p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-gray-800">
            <DialogTitle className="text-white">Pré-visualização de Arquivo</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            {previewMedia?.type === 'image' ? (
              <Image 
                src={previewMedia.url} 
                alt="Preview" 
                fill 
                className="object-contain" 
              />
            ) : (
              <video 
                src={previewMedia?.url} 
                controls 
                autoPlay 
                className="max-h-full max-w-full" 
              />
            )}
          </div>
          <div className="p-4 flex justify-end">
            <Button variant="secondary" onClick={() => setPreviewMedia(null)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
