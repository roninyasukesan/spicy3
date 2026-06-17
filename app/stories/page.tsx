"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { localGetUser, subscribeToModelProfileChanges } from "@/lib/local-auth";
import { StoryViewer } from "@/components/story-viewer";
import { type Model } from "@/components/model-details-modal";
import { SubscriptionModal } from "@/components/subscription-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoginForm } from "@/components/login-form";
import { mapLocalProfileToModel } from "@/lib/model-mappers";
import { loadProfileSources } from "@/lib/profile-client";
import { matchesProfileReference } from "@/lib/utils";

export default function StoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProfileId = searchParams.get("id");

  const [profiles, setProfiles] = useState<Model[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [needsSubscription, setNeedsSubscription] = useState(false);
  const [currentUser, setCurrentUser] = useState(localGetUser());

  useEffect(() => {
    let active = true;

    const loadProfiles = async () => {
      const profileSources = await loadProfileSources();
      if (!active) return;

      const profilesWithStories = profileSources
        .filter((profile) => profile.stories && profile.stories.length > 0)
        .map((profile) => mapLocalProfileToModel(profile));

      setProfiles(profilesWithStories);

      if (initialProfileId) {
        const index = profilesWithStories.findIndex((profile) =>
          matchesProfileReference(profile, initialProfileId)
        );
        if (index !== -1) {
          setCurrentIndex(index);
          return;
        }
      }

      setCurrentIndex(0);
    };

    loadProfiles();
    const unsubscribe = subscribeToModelProfileChanges(loadProfiles);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [initialProfileId]);

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(localGetUser());
    };

    window.addEventListener("spicy-auth-change", handleAuthChange);
    return () => window.removeEventListener("spicy-auth-change", handleAuthChange);
  }, []);

  useEffect(() => {
    if (profiles.length === 0) return;

    const user = localGetUser();
    setCurrentUser(user);

    if (!user) {
      setNeedsLogin(true);
      setNeedsSubscription(false);
      return;
    }

    setNeedsLogin(false);
    setNeedsSubscription(false);
  }, [currentIndex, profiles, currentUser?.subscribedModelIds?.length]);

  const handleClose = () => {
    setIsOpen(false);
    router.back();
  };

  const handleNextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevProfile = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (profiles.length === 0) return null;

  const currentProfile = profiles[currentIndex];
  const hasAccess =
    currentUser?.plan === "vip" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "modelo" ||
    currentUser?.subscribedModelIds?.includes(currentProfile.id);

  if (needsLogin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Dialog open={true} onOpenChange={() => router.back()}>
          <DialogContent className="bg-transparent border-none p-0 max-w-md">
            <LoginForm
              onSuccess={() => {
                const user = localGetUser();
                setCurrentUser(user);
                setNeedsLogin(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (needsSubscription) {
    return (
      <div
        className="min-h-screen bg-black flex items-center justify-center p-4"
        style={{
          backgroundImage: `url(${currentProfile.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
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
