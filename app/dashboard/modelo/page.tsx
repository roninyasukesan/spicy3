"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { type UserRole } from "@/lib/utils";
import { localGetUser, getModelProfile, saveModelProfile, type ModelProfile, type Story } from "@/lib/local-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Pause, X, Upload, Trash2, Image as ImageIcon, Film } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { FETISH_CATEGORIES } from "@/lib/fetishes";
import { PHYSICAL_CHARACTERISTICS, type PhysicalCharacteristics } from "@/lib/physical-characteristics";
import { AudioPlayerWave } from "@/components/ui/audio-player-wave";
import Image from "next/image";

const SERVICES_LIST = ["Acompanhante", "Massagem", "Jantar", "Eventos", "Viagens", "Fetiches"];

export default function ModeloDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    
    const savedProfile = getModelProfile(user.email);
    if (savedProfile) {
      setProfile(savedProfile);
    } else {
      setProfile(p => ({ ...p, artisticName: user.name }));
    }
    
    setLoading(false);
  }, [router]);

  const handleSaveProfile = () => {
    const user = localGetUser();
    if (user && user.email) {
      saveModelProfile(user.email, profile);
      toast({ title: "Perfil atualizado com sucesso!" });
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

  const processFiles = (files: File[]) => {
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setProfile(prev => ({
            ...prev,
            photos: [...(prev.photos || []), reader.result as string]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    toast({ title: "Fotos adicionadas à galeria!" });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
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

  const processStoryFiles = (files: File[]) => {
    files.forEach(file => {
      // Allow image and video
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          const newStory: Story = {
            id: Date.now().toString() + Math.random().toString().slice(2),
            mediaUrl: reader.result as string,
            mediaType: file.type.startsWith('video/') ? 'video' : 'image',
            duration: 5,
            createdAt: new Date().toISOString()
          };
          
          setProfile(prev => ({
            ...prev,
            stories: [...(prev.stories || []), newStory]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    toast({ title: "Stories adicionados!" });
  };

  const handleStoryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processStoryFiles(Array.from(e.target.files));
    }
  };

  const removePhoto = (index: number) => {
    setProfile(prev => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index)
    }));
  };

  const removeStory = (id: string) => {
    setProfile(prev => ({
      ...prev,
      stories: (prev.stories || []).filter(s => s.id !== id)
    }));
  };

  const removeVoice = () => {
    setProfile(prev => ({
      ...prev,
      voiceUrl: undefined
    }));
  };

  if (loading || role !== "modelo") {
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
        <h1 className="text-3xl font-bold text-white">Dashboard Modelo</h1>
        <p className="text-gray-400">
          Gerencie seu perfil, fotos e preferências.
        </p>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-dark-900 border-gray-800">
            <TabsTrigger value="dashboard">Visão Geral</TabsTrigger>
            <TabsTrigger value="profile">Editar Perfil</TabsTrigger>
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
                  <CardTitle className="text-white">Galeria de Fotos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {profile.photos?.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-gray-700 group">
                        <Image src={photo} alt={`Foto ${index + 1}`} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                        <button 
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-500">Selecione imagens para adicionar ao seu perfil.</p>
                </CardContent>
              </Card>

              <Card className="bg-dark-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Stories (24h)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {profile.stories?.map((story) => (
                      <div key={story.id} className="relative aspect-[9/16] rounded-md overflow-hidden border border-gray-700 group bg-black">
                        {story.mediaType === 'image' ? (
                          <Image src={story.mediaUrl} alt="Story" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                        ) : (
                          <video src={story.mediaUrl} className="w-full h-full object-cover" />
                        )}
                        <button 
                          onClick={() => removeStory(story.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded">
                           {story.mediaType === 'video' ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleStoryUpload}
                    className="bg-dark-800 border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-500">Adicione fotos ou vídeos curtos como stories.</p>
                  
                  <Button onClick={handleSaveProfile} className="w-full bg-primary hover:bg-primary/90 text-white mt-4">
                    Salvar Alterações
                  </Button>
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
                <CardTitle className="text-white">Gerenciamento de Mídia</CardTitle>
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
                      {profile.photos?.length || 0} fotos
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
                          {(!profile.photos || profile.photos.length === 0) 
                            ? "Nenhuma foto selecionada" 
                            : "Arraste suas fotos para cá ou clique para selecionar"
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grid de Visualização */}
                  {profile.photos && profile.photos.length > 0 && (
                    <div className="space-y-2 animate-in fade-in duration-500">
                      <Label className="text-gray-300">Fotos Selecionadas</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {profile.photos.map((photo, index) => (
                          <div key={index} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-700 group shadow-sm hover:shadow-md transition-all">
                            <Image src={photo} alt={`Foto ${index + 1}`} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePhoto(index);
                              }}
                              className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

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
                  <Label className="text-white text-lg">Fetiches</Label>
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
                  <Label className="text-white text-lg">Exclusões (O que não faço)</Label>
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
              <Button onClick={handleSaveProfile} size="lg" className="bg-primary hover:bg-primary/90 text-white">
                Salvar Alterações
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
