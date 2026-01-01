
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Shield, Eye, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Model } from "./model-details-modal";
import Image from "next/image";

interface ProfileCardProps {
  profile: Model;
  isLoggedIn: boolean;
  onDetailsClick?: (model: Model) => void;
}

export function ProfileCard({ profile, isLoggedIn, onDetailsClick }: ProfileCardProps) {
  const handleDetailsClick = () => {
    if (onDetailsClick) {
      onDetailsClick(profile);
    }
  };

  return (
    <Card className="bg-dark-800/60 border-gray-700/50 rounded-xl overflow-hidden group transform hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-primary-500/20">
      <CardContent className="p-0">
        <div className="relative aspect-[3/4] overflow-hidden">
          <div
            className={cn(
              "w-full h-full transition-transform duration-500 group-hover:scale-110 cursor-pointer",
              { "blur-lg": !isLoggedIn }
            )}
            onClick={handleDetailsClick}
          >
            <Image
              src={profile.imageUrl}
              alt={profile.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          {!isLoggedIn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 pointer-events-none">
              <Eye className="h-10 w-10 text-white mb-2" />
              <Button size="sm" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black pointer-events-auto" onClick={handleDetailsClick}>
                Ver Perfil
              </Button>
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {(profile.isVerified ?? true) && (
              <Badge className="bg-blue-500 text-white border-none text-xs font-semibold">
                <Shield className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
            )}
            {/* Online status would need to be in Model type or handled differently */}
          </div>
          <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-9 w-9 bg-black/40 hover:bg-black/70 rounded-full">
            <Heart className="h-5 w-5 text-white" />
          </Button>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-white">{profile.name}, {profile.age}</h3>
            <div className="flex items-center text-gold-400">
              <Star className="h-4 w-4 fill-current mr-1" />
              <span className="font-semibold">{profile.rating}</span>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-3">{profile.city}</p>
          <div className="flex justify-between items-center">
            <p className="text-lg font-semibold text-primary-500">{profile.price}</p>
            <Button size="sm" className="bg-primary-600 hover:bg-primary-700 rounded-full px-5" onClick={handleDetailsClick}>
              Detalhes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
