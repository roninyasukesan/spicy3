import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioPlayerWaveProps {
  src?: string;
  onRemove?: () => void;
}

export function AudioPlayerWave({ src, onRemove }: AudioPlayerWaveProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    // Generate random bar heights for visualization
    const newBars = Array.from({ length: 40 }, () => Math.random() * 24 + 4);
    setBars(newBars);
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="w-full bg-neutral-white px-5 pt-2 pb-1 lg:pb-4 flex flex-col gap-5 rounded-xl border border-neutral-gray-18 bg-dark-800">
      <div className="flex gap-2 md:gap-[18px] rounded-xl w-full md:mx-auto relative overflow-hidden z-0 items-center p-2">
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={togglePlay}
          className="h-10 w-10 rounded-full bg-primary/20 text-primary hover:bg-primary/30 shrink-0"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
        </Button>

        <div className="flex items-center gap-[3px] justify-start overflow-hidden flex-1 h-10 opacity-80">
          {bars.map((height, i) => (
            <div 
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${isPlaying ? 'animate-pulse bg-primary' : 'bg-gray-600'}`}
              style={{ height: `${isPlaying ? Math.max(height, Math.random() * 24 + 4) : height}px` }}
            ></div>
          ))}
        </div>

        {onRemove && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500"
          >
            <X className="h-5 w-5" />
          </Button>
        )}

        {src && (
          <audio 
            ref={audioRef} 
            src={src} 
            onEnded={handleEnded}
            className="hidden"
          />
        )}
      </div>
    </div>
  );
}
