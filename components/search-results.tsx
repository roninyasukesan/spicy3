"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Eye, Heart, Shield, MessageCircle, PlayCircle, Filter, ChevronUp, ChevronDown, Clock, DollarSign } from "lucide-react"
import { AnimatedText } from "@/components/animated-text";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ModelDetailsModal, Model } from "@/components/model-details-modal";
import { SearchFiltersState } from "@/app/busca/page";
import { PhysicalCharacteristics } from "@/lib/physical-characteristics";
import { getAllLocalProfiles } from "@/lib/local-auth";
import { StoryViewer } from "@/components/story-viewer";
import { cn, getPublicProfileSlug } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { SearchFilters } from "@/components/search-filters"
import { locations } from "@/lib/brazil-locations";
import { mapLocalProfileToModel } from "@/lib/model-mappers";

interface SearchResultsProps {
  filters: SearchFiltersState;
  setFilters: (filters: SearchFiltersState) => void;
  isFiltersOpen?: boolean;
  setIsFiltersOpen?: (isOpen: boolean) => void;
}

export function SearchResults({ filters, setFilters, isFiltersOpen = false, setIsFiltersOpen = () => {} }: SearchResultsProps) {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredProfiles, setFilteredProfiles] = useState<Model[]>([]);
  const [profiles, setProfiles] = useState<Model[]>([]);
  const [sortBy, setSortBy] = useState<string>("relevance");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const modelIdFromUrl = searchParams.get("modelId");
  const profileSlugFromUrl = searchParams.get("perfil");

  const loadProfiles = useCallback(() => {
    const localProfiles = getAllLocalProfiles();
    const mapped: Model[] = localProfiles.map((p) => {
      const baseModel = mapLocalProfileToModel(p);

      // Normalize characteristics to match filter options
      const normalizeHairColor = (color?: string) => {
         if (!color) return "Morena";
         if (color.includes("Loir")) return "Loira";
         if (color.includes("Moren")) return "Morena";
         if (color.includes("Ruiv")) return "Ruiva";
         if (color.includes("Pret")) return "Preta";
         if (color.includes("Castanh")) return "Castanha";
         return "Morena";
      };

      const normalizeEyes = (eyes?: string) => {
          if (!eyes) return "Castanho";
          if (eyes.includes("Azul") || eyes.includes("Azuis")) return "Azul";
          if (eyes.includes("Verde")) return "Verde";
          if (eyes.includes("Castanho")) return "Castanho";
          if (eyes.includes("Preto")) return "Preto";
          if (eyes.includes("Mel")) return "Mel";
          return "Castanho";
      };

      const normalizeBreasts = (breasts?: string) => {
          if (!breasts) return "Naturais Médios";
          if (breasts.includes("Pequen")) return "Naturais Pequenos";
          if (breasts.includes("Médi")) return "Naturais Médios";
          if (breasts.includes("Grand")) return "Naturais Grandes";
          if (breasts.includes("Silicon")) return "Silicone Médio";
          return "Naturais Médios";
      };

      return {
          ...baseModel,
          rating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
          reviews: Math.floor(Math.random() * 50) + 10,
          isVerified: true,
          isOnline: Math.random() > 0.7,
          characteristics: {
              hairColor: normalizeHairColor(p.characteristics.hairColor),
              ethnicity: p.characteristics.ethnicity || "Branca",
              bodyType: p.characteristics.bodyType || "Curvilínea",
              height: p.characteristics.height || "Mediana",
              ageRange: p.characteristics.age || "18–22",
              eyes: normalizeEyes(p.characteristics.eyes),
              breasts: normalizeBreasts(p.characteristics.breasts),
              tattoos: p.characteristics.tattoos === "Sim" ? "Algumas" : "Nenhuma",
              piercings: p.characteristics.piercings === "Sim" ? "Vários" : "Nenhum"
          }
      };
    });

    setProfiles(mapped);
  }, []);

  useEffect(() => {
    if ((modelIdFromUrl || profileSlugFromUrl) && profiles.length > 0) {
      const model = profiles.find((p) => {
        if (modelIdFromUrl && p.id === modelIdFromUrl) {
          return true;
        }

        if (profileSlugFromUrl) {
          return getPublicProfileSlug(p.name, p.id) === profileSlugFromUrl;
        }

        return false;
      });
      if (model) {
        setSelectedModel(model);
        setIsModalOpen(true);
      }
      return;
    }

    setIsModalOpen(false);
    setSelectedModel(null);
  }, [modelIdFromUrl, profileSlugFromUrl, profiles]);

  useEffect(() => {
    loadProfiles();

    const handleProfilesChanged = () => loadProfiles();

    window.addEventListener("storage", handleProfilesChanged);
    window.addEventListener("spicy-profile-change", handleProfilesChanged as EventListener);

    return () => {
      window.removeEventListener("storage", handleProfilesChanged);
      window.removeEventListener("spicy-profile-change", handleProfilesChanged as EventListener);
    };
  }, [loadProfiles]);

  useEffect(() => {
    const filtered = profiles.filter(profile => {
      // Filter by State
      if (filters.state) {
        // If cities are selected, they must be in the selected state implicitly because UI clears cities on state change.
        // But we must check if the profile's city belongs to the selected state if cities array is empty.
        // If cities array is NOT empty, we just check cities inclusion (which is standard).
        // But we should strictly enforce state match in case of same city name in different states (unlikely but possible).
        
        const stateCities = (filters.state in locations) 
          ? Object.keys(locations[filters.state as keyof typeof locations] || {}) 
          : [];
        if (!stateCities.includes(profile.city)) {
          return false;
        }
      }

      // Filter by City
      if (filters.cities.length > 0 && !filters.cities.includes(profile.city)) {
        return false;
      }

      // Filter by Online Now
      if (filters.onlineNow && !profile.isOnline) {
        return false;
      }

      // Filter by Price
      const priceValue = parseInt(profile.price.replace(/\D/g, ""));
      if (priceValue < filters.priceRange[0] || priceValue > filters.priceRange[1]) {
        return false;
      }

      // Filter by Rating
      if (filters.minRating > 0 && profile.rating < filters.minRating) {
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
          let ageCategory = "";
            if (profile.age >= 18 && profile.age <= 22) ageCategory = "18–22";
            else if (profile.age >= 23 && profile.age <= 27) ageCategory = "23–27";
            else if (profile.age >= 28 && profile.age <= 35) ageCategory = "28–35";
            else if (profile.age > 35) ageCategory = "35+";
            
            if (!filters.characteristics.age.includes(ageCategory)) {
              return false;
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

    let sorted = [...filtered];
    switch (sortBy) {
      case "price_asc":
        sorted.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/\D/g, "")) || 0;
          const priceB = parseInt(b.price.replace(/\D/g, "")) || 0;
          return priceA - priceB;
        });
        break;
      case "price_desc":
        sorted.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/\D/g, "")) || 0;
          const priceB = parseInt(b.price.replace(/\D/g, "")) || 0;
          return priceB - priceA;
        });
        break;
      case "rating":
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "online":
        sorted.sort((a, b) => (a.isOnline === b.isOnline ? 0 : a.isOnline ? -1 : 1));
        break;
      case "relevance":
      default:
        // Keep original order
        break;
    }

    setFilteredProfiles(sorted);
  }, [filters, profiles, sortBy]);

  const handleOpenModal = (model: Model) => {
    setSelectedModel(model);
    setIsModalOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("modelId");
    params.set("perfil", getPublicProfileSlug(model.name, model.id));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedModel(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("perfil");
    params.delete("modelId");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const handleOpenStoriesPage = (profileId: string) => {
    router.push(`/stories?id=${encodeURIComponent(profileId)}`);
  };

  return (
    <div className="space-y-6">
      {/* Stories Bar - Instagram Style */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {profiles.filter(p => p.stories && p.stories.length > 0).map((profile) => (
          <div 
            key={profile.id} 
            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
            onClick={() => handleOpenStoriesPage(profile.id)}
          >
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 p-[2px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
              <div className="w-full h-full rounded-full border-2 border-dark-950 overflow-hidden relative">
                <Image
                  src={profile.imageUrl}
                  alt={profile.name}
                  fill
                  sizes="(max-width: 768px) 64px, 80px"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            </div>
            <span className="text-xs text-white truncate w-20 text-center">{profile.name}</span>
          </div>
        ))}
      </div>

      {/* Mobile Filter Bar (Simple + Advanced) */}
      <div className="lg:hidden mb-6 space-y-4">
        <div className="flex gap-2 items-center overflow-x-auto pb-2 scrollbar-hide">
          {/* Online Toggle */}
          <Button
            variant={filters.onlineNow ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters({ ...filters, onlineNow: !filters.onlineNow })}
            className={cn(
              "whitespace-nowrap rounded-full text-xs h-8",
              filters.onlineNow ? "bg-green-600 hover:bg-green-700" : "bg-dark-800 border-gray-700 text-gray-300"
            )}
          >
            <Clock className="w-3 h-3 mr-1.5" />
            Online agora
          </Button>

          {/* Rating Filter */}
          <Button
            variant={filters.minRating > 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters({ ...filters, minRating: filters.minRating > 0 ? 0 : 4.5 })}
            className={cn(
              "whitespace-nowrap rounded-full text-xs h-8",
              filters.minRating > 0 ? "bg-yellow-600 hover:bg-yellow-700" : "bg-dark-800 border-gray-700 text-gray-300"
            )}
          >
            <Star className="w-3 h-3 mr-1.5" />
            4.5+
          </Button>

          {/* Price Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="whitespace-nowrap rounded-full text-xs h-8 bg-dark-800 border-gray-700 text-gray-300">
                <DollarSign className="w-3 h-3 mr-1.5" />
                Preço: R$ {filters.priceRange[0]} - {filters.priceRange[1]}+
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-dark-900 border-gray-700">
              <div className="space-y-4">
                <h4 className="font-medium text-white text-sm">Faixa de Preço (R$)</h4>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(val) => setFilters({ ...filters, priceRange: val })}
                  max={1000}
                  min={50}
                  step={50}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>R$ {filters.priceRange[0]}</span>
                  <span>R$ {filters.priceRange[1]}+</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Advanced Filters Toggle */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className={cn(
              "whitespace-nowrap rounded-full text-xs h-8 border transition-all",
              isFiltersOpen 
                ? "bg-primary-600 text-white border-primary-600" 
                : "bg-dark-800 border-gray-700 text-gray-300 hover:bg-dark-700"
            )}
          >
            <Filter className="w-3 h-3 mr-1.5" />
            Mais Filtros
            {isFiltersOpen ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        </div>

        {/* Advanced Filters Content */}
        {isFiltersOpen && (
          <div className="bg-dark-900/50 rounded-lg border border-gray-800 p-4 animate-in slide-in-from-top-2 duration-200">
             <SearchFilters filters={filters} setFilters={setFilters} isOpen={true} />
          </div>
        )}
      </div>

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
          <select 
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
            className="bg-dark-700 border border-gray-600 rounded px-3 py-1 text-white text-sm w-full sm:w-auto"
          >
            <option value="relevance">Mais relevantes</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
            <option value="rating">Melhor avaliação</option>
            <option value="online">Online agora</option>
          </select>
        </div>
      </AnimatedText>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProfiles.map((profile: Model, index: number) => {
          const hasStories = profile.stories && profile.stories.length > 0;
          return (
          <AnimatedText key={profile.id} delay={index * 0.1 + 0.2}>
            <Card className="bg-dark-800/50 border-gray-700 card-hover overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div
                    className="relative w-full h-64 sm:w-48 sm:h-auto flex-shrink-0 cursor-pointer overflow-hidden group"
                    onClick={() => handleOpenModal(profile)}
                  >
                    <Image
                      src={profile.imageUrl}
                      alt={profile.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 192px"
                    />
                    {hasStories && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button 
                           size="sm" 
                           variant="secondary"
                           className="bg-pink-500/80 hover:bg-pink-500 text-white rounded-full px-4"
                           onClick={(e: React.MouseEvent) => {
                             e.stopPropagation();
                             handleOpenStoriesPage(profile.id);
                           }}
                         >
                           <PlayCircle className="w-4 h-4 mr-2" />
                           Ver Story
                         </Button>
                      </div>
                    )}
                    {hasStories && (
                      <div className="absolute inset-0 pointer-events-none border-4 border-pink-500/50 z-10" />
                    )}
                    <div className="absolute inset-0 bg-black/30 hover:bg-black/10 transition-colors"></div>

                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {profile.isOnline && (
                        <div className="bg-green-500/90 hover:bg-green-600 text-white text-xs border-none backdrop-blur-sm flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Online
                        </div>
                      )}
                      {(profile.isVerified ?? true) && (
                        <div className="bg-blue-500/90 hover:bg-blue-600 text-white text-xs border-none backdrop-blur-sm px-2.5 py-0.5 rounded-full font-semibold">
                          Verificado
                        </div>
                      )}
                    </div>

                    {/* Heart Icon */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-3 right-3 h-7 w-7 p-0 bg-black/50 hover:bg-black/70"
                      onClick={(e: React.MouseEvent) => {
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
                        <div className="flex items-center text-primary-400 text-sm">
                          <MapPin className="h-3 w-3 mr-1" />
                          {profile.city}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary-400">{profile.price}</div>
                        <div className="flex items-center text-yellow-500 text-xs justify-end mt-1">
                          <Star className="h-3 w-3 fill-current mr-1" />
                          <span>{profile.rating}</span>
                          <span className="text-gray-500 ml-1">({profile.reviews})</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {profile.bio}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {profile.services?.map((service: string) => (
                        <div key={service} className="bg-dark-700 hover:bg-dark-600 text-gray-300 border-none text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          {service}
                        </div>
                      ))}
                    </div>

                    {profile.fetishes && profile.fetishes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {profile.fetishes.map((fetish: string) => (
                          <div key={fetish} className="bg-red-900/20 text-red-300 border border-red-900/50 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                            {fetish}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-auto">
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary/90 text-white"
                        onClick={() => handleOpenModal(profile)}
                      >
                        Ver Perfil
                      </Button>
                      <Button variant="outline" size="icon" className="border-primary text-primary hover:bg-primary/10">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedText>
          );
        })}
      </div>

      <ModelDetailsModal 
        model={selectedModel} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </div>
  );
}
