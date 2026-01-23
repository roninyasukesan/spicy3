"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { SearchFilters } from "@/components/search-filters"
import { SearchResults } from "@/components/search-results"
import { Footer } from "@/components/footer"

export interface SearchFiltersState {
  state: string;
  priceRange: number[];
  services: string[];
  fetishes: string[];
  cities: string[];
  onlineNow: boolean;
  minRating: number;
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

  const [debouncedFilters, setDebouncedFilters] = useState<SearchFiltersState>(filters)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters)
    }, 500)

    return () => clearTimeout(timer)
  }, [filters])

  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block lg:w-1/4">
            <SearchFilters filters={filters} setFilters={setFilters} isOpen={isFiltersOpen} />
          </aside>
          <main className="lg:w-3/4">
            <SearchResults 
              filters={debouncedFilters} 
              setFilters={setFilters}
              isFiltersOpen={isFiltersOpen} 
              setIsFiltersOpen={setIsFiltersOpen} 
            />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  )
}


