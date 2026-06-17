
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Shield, Eye, Heart, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Model } from "./model-details-modal";
import { useFavorites } from "@/lib/favorites";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { localGetUser } from "@/lib/local-auth";
import { getGalleryItemsFromModel } from "@/lib/model-mappers";
import { MediaFill } from "@/components/ui/media-fill";

interface ProfileCardProps {
  profile: Model;
  isLoggedIn: boolean;
  onDetailsClick?: (model: Model) => void;
  onStoryClick?: (model: Model) => void;
}

export function ProfileCard({ profile, isLoggedIn, onDetailsClick, onStoryClick }: ProfileCardProps) {
  const { isFavorite, toggle } = useFavorites();
  const [liked, setLiked] = useState(false);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const { toast } = useToast();
  
  function hasSupabaseConfig() {
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  
  const hasStories = profile.stories && profile.stories.length > 0;
  const currentUser = localGetUser();
  const hasContentAccess =
    currentUser?.plan === "vip" ||
    currentUser?.subscribedModelIds?.includes(profile.id) ||
    currentUser?.role === "admin" ||
    currentUser?.role === "modelo";
  const coverPhoto = getGalleryItemsFromModel(profile)[0];
  const shouldBlurCover = Boolean(coverPhoto?.isBlurred && !hasContentAccess);

  // Initialize BroadcastChannel for cross-user heart actions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      bcRef.current = new BroadcastChannel("spicy_heart_actions");
      
      bcRef.current.onmessage = (event) => {
        const { type, profileId, action } = event.data;
        
        if (type === 'heart_action' && profileId === profile.id) {
          if (action === 'liked') {
            setLiked(true);
          } else if (action === 'unliked') {
            setLiked(false);
          }
        }
      };
    }

    return () => {
      if (bcRef.current) {
        bcRef.current.close();
      }
    };
  }, [profile.id, toast]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (hasSupabaseConfig()) {
      channel = supabase
        .channel(`favorites:${profile.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "favorites", filter: `model_id=eq.${profile.id}` },
          () => {
            const user = localGetUser();
            if (user?.role === "modelo") {
              toast({
                title: "Novo favorito",
                description: "Seu perfil foi favoritado.",
              });
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "favorites", filter: `model_id=eq.${profile.id}` },
          () => {
            const user = localGetUser();
            if (user?.role === "modelo") {
              toast({
                title: "Favorito removido",
                description: "Seu perfil foi removido das favoritas.",
              });
            }
          }
        )
        .subscribe();
    }
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [profile.id, toast]);

  // Sync with global state on mount and updates
  useEffect(() => {
    setLiked(isFavorite(profile.id));
  }, [profile.id, isFavorite]);

  const handleDetailsClick = () => {
    if (onDetailsClick) {
      onDetailsClick(profile);
    }
  };
  
  const handleStoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasStories && onStoryClick) {
      onStoryClick(profile);
    } else {
      handleDetailsClick();
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const newLikedState = !liked;
    setLiked(newLikedState); // Optimistic update
    
    // Toggle in global favorites state
    toggle(profile.id);
    
    // Send cross-user notification via BroadcastChannel
    if (bcRef.current) {
      bcRef.current.postMessage({
        type: 'heart_action',
        profileId: profile.id,
        action: newLikedState ? 'liked' : 'unliked',
        timestamp: Date.now()
      });
    }
  };

  return (
    <Card className={cn(
      "bg-dark-800/60 border-gray-700/50 rounded-xl overflow-hidden group transform hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-primary-500/20",
      hasStories && "ring-2 ring-offset-2 ring-offset-dark-950 ring-pink-500"
    )}>
      <CardContent className="p-0">
        <div className="relative aspect-[3/4] overflow-hidden">
          <div
            className={cn(
              "w-full h-full transition-transform duration-500 group-hover:scale-110 cursor-pointer",
              { "blur-lg": shouldBlurCover }
            )}
            onClick={handleStoryClick}
          >
            <MediaFill
              src={coverPhoto?.url || profile.imageUrl}
              alt={profile.name}
              mediaType={coverPhoto?.mediaType}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              autoPlay={coverPhoto?.mediaType === "video"}
              loop={coverPhoto?.mediaType === "video"}
            />
          </div>
          {hasStories && (
             <div className="absolute inset-0 pointer-events-none border-4 border-pink-500/50 z-10" />
          )}
          {shouldBlurCover && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 pointer-events-none">
              <Lock className="h-10 w-10 text-white mb-2" />
              <span className="text-sm text-white">Foto protegida</span>
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
          <Button 
            size="icon" 
            variant="ghost" 
            className="absolute top-2 right-2 h-9 w-9 bg-black/40 hover:bg-black/70 rounded-full transition-colors"
            onClick={handleToggleFavorite}
          >
            <Heart className={cn("h-5 w-5 transition-colors", liked ? "fill-red-500 text-red-500" : "text-white")} />
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
