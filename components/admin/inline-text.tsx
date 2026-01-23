"use client";

import { useState, useEffect, useRef } from "react";
import { useEditMode } from "./edit-mode-context";
import { cn } from "@/lib/utils";

interface InlineTextProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  tagName?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
}

export function InlineText({ value, onSave, className, tagName = "p" }: InlineTextProps) {
  const { isEditing } = useEditMode();
  const [localValue, setLocalValue] = useState(value);
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (contentRef.current) {
        const newValue = contentRef.current.innerText;
        if (newValue !== value) {
            onSave(newValue);
        }
    }
  };

  const Tag = tagName as any;

  if (!isEditing) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag
      ref={contentRef}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      className={cn(className, "outline-dashed outline-2 outline-primary-500/50 hover:outline-primary-500 min-w-[1ch] cursor-text hover:bg-white/5 transition-colors rounded px-1 relative z-30")}
    >
      {localValue}
    </Tag>
  );
}
