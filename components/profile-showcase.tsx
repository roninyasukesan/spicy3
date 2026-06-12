
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileCard } from "@/components/profile-card";
import { useEffect, useState } from "react";
import { getAllLocalProfiles, subscribeToModelProfileChanges } from "@/lib/local-auth";
import { Model } from "@/components/model-details-modal";
import { ModelDetailsModal } from "@/components/model-details-modal";
import { mapLocalProfileToModel } from "@/lib/model-mappers";

export function ProfileShowcase() {
  const [profiles, setProfiles] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadProfiles = () => {
      const localProfiles = getAllLocalProfiles();
      const mappedModels: Model[] = localProfiles.map((profile) => {
        return {
          ...mapLocalProfileToModel(profile),
          rating: 4.9,
          reviews: 20,
          isVerified: true,
          characteristics: {
             hairColor: profile.characteristics.hairColor,
             ethnicity: profile.characteristics.ethnicity,
             bodyType: profile.characteristics.bodyType,
             height: profile.characteristics.height,
             ageRange: profile.characteristics.age,
             eyes: profile.characteristics.eyes,
             breasts: profile.characteristics.breasts,
             tattoos: profile.characteristics.tattoos,
             piercings: profile.characteristics.piercings
          }
        };
      });
      setProfiles(mappedModels);
    };

    loadProfiles();
    return subscribeToModelProfileChanges(loadProfiles);
  }, []);

  const handleDetailsClick = (model: Model) => {
    setSelectedModel(model);
    setIsModalOpen(true);
  };

  return (
    <section className="py-16 bg-dark-950">
      <div className="container mx-auto px-4">
        <Tabs defaultValue="destaques" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-dark-800/80 border border-gray-700/60 h-12 px-2">
            <TabsTrigger value="destaques" className="text-lg">Destaques</TabsTrigger>
            <TabsTrigger value="novidades" className="text-lg">Novidades</TabsTrigger>
            <TabsTrigger value="online" className="text-lg">Online Agora</TabsTrigger>
          </TabsList>
          <TabsContent value="destaques" className="mt-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {profiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} isLoggedIn={true} onDetailsClick={handleDetailsClick} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="novidades" className="mt-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {profiles.slice().reverse().map((profile) => (
                <ProfileCard key={profile.id} profile={profile} isLoggedIn={true} onDetailsClick={handleDetailsClick} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="online" className="mt-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {profiles.slice(0, 2).map((profile) => (
                <ProfileCard key={profile.id} profile={profile} isLoggedIn={true} onDetailsClick={handleDetailsClick} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <ModelDetailsModal 
        model={selectedModel} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </section>
  );
}
