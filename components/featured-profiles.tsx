"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Eye, Flame, Shield } from "lucide-react"

interface Profile {
  id: string;
  name: string;
  rating: number;
  city: string;
  price: string;
  isVip: boolean;
  isOnline: boolean;
}

const featuredProfiles: Profile[] = [];

export function FeaturedProfiles() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 gradient-text">Nossa Seleção Exclusiva</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Descubra perfis de elite, todos verificados para sua total segurança e tranquilidade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProfiles.map((profile) => (
            <Card key={profile.id} className="bg-dark-800/50 border-gray-700 card-hover group">
              <CardContent className="p-0">
                {/* Image Container */}
                <div
                  className="relative overflow-hidden rounded-t-lg cursor-pointer"
                  onClick={() => (window.location.href = `/perfil/${profile.id}`)}
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-800 to-gray-900 blur-content flex items-center justify-center">
                    <Eye className="h-8 w-8 text-gray-500" />
                    <span className="ml-2 text-gray-500">Clique para ver</span>
                  </div>

                  {/* Status Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {profile.isVip && (
                      <Badge className="bg-gold-500 text-black font-semibold">
                        <Shield className="h-3 w-3 mr-1" />
                        VIP
                      </Badge>
                    )}
                    {profile.isOnline && <Badge className="bg-green-500 text-white">Online</Badge>}
                  </div>

                  {/* Heart Icon */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-3 right-3 h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle favorite logic
                    }}
                  >
                    <Flame className="h-4 w-4" />
                  </Button>
                </div>

                {/* Profile Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg text-white">{profile.name}</h3>
                    <div className="flex items-center text-gold-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="ml-1 text-sm">{profile.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-400 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{profile.city}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-primary-500 font-semibold">{profile.price}</span>
                    <Button
                      size="sm"
                      className="bg-primary-600 hover:bg-primary-700"
                      onClick={() => (window.location.href = `/perfil/${profile.id}`)}
                    >
                      Ver Perfil
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white bg-transparent"
          >
            Ver Todos os Perfis
          </Button>
        </div>
      </div>
    </section>
  )
}
