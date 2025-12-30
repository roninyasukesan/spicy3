"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Eye, Heart, Shield, MessageCircle } from "lucide-react"
import { AnimatedText } from "@/components/animated-text";
import { useState, useEffect } from "react";
import { ModelDetailsModal, Model } from "@/components/model-details-modal";
import { SearchFiltersState } from "@/app/busca/page";
import { PhysicalCharacteristics } from "@/lib/physical-characteristics";
import { mockProfiles, ModelWithCharacteristics } from "@/lib/mock-profiles";
import { fetchProfiles, fetchProfilesFiltered } from "@/lib/db/profiles";

const allProfiles: ModelWithCharacteristics[] = mockProfiles;

interface SearchResultsProps {
  filters: SearchFiltersState;
}

export function SearchResults({ filters }: SearchResultsProps) {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredProfiles, setFilteredProfiles] = useState<ModelWithCharacteristics[]>(allProfiles);
  const [profiles, setProfiles] = useState<ModelWithCharacteristics[]>(allProfiles);

  useEffect(() => {
    let mounted = true
    async function load() {
      const serverData = await fetchProfilesFiltered({
        cities: filters.cities,
        services: filters.services,
        fetishes: filters.fetishes,
      })
      if (!mounted) return
      const baseData = serverData && serverData.length > 0 ? serverData : await fetchProfiles()
      if (!baseData || baseData.length === 0) {
        setProfiles(allProfiles)
        return
      }
      const mapped: ModelWithCharacteristics[] = baseData.map(p => ({
        id: p.id,
        name: p.name,
        city: p.city,
        price: p.price,
        imageUrl: p.image_url ?? "/placeholder.svg?height=400&width=300",
        age: p.age ?? 0,
        rating: p.rating ?? 0,
        reviews: p.reviews ?? 0,
        isVerified: p.is_verified ?? true,
        bio: p.bio ?? "",
        services: p.services ?? [],
        fetishes: p.fetishes ?? [],
        gallery: p.gallery ?? [],
        characteristics: p.characteristics ?? undefined
      }))
      setProfiles(mapped)
    }
    load()
    return () => {
      mounted = false
    }
  }, [filters.cities, filters.services, filters.fetishes])

  useEffect(() => {
    const filtered = profiles.filter(profile => {
      // Filter by City
      if (filters.cities.length > 0 && !filters.cities.includes(profile.city)) {
        return false;
      }

      // Filter by Price
      const priceValue = parseInt(profile.price.replace(/\D/g, ""));
      if (priceValue < filters.priceRange[0] || priceValue > filters.priceRange[1]) {
        return false;
      }

      // Filter by Services (AND logic - must have all selected services)
      if (filters.services.length > 0) {
        const hasAllServices = filters.services.every(service => 
          profile.services?.includes(service)
        );
        if (!hasAllServices) return false;
      }

      // Filter by Fetishes (AND logic - must have all selected fetishes)
      if (filters.fetishes.length > 0) {
        const hasAllFetishes = filters.fetishes.every(fetish => 
          profile.fetishes?.includes(fetish)
        );
        if (!hasAllFetishes) return false;
      }

      // Filter by Physical Characteristics
      if (filters.characteristics) {
        // Hair Color
        if (filters.characteristics.hairColor.length > 0) {
          if (!profile.characteristics?.hairColor || !filters.characteristics.hairColor.includes(profile.characteristics.hairColor)) {
            return false;
          }
        }

        // Ethnicity
        if (filters.characteristics.ethnicity.length > 0) {
          if (!profile.characteristics?.ethnicity || !filters.characteristics.ethnicity.includes(profile.characteristics.ethnicity)) {
            return false;
          }
        }

        // Body Type
        if (filters.characteristics.bodyType.length > 0) {
          if (!profile.characteristics?.bodyType || !filters.characteristics.bodyType.includes(profile.characteristics.bodyType)) {
            return false;
          }
        }

        // Height
        if (filters.characteristics.height.length > 0) {
          if (!profile.characteristics?.height || !filters.characteristics.height.includes(profile.characteristics.height)) {
            return false;
          }
        }

        // Age
        if (filters.characteristics.age.length > 0) {
          // This matches the age range string, but could be more sophisticated (checking actual age number)
          // For now, we match the range tag if it exists, or infer from age number
          if (filters.characteristics.age.length > 0) {
            let ageCategory = "";
            if (profile.age >= 18 && profile.age <= 22) ageCategory = "18–22";
            else if (profile.age >= 23 && profile.age <= 27) ageCategory = "23–27";
            else if (profile.age >= 28 && profile.age <= 35) ageCategory = "28–35";
            else if (profile.age > 35) ageCategory = "35+";
            
            if (!filters.characteristics.age.includes(ageCategory)) {
              return false;
            }
          }
        }

        // Eyes
        if (filters.characteristics.eyes && filters.characteristics.eyes.length > 0) {
          if (!profile.characteristics?.eyes || !filters.characteristics.eyes.includes(profile.characteristics.eyes)) {
            return false;
          }
        }

        // Breasts
        if (filters.characteristics.breasts && filters.characteristics.breasts.length > 0) {
          if (!profile.characteristics?.breasts || !filters.characteristics.breasts.includes(profile.characteristics.breasts)) {
            return false;
          }
        }

        // Tattoos
        if (filters.characteristics.tattoos && filters.characteristics.tattoos.length > 0) {
          if (!profile.characteristics?.tattoos || !filters.characteristics.tattoos.includes(profile.characteristics.tattoos)) {
            return false;
          }
        }

        // Piercings
        if (filters.characteristics.piercings && filters.characteristics.piercings.length > 0) {
          if (!profile.characteristics?.piercings || !filters.characteristics.piercings.includes(profile.characteristics.piercings)) {
            return false;
          }
        }
      }

      return true;
    });

    setFilteredProfiles(filtered);
  }, [filters, profiles]);

  const handleOpenModal = (model: Model) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <AnimatedText>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-3xl font-bold text-white">Resultados da Busca</h1>
          <span className="text-gray-400">{filteredProfiles.length} perfis encontrados</span>
        </div>
      </AnimatedText>

      {/* Sort Options */}
      <AnimatedText delay={0.1}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="text-gray-400 text-sm">Ordenar por:</span>
          <select className="bg-dark-700 border border-gray-600 rounded px-3 py-1 text-white text-sm w-full sm:w-auto">
            <option>Mais relevantes</option>
            <option>Menor preço</option>
            <option>Maior preço</option>
            <option>Melhor avaliação</option>
            <option>Online agora</option>
          </select>
        </div>
      </AnimatedText>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProfiles.map((profile, index) => (
          <AnimatedText key={profile.id} delay={index * 0.1 + 0.2}>
            <Card className="bg-dark-800/50 border-gray-700 card-hover overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div
                    className="relative w-full h-64 sm:w-48 sm:h-auto flex-shrink-0 cursor-pointer"
                    onClick={() => handleOpenModal(profile)}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 blur-content flex items-center justify-center sm:rounded-l-lg"
                         style={{ backgroundImage: `url(${profile.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                      <div className="absolute inset-0 bg-black/30 hover:bg-black/10 transition-colors"></div>
                    </div>

                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {(profile.isVerified ?? true) && <Badge className="bg-blue-500 text-white text-xs">Verificado</Badge>}
                    </div>

                    {/* Heart Icon */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-3 right-3 h-7 w-7 p-0 bg-black/50 hover:bg-black/70"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle favorite logic
                      }}
                    >
                      <Heart className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-xl text-white mb-1">
                          {profile.name}, {profile.age}
                        </h3>
                        <div className="flex items-center text-gray-400 text-sm mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{profile.city}</span>
                        </div>
                        <div className="flex items-center text-gold-500 text-sm">
                          <Star className="h-4 w-4 fill-current mr-1" />
                          <span>{profile.rating}</span>
                          <span className="text-gray-400 ml-1">({profile.reviews} avaliações)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-primary-500 font-bold text-lg">{profile.price}</div>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{profile.bio}</p>

                    <div className="flex items-center space-x-3">
                      <Button
                        size="sm"
                        className="bg-primary-600 hover:bg-primary-700 flex-1"
                        onClick={() => handleOpenModal(profile)}
                      >
                        Ver Perfil Completo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white bg-transparent"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedText>
        ))}
      </div>

      {/* Load More */}
      <AnimatedText delay={filteredProfiles.length * 0.1 + 0.3}>
        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            className="border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white bg-transparent"
          >
            Carregar Mais Resultados
          </Button>
        </div>
      </AnimatedText>
      
      <ModelDetailsModal 
        model={selectedModel} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </div>
  )
}
