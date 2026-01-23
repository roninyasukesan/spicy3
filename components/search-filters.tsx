"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { MapPin, DollarSign, Clock, Filter, Flame } from "lucide-react"
import { AnimatedText } from "@/components/animated-text";
import { FETISH_CATEGORIES } from "@/lib/fetishes";
import { PHYSICAL_CHARACTERISTICS, PhysicalCharacteristics } from "@/lib/physical-characteristics";
import { SearchFiltersState } from "@/app/busca/page";
import { locations } from "@/lib/brazil-locations";

interface SearchFiltersProps {
  filters: SearchFiltersState;
  setFilters: (filters: SearchFiltersState) => void;
  isOpen: boolean;
}

export function SearchFilters({ filters, setFilters, isOpen }: SearchFiltersProps) {
  // Removed local state: priceRange, selectedFilters, selectedFetishes

  // Derived state for cities based on selected state
  const availableCities = filters.state && filters.state in locations 
    ? Object.keys(locations[filters.state as keyof typeof locations] || {}) 
    : []

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

  const handleStateChange = (state: string) => {
    setFilters({
      ...filters,
      state,
      cities: [] // Clear cities when state changes
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
      state: "",
      priceRange: [50, 1000],
      services: [],
      fetishes: [],
      cities: [],
      onlineNow: false,
      minRating: 0,
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
      <div className={`${isOpen ? 'block' : 'hidden'} lg:block space-y-6`}>
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

              {/* Location Filter */}
              <AnimatedText delay={0.2}>
                <div className="space-y-4">
                  <h3 className="font-semibold text-white flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-primary-500" />
                    Localização
                  </h3>
                  
                  {/* State Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</label>
                    <select
                      className="w-full bg-dark-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                      value={filters.state}
                      onChange={(e) => handleStateChange(e.target.value)}
                    >
                      <option value="">Selecione um estado</option>
                      {Object.keys(locations).map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  {/* City Selection */}
                  {filters.state && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cidades</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {availableCities.map((city) => (
                          <label key={city} className="flex items-center space-x-2 cursor-pointer hover:bg-dark-700 p-1 rounded transition-colors">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-600 bg-dark-800 text-primary-500 focus:ring-primary-500 focus:ring-offset-dark-800" 
                              checked={filters.cities.includes(city)}
                              onChange={() => toggleCity(city)}
                            />
                            <span className="text-sm text-gray-300">{city}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
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
