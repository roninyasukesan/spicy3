
"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, MapPin, Phone, MessageCircle, Gift, ShieldCheck, X, Upload, Trash2, GripVertical, Lock, LockOpen, PlayCircle, ImageIcon, LoaderCircle, CheckCircle2, Eye } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createPublicProfileId, estimateModelProfileStorageSize, localGetUser, getModelProfile, getUsers, saveModelProfile, getProfilePhotoItems, subscribeToModelProfileChanges, type ModelPhoto, type ModelProfile as ModelProfileType, type Story } from "@/lib/local-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image-utils";
import { PHYSICAL_CHARACTERISTICS, type PhysicalCharacteristics } from "@/lib/physical-characteristics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  isRemoteMediaEnabled,
  syncRemoteProfileMedia,
} from "@/lib/media-client";
import {
  isRemoteDataEnabled,
  saveRemoteProfile,
} from "@/lib/profile-client";

const SERVICES_LIST = ["Acompanhante", "Massagem", "Jantar", "Eventos", "Viagens", "Fetiches"];
const MAX_PHOTOS = 12;
const MAX_STORIES = 10;
const MAX_PHOTO_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const MAX_STORY_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const PHOTO_TARGET_BYTES = 260 * 1024;
const STORY_TARGET_BYTES = 180 * 1024;
const PROFILE_STORAGE_SOFT_LIMIT_BYTES = Math.floor(4.5 * 1024 * 1024);
type SaveStatus = "idle" | "compressing" | "saving" | "success";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ModelProfile({ profileId }: { profileId: string }) {
  const { toast } = useToast()
  const [model, setModel] = useState<ModelProfileType | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [editing, setEditing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [canEdit, setCanEdit] = useState(false);
  const [hasContentAccess, setHasContentAccess] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const [draggedStoryId, setDraggedStoryId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const saveInFlightRef = useRef(false);
  const saveResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const email = decodeURIComponent(profileId);
    const loadProfile = () => {
      const user = localGetUser();
      const p = getModelProfile(email);

      if (p) {
        setModel(p);
        setMainImage(p.photoItems?.[0]?.url || p.coverImage || p.photos?.[0] || "");
      }

      const userCanEdit = Boolean(
        user && (user.role === "admin" || user.email.toLowerCase() === email.toLowerCase())
      );
      setCanEdit(userCanEdit);
      setHasContentAccess(Boolean(
        userCanEdit ||
        user?.role === "modelo" ||
        user?.plan === "vip" ||
        user?.subscribedModelIds?.includes(email)
      ));
    };

    loadProfile();
    return subscribeToModelProfileChanges(loadProfile);
  }, [profileId]);

  useEffect(() => {
    return () => {
      if (saveResetTimerRef.current) {
        clearTimeout(saveResetTimerRef.current);
      }
    };
  }, []);

  const currentPhotoItems = getProfilePhotoItems(model);
  const profileToSave = useMemo<ModelProfileType | null>(
    () => model ? ({
        ...model,
        photoItems: currentPhotoItems,
        photos: currentPhotoItems.map((photo) => photo.url),
        coverImage: currentPhotoItems[0]?.url,
      }) : null,
    [currentPhotoItems, model]
  );
  const estimatedStorageBytes = useMemo(
    () => (model?.email && profileToSave ? estimateModelProfileStorageSize(model.email, profileToSave) : 0),
    [model?.email, profileToSave]
  );
  const isStorageNearLimit = estimatedStorageBytes >= PROFILE_STORAGE_SOFT_LIMIT_BYTES;
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
    "w-full transition-all duration-300",
    (saveStatus === "compressing" || saveStatus === "saving") &&
      "animate-pulse scale-[0.98] bg-amber-600 text-white hover:bg-amber-600 shadow-lg shadow-amber-950/30",
    saveStatus === "success" && "bg-emerald-600 text-white hover:bg-emerald-600"
  );

  if (!model || !profileToSave) {
    return <div className="min-h-screen bg-dark-950 flex items-center justify-center text-white">Modelo não encontrada.</div>;
  }

  const handleSave = async () => {
    if (saveInFlightRef.current) return;

    if (!model.email) {
      toast({ title: "Erro ao salvar", description: "Perfil sem identificador para persistencia.", variant: "destructive" });
      return;
    }

    const currentUser = localGetUser();
    const targetUser = getUsers().find(
      (user) => user.email.toLowerCase() === model.email?.toLowerCase()
    );
    const remoteProfileId =
      currentUser?.email.toLowerCase() === model.email.toLowerCase()
        ? currentUser.id
        : targetUser?.id;
    saveInFlightRef.current = true;
    if (saveResetTimerRef.current) {
      clearTimeout(saveResetTimerRef.current);
      saveResetTimerRef.current = null;
    }
    setSaveStatus("saving");

    try {
      let nextProfile: ModelProfileType = {
        ...profileToSave,
        publicId: profileToSave.publicId || createPublicProfileId(),
        photoItems: currentPhotoItems,
        photos: currentPhotoItems.map((photo) => photo.url),
        coverImage: currentPhotoItems[0]?.url,
      };
      if (isRemoteDataEnabled()) {
        if (!remoteProfileId) {
          throw new Error(
            "O perfil não possui vínculo com um usuário do Supabase."
          );
        }

        if (!isRemoteMediaEnabled()) {
          throw new Error(
            "O armazenamento remoto de mídia está desativado. Ative o Google Drive antes de salvar."
          );
        }

        nextProfile = await syncRemoteProfileMedia(
          remoteProfileId,
          nextProfile
        );
        const published = await saveRemoteProfile(remoteProfileId, nextProfile);
        nextProfile = { ...nextProfile, publicId: published.publicId };
        saveModelProfile(model.email, nextProfile);
      } else if (!saveModelProfile(model.email, nextProfile)) {
        throw new Error(
          isStorageNearLimit
            ? `O perfil ocupa cerca de ${formatFileSize(estimatedStorageBytes)} e excedeu o espaço local. Remova algumas mídias ou ative o armazenamento remoto.`
            : "O navegador não conseguiu persistir o perfil. Tente novamente."
        );
      }

      setModel(nextProfile);
      setMainImage(nextProfile.coverImage || "");
      await new Promise(resolve => setTimeout(resolve, 350));
      setSaveStatus("success");
      saveInFlightRef.current = false;
      toast({
        title: "Perfil atualizado!",
        description: isRemoteDataEnabled()
          ? "Perfil e mídias publicados no Supabase e Google Drive."
          : "Perfil salvo somente neste navegador. A publicação remota está desativada.",
      });
      saveResetTimerRef.current = setTimeout(() => {
        setSaveStatus("idle");
        saveResetTimerRef.current = null;
      }, 1400);

    } catch (error) {
      saveInFlightRef.current = false;
      setSaveStatus("idle");
      toast({
        title: "Erro ao salvar",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar as alterações do perfil.",
        variant: "destructive",
      });
    }
  };

  const updatePhotoItems = (photoItems: ModelPhoto[]) => {
    setModel(prev => prev ? ({
      ...prev,
      photoItems,
      photos: photoItems.map(p => p.url),
      coverImage: photoItems[0]?.url
    }) : null);
  };

  const movePhoto = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const nextItems = [...currentPhotoItems];
    const [moved] = nextItems.splice(fromIndex, 1);
    if (!moved) return;
    nextItems.splice(toIndex, 0, moved);
    updatePhotoItems(nextItems);
  };

  const togglePhotoBlur = (index: number) => {
    updatePhotoItems(currentPhotoItems.map((p, i) => i === index ? { ...p, isBlurred: !p.isBlurred } : p));
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

  const processFiles = async (files: File[]) => {
    const remainingSlots = MAX_PHOTOS - currentPhotoItems.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Limite de fotos atingido",
        description: `Remova alguma foto antes de adicionar mais. Limite atual: ${MAX_PHOTOS}.`,
        variant: "destructive",
      });
      return;
    }

    const feedback: string[] = [];
    const acceptedFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
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

    for (const file of validFiles) {
      try {
        const compressed = await compressImage(file, 960, 1280, 0.72, PHOTO_TARGET_BYTES);
        setModel(prev => {
          if (!prev) return null;
          const nextItems = [...getProfilePhotoItems(prev), { id: crypto.randomUUID(), url: compressed, isBlurred: false }];
          return { ...prev, photoItems: nextItems, photos: nextItems.map(i => i.url) };
        });
      } catch (e) {
        console.error(e);
        feedback.push(`Nao foi possivel processar "${file.name}".`);
      }
    }
    toast({
      title: validFiles.length > 0 ? "Fotos adicionadas!" : "Nenhuma foto adicionada",
      description: feedback.length > 0 ? feedback.join(" ") : "As imagens foram comprimidas antes de entrar no perfil.",
      variant: validFiles.length > 0 ? "default" : "destructive",
    });
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const moveStory = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setModel(prev => {
      if (!prev) return null;
      const next = [...(prev.stories || [])];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...prev, stories: next };
    });
  };

  const toggleStoryBlur = (id: string) => {
    setModel(prev => prev ? ({
      ...prev,
      stories: (prev.stories || []).map(s => s.id === id ? { ...s, isBlurred: !s.isBlurred } : s)
    }) : null);
  };

  const removeStory = (id: string) => {
    setModel(prev => prev ? ({
      ...prev,
      stories: (prev.stories || []).filter(s => s.id !== id)
    }) : null);
  };

  const handleStoryUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const existingStories = model.stories || [];
    const remainingSlots = MAX_STORIES - existingStories.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Limite de stories atingido",
        description: `Remova algum story antes de adicionar mais. Limite atual: ${MAX_STORIES}.`,
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    const feedback: string[] = [];
    const acceptedFiles = Array.from(e.target.files).filter((file) => {
      if (file.type.startsWith("video/")) {
        feedback.push(`"${file.name}" foi bloqueado: videos nao sao suportados no modo local.`);
        return false;
      }

      if (!file.type.startsWith("image/")) {
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

    for (const file of validFiles) {
      try {
        const url = await compressImage(file, 720, 1280, 0.7, STORY_TARGET_BYTES);
        const newStory: Story = { id: crypto.randomUUID(), mediaUrl: url, mediaType: "image", createdAt: new Date().toISOString() };
        setModel(prev => prev ? ({ ...prev, stories: [...(prev.stories || []), newStory] }) : null);
      } catch (err) {
        console.error(err);
        feedback.push(`Nao foi possivel processar "${file.name}".`);
      }
    }
    toast({
      title: validFiles.length > 0 ? "Stories adicionados!" : "Nenhum story adicionado",
      description: feedback.length > 0 ? feedback.join(" ") : "Os stories foram comprimidos antes de entrar no perfil.",
      variant: validFiles.length > 0 ? "default" : "destructive",
    });
    e.target.value = "";
  };

  return (
    <div className="bg-dark-950 text-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/busca">
            <Button variant="ghost" className="hover:bg-dark-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para a busca
            </Button>
          </Link>
          {canEdit && !editing && (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Editar Perfil
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gallery */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-dark-900 border-gray-800 overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-[4/5] w-full relative group">
                  {mainImage && (
                    <Image 
                      src={mainImage} 
                      alt={model?.artisticName || ""} 
                      fill 
                      className={cn(
                        "object-cover",
                        currentPhotoItems.find(p => p.url === mainImage)?.isBlurred && !hasContentAccess && "blur-2xl"
                      )} 
                    />
                  )}
                  {currentPhotoItems.find(p => p.url === mainImage)?.isBlurred && !hasContentAccess && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10">
                      <Lock className="h-12 w-12 text-white mb-4" />
                      <p className="text-white font-bold text-lg">Conteúdo Exclusivo</p>
                      <Button className="mt-4 bg-primary-500 hover:bg-primary-600">Assinar para Ver</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-900 border-gray-800 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Galeria</h3>
                {editing && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Adicionar Fotos
                    </Button>
                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {currentPhotoItems.map((photo, index) => (
                  <div
                    key={photo.id}
                    draggable={editing}
                    onDragStart={() => setDraggedPhotoId(photo.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (!draggedPhotoId || !editing) return;
                      const fromIndex = currentPhotoItems.findIndex(p => p.id === draggedPhotoId);
                      movePhoto(fromIndex, index);
                      setDraggedPhotoId(null);
                    }}
                    className={cn(
                      "aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all relative group",
                      mainImage === photo.url ? 'border-primary-500' : 'border-transparent hover:border-gray-600'
                    )}
                    onClick={() => {
                      if (editing) {
                        setPreviewMedia({ url: photo.url, type: 'image' });
                      } else {
                        setMainImage(photo.url);
                      }
                    }}
                  >
                    <Image 
                      src={photo.url} 
                      alt={`Foto ${index + 1}`} 
                      fill 
                      className={cn("object-cover", photo.isBlurred && !hasContentAccess && "blur-md")}
                    />
                    
                    {editing && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 bg-black/50 hover:bg-black/70 text-white" onClick={(e) => { e.stopPropagation(); setPreviewMedia({ url: photo.url, type: 'image' }); }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="destructive" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); removePhoto(index); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className={cn("h-7 w-7", photo.isBlurred && "bg-amber-500")} 
                            onClick={(e) => { e.stopPropagation(); togglePhotoBlur(index); }}
                          >
                            {photo.isBlurred ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                        <Button size="sm" variant="secondary" className="text-[10px] h-6 px-2" onClick={(e) => { e.stopPropagation(); setFeaturedPhoto(index); }}>
                          Capa
                        </Button>
                        <GripVertical className="h-4 w-4 text-white cursor-grab active:cursor-grabbing" />
                      </div>
                    )}
                    {photo.isBlurred && !editing && !hasContentAccess && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Lock className="h-4 w-4 text-white/70" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Stories Section */}
            {(editing || (model.stories && model.stories.length > 0)) && (
              <Card className="bg-dark-900 border-gray-800 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-primary-500" />
                    Stories
                  </h3>
                  {editing && (
                    <Button size="sm" variant="outline" onClick={() => storyInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Adicionar Stories
                    </Button>
                  )}
                  <input type="file" multiple accept="image/*,video/*" className="hidden" ref={storyInputRef} onChange={handleStoryUpload} />
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {(model.stories || []).map((story, index) => (
                    <div
                      key={story.id}
                      draggable={editing}
                      onDragStart={() => setDraggedStoryId(story.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (!draggedStoryId || !editing) return;
                        const fromIndex = (model.stories || []).findIndex(s => s.id === draggedStoryId);
                        moveStory(fromIndex, index);
                        setDraggedStoryId(null);
                      }}
                      onClick={() => setPreviewMedia({ url: story.mediaUrl, type: story.mediaType })}
                      className="aspect-[9/16] rounded-lg overflow-hidden border border-gray-700 relative group bg-black cursor-zoom-in"
                    >
                      {story.mediaType === 'image' ? (
                        <Image src={story.mediaUrl} alt="Story" fill className={cn("object-cover", story.isBlurred && !hasContentAccess && "blur-sm")} />
                      ) : (
                        <video src={story.mediaUrl} className={cn("w-full h-full object-cover", story.isBlurred && !hasContentAccess && "blur-sm")} />
                      )}
                      
                      {/* Story Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        {editing ? (
                          <>
                            <Button size="icon" variant="destructive" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); removeStory(story.id); }}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="secondary" 
                              className={cn("h-7 w-7", story.isBlurred && "bg-amber-500")} 
                              onClick={(e) => { e.stopPropagation(); toggleStoryBlur(story.id); }}
                            >
                              {story.isBlurred ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                            </Button>
                            <GripVertical className="h-4 w-4 text-white cursor-grab" />
                          </>
                        ) : (
                          <Eye className="h-6 w-6 text-white" />
                        )}
                      </div>
                      
                      {story.isBlurred && !hasContentAccess && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Lock className="h-5 w-5 text-white/70" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <Card className="bg-dark-900 border-gray-800 p-6">
              {!editing ? (
                <h1 className="text-4xl font-bold mb-2">{model?.artisticName}, {model?.characteristics?.age || model?.age}</h1>
              ) : (
                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <Label>Nome Artístico</Label>
                    <Input value={model.artisticName} onChange={e => setModel({...model, artisticName: e.target.value})} className="bg-dark-800" />
                  </div>
                </div>
              )}
              
              <div className="flex items-center text-gray-400 mb-4">
                <MapPin className="h-4 w-4 mr-2" />
                {!editing ? (
                  <span>{model?.city}</span>
                ) : (
                  <Input value={model.city} onChange={e => setModel({...model, city: e.target.value})} className="bg-dark-800" />
                )}
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center text-amber-400">
                  <Star className="h-5 w-5 fill-current mr-1" />
                  <span className="text-lg font-bold">4.9</span>
                </div>
                <span className="text-gray-500">(24 avaliações)</span>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  Verificada
                </Badge>
              </div>

              {!editing ? (
                <p className="text-gray-300 mb-6 leading-relaxed whitespace-pre-wrap">{model?.bio}</p>
              ) : (
                <div className="space-y-2 mb-6">
                  <Label>Bio / Descrição</Label>
                  <Textarea rows={4} value={model.bio} onChange={e => setModel({...model, bio: e.target.value})} className="bg-dark-800" />
                </div>
              )}

              {!editing ? (
                <div className="text-primary-500 font-bold text-2xl mb-6">{model?.priceRange || "A consultar"}</div>
              ) : (
                <div className="space-y-2 mb-6">
                  <Label>Preço / Cachet</Label>
                  <Input value={model.priceRange} onChange={e => setModel({...model, priceRange: e.target.value})} className="bg-dark-800" />
                </div>
              )}

              <div className="space-y-3">
                {!editing ? (
                  <>
                    <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-lg">
                      <Phone className="h-5 w-5 mr-2" />
                      WhatsApp
                    </Button>
                    <Button size="lg" variant="outline" className="w-full border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Chat Interno
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button type="button" className={saveButtonClassName} onClick={() => void handleSave()} disabled={isSaving}>
                      {(saveStatus === "compressing" || saveStatus === "saving") && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                      {saveStatus === "success" && <CheckCircle2 className="mr-2 h-4 w-4" />}
                      {saveButtonLabel}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setEditing(false)}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <Card className="bg-dark-900 border-gray-800 p-6">
              <h3 className="text-xl font-bold mb-4">Características</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(PHYSICAL_CHARACTERISTICS).map(([key, data]) => (
                  <div key={key} className="space-y-1">
                    <span className="text-xs text-gray-500 block">{data.label}</span>
                    {!editing ? (
                      <span className="text-sm text-gray-200">
                        {model.characteristics?.[key as keyof PhysicalCharacteristics] || "—"}
                      </span>
                    ) : (
                      <Select 
                        value={model.characteristics?.[key as keyof PhysicalCharacteristics]} 
                        onValueChange={(val) => setModel(prev => prev ? ({...prev, characteristics: {...prev.characteristics, [key]: val}}) : null)}
                      >
                        <SelectTrigger className="bg-dark-800 border-gray-700 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-dark-800 border-gray-700 text-white">
                          {data.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-dark-900 border-gray-800 p-6">
              <h3 className="text-xl font-bold mb-4">Serviços</h3>
              <div className="flex flex-wrap gap-2">
                {!editing ? (
                  (model?.services ?? []).map((service: string) => (
                    <Badge key={service} variant="outline" className="py-1 px-3 border-gray-700 text-gray-300">
                      {service}
                    </Badge>
                  ))
                ) : (
                  SERVICES_LIST.map((service) => (
                    <Badge
                      key={service}
                      variant={(model.services || []).includes(service) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer py-1 px-3",
                        (model.services || []).includes(service) ? "bg-primary-500 text-white" : "border-gray-700 text-gray-400 hover:bg-dark-800"
                      )}
                      onClick={() => setModel(prev => {
                        if (!prev) return null;
                        const srv = prev.services || [];
                        const next = srv.includes(service) ? srv.filter(s => s !== service) : [...srv, service];
                        return { ...prev, services: next };
                      })}
                    >
                      {service}
                    </Badge>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

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
