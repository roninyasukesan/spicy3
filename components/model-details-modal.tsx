"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, MessageCircle, ShieldCheck, Flame, Heart, X, Video, Lock, ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { localGetUser } from "@/lib/local-auth";
import { LoginForm } from "@/components/login-form";
import { SubscriptionModal } from "@/components/subscription-modal";
import { StoryViewer } from "./story-viewer";
import { Story, type ModelPhoto } from "@/lib/local-auth";
import { getGalleryItemsFromModel } from "@/lib/model-mappers";
import { toast } from "@/components/ui/use-toast";

// Define the interface for the model prop
export interface Model {
  id: string;
  publicId?: string;
  name: string;
  city: string;
  price: string;
  imageUrl: string;
  age: number;
  rating?: number;
  reviews?: number;
  isVerified?: boolean;
  isOnline?: boolean;
  bio?: string;
  services?: string[];
  fetishes?: string[];
  exclusions?: string[];
  gallery?: string[];
  galleryItems?: ModelPhoto[];
  stories?: Story[];
  characteristics?: {
    hairColor?: string;
    ethnicity?: string;
    bodyType?: string;
    height?: string;
    ageRange?: string;
    eyes?: string;
    breasts?: string;
    tattoos?: string;
    piercings?: string;
  };
}

interface ModelDetailsModalProps {
  model: Model | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ModelDetailsModal({ model, isOpen, onClose }: ModelDetailsModalProps) {
  const { isFavorite, toggle } = useFavorites();
  const router = useRouter();
  
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isGalleryLightboxOpen, setIsGalleryLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);

  // Reset main image when model changes
  useEffect(() => {
    if (model) {
      setMainImage(model.imageUrl);
      setLightboxIndex(0);
    }
  }, [model]);

  const currentUser = localGetUser();

  const handleContentUnlock = () => {
    if (!model) return;
    const user = localGetUser();
    if (!user) {
      setShowLoginModal(true);
      toast({
        title: "Login necessário",
        description: "Faça login para acessar o conteúdo.",
        variant: "destructive",
      });
      return;
    }
    // Admin and Models have unrestricted access
    if (user.role === "admin" || user.role === "modelo") {
      return;
    }

    if (user.plan !== "vip" && !user.subscribedModelIds?.includes(model.id)) {
      setShowSubscriptionModal(true);
      toast({
        title: "Assinatura necessária",
        description: "Assine para acessar o conteúdo completo.",
        variant: "destructive",
      });
    }
  };

