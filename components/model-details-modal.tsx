"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, MessageCircle, ShieldCheck, Flame } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

// Define the interface for the model prop
export interface Model {
  id: string;
  name: string;
  city: string;
  price: string;
  imageUrl: string;
  age: number;
  rating?: number;
  reviews?: number;
  isVerified?: boolean;
  bio?: string;
  services?: string[];
  fetishes?: string[];
  gallery?: string[];
  characteristics?: {
    hairColor?: string;
    ethnicity?: string;
    bodyType?: string;
    height?: string;
    ageRange?: string;
    eyes?: string;
    breasts?: string;
    tattoos?: string;
    piercings?: string;
  };
}

interface ModelDetailsModalProps {
  model: Model | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ModelDetailsModal({ model, isOpen, onClose }: ModelDetailsModalProps) {
  const [mainImage, setMainImage] = useState<string | null>(null);

  // Reset main image when model changes
  useEffect(() => {
    if (model) {
      setMainImage(model.imageUrl);
    }
  }, [model]);

  if (!model) return null;

  // Use model.imageUrl as default main image if mainImage is not set
  const currentMainImage = mainImage || model.imageUrl;
  
  // Mock additional data if missing (since we are transitioning from simple mock data)
  const gallery = model.gallery || [
    model.imageUrl,
    "/placeholder.svg?height=600&width=400",
    "/placeholder.svg?height=600&width=400",
    "/placeholder.svg?height=600&width=400",
  ];
  const bio = model.bio || "Uma mulher sofisticada e envolvente, pronta para transformar seus momentos em memórias inesquecíveis.";
  const services = model.services || ["Jantar a dois", "Eventos", "Viagens"];
  const fetishes = model.fetishes || [];
  const rating = model.rating || 4.9;
  const reviews = model.reviews || 15;
  const age = model.age || 24;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-dark-950 text-white border-gray-800 p-0 overflow-hidden max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Gallery Section */}
          <div className="bg-dark-900 p-4">
            <div className="aspect-[3/4] w-full rounded-lg overflow-hidden mb-4 relative">
              <Image 
                src={currentMainImage} 
                alt={model.name} 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }} 
              />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {gallery.map((img, index) => (
                <div
                  key={index}
                  className={`aspect-square rounded-md cursor-pointer border-2 transition-all relative ${currentMainImage === img ? 'border-primary-500' : 'border-transparent hover:border-gray-600'}`}
                  onClick={() => setMainImage(img)}
                >
                  <Image src={img} alt={`${model.name} ${index + 1}`} fill sizes="100px" style={{ objectFit: "cover" }} className="rounded-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 space-y-6 flex flex-col">
            <div>
              <DialogTitle className="text-3xl font-bold mb-2">{model.name}, {age}</DialogTitle>
              <div className="flex items-center text-gray-400 mb-4">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{model.city}</span>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center text-gold-400">
                  <Star className="h-5 w-5 fill-current mr-1" />
                  <span className="text-lg font-bold">{rating}</span>
                </div>
                <span className="text-gray-500">({reviews} avaliações)</span>
                {(model.isVerified ?? true) && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                    <ShieldCheck className="h-4 w-4 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>

              <div className="text-2xl font-bold text-primary-500 mb-6">
                {model.price}
              </div>

              {/* Physical Characteristics */}
              {model.characteristics && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6 text-sm text-gray-300 bg-dark-900 p-4 rounded-lg">
                  {model.characteristics.ageRange && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Idade:</span>
                      <span className="font-medium text-white">{model.characteristics.ageRange}</span>
                    </div>
                  )}
                  {model.characteristics.height && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Altura:</span>
                      <span className="font-medium text-white">{model.characteristics.height}</span>
                    </div>
                  )}
                  {model.characteristics.bodyType && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Corpo:</span>
                      <span className="font-medium text-white">{model.characteristics.bodyType}</span>
                    </div>
                  )}
                  {model.characteristics.hairColor && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cabelo:</span>
                      <span className="font-medium text-white">{model.characteristics.hairColor}</span>
                    </div>
                  )}
                  {model.characteristics.ethnicity && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Etnia:</span>
                      <span className="font-medium text-white">{model.characteristics.ethnicity}</span>
                    </div>
                  )}
                  {model.characteristics.eyes && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Olhos:</span>
                      <span className="font-medium text-white">{model.characteristics.eyes}</span>
                    </div>
                  )}
                  {model.characteristics.breasts && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Seios:</span>
                      <span className="font-medium text-white">{model.characteristics.breasts}</span>
                    </div>
                  )}
                  {model.characteristics.tattoos && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tatuagens:</span>
                      <span className="font-medium text-white">{model.characteristics.tattoos}</span>
                    </div>
                  )}
                  {model.characteristics.piercings && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Piercings:</span>
                      <span className="font-medium text-white">{model.characteristics.piercings}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-gray-300 mb-6 leading-relaxed">
                {bio}
              </p>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Serviços:</h3>
                <div className="flex flex-wrap gap-2">
                  {services.map((service, index) => (
                    <Badge key={index} variant="outline" className="border-gray-700 text-gray-300">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              {fetishes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Flame className="h-4 w-4 mr-2 text-red-500" />
                    Fetiches:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {fetishes.map((fetish, index) => (
                      <Badge 
                        key={index} 
                        className="bg-red-900/20 text-red-300 border border-red-900/50 hover:bg-red-900/30"
                      >
                        {fetish}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 mt-auto">
              <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-lg">
                <Phone className="h-5 w-5 mr-2" />
                WhatsApp
              </Button>
              <Button size="lg" variant="outline" className="w-full border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white">
                <MessageCircle className="h-5 w-5 mr-2" />
                Chat Privado
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
