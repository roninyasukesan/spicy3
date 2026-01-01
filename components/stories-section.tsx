"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Play } from "lucide-react"
import Image from "next/image"

const stories = [
  {
    id: 1,
    modelName: "Isabella",
    avatar: "/placeholder.svg?height=60&width=60",
    hasNewStory: true,
    isLive: false,
  },
  {
    id: 2,
    modelName: "Valentina",
    avatar: "/placeholder.svg?height=60&width=60",
    hasNewStory: true,
    isLive: true,
  },
  {
    id: 3,
    modelName: "Sophia",
    avatar: "/placeholder.svg?height=60&width=60",
    hasNewStory: false,
    isLive: false,
  },
  {
    id: 4,
    modelName: "Camila",
    avatar: "/placeholder.svg?height=60&width=60",
    hasNewStory: true,
    isLive: false,
  },
]

export function StoriesSection() {
  const [selectedStory, setSelectedStory] = useState<number | null>(null)

  return (
    <section className="py-8 bg-dark-900/30">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-white">Momentos Recentes</h2>

        <div className="flex space-x-4 overflow-x-auto pb-4">
          {/* Add Story Button (for models) */}
          <div className="flex-shrink-0">
            <Card className="bg-dark-800/50 border-gray-700 cursor-pointer hover:bg-dark-700/50 transition-colors">
              <CardContent className="p-3 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs text-gray-300">Adicionar</span>
              </CardContent>
            </Card>
          </div>

          {/* Stories */}
          {stories.map((story) => (
            <div key={story.id} className="flex-shrink-0">
              <Card
                className="bg-dark-800/50 border-gray-700 cursor-pointer hover:bg-dark-700/50 transition-colors"
                onClick={() => setSelectedStory(story.id)}
              >
                <CardContent className="p-3 text-center relative">
                  <div
                    className={`w-16 h-16 rounded-full p-0.5 mb-2 mx-auto ${
                      story.hasNewStory ? "bg-gradient-to-br from-primary-500 to-gold-500" : "bg-gray-600"
                    }`}
                  >
                    <div className="w-full h-full bg-dark-800 rounded-full p-0.5 relative">
                      <div className="relative w-full h-full rounded-full overflow-hidden">
                        <Image
                          src={story.avatar}
                          alt={story.modelName}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    </div>
                  </div>

                  {story.isLive && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1">
                      <Play className="h-2 w-2 mr-1" />
                      LIVE
                    </Badge>
                  )}

                  <span className="text-xs text-gray-300 block truncate max-w-[60px]">{story.modelName}</span>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
