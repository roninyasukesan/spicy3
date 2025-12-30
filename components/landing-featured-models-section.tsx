
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign } from "lucide-react";
import { AnimatedText } from "@/components/animated-text";
import Image from "next/image";
import { useState } from "react";
import { ModelDetailsModal, Model } from "@/components/model-details-modal";

const mockModels: Model[] = [
  {
    id: "1",
    name: "Laura Diamond",
    city: "São Paulo",
    price: "R$ 500/h",
    imageUrl: "/placeholder.svg?height=400&width=300",
    age: 23,
    rating: 4.8,
    reviews: 24,
    isVerified: true,
    bio: "Adoro conhecer pessoas novas e proporcionar momentos inesquecíveis. Sou carinhosa, atenciosa e muito divertida.",
    services: ["Jantar", "Cinema", "Viagens curtas"],
    gallery: [
        "/placeholder.svg?height=400&width=300",
        "/placeholder.svg?height=400&width=300",
        "/placeholder.svg?height=400&width=300",
    ]
  },
  {
    id: "2",
    name: "Isabella Gold",
    city: "Rio de Janeiro",
    price: "R$ 650/h",
    imageUrl: "/placeholder.svg?height=400&width=300",
    age: 25,
    rating: 5.0,
    reviews: 42,
    isVerified: true,
    bio: "Sofisticação e beleza em cada detalhe. Venha viver uma experiência de alto nível.",
    services: ["Eventos", "Jantar de negócios", "Viagens internacionais"],
    gallery: [
        "/placeholder.svg?height=400&width=300",
        "/placeholder.svg?height=400&width=300",
        "/placeholder.svg?height=400&width=300",
    ]
  },
  {
    id: "3",
    name: "Sophia Ruby",
    city: "Belo Horizonte",
    price: "R$ 400/h",
    imageUrl: "/placeholder.svg?height=400&width=300",
    age: 21,
    rating: 4.7,
    reviews: 18,
    isVerified: true,
    bio: "Doce e encantadora, pronta para ser sua melhor companhia.",
    services: ["Cinema", "Passeios", "Jantar"],
    gallery: [
        "/placeholder.svg?height=400&width=300",
        "/placeholder.svg?height=400&width=300",
        "/placeholder.svg?height=400&width=300",
    ]
  },
];

export function LandingFeaturedModelsSection() {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (model: Model) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <section className="bg-dark-950 py-16">
      <div className="container mx-auto px-4">
        <AnimatedText>
          <h2 className="text-4xl font-bold text-center text-white mb-12">Modelos em Destaque</h2>
        </AnimatedText>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockModels.map((model, index) => (
            <AnimatedText key={model.id} delay={index * 0.1}>
              <Card className="bg-dark-900 border-gray-800 text-white rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
                <CardContent className="p-0">
                  <div className="relative h-56 sm:h-60 md:h-72 w-full cursor-pointer" onClick={() => handleOpenModal(model)}>
                    <Image src={model.imageUrl} alt={model.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" style={{ objectFit: "cover" }} className="w-full h-full" />
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
          ))}
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
