
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Heart, Lock } from "lucide-react";
import { AnimatedText } from "@/components/animated-text";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ModelDetailsModal, Model } from "@/components/model-details-modal";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";
import { getAllLocalProfiles, localGetUser, subscribeToModelProfileChanges } from "@/lib/local-auth";
import { getGalleryItemsFromModel, mapLocalProfileToModel } from "@/lib/model-mappers";

export function LandingFeaturedModelsSection() {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isFavorite, toggle } = useFavorites();
  const [models, setModels] = useState<Model[]>([]);
  const currentUser = localGetUser();

  useEffect(() => {
    const loadModels = () => {
      const localProfiles = getAllLocalProfiles();
      const mappedModels: Model[] = localProfiles.map((profile) => {
        return {
          ...mapLocalProfileToModel(profile),
          rating: 5.0,
          reviews: Math.floor(Math.random() * 50) + 10,
          isVerified: true,
          characteristics: {
             hairColor: profile.characteristics.hairColor,
             ethnicity: profile.characteristics.ethnicity,
             bodyType: profile.characteristics.bodyType,
             height: profile.characteristics.height,
             ageRange: profile.characteristics.age,
             eyes: profile.characteristics.eyes,
             breasts: profile.characteristics.breasts,
             tattoos: profile.characteristics.tattoos,
             piercings: profile.characteristics.piercings
          }
        };
      });

      setModels(mappedModels);
    };

    loadModels();
    return subscribeToModelProfileChanges(loadModels);
  }, []);

  const handleOpenModal = (model: Model) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (models.length === 0) return null; // Or loading state

  return (
    <section className="bg-dark-950 py-16">
      <div className="container mx-auto px-4">
        <AnimatedText>
          <h2 className="text-4xl font-bold text-center text-white mb-12">Modelos em Destaque</h2>
        </AnimatedText>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {models.slice(0, 4).map((model, index) => {
            const coverPhoto = getGalleryItemsFromModel(model)[0];
            const hasContentAccess =
              currentUser?.plan === "vip" ||
              currentUser?.subscribedModelIds?.includes(model.id) ||
              currentUser?.role === "admin" ||
              currentUser?.role === "modelo";
            const shouldBlurCover = Boolean(coverPhoto?.isBlurred && !hasContentAccess);

            return (
            <AnimatedText key={model.id} delay={index * 0.1}>
              <Card className="bg-dark-900 border-gray-800 text-white rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
                <CardContent className="p-0">
                  <div className="relative h-56 sm:h-60 md:h-72 w-full cursor-pointer" onClick={() => handleOpenModal(model)}>
                    <Image src={coverPhoto?.url || model.imageUrl} alt={model.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" style={{ objectFit: "cover" }} className={cn("h-full w-full", shouldBlurCover && "blur-md")} />
                    {shouldBlurCover && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45">
                        <Lock className="h-8 w-8 text-white/80" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-2xl font-bold">{model.name}</h3>
                      <div className="flex items-center text-gray-300 text-sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{model.city}</span>
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 flex items-center text-lg font-bold text-primary-500">
                      <DollarSign className="h-5 w-5 mr-1" />
                      {model.price}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-3 right-3 h-10 w-10 p-0 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-sm transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(model.id);
                      }}
                    >
                      <Heart className={cn("h-6 w-6 transition-colors", isFavorite(model.id) ? "fill-red-500 text-red-500" : "text-white")} />
                    </Button>
                  </div>
                  <div className="p-4">
                    <Button 
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                        onClick={() => handleOpenModal(model)}
                    >
                      Ver Perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AnimatedText>
          )})}
        </div>
      </div>
      <ModelDetailsModal 
        model={selectedModel} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </section>
  );
}
