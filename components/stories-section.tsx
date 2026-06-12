"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock, Plus } from "lucide-react"
import Image from "next/image"
import { getAllLocalProfiles, localGetUser, subscribeToModelProfileChanges } from "@/lib/local-auth"
import { useRouter } from "next/navigation"
import { StoryViewer } from "./story-viewer"
import { getGalleryItemsFromModel, mapLocalProfileToModel } from "@/lib/model-mappers"
import { Model } from "./model-details-modal"

export function StoriesSection() {
  const [profilesWithStories, setProfilesWithStories] = useState<Model[]>([])
  const [selectedProfile, setSelectedStory] = useState<Model | null>(null)
  const router = useRouter()
  const user = localGetUser()

  useEffect(() => {
    const loadProfiles = () => {
      const all = getAllLocalProfiles()
      const withStories = all
        .map(p => mapLocalProfileToModel(p))
        .filter(p => p.stories && p.stories.length > 0)
      setProfilesWithStories(withStories)
    }

    loadProfiles()
    return subscribeToModelProfileChanges(loadProfiles)
  }, [])

  return (
    <section className="py-8 bg-dark-900/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-white">Momentos Recentes</h2>

        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
          {/* Add Story Button (for models) */}
          {user?.role === "modelo" && (
            <div className="flex-shrink-0">
              <Card 
                className="bg-dark-800/50 border-gray-700 cursor-pointer hover:bg-dark-700/50 transition-colors"
                onClick={() => router.push("/dashboard/modelo")}
              >
                <CardContent className="p-3 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center mb-2 mx-auto">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-gray-300">Postar</span>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stories */}
          {profilesWithStories.map((profile) => {
            const coverPhoto = getGalleryItemsFromModel(profile)[0]
            const hasContentAccess =
              user?.plan === "vip" ||
              user?.role === "admin" ||
              user?.role === "modelo" ||
              user?.subscribedModelIds?.includes(profile.id)
            const shouldBlurCover = Boolean(coverPhoto?.isBlurred && !hasContentAccess)

            return (
            <div key={profile.id} className="flex-shrink-0">
              <Card
                className="bg-dark-800/50 border-gray-700 cursor-pointer hover:bg-dark-700/50 transition-colors"
                onClick={() => setSelectedStory(profile)}
              >
                <CardContent className="p-3 text-center relative">
                  <div
                    className="w-16 h-16 rounded-full p-0.5 mb-2 mx-auto bg-gradient-to-br from-primary-500 to-pink-500"
                  >
                    <div className="w-full h-full bg-dark-800 rounded-full p-0.5 relative">
                      <div className="relative w-full h-full rounded-full overflow-hidden">
                        <Image
                          src={coverPhoto?.url || profile.imageUrl}
                          alt={profile.name}
                          fill
                          className={shouldBlurCover ? "object-cover blur-md" : "object-cover"}
                          sizes="64px"
                        />
                        {shouldBlurCover && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Lock className="h-4 w-4 text-white/80" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Optional: Add Online indicator if model is online */}
                  {profile.isOnline && (
                    <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] h-4 px-1">
                      LIVE
                    </Badge>
                  )}

                  <span className="text-xs text-gray-300 block truncate max-w-[64px]">{profile.name}</span>
                </CardContent>
              </Card>
            </div>
          )})}
          
          {profilesWithStories.length === 0 && !user?.role === "modelo" && (
             <div className="text-gray-500 text-sm py-4 italic">Nenhum story recente disponível.</div>
          )}
        </div>
      </div>

      {selectedProfile && (
        <StoryViewer
          isOpen={!!selectedProfile}
          onClose={() => setSelectedStory(null)}
          stories={selectedProfile.stories || []}
          modelName={selectedProfile.name}
          modelImage={selectedProfile.imageUrl}
          modelId={selectedProfile.id}
          hasAccess={user?.plan === "vip" || user?.role === "admin" || user?.role === "modelo" || user?.subscribedModelIds?.includes(selectedProfile.id) || false}
        />
      )}
    </section>
  )
}
