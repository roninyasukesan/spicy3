"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedTextProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
}

export function AnimatedText({
  children,
  delay = 0,
  duration = 0.8,
  yOffset = 20,
}: AnimatedTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
