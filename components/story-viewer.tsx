"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Story } from "@/lib/local-auth";
import { Progress } from "@/components/ui/progress";

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onNextProfile?: () => void;
  onPrevProfile?: () => void;
  modelName: string;
  modelImage: string;
}

export function StoryViewer({
  stories,
  initialStoryIndex = 0,
  isOpen,
  onClose,
  onNextProfile,
  onPrevProfile,
  modelName,
  modelImage
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = stories[currentIndex];
  const duration = (currentStory?.duration || 5) * 1000; // ms
  const intervalTime = 50; // Update progress every 50ms

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      if (onNextProfile) {
        onNextProfile();
      } else {
        onClose();
      }
    }
  }, [currentIndex, stories.length, onClose, onNextProfile]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    } else {
      if (onPrevProfile) {
        onPrevProfile();
      } else {
        setProgress(0);
      }
    }
  }, [currentIndex, onPrevProfile]);

  // Auto-advance
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const timer = setInterval(() => {
      setProgress(prev => Math.min(prev + (intervalTime / duration) * 100, 100));
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, duration, handleNext]);

  useEffect(() => {
    if (!isOpen || isPaused) return;
    if (progress >= 100) {
      handleNext();
      setProgress(0);
    }
  }, [progress, isOpen, isPaused, handleNext]);

  // Reset when story changes
  useEffect(() => {
    if (isOpen) {
      setProgress(0);
    }
  }, [currentIndex, isOpen]);

  useEffect(() => {
    if (currentIndex >= stories.length) {
      setCurrentIndex(0);
      setProgress(0);
    }
  }, [currentIndex, stories.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') setIsPaused(prev => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!stories.length || !currentStory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 h-[80vh] bg-black border-none overflow-hidden sm:h-[90vh] sm:rounded-xl">
        <DialogTitle className="sr-only">{modelName} Stories</DialogTitle>
        {/* Progress Bars */}
        <div className="absolute top-4 left-0 w-full px-4 z-50 flex gap-1">
          {stories.map((story, idx) => (
            <div key={story.id} className="h-1 flex-1 bg-gray-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ 
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-0 w-full px-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white">
              <Image src={modelImage} alt={modelName} fill className="object-cover" />
            </div>
            <span className="text-white font-semibold text-sm drop-shadow-md">{modelName}</span>
            <span className="text-gray-300 text-xs drop-shadow-md">
               {currentStory?.createdAt ? new Date(currentStory.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 rounded-full" 
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content */}
        <div 
          className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Touch Navigation Zones */}
          <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
          <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); handleNext(); }} />

          {currentStory.mediaType === 'image' ? (
            <div className="relative w-full h-full">
               <Image 
                 src={currentStory.mediaUrl} 
                 alt="Story" 
                 fill 
                 className="object-cover"
                 priority
               />
            </div>
          ) : (
            <video 
              src={currentStory.mediaUrl}
              className="w-full h-full object-cover"
              autoPlay
              muted // Muted for autoplay policy, maybe add unmute button
              playsInline
              loop={false}
              onEnded={handleNext}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
