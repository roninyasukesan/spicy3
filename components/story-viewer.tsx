"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import Image from "next/image";
import { cn, getProfileSearchPath } from "@/lib/utils";
import { Story } from "@/lib/local-auth";
import { useRouter } from "next/navigation";

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onNextProfile?: () => void;
  onPrevProfile?: () => void;
  modelName: string;
  modelImage: string;
  modelId: string;
  hasAccess: boolean;
}

export function StoryViewer({
  stories,
  initialStoryIndex = 0,
  isOpen,
  onClose,
  onNextProfile,
  onPrevProfile,
  modelName,
  modelImage,
  modelId,
  hasAccess
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [videoDurationMs, setVideoDurationMs] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const router = useRouter();

  const currentStory = stories[currentIndex];
  const isBlurred = currentStory?.isBlurred && !hasAccess;

  // Fix: StoryViewer should probably just take a callback for name click
  // or use router directly if we want it to be more self-contained.
  const handleNameClick = () => {
    router.push(getProfileSearchPath(modelName, modelId));
  };

  const duration = (currentStory?.duration || 5) * 1000; // ms
  const intervalTime = 50; // Update progress every 50ms
  const isVideoStory = currentStory?.mediaType === "video";
  const effectiveDuration = isVideoStory ? videoDurationMs || duration : duration;

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

  // Auto-advance for image stories starts only after the current media is ready.
  useEffect(() => {
    if (!isOpen || isPaused || !isMediaReady || isVideoStory) return;

    const timer = setInterval(() => {
      setProgress(prev => Math.min(prev + (intervalTime / effectiveDuration) * 100, 100));
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, isMediaReady, isVideoStory, effectiveDuration]);

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
      setIsMediaReady(false);
      setVideoDurationMs(null);
    }
  }, [currentIndex, isOpen]);

  useEffect(() => {
    if (currentIndex >= stories.length) {
      setCurrentIndex(0);
      setProgress(0);
    }
  }, [currentIndex, stories.length]);

  // Preload the next story so the transition begins immediately.
  useEffect(() => {
    if (!isOpen || currentIndex >= stories.length - 1) return;

    const nextStory = stories[currentIndex + 1];
    if (!nextStory) return;

    if (nextStory.mediaType === "video") {
      const preloadVideo = document.createElement("video");
      preloadVideo.preload = "auto";
      preloadVideo.muted = true;
      preloadVideo.playsInline = true;
      preloadVideo.src = nextStory.mediaUrl;
      preloadVideo.load();
      return;
    }

    const preloadImage = new window.Image();
    preloadImage.src = nextStory.mediaUrl;
  }, [currentIndex, isOpen, stories]);

  // Pause/resume videos together with the viewer.
  useEffect(() => {
    if (!isVideoStory || !videoRef.current) return;

    if (!isOpen || isPaused || !isMediaReady) {
      videoRef.current.pause();
      return;
    }

    void videoRef.current.play().catch(() => {});
  }, [isMediaReady, isOpen, isPaused, isVideoStory]);

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
      <DialogContent
        className={
          isVideoStory
            ? "h-[100dvh] w-[100vw] max-w-[100vw] border-none bg-black p-0 overflow-hidden rounded-none sm:h-[92vh] sm:max-w-[96vw] sm:rounded-xl"
            : "h-[100dvh] w-[100vw] max-w-[100vw] border-none bg-black p-0 overflow-hidden rounded-none sm:h-[90vh] sm:max-w-[min(92vw,480px)] sm:rounded-xl"
        }
      >
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
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              handleNameClick();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
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
          className="relative flex h-full w-full cursor-pointer items-center justify-center bg-black pt-20 pb-6"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Touch Navigation Zones */}
          <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
          <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={(e) => { e.stopPropagation(); handleNext(); }} />

          {currentStory.mediaType === 'image' ? (
            <div className="relative h-full w-full">
               <Image 
                 key={currentStory.id}
                 src={currentStory.mediaUrl} 
                 alt={`Story ${currentIndex + 1}`} 
                 fill 
                 className={cn("object-contain", isBlurred && "blur-2xl")}
                 priority
                 onLoad={() => setIsMediaReady(true)}
               />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center px-2 sm:px-4">
              <video 
                key={currentStory.id}
                ref={videoRef}
                src={currentStory.mediaUrl}
                className={cn(
                  "h-auto w-auto max-h-[calc(100dvh-7rem)] max-w-[calc(100vw-1rem)] object-contain sm:max-h-[calc(92vh-7rem)] sm:max-w-[94vw]",
                  isBlurred && "blur-2xl"
                )}
                autoPlay
                muted
                playsInline
                loop={false}
                preload="auto"
                onLoadedMetadata={(event) => {
                  const nextDurationMs = Number.isFinite(event.currentTarget.duration)
                    ? event.currentTarget.duration * 1000
                    : duration;
                  setVideoDurationMs(nextDurationMs > 0 ? nextDurationMs : duration);
                }}
                onCanPlay={() => setIsMediaReady(true)}
                onTimeUpdate={(event) => {
                  const mediaDuration = event.currentTarget.duration;
                  if (!Number.isFinite(mediaDuration) || mediaDuration <= 0) return;
                  setProgress(
                    Math.min((event.currentTarget.currentTime / mediaDuration) * 100, 100)
                  );
                }}
                onEnded={handleNext}
              />
            </div>
          )}

          {/* Blurred Content Overlay */}
          {isBlurred && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-10">
              <div className="bg-black/60 p-6 rounded-2xl border border-white/20 backdrop-blur-md flex flex-col items-center gap-4 text-center max-w-[80%]">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Conteúdo Exclusivo</h3>
                  <p className="text-gray-300 text-sm">Assine para desbloquear este story e muito mais.</p>
                </div>
                <Button 
                  onClick={() => router.push(getProfileSearchPath(modelName, modelId))}
                  className="bg-primary hover:bg-primary/90 text-white w-full"
                >
                  Ver Planos
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
