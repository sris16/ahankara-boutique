"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps extends ImageProps {
  fallback?: React.ReactNode;
}

export function ImageWithFallback({
  src,
  alt,
  fallback,
  className,
  ...props
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    if (fallback) return <>{fallback}</>;
    
    // Default AHANKARA Studios branded fallback
    return (
      <div className={cn("flex flex-col items-center justify-center w-full h-full p-4 bg-gradient-to-b from-surface-muted to-brand-50/60 select-none", className)}>
        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border/60 mb-2 opacity-50">
          <Image
            src="/images/brand/ahankara-studios-logo.jpg"
            alt="AHANKARA STUDIOS"
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <span className="font-serif text-[11px] uppercase tracking-[0.25em] text-muted-foreground/80 font-medium text-center">
          AHANKARA
        </span>
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 mt-0.5">
          Atelier Piece
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
