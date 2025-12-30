"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { MapPin, DollarSign, Clock, Filter, X, Flame, ChevronDown, ChevronUp } from "lucide-react"
import { AnimatedText } from "@/components/animated-text";
import { FETISH_CATEGORIES } from "@/lib/fetishes";
import { PHYSICAL_CHARACTERISTICS, PhysicalCharacteristics } from "@/lib/physical-characteristics";
import { SearchFiltersState } from "@/app/busca/page";

interface SearchFiltersProps {
  filters: SearchFiltersState;
  setFilters: (filters: SearchFiltersState) => void;
}

export function SearchFilters({ filters, setFilters }: SearchFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  // Removed local state: priceRange, selectedFilters, selectedFetishes

  const cities = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Brasília", "Salvador", "Fortaleza"]
  const services = ["Acompanhante", "Massagem", "Jantar", "Viagem", "Eventos"]

  const toggleFilter = (filter: string) => {
    setFilters({
      ...filters,
      services: filters.services.includes(filter) 
        ? filters.services.filter((f) => f !== filter) 
        : [...filters.services, filter]
    })
  }

  const toggleFetish = (fetish: string) => {
    setFilters({
      ...filters,
      fetishes: filters.fetishes.includes(fetish) 
        ? filters.fetishes.filter((f) => f !== fetish) 
        : [...filters.fetishes, fetish]
    })
  }

  const toggleCharacteristic = (category: keyof PhysicalCharacteristics, value: string) => {
    setFilters({
      ...filters,
      characteristics: {
        ...filters.characteristics,
        [category]: filters.characteristics[category].includes(value)
          ? filters.characteristics[category].filter((c) => c !== value)
          : [...filters.characteristics[category], value]
      }
    })
  }

  const toggleCity = (city: string) => {
    setFilters({
      ...filters,
      cities: filters.cities.includes(city)
        ? filters.cities.filter((c) => c !== city)
        : [...filters.cities, city]
    })
  }

  const toggleOnline = () => {
    setFilters({
      ...filters,
      onlineNow: !filters.onlineNow
    })
  }

  const handlePriceChange = (value: number[]) => {
    setFilters({
      ...filters,
      priceRange: value
    })
  }

  const clearFilters = () => {
    setFilters({
      priceRange: [50, 1000],
      services: [],
      fetishes: [],
      cities: [],
      onlineNow: false,
      characteristics: {
        hairColor: [],
        ethnicity: [],
        bodyType: [],
        height: [],
        age: [],
        eyes: [],
        breasts: [],
        tattoos: [],
        piercings: []
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="lg:hidden">
        <Button 
          variant="outline"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)} 
          className="w-full flex justify-between items-center bg-dark-800 border-gray-700 text-white hover:bg-dark-700"
        >
          <span className="flex items-center">
            <Filter className="h-5 w-5 mr-2 text-primary-500" />
            Filtros
          </span>
          {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      <div className={`${isFiltersOpen ? 'block' : 'hidden'} lg:block space-y-6`}>
        <AnimatedText>
          <Card className="bg-dark-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Filter className="h-5 w-5 mr-2 text-primary-500" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Online Now */}
              <AnimatedText delay={0.1}>
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-600 bg-dark-700" 
                      checked={filters.onlineNow}
                      onChange={toggleOnline}
                    />
                    <Clock className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-300">Online agora</span>
                  </label>
                </div>
              </AnimatedText>

              {/* Cities */}
              <AnimatedText delay={0.2}>
                <div>
                  <h3 className="font-semibold text-white mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-primary-500" />
                    Cidades
                  </h3>
                  <div className="space-y-2">
                    {cities.map((city) => (
                      <label key={city} className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-600 bg-dark-700" 
                          checked={filters.cities.includes(city)}
                          onChange={() => toggleCity(city)}
                        />
                        <span className="text-sm text-gray-300">{city}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </AnimatedText>

              {/* Price Range */}
              <AnimatedText delay={0.3}>
                <div>
                  <h3 className="font-semibold text-white mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-primary-500" />
                    Faixa de Preço
                  </h3>
                  <div className="space-y-3">
                    <Slider
                      value={filters.priceRange}
                      onValueChange={handlePriceChange}
                      max={1000}
                      min={50}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>R$ {filters.priceRange[0]}</span>
                      <span>R$ {filters.priceRange[1]}+</span>
                    </div>
                  </div>
                </div>
              </AnimatedText>

              {/* Services */}
              <AnimatedText delay={0.4}>
                <div>
                  <h3 className="font-semibold text-white mb-3">Serviços</h3>
                  <div className="flex flex-wrap gap-2">
                    {services.map((service) => (
                      <Badge
                        key={service}
                        variant={filters.services.includes(service) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          filters.services.includes(service)
                            ? "bg-primary-600 text-white"
                            : "border-gray-600 text-gray-300 hover:bg-gray-700"
                        }`}
                        onClick={() => toggleFilter(service)}
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              </AnimatedText>

              {/* Fetishes */}
              <AnimatedText delay={0.4}>
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-white flex items-center">
                    <Flame className="h-4 w-4 mr-2 text-primary-500" />
                    Fetiches
                  </h3>
                  
                  {Object.entries(FETISH_CATEGORIES).map(([key, category]) => {
                    if (key === 'exclusion') return null;
                    return (
                      <div key={key} className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">{category.label}</h4>
                        <div className="flex flex-wrap gap-2">
                          {category.options.map((fetish) => (
                            <Badge
                              key={fetish}
                              variant={filters.fetishes.includes(fetish) ? "default" : "outline"}
                              className={`cursor-pointer transition-colors ${
                                filters.fetishes.includes(fetish)
                                  ? "bg-primary-600 hover:bg-primary-700 border-primary-600"
                                  : "hover:bg-gray-800 border-gray-700 text-gray-300"
                              }`}
                              onClick={() => toggleFetish(fetish)}
                            >
                              {fetish}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AnimatedText>

              {/* Physical Characteristics */}
              <AnimatedText delay={0.5}>
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-white flex items-center">
                    <span className="mr-2">👤</span>
                    Características Físicas
                  </h3>
                  
                  {Object.entries(PHYSICAL_CHARACTERISTICS).map(([key, category]) => {
                    const typedKey = key as keyof PhysicalCharacteristics;
                    return (
                      <div key={key} className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">{category.label}</h4>
                        <div className="flex flex-wrap gap-2">
                          {category.options.map((option) => (
                            <Badge
                              key={option}
                              variant={filters.characteristics[typedKey].includes(option) ? "default" : "outline"}
                              className={`cursor-pointer transition-colors ${
                                filters.characteristics[typedKey].includes(option)
                                  ? "bg-purple-600 hover:bg-purple-700 border-purple-600"
                                  : "hover:bg-gray-800 border-gray-700 text-gray-300"
                              }`}
                              onClick={() => toggleCharacteristic(typedKey, option)}
                            >
                              {option}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AnimatedText>
            </CardContent>
          </Card>
        </AnimatedText>
      </div>
    </div>
  )
}