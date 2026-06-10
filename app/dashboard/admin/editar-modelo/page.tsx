"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { compressImage } from "@/lib/image-utils";
import { Header } from "@/components/header";
import { cn, getProfileSearchPath, type UserRole } from "@/lib/utils";
import { estimateModelProfileStorageSize, localGetUser, getAllLocalProfiles, getModelProfile, saveModelProfile, getProfilePhotoItems, type ModelPhoto, type ModelProfile, type Story } from "@/lib/local-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, Trash2, Image as ImageIcon, Film, GripVertical, Lock, LockOpen, Star, PlayCircle, ChevronLeft, LoaderCircle, CheckCircle2, Eye } from 'lucide-react';
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

const SERVICES_LIST = ["Acompanhante", "Massagem", "Jantar", "Eventos", "Viagens", "Fetiches"];
const MAX_PHOTOS = 12;
const MAX_STORIES = 10;
const MAX_PHOTO_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_STORY_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VOICE_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const PHOTO_TARGET_BYTES = 260 * 1024;
const STORY_TARGET_BYTES = 180 * 1024;
const PROFILE_STORAGE_SOFT_LIMIT_BYTES = Math.floor(4.5 * 1024 * 1024);
type SaveStatus = "idle" | "compressing" | "saving" | "success";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminEditModeloPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [editingEmail, setEditingEmail] = useState("");
  const [editingName, setEditingName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const [draggedStoryId, setDraggedStoryId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [previewMedia, setPreviewMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  
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
    const requestedEmail = searchParams.get("email")?.trim() || "";

    if (!user || user.role !== "admin") {
      router.replace("/");
      return;
    }

    if (!requestedEmail) {
      router.replace("/dashboard/admin");
      return;
    }

    setEditingEmail(requestedEmail);

    const savedProfile =
      getModelProfile(requestedEmail) ||
      getAllLocalProfiles().find((candidate) => candidate.email === requestedEmail) ||
      null;

    if (savedProfile) {
      setProfile(savedProfile);
      setEditingName(savedProfile.artisticName || requestedEmail);
    } else {
      setProfile((p) => ({ ...p, artisticName: requestedEmail }));
      setEditingName(requestedEmail);
    }

    setLoading(false);
  }, [router, searchParams]);

  const currentPhotoItems = getProfilePhotoItems(profile);
  const profileToSave = useMemo<ModelProfile>(
    () => ({
      ...profile,
      photoItems: currentPhotoItems,
      photos: currentPhotoItems.map((photo) => photo.url),
      coverImage: currentPhotoItems[0]?.url,
    }),
    [currentPhotoItems, profile]
  );
  const estimatedStorageBytes = useMemo(
    () => (editingEmail ? estimateModelProfileStorageSize(editingEmail, profileToSave) : 0),
    [editingEmail, profileToSave]
  );
  const isStorageNearLimit = estimatedStorageBytes >= PROFILE_STORAGE_SOFT_LIMIT_BYTES;
  const isSaving = saveStatus !== "idle";
  const saveButtonLabel =
    saveStatus === "compressing"
      ? "Comprimindo e preparando..."
      : saveStatus === "saving"
        ? "Salvando perfil..."
        : saveStatus === "success"
          ? "Salvo com sucesso"
        : "Salvar Alterações";

  const updatePhotoItems = (photoItems: ModelPhoto[]) => {
    setProfile((prev) => ({
      ...prev,
      photoItems,
      photos: photoItems.map((photo) => photo.url),
      coverImage: photoItems[0]?.url,
    }));
  };

  const handleSaveProfile = async () => {
    if (editingEmail) {
      if (isStorageNearLimit) {
        toast({
          title: "Perfil grande demais para o modo local",
          description: `O perfil esta usando cerca de ${formatFileSize(estimatedStorageBytes)}. Remova algumas fotos, stories ou audio antes de salvar.`,
          variant: "destructive"
        });
        return;
      }

      setSaveStatus("compressing");
      await new Promise(resolve => setTimeout(resolve, 450));
      setSaveStatus("saving");
      await new Promise(resolve => setTimeout(resolve, 450));

      const success = saveModelProfile(editingEmail, profileToSave);

      if (success) {
        setSaveStatus("success");
        toast({
          title: "Alterações salvas!",
          description: `As alterações de ${profile.artisticName || editingName} foram salvas. Clique em "Visualizar Perfil" para conferir a versão atualizada.`,
        });
        window.setTimeout(() => setSaveStatus("idle"), 1600);
      } else {
        setSaveStatus("idle");
        toast({
          title: "Erro ao salvar",
          description: "O navegador nao conseguiu persistir o perfil no localStorage. Remova algumas fotos, stories ou audio e tente novamente.",
          variant: "destructive"
        });
      }
    }
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
    const remainingSlots = MAX_PHOTOS - currentPhotoItems.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Limite de fotos atingido",
        description: `Remova alguma foto antes de adicionar mais. Limite atual: ${MAX_PHOTOS}.`,
        variant: "destructive"
      });
      return;
    }

    const feedback: string[] = [];
    const acceptedFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        feedback.push(`"${file.name}" foi ignorado porque nao e uma imagem.`);
        return false;
      }

      if (file.size > MAX_PHOTO_FILE_SIZE_BYTES) {
        feedback.push(`"${file.name}" excede ${formatFileSize(MAX_PHOTO_FILE_SIZE_BYTES)}.`);
        return false;
      }

      return true;
    });
    const validFiles = acceptedFiles.slice(0, remainingSlots);

    if (acceptedFiles.length > validFiles.length) {
      feedback.push(`A galeria local aceita no maximo ${MAX_PHOTOS} fotos.`);
    }

    const newPhotoItems: ModelPhoto[] = [];

    for (const file of validFiles) {
      try {
        const compressedDataUrl = await compressImage(file, 960, 1280, 0.72, PHOTO_TARGET_BYTES);
        newPhotoItems.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          url: compressedDataUrl,
          isBlurred: false,
        });
      } catch (error) {
        console.error(error);
        feedback.push(`Nao foi possivel processar "${file.name}".`);
      }
    }

    if (newPhotoItems.length > 0) {
      setProfile((prev) => {
        const prevPhotoItems = getProfilePhotoItems(prev);
        const nextPhotoItems = [...prevPhotoItems, ...newPhotoItems];
        return {
          ...prev,
          photoItems: nextPhotoItems,
          photos: nextPhotoItems.map((photo) => photo.url),
          coverImage: nextPhotoItems[0]?.url,
        };
      });
    }

    toast({
      title: newPhotoItems.length > 0 ? "Fotos adicionadas!" : "Nenhuma foto adicionada",
      description: feedback.length > 0 ? feedback.join(" ") : `As imagens foram comprimidas para caber melhor no modo local.`,
      variant: newPhotoItems.length > 0 ? "default" : "destructive"
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    e.target.value = "";
  };

  const handleVoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      if (file.size > MAX_VOICE_FILE_SIZE_BYTES) {
        toast({
          title: "Audio muito grande",
          description: `No modo local, use audios de ate ${formatFileSize(MAX_VOICE_FILE_SIZE_BYTES)}.`,
          variant: "destructive"
        });
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setProfile(prev => ({ ...prev, voiceUrl: reader.result as string }));
          toast({ title: "Áudio adicionado!" });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processStoryFiles = async (files: File[]) => {
    const existingStories = profile.stories || [];
    const remainingSlots = MAX_STORIES - existingStories.length;

    if (remainingSlots <= 0) {
      toast({
        title: "Limite de stories atingido",
        description: `Remova algum story antes de adicionar mais. Limite atual: ${MAX_STORIES}.`,
        variant: "destructive"
      });
      return;
    }

    const feedback: string[] = [];
    const acceptedFiles = files.filter((file) => {
      if (file.type.startsWith('video/')) {
        feedback.push(`"${file.name}" foi bloqueado: videos nao sao suportados no modo local.`);
        return false;
      }

      if (!file.type.startsWith('image/')) {
        feedback.push(`"${file.name}" foi ignorado porque nao e uma imagem.`);
        return false;
      }

      if (file.size > MAX_STORY_IMAGE_FILE_SIZE_BYTES) {
        feedback.push(`"${file.name}" excede ${formatFileSize(MAX_STORY_IMAGE_FILE_SIZE_BYTES)}.`);
        return false;
      }

      return true;
    });
    const validFiles = acceptedFiles.slice(0, remainingSlots);

    if (acceptedFiles.length > validFiles.length) {
      feedback.push(`O modo local aceita no maximo ${MAX_STORIES} stories.`);
    }

    const newStories: Story[] = [];

    for (const file of validFiles) {
      try {
        const mediaUrl = await compressImage(file, 720, 1280, 0.7, STORY_TARGET_BYTES);
        newStories.push({
          id: Date.now().toString() + Math.random().toString().slice(2),
          mediaUrl,
          mediaType: 'image',
          duration: 5,
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        console.error(error);
        feedback.push(`Nao foi possivel processar "${file.name}".`);
      }
    }

    if (newStories.length > 0) {
      setProfile(prev => ({ ...prev, stories: [...(prev.stories || []), ...newStories] }));
    }

    toast({
      title: newStories.length > 0 ? "Stories adicionados!" : "Nenhum story adicionado",
      description: feedback.length > 0 ? feedback.join(" ") : `So imagens sao permitidas no modo local.`,
      variant: newStories.length > 0 ? "default" : "destructive"
    });
  };

  const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processStoryFiles(Array.from(e.target.files));
    }
    e.target.value = "";
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
    setProfile(prev => ({ ...prev, stories: (prev.stories || []).filter(s => s.id !== id) }));
  };

  const toggleStoryBlur = (id: string) => {
    setProfile(prev => ({
      ...prev,
      stories: (prev.stories || []).map(s => s.id === id ? { ...s, isBlurred: !s.isBlurred } : s)
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
    setProfile(prev => ({ ...prev, voiceUrl: undefined }));
  };

  if (loading) {
    return <div className="min-h-screen bg-dark-950 flex items-center justify-center text-gray-200">Carregando editor...</div>;
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-white -ml-2"
                onClick={() => router.push("/dashboard/admin")}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar ao Painel
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-white">Editar Modelo (Admin)</h1>
            <p className="text-gray-400">Editando perfil: <span className="text-primary font-medium">{editingName}</span></p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="border-gray-700 text-gray-300" onClick={() => router.push(getProfileSearchPath(profile.artisticName || editingName || editingEmail, editingEmail))}>Visualizar Perfil</Button>
             <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-white">
               {(saveStatus === "compressing" || saveStatus === "saving") && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
               {saveStatus === "success" && <CheckCircle2 className="mr-2 h-4 w-4" />}
               {saveButtonLabel}
             </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-dark-900 border-gray-800">
            <TabsTrigger value="profile">Perfil e Dados</TabsTrigger>
            <TabsTrigger value="media">Fotos e Stories</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
             <Card className="bg-dark-900 border-gray-800">
              <CardHeader><CardTitle className="text-white">Dados da Modelo</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white">Nome Artístico</Label>
                  <Input value={profile.artisticName} onChange={e => setProfile({...profile, artisticName: e.target.value})} className="bg-dark-800 border-gray-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Cidade</Label>
                  <Input value={profile.city} onChange={e => setProfile({...profile, city: e.target.value})} className="bg-dark-800 border-gray-700 text-white" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white">Bio / Descrição</Label>
                  <Textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="bg-dark-800 border-gray-700 text-white min-h-[100px]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader><CardTitle className="text-white">Características</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {Object.entries(PHYSICAL_CHARACTERISTICS).map(([key, data]) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-white">{data.label}</Label>
                    <Select value={profile.characteristics[key as keyof PhysicalCharacteristics]} onValueChange={(val) => setCharacteristic(key as keyof PhysicalCharacteristics, val)}>
                      <SelectTrigger className="bg-dark-800 border-gray-700 text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-dark-800 border-gray-700 text-white">
                        {data.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader><CardTitle className="text-white">Serviços e Fetiches</CardTitle></CardHeader>
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
                    {Object.entries(FETISH_CATEGORIES)
                      .filter(([key]) => key !== "exclusion")
                      .map(([key, category]) => (
                        <div key={key}>
                          <h4 className="text-gray-400 mb-2 font-medium">{category.label}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {category.options.map((fetish) => (
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
                    {FETISH_CATEGORIES.exclusion.options.map((exclusion) => (
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
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardHeader><CardTitle className="text-white">Galeria de Fotos (Drag & Drop)</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-700 hover:bg-dark-800'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                  <Input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" ref={fileInputRef} />
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-8 w-8 text-gray-500" />
                    <p className="text-white font-medium">Arraste fotos ou clique para enviar</p>
                    <p className="text-xs text-gray-500">Ate {MAX_PHOTOS} fotos. Cada arquivo pode ter no maximo {formatFileSize(MAX_PHOTO_FILE_SIZE_BYTES)} e sera comprimido no navegador antes de importar.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {currentPhotoItems.map((photo, index) => (
                    <div key={photo.id} draggable onDragStart={() => setDraggedPhotoId(photo.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (!draggedPhotoId) return; const fromIndex = currentPhotoItems.findIndex(i => i.id === draggedPhotoId); movePhoto(fromIndex, index); setDraggedPhotoId(null); }} 
                      onClick={() => setPreviewMedia({ url: photo.url, type: 'image' })}
                      className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-700 group cursor-zoom-in"
                    >
                      <Image src={photo.url} alt="Foto" fill className={cn("object-cover", photo.isBlurred && "blur-md")} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Eye className="h-8 w-8 text-white/70" />
                      </div>
                      <div className="absolute left-2 top-2 flex items-center gap-2 z-20">
                         <GripVertical className="h-4 w-4 text-white bg-black/50 rounded p-0.5 cursor-grab" />
                         {index === 0 && <Badge className="bg-primary text-white text-[10px]">Capa</Badge>}
                      </div>
                      <div className="absolute top-2 right-2 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button size="icon" variant="destructive" className="h-7 w-7 rounded-full" onClick={() => removePhoto(index)}><Trash2 className="h-3.5 w-3.5" /></Button>
                         <Button size="icon" variant="secondary" className={cn("h-7 w-7 rounded-full", photo.isBlurred && "bg-amber-500")} onClick={() => togglePhotoBlur(index)}>{photo.isBlurred ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}</Button>
                      </div>
                      <Button size="sm" variant="secondary" className="absolute bottom-2 left-2 right-2 bg-black/60 text-white opacity-0 group-hover:opacity-100" onClick={() => setFeaturedPhoto(index)}>Usar como Capa</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800">
              <CardHeader><CardTitle className="text-white">Stories (24h)</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                 <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:bg-dark-800 cursor-pointer" onClick={() => storyInputRef.current?.click()}>
                   <Input type="file" multiple accept="image/*" onChange={handleStoryUpload} className="hidden" ref={storyInputRef} />
                   <div className="flex flex-col items-center gap-2">
                     <PlayCircle className="h-6 w-6 text-primary" />
                     <span className="text-white text-sm">Adicionar Stories</span>
                     <span className="text-xs text-gray-500">No modo local, apenas imagens sao aceitas. Ate {MAX_STORIES} stories, com compressao nativa antes da importacao.</span>
                   </div>
                 </div>
                 <div className={cn("rounded-lg border px-3 py-2 text-sm", isStorageNearLimit ? "border-red-500/60 bg-red-500/10 text-red-100" : "border-amber-500/40 bg-amber-500/10 text-amber-100")}>
                   Armazenamento estimado do perfil: {formatFileSize(estimatedStorageBytes)}. O modo local costuma falhar perto de {formatFileSize(PROFILE_STORAGE_SOFT_LIMIT_BYTES)}.
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                   {profile.stories?.map((story, index) => (
                     <div key={story.id} draggable onDragStart={() => setDraggedStoryId(story.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (!draggedStoryId) return; const fromIndex = profile.stories?.findIndex(s => s.id === draggedStoryId); if (fromIndex !== undefined) moveStory(fromIndex, index); setDraggedStoryId(null); }} 
                        onClick={() => setPreviewMedia({ url: story.mediaUrl, type: story.mediaType })}
                        className="relative aspect-[9/16] rounded-lg overflow-hidden border border-gray-700 group bg-black cursor-zoom-in"
                     >
                        {story.mediaType === 'image' ? <Image src={story.mediaUrl} alt="Story" fill className={cn("object-cover", story.isBlurred && "blur-sm")} /> : <video src={story.mediaUrl} className={cn("w-full h-full object-cover", story.isBlurred && "blur-sm")} />}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Eye className="h-8 w-8 text-white/70" />
                        </div>
                        <div className="absolute top-1 right-1 flex flex-col gap-1 z-20 opacity-0 group-hover:opacity-100">
                          <Button size="icon" variant="destructive" className="h-6 w-6 rounded-full" onClick={() => removeStory(story.id)}><X className="h-3 w-3" /></Button>
                          <Button size="icon" variant="secondary" className={cn("h-6 w-6 rounded-full", story.isBlurred && "bg-amber-500")} onClick={() => toggleStoryBlur(story.id)}>{story.isBlurred ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}</Button>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] px-1 rounded">{story.mediaType === 'video' ? "VÍDEO" : "FOTO"}</div>
                     </div>
                   ))}
                 </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveProfile}
                size="lg"
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-white"
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
            <DialogTitle className="text-white">Pré-visualização de Arquivo (Admin)</DialogTitle>
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
