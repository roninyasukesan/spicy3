"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedTextProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
}

export function AnimatedText({
  children,
  delay = 0,
  duration = 0.8,
  yOffset = 20,
  className = "",
}: AnimatedTextProps) {
  // Animation temporarily disabled to fix visibility issues
  return (
    <div className={`animate-in fade-in slide-in-from-bottom-4 duration-700 ${className}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
