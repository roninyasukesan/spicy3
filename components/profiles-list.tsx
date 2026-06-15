
"use client";

import { ProfileCard } from "@/components/profile-card";
import { ModelDetailsModal, Model } from "@/components/model-details-modal";
import { StoryViewer } from "@/components/story-viewer";
import { useState, useEffect } from "react";
import {
  getAllLocalProfiles,
  localGetUser,
  subscribeToModelProfileChanges,
} from "@/lib/local-auth";
import { mapLocalProfileToModel } from "@/lib/model-mappers";

export function ProfilesList() {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [storyModel, setStoryModel] = useState<Model | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profiles, setProfiles] = useState<Model[]>([]);
  const currentUser = localGetUser();

  useEffect(() => {
    const loadProfiles = () => {
      const localProfiles = getAllLocalProfiles();
      const mapped: Model[] = localProfiles.map((p) => {
        return {
          ...mapLocalProfileToModel(p),
          rating: 4.9,
          isVerified: true,
          characteristics: {
             hairColor: p.characteristics.hairColor,
             ethnicity: p.characteristics.ethnicity,
             bodyType: p.characteristics.bodyType,
             height: p.characteristics.height,
             ageRange: p.characteristics.age,
             eyes: p.characteristics.eyes,
             breasts: p.characteristics.breasts,
             tattoos: p.characteristics.tattoos,
             piercings: p.characteristics.piercings
          }
        };
      });
      setProfiles(mapped);
    };

    loadProfiles();
    return subscribeToModelProfileChanges(loadProfiles);
  }, []);

  const handleOpenModal = (model: Model) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleOpenStory = (model: Model) => {
    setStoryModel(model);
  };

  const handleCloseStory = () => {
    setStoryModel(null);
  };

  return (
    <section className="py-16 bg-dark-950">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-white mb-12">Perfis em Destaque</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {profiles.map((profile) => (
            <ProfileCard 
              key={profile.id} 
              profile={profile} 
              isLoggedIn={false} 
              onDetailsClick={handleOpenModal}
              onStoryClick={handleOpenStory}
            />
          ))}
        </div>
      </div>
      <ModelDetailsModal 
        model={selectedModel} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
      
      {storyModel && storyModel.stories && storyModel.stories.length > 0 && (
        <StoryViewer
          stories={storyModel.stories}
          isOpen={!!storyModel}
          onClose={handleCloseStory}
          modelName={storyModel.name}
          modelImage={storyModel.imageUrl}
          modelId={storyModel.id}
          hasAccess={
            currentUser?.plan === "vip" ||
            currentUser?.role === "admin" ||
            currentUser?.role === "modelo" ||
            currentUser?.subscribedModelIds?.includes(storyModel.id) ||
            false
          }
        />
      )}
    </section>
  );
}
