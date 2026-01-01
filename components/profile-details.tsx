"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Shield,
  Heart,
  MessageCircle,
  Calendar,
  Eye,
  Camera,
  Phone,
} from "lucide-react"
import Image from "next/image"

interface ProfileDetailsProps {
  profileId: string
}

export function ProfileDetails({ profileId }: ProfileDetailsProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false) // Simulate login state

  // Mock data - replace with actual API call
  const profile = {
    id: profileId,
    name: "Isabella Santos",
    age: 25,
    city: "São Paulo - Jardins",
    price: "R$ 400/h",
    rating: 4.9,
    reviews: 127,
    isVip: true,
    isOnline: true,
    isVerified: true,
    bio: "Acompanhante de luxo, discreta e elegante. Formada em administração, falo inglês fluente e adoro viajar. Atendo em hotéis de alto padrão e aceito viagens nacionais e internacionais.",
    services: ["Acompanhante", "Jantar", "Eventos", "Viagens"],
    languages: ["Português", "Inglês", "Espanhol"],
    paymentMethods: ["Dinheiro", "Pix", "Cartão"],
    workingHours: "24h",
    location: "Hotel/Motel",
    images: [
      "/placeholder.svg?height=600&width=400",
      "/placeholder.svg?height=600&width=400",
      "/placeholder.svg?height=600&width=400",
      "/placeholder.svg?height=600&width=400",
    ],
    whatsapp: "+5511999999999",
  }

  const handleImageClick = (index: number) => {
    if (isLoggedIn) {
      setCurrentImageIndex(index)
    } else {
      // Redirect to login
      alert("Faça login para ver as fotos")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white" onClick={() => window.history.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Image Gallery */}
        <div className="lg:col-span-2">
          <Card className="bg-dark-800/50 border-gray-700">
            <CardContent className="p-0">
              {/* Main Image */}
              <div className="relative aspect-[4/5] mb-4">
                {isLoggedIn ? (
                  <div
                    className="w-full h-full rounded-t-lg cursor-pointer overflow-hidden relative"
                    onClick={() => handleImageClick(currentImageIndex)}
                  >
                    <Image
                      src={profile.images[currentImageIndex]}
                      alt={profile.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <div
                    className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 blur-content flex items-center justify-center rounded-t-lg cursor-pointer"
                    onClick={() => setIsLoggedIn(true)}
                  >
                    <div className="text-center">
                      <Eye className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400">Clique para fazer login</p>
                      <p className="text-gray-500 text-sm">e ver as fotos</p>
                    </div>
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {profile.isVip && (
                    <Badge className="bg-gold-500 text-black font-semibold">
                      <Shield className="h-3 w-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                  {profile.isOnline && <Badge className="bg-green-500 text-white">Online</Badge>}
                  {profile.isVerified && <Badge className="bg-blue-500 text-white">Verificado</Badge>}
                </div>

                {/* Heart Icon */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-4 right-4 h-10 w-10 p-0 bg-black/50 hover:bg-black/70"
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-2 p-4">
                {profile.images.map((image, index) => (
                  <div
                    key={index}
                    className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 ${
                      currentImageIndex === index ? "border-primary-500" : "border-transparent"
                    }`}
                    onClick={() => handleImageClick(index)}
                  >
                    {isLoggedIn ? (
                      <Image
                        src={image}
                        alt={`${profile.name} ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 25vw, 15vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 blur-content flex items-center justify-center">
                        <Camera className="h-4 w-4 text-gray-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Info */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card className="bg-dark-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {profile.name}, {profile.age}
                  </h1>
                  <div className="flex items-center text-gray-400 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{profile.city}</span>
                  </div>
                  <div className="flex items-center text-gold-500">
                    <Star className="h-4 w-4 fill-current mr-1" />
                    <span>{profile.rating}</span>
                    <span className="text-gray-400 ml-1">({profile.reviews} avaliações)</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary-500 font-bold text-2xl">{profile.price}</div>
                  <div className="flex items-center text-green-500 text-sm">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Online agora</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-300 mb-6">{profile.bio}</p>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Phone className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                <Button className="w-full bg-primary-600 hover:bg-primary-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Encontro
                </Button>
                <Button variant="outline" className="w-full border-gray-600 text-gray-300 bg-transparent">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat Privado
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card className="bg-dark-800/50 border-gray-700">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-4">Serviços</h3>
              <div className="flex flex-wrap gap-2">
                {profile.services.map((service) => (
                  <Badge key={service} variant="outline" className="border-primary-500 text-primary-500">
                    {service}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="bg-dark-800/50 border-gray-700">
            <CardContent className="p-6">
              <h3 className="font-semibold text-white mb-4">Detalhes</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Idiomas:</span>
                  <span className="text-white">{profile.languages.join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pagamento:</span>
                  <span className="text-white">{profile.paymentMethods.join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Horário:</span>
                  <span className="text-white">{profile.workingHours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Local:</span>
                  <span className="text-white">{profile.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