  const handleChat = () => {
    if (!model) return;
    const user = localGetUser();
    
    if (!user) {
      setShowLoginModal(true);
      toast({
        title: "Login necessário",
        description: "Faça login para iniciar uma conversa.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has access (Admin, Model, VIP or subscribed to this model)
    const hasAccess = user.role === "admin" || user.role === "modelo" || user.plan === "vip" || user.subscribedModelIds?.includes(model.id);
    
    if (!hasAccess) {
      setShowSubscriptionModal(true);
      toast({
        title: "Assinatura necessária",
        description: "Assine para ter acesso ao chat com esta modelo.",
        variant: "destructive",
      });
      return;
    }

    // User has access, navigate to chat
    router.push(`/dashboard/chat?contactId=${model.id}`);
  };

  const handleVideoCall = () => {
    if (!model) return;
    const user = localGetUser();
    
    if (!user) {
      setShowLoginModal(true);
      toast({
        title: "Login necessário",
        description: "Faça login para iniciar uma videochamada.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has access (Admin, Model, VIP or subscribed to this model)
    const hasAccess = user.role === "admin" || user.role === "modelo" || user.plan === "vip" || user.subscribedModelIds?.includes(model.id);
    
    if (!hasAccess) {
      setShowSubscriptionModal(true);
      toast({
        title: "Assinatura necessária",
        description: "Assine para ter acesso a videochamadas com esta modelo.",
        variant: "destructive",
      });
      return;
    }

    // User has access, initiate video call
    toast({
      title: "Videochamada iniciada",
      description: `Conectando com ${model.name}...`,
    });
    // TODO: Implement actual video call logic
  };

  if (!model) return null;

  const isClient = currentUser?.role === "cliente";
  const hasContentAccess = currentUser?.plan === "vip" || currentUser?.subscribedModelIds?.includes(model.id) || currentUser?.role === "admin" || currentUser?.role === "modelo";
  const galleryItems = getGalleryItemsFromModel(model)
  
  const currentMainItem =
    galleryItems.find((item) => item.url === mainImage) || galleryItems[0]
  const currentMainImage = currentMainItem?.url || model.imageUrl
  const shouldBlurCurrentMain = Boolean(currentMainItem?.isBlurred && !hasContentAccess)
  const bio = model.bio || "Uma mulher sofisticada e envolvente, pronta para transformar seus momentos em memórias inesquecíveis.";
  const services = model.services || ["Jantar a dois", "Eventos", "Viagens"];
  const fetishes = model.fetishes || [];
  const exclusions = model.exclusions || [];
  const rating = model.rating || 4.9;
  const reviews = model.reviews || 15;
  const age = model.age || 24;
  const hasStories = model.stories && model.stories.length > 0;

  const openGalleryLightbox = (imageUrl: string) => {
    const targetIndex = galleryItems.findIndex((item) => item.url === imageUrl)
    setLightboxIndex(targetIndex >= 0 ? targetIndex : 0)
    setIsGalleryLightboxOpen(true)
  }

  const showPrevLightboxImage = () => {
    setLightboxIndex((prev) => (prev === 0 ? galleryItems.length - 1 : prev - 1))
  }

  const showNextLightboxImage = () => {
    setLightboxIndex((prev) => (prev === galleryItems.length - 1 ? 0 : prev + 1))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-dark-950 text-white border-gray-800 p-0 overflow-hidden max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus:outline-none"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Fechar</span>
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Gallery Section */}
          <div className="bg-dark-900 p-4">
            <div
              className="aspect-[3/4] w-full rounded-lg overflow-hidden mb-4 relative"
              onClick={() => {
                if (shouldBlurCurrentMain) {
                  handleContentUnlock()
                  return
                }
                openGalleryLightbox(currentMainImage)
              }}
            >
              <Image 
                src={currentMainImage} 
                alt={model.name} 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }} 
                className={cn(shouldBlurCurrentMain && "blur-md")}
              />
              {shouldBlurCurrentMain && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-center">
                  <div className="flex flex-col items-center gap-2 text-white">
                    <Lock className="h-8 w-8" />
                    <span className="text-sm font-semibold">Foto protegida</span>
                    <span className="text-xs text-gray-200">Assine para desbloquear</span>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {galleryItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`aspect-square rounded-md cursor-pointer border-2 transition-all relative ${currentMainImage === item.url ? 'border-primary-500' : 'border-transparent hover:border-gray-600'}`}
                  onClick={() => {
                    if (item.isBlurred && !hasContentAccess) {
                      handleContentUnlock()
                      return
                    }
                    setMainImage(item.url)
                  }}
                >
                  <Image src={item.url} alt={`${model.name} ${index + 1}`} fill sizes="100px" style={{ objectFit: "cover" }} className={cn("rounded-sm", item.isBlurred && !hasContentAccess && "blur-md")} />
                  {item.isBlurred && !hasContentAccess && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-6 flex flex-col">
            <div>
              <div className="flex items-center justify-between mb-2">
                <DialogTitle className="text-3xl font-bold">{model.name}, {age}</DialogTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-dark-800"
                  onClick={() => toggle(model.id)}
                >
                  <Heart className={cn("h-8 w-8 transition-colors", isFavorite(model.id) ? "fill-red-500 text-red-500" : "text-gray-500")} />
                </Button>
              </div>
              <div className="flex items-center text-gray-400 mb-4">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{model.city}</span>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center text-gold-400">
                  <Star className="h-5 w-5 fill-current mr-1" />
                  <span className="text-lg font-bold">{rating}</span>
                </div>
                <span className="text-gray-500">({reviews} avaliações)</span>
                {model.isOnline && (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/50 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Online
                  </Badge>
                )}
                {(model.isVerified ?? true) && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                    <ShieldCheck className="h-4 w-4 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>

              {/* Stories Preview inside Modal */}
              {hasStories && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-pink-500" />
                    Stories Recentes
                  </h3>
                  <div 
                    className="flex items-center gap-3 p-2 bg-dark-900 rounded-xl border border-gray-800 cursor-pointer hover:bg-dark-800 transition-colors group"
                    onClick={() => setIsStoryViewerOpen(true)}
                  >
                    <div className="relative w-12 h-12 rounded-full p-0.5 bg-gradient-to-br from-primary-500 to-pink-500">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-dark-900">
                        <Image src={model.imageUrl} alt={model.name} fill className="object-cover" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Ver Stories</p>
                      <p className="text-xs text-gray-500">{model.stories?.length} momentos postados</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
              )}

              <div className="text-2xl font-bold text-red-600 mb-6">
                {model.price}
              </div>

              {/* Physical Characteristics */}
              {model.characteristics && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6 text-sm text-gray-300 bg-dark-900 p-4 rounded-lg">
                  {model.characteristics.ageRange && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Idade:</span>
                      <span className="font-medium text-white">{model.characteristics.ageRange}</span>
                    </div>
                  )}
                  {model.characteristics.height && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Altura:</span>
                      <span className="font-medium text-white">{model.characteristics.height}</span>
                    </div>
                  )}
                  {model.characteristics.bodyType && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Corpo:</span>
                      <span className="font-medium text-white">{model.characteristics.bodyType}</span>
                    </div>
                  )}
                  {model.characteristics.hairColor && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cabelo:</span>
                      <span className="font-medium text-white">{model.characteristics.hairColor}</span>
                    </div>
                  )}
                  {model.characteristics.ethnicity && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Etnia:</span>
                      <span className="font-medium text-white">{model.characteristics.ethnicity}</span>
                    </div>
                  )}
                  {model.characteristics.eyes && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Olhos:</span>
                      <span className="font-medium text-white">{model.characteristics.eyes}</span>
                    </div>
                  )}
                  {model.characteristics.breasts && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Seios:</span>
                      <span className="font-medium text-white">{model.characteristics.breasts}</span>
                    </div>
                  )}
                  {model.characteristics.tattoos && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tatuagens:</span>
                      <span className="font-medium text-white">{model.characteristics.tattoos}</span>
                    </div>
                  )}
                  {model.characteristics.piercings && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Piercings:</span>
                      <span className="font-medium text-white">{model.characteristics.piercings}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-gray-300 mb-6 leading-relaxed">
                {bio}
              </p>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Serviços:</h3>
                <div className="flex flex-wrap gap-2">
                  {services.map((service, index) => (
                    <Badge key={index} variant="outline" className="border-gray-700 text-gray-300">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              {fetishes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Flame className="h-4 w-4 mr-2 text-red-500" />
                    Faz:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {fetishes.map((fetish, index) => (
                      <Badge 
                        key={index} 
                        className="bg-red-900/20 text-red-300 border border-red-900/50 hover:bg-red-900/30"
                      >
                        {fetish}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {exclusions.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Não faz:</h3>
                  <div className="flex flex-wrap gap-2">
                    {exclusions.map((exclusion, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-amber-700/60 text-amber-200 bg-amber-950/20"
                      >
                        {exclusion}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 mt-auto">
              <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-lg">
                <Phone className="h-5 w-5 mr-2" />
                WhatsApp
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  onClick={handleChat}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Chat
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  onClick={handleVideoCall}
                >
                  <Video className="h-5 w-5 mr-2" />
                  Vídeo
                </Button>
              </div>
            </div>
          </div>
        </div>

        {isGalleryLightboxOpen && (
          <div
            className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center"
            onClick={() => setIsGalleryLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsGalleryLightboxOpen(false)
              }}
              className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar slide</span>
            </button>

            {galleryItems.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  showPrevLightboxImage()
                }}
                className="absolute left-4 rounded-full bg-black/60 p-3 text-white hover:bg-black/80"
              >
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">Foto anterior</span>
              </button>
            )}

            <div
              className="relative h-[78vh] w-[min(92vw,540px)]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={galleryItems[lightboxIndex]?.url || currentMainImage}
                alt={`${model.name} slide ${lightboxIndex + 1}`}
                fill
                sizes="92vw"
                className="object-contain"
                priority
              />
            </div>

            {galleryItems.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  showNextLightboxImage()
                }}
                className="absolute right-4 rounded-full bg-black/60 p-3 text-white hover:bg-black/80"
              >
                <ChevronRight className="h-6 w-6" />
                <span className="sr-only">Próxima foto</span>
              </button>
            )}

            {galleryItems.length > 1 && (
              <div
                className="absolute bottom-4 left-1/2 flex max-w-[90vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-xl bg-black/50 p-3 opacity-0 transition-opacity duration-200 hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                {galleryItems.map((item, index) => (
                  <button
                    key={`lightbox-${item.id}`}
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className={cn(
                      "relative h-16 w-12 shrink-0 overflow-hidden rounded-md border-2",
                      index === lightboxIndex ? "border-primary-500" : "border-transparent"
                    )}
                  >
                    <Image
                      src={item.url}
                      alt={`${model.name} miniatura ${index + 1}`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>

      {isStoryViewerOpen && (
        <StoryViewer
          isOpen={isStoryViewerOpen}
          onClose={() => setIsStoryViewerOpen(false)}
          stories={model.stories || []}
          modelName={model.name}
          modelImage={model.imageUrl}
          modelId={model.id}
          hasAccess={hasContentAccess}
        />
      )}
      
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="bg-transparent border-none p-0 max-w-md">
          <DialogTitle className="sr-only">Login</DialogTitle>
          <LoginForm />
        </DialogContent>
      </Dialog>

      <SubscriptionModal 
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        modelName={model.name}
        modelId={model.id}
        onSuccess={() => {
          // Auto-trigger chat after success if desired, or just let user click again
          handleChat();
        }}
      />
    </Dialog>
  );
}
