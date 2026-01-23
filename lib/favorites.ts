
"use client";

import { useState, useEffect } from "react";
import { fetchFavoritesDb, toggleFavoriteDb } from "@/lib/db/favorites";
import { supabase } from "@/lib/supabase";
import { localGetUser } from "@/lib/local-auth";
import { useToast } from "@/hooks/use-toast";

// Key for localStorage
const FAVORITES_KEY = "spicy_favorites";

// Custom event name for synchronization
const FAVORITES_UPDATED_EVENT = "favorites-updated";

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Helper: Get local favorites synchronously
export function getLocalFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading favorites:", error);
    return [];
  }
}

// Helper: Toggle local favorite
export function toggleLocalFavorite(modelId: string): boolean {
  if (typeof window === "undefined") return false;
  
  const favorites = getLocalFavorites();
  const index = favorites.indexOf(modelId);
  let isNowFavorite = false;

  if (index >= 0) {
    // Remove
    favorites.splice(index, 1);
    isNowFavorite = false;
  } else {
    // Add
    favorites.push(modelId);
    isNowFavorite = true;
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  
  // Dispatch event for other components to update
  window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
  
  return isNowFavorite;
}

// Hook for React components
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isDbMode, setIsDbMode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const loadData = async (uid: string | null) => {
      if (uid) {
        setIsDbMode(true);
        setUserId(uid);
        const dbFavs = await fetchFavoritesDb(uid);
        if (mounted) setFavorites(dbFavs);
      } else {
        setIsDbMode(false);
        setUserId(null);
        if (mounted) setFavorites(getLocalFavorites());
      }
    };

    // Initial check
    if (hasSupabaseConfig()) {
      supabase.auth.getSession().then(({ data }) => {
        if (mounted) loadData(data.session?.user?.id || null);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) loadData(session?.user?.id || null);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } else {
      loadData(null);
      return () => { mounted = false; };
    }
  }, []);

  // Effect for local storage synchronization
  useEffect(() => {
    if (isDbMode) return;

    const handleLocalUpdate = () => {
      setFavorites(getLocalFavorites());
    };

    window.addEventListener(FAVORITES_UPDATED_EVENT, handleLocalUpdate);
    window.addEventListener("storage", (e) => {
      if (e.key === FAVORITES_KEY) {
        handleLocalUpdate();
      }
    });

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleLocalUpdate);
      window.removeEventListener("storage", handleLocalUpdate);
    };
  }, [isDbMode]);

  const toggle = async (id: string) => {
    const user = localGetUser();
    const hasVipAccess = user?.plan === "vip" || user?.role === "admin" || user?.role === "modelo";
    if (!hasVipAccess) {
      toast({
        title: "Acesso VIP necessário",
        description: "Assine VIP para salvar favoritas.",
        variant: "destructive",
      });
      return;
    }
    // Optimistic update
    const isCurrentlyFav = favorites.includes(id);
    const newFavorites = isCurrentlyFav 
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    
    setFavorites(newFavorites);

    if (isDbMode && userId) {
      try {
        await toggleFavoriteDb(userId, id);
      } catch (error) {
        // Revert on error
        console.error("Failed to toggle favorite in DB", error);
        setFavorites(favorites);
      }
    } else {
      toggleLocalFavorite(id);
    }
  };

  return {
    favorites,
    isFavorite: (id: string) => favorites.includes(id),
    toggle,
    count: favorites.length
  };
}

// Deprecated export for compatibility, aliased to local helper
export const getFavorites = getLocalFavorites;
export const toggleFavorite = toggleLocalFavorite;
