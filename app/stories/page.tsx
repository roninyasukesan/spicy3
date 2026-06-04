"use client";

import { useState, useEffect } from "react";
import { getAllLocalProfiles, localGetUser } from "@/lib/local-auth";
import { StoryViewer } from "@/components/story-viewer";
import { useRouter, useSearchParams } from "next/navigation";
import { Model } from "@/components/model-details-modal";
import { SubscriptionModal } from "@/components/subscription-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoginForm } from "@/components/login-form";
import { mapLocalProfileToModel } from "@/lib/model-mappers";

export default function StoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProfileId = searchParams.get("id");
  
  const [profiles, setProfiles] = useState<Model[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  
  // Auth & Access State
  const [needsLogin, setNeedsLogin] = useState(false);
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [currentUser, setCurrentUser] = useState(localGetUser());

  useEffect(() => {
    // Fetch profiles with stories
    const localProfiles = getAllLocalProfiles();
    const profilesWithStories = localProfiles
      .filter(p => p.stories && p.stories.length > 0)
      .map(p => mapLocalProfileToModel(p));

    setProfiles(profilesWithStories);

    // Set initial index based on URL param
    if (initialProfileId) {
      const index = profilesWithStories.findIndex(p => p.id === initialProfileId);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [initialProfileId]);

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(localGetUser());
    };
    window.addEventListener("spicy-auth-change", handleAuthChange);
    return () => window.removeEventListener("spicy-auth-change", handleAuthChange);
  }, []);

  // Check Access whenever Index or User changes
  useEffect(() => {
    if (profiles.length === 0) return;
    
    const user = localGetUser();
    setCurrentUser(user);
    const currentProfile = profiles[currentIndex];

    if (!user) {
      setNeedsLogin(true);
      setNeedsSubscription(false);
      return;
    }

    setNeedsLogin(false);
    
    // We don't block the whole viewer anymore, individual stories will be blurred if needed
    setNeedsSubscription(false);

  }, [currentIndex, profiles, currentUser?.subscribedModelIds?.length]); // Re-check if subscriptions change

  const handleClose = () => {
    setIsOpen(false);
    router.back();
  };

  const handleNextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevProfile = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (profiles.length === 0) return null;

  const currentProfile = profiles[currentIndex];
  const hasAccess = currentUser?.plan === "vip" || currentUser?.role === "admin" || currentUser?.role === "modelo" || currentUser?.subscribedModelIds?.includes(currentProfile.id);

  // Render Login Modal if needed
  if (needsLogin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Dialog open={true} onOpenChange={() => router.back()}>
          <DialogContent className="bg-transparent border-none p-0 max-w-md">
             <LoginForm onSuccess={() => {
                const user = localGetUser();
                setCurrentUser(user);
                setNeedsLogin(false);
             }} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Render Subscription Modal if needed
  if (needsSubscription) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4" style={{
        backgroundImage: `url(${currentProfile.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        
        <SubscriptionModal 
            isOpen={true} 
            onClose={() => router.back()}
            modelName={currentProfile.name}
            modelId={currentProfile.id}
            onSuccess={() => {
                const user = localGetUser();
                setCurrentUser(user);
                setNeedsSubscription(false);
            }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <StoryViewer
        stories={currentProfile.stories || []}
        isOpen={isOpen}
        onClose={handleClose}
        onNextProfile={handleNextProfile}
        onPrevProfile={handlePrevProfile}
        modelName={currentProfile.name}
        modelImage={currentProfile.imageUrl}
        modelId={currentProfile.id}
        hasAccess={!!hasAccess}
      />
    </div>
  );
}
