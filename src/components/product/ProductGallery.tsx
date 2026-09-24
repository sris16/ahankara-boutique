"use client";

import { useState } from "react";
import Image from "next/image";
import { ProductImage } from "@/types/catalog";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[3/4] bg-muted/20 border border-dashed rounded-sm flex items-center justify-center">
        <span className="text-muted-foreground text-sm uppercase tracking-widest">No Image</span>
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <div className="flex flex-col gap-4 md:flex-row-reverse md:items-start">
      {/* Main Image Area */}
      <div className="flex-1 w-full aspect-[3/4] md:aspect-[4/5] relative bg-muted/10 overflow-hidden">
        <Image
          src={activeImage.secureUrl}
          alt={activeImage.altText || productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails List (Desktop left sidebar / Mobile bottom horizontal scroll) */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:w-20 lg:w-24 shrink-0 hide-scrollbar py-1 md:py-0">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative aspect-[3/4] w-16 md:w-full shrink-0 overflow-hidden transition-opacity duration-300 rounded-sm",
                index === activeIndex
                  ? "ring-1 ring-foreground ring-offset-1 opacity-100"
                  : "opacity-50 hover:opacity-100"
              )}
              aria-label={`View image ${index + 1} of ${images.length}: ${image.altText || productName}`}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              <Image
                src={image.secureUrl}
                alt={image.altText || `${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 64px, 96px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
