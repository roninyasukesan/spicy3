"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, DollarSign, Filter, Search, Tag } from "lucide-react"
import { AnimatedText } from "@/components/animated-text";

const fetiches = [
  "BDSM", "Dominatrix", "Submissão", "Roleplay", "Fantasia", "Golden Shower",
  "Massagem Erótica", "Beijo Grego", "Anal", "Dupla Penetração", "Travesti",
  "Transgênero", "Casais", "Striptease", "Dança Erótica", "Sessão de Fotos",
  "Viagens", "Jantares", "Eventos", "Acompanhante"
];

const locations: Record<string, Record<string, string[]>> = {
  'AC': { 'Rio Branco': ['Centro', 'Bosque'] },
  'AL': { 'Maceió': ['Ponta Verde', 'Jatiúca'] },
  'AP': { 'Macapá': ['Central', 'Santa Rita'] },
  'AM': { 'Manaus': ['Adrianópolis', 'Ponta Negra'] },
  'BA': { 'Salvador': ['Barra', 'Pituba', 'Rio Vermelho'] },
  'CE': { 'Fortaleza': ['Meireles', 'Aldeota'] },
  'DF': { 'Brasília': ['Asa Sul', 'Asa Norte', 'Lago Sul'] },
  'ES': { 'Vitória': ['Jardim Camburi', 'Praia do Canto'] },
  'GO': { 'Goiânia': ['Setor Marista', 'Bueno'] },
  'MA': { 'São Luís': ['Ponta D\'Areia', 'Calhau'] },
  'MT': { 'Cuiabá': ['Centro-Norte', 'Santa Rosa'] },
  'MS': { 'Campo Grande': ['Centro', 'Jardim dos Estados'] },
  'MG': { 'Belo Horizonte': ['Savassi', 'Lourdes', 'Funcionários'] },
  'PA': { 'Belém': ['Nazaré', 'Umarizal'] },
  'PB': { 'João Pessoa': ['Manaíra', 'Tambaú'] },
  'PR': { 'Curitiba': ['Batel', 'Centro Cívico'] },
  'PE': { 'Recife': ['Boa Viagem', 'Pina'] },
  'PI': { 'Teresina': ['Centro', 'Fátima'] },
  'RJ': { 'Rio de Janeiro': ['Copacabana', 'Ipanema', 'Leblon', 'Barra da Tijuca'], 'Niterói': ['Icaraí', 'Centro'] },
  'RN': { 'Natal': ['Ponta Negra', 'Petrópolis'] },
  'RO': { 'Porto Velho': ['Centro', 'Flodoaldo Pontes Pinto'] },
  'RR': { 'Boa Vista': ['Centro', 'Paraviana'] },
  'RS': { 'Porto Alegre': ['Moinhos de Vento', 'Bela Vista'] },
  'SC': { 'Florianópolis': ['Jurerê Internacional', 'Lagoa da Conceição'] },
  'SP': { 'São Paulo': ['Jardins', 'Moema', 'Pinheiros', 'Vila Olímpia', 'Morumbi'], 'Campinas': ['Centro', 'Cambuí', 'Nova Campinas'] },
  'SE': { 'Aracaju': ['Jardins', 'Atalaia'] },
  'TO': { 'Palmas': ['Plano Diretor Sul', 'Graciosa'] },
};


export function SearchSection() {
  const [filters, setFilters] = useState({
    state: "",
    city: "",
    neighborhood: "",
    category: "",
    priceRange: "",
    fetish: "",
  });

  const availableCities = filters.state ? Object.keys(locations[filters.state]) : [];
  const availableNeighborhoods = filters.state && filters.city ? locations[filters.state][filters.city] : [];

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value,
      ...(filterName === "state" && { city: "", neighborhood: "" }),
      ...(filterName === "city" && { neighborhood: "" }),
    }));
  };

  return (
    <section className="py-16 bg-dark-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <AnimatedText>
            <h2 className="text-4xl font-bold mb-4 gradient-text">Busque Sua Companhia Ideal</h2>
          </AnimatedText>
          <AnimatedText delay={0.2}>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Refine sua busca e encontre a companhia perfeita para cada ocasião.
            </p>
          </AnimatedText>
        </div>

        <AnimatedText delay={0.3}>
          <Card className="max-w-4xl mx-auto bg-dark-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* State Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-primary-500" />
                    Estado
                  </label>
                  <select
                    className="w-full p-3 bg-dark-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    value={filters.state}
                    onChange={(e) => handleFilterChange("state", e.target.value)}
                  >
                    <option value="">Todos os Estados</option>
                    {Object.keys(locations).map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* City Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-primary-500" />
                    Cidade
                  </label>
                  <select
                    className="w-full p-3 bg-dark-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    value={filters.city}
                    onChange={(e) => handleFilterChange("city", e.target.value)}
                    disabled={!filters.state}
                  >
                    <option value="">Todas as Cidades</option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Neighborhood Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-primary-500" />
                    Bairro
                  </label>
                  <select
                    className="w-full p-3 bg-dark-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    value={filters.neighborhood}
                    onChange={(e) => handleFilterChange("neighborhood", e.target.value)}
                    disabled={!filters.city}
                  >
                    <option value="">Todos os Bairros</option>
                    {availableNeighborhoods.map(neighborhood => (
                      <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    <Filter className="h-4 w-4 mr-2 text-primary-500" />
                    Categoria
                  </label>
                  <select
                    className="w-full p-3 bg-dark-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    value={filters.category}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                  >
                    <option value="">Todas</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                    <option value="internacional">Internacional</option>
                  </select>
                </div>

                {/* Fetish Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-primary-500" />
                    Fetiches
                  </label>
                  <select
                    className="w-full p-3 bg-dark-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    value={filters.fetish}
                    onChange={(e) => handleFilterChange("fetish", e.target.value)}
                  >
                    <option value="">Todos os Fetiches</option>
                    {fetiches.map(fetish => (
                      <option key={fetish} value={fetish}>{fetish}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-primary-500" />
                    Faixa de Valor
                  </label>
                  <select
                    className="w-full p-3 bg-dark-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange("priceRange", e.target.value)}
                  >
                    <option value="">Qualquer valor</option>
                    <option value="100-300">R$ 100 - R$ 300</option>
                    <option value="300-500">R$ 300 - R$ 500</option>
                    <option value="500+">R$ 500+</option>
                  </select>
                </div>

                {/* Search Button */}
                <div className="flex items-end lg:col-span-2">
                  <Button className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 h-12">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedText>
      </div>
    </section>
  );
}
