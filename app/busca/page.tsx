"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { SearchFilters } from "@/components/search-filters"
import { SearchResults } from "@/components/search-results"
import { Footer } from "@/components/footer"

export interface SearchFiltersState {
  priceRange: number[];
  services: string[];
  fetishes: string[];
  cities: string[];
  onlineNow: boolean;
  characteristics: {
    hairColor: string[];
    ethnicity: string[];
    bodyType: string[];
    height: string[];
    age: string[];
    eyes: string[];
    breasts: string[];
    tattoos: string[];
    piercings: string[];
  };
}

export default function SearchPage() {
  const [filters, setFilters] = useState<SearchFiltersState>({
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

  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4">
            <SearchFilters filters={filters} setFilters={setFilters} />
          </aside>
          <main className="lg:w-3/4">
            <SearchResults filters={filters} />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  )
}


