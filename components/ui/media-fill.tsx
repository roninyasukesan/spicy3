"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

type MediaFillProps = {
  src: string
  alt: string
  mediaType?: "image" | "video"
  className?: string
  sizes?: string
  fit?: "cover" | "contain"
  priority?: boolean
  muted?: boolean
  autoPlay?: boolean
  loop?: boolean
  controls?: boolean
  preload?: "none" | "metadata" | "auto"
}

export function MediaFill({
  src,
  alt,
  mediaType = "image",
  className,
  sizes,
  fit = "cover",
  priority = false,
  muted = true,
  autoPlay = false,
  loop = false,
  controls = false,
  preload = "metadata",
}: MediaFillProps) {
  const objectClass = fit === "contain" ? "object-contain" : "object-cover"

  if (mediaType === "video") {
    return (
      <video
        src={src}
        className={cn("absolute inset-0 h-full w-full", objectClass, className)}
        muted={muted}
        autoPlay={autoPlay}
        loop={loop}
        controls={controls}
        playsInline
        preload={preload}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={cn(objectClass, className)}
      priority={priority}
    />
  )
}
