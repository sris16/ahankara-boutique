"use client"

import * as React from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { ProductImage } from "@/types/catalog"
import { cn } from "@/lib/utils"

interface ProductLightboxProps {
  images: ProductImage[]
  productName: string
  activeIndex: number
  open: boolean
  onClose: () => void
  onSelectIndex: (index: number) => void
}

export function ProductLightbox({
  images,
  productName,
  activeIndex,
  onClose,
  onSelectIndex,
}: ProductLightboxProps) {
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null)

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowLeft") {
        if (activeIndex > 0) {
          onSelectIndex(activeIndex - 1)
        }
      } else if (e.key === "ArrowRight") {
        if (activeIndex < images.length - 1) {
          onSelectIndex(activeIndex + 1)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    // Lock body scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [activeIndex, images.length, onClose, onSelectIndex])

  if (images.length === 0) return null

  const activeImage = images[activeIndex] || images[0]

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX - touchEndX

    if (diff > 50 && activeIndex < images.length - 1) {
      onSelectIndex(activeIndex + 1)
    } else if (diff < -50 && activeIndex > 0) {
      onSelectIndex(activeIndex - 1)
    }
    setTouchStartX(null)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Expanded gallery for ${productName}`}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-8 animate-in fade-in duration-standard select-none"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto z-10">
        <div className="flex items-center gap-3">
          <span className="font-serif text-sm md:text-base text-white/90 tracking-wide font-normal truncate max-w-[200px] sm:max-w-md">
            {productName}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-xs bg-white/10 text-white/80 border border-white/15">
            {activeIndex + 1} / {images.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close enlarged gallery"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xs bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/15 flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main image viewport with touch swipe */}
      <div
        className="relative flex-1 w-full max-w-6xl mx-auto my-4 flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onSelectIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            aria-label="Previous image"
            className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-xs bg-black/50 hover:bg-black/80 text-white border border-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div className="relative w-full h-[65vh] md:h-[75vh]">
          <Image
            src={activeImage.secureUrl}
            alt={activeImage.altText || `${productName} view ${activeIndex + 1}`}
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 1200px"
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onSelectIndex(Math.min(images.length - 1, activeIndex + 1))}
            disabled={activeIndex === images.length - 1}
            aria-label="Next image"
            className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-xs bg-black/50 hover:bg-black/80 text-white border border-white/20 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="w-full max-w-2xl mx-auto flex items-center justify-center gap-2 overflow-x-auto py-2 px-4 hide-scrollbar">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={cn(
                "relative w-12 h-16 sm:w-14 sm:h-18 rounded-xs overflow-hidden shrink-0 border transition-all cursor-pointer",
                idx === activeIndex
                  ? "border-accent ring-2 ring-accent/60 opacity-100 scale-105"
                  : "border-white/20 opacity-50 hover:opacity-90"
              )}
              aria-label={`Jump to view ${idx + 1}`}
              aria-current={idx === activeIndex ? "true" : undefined}
            >
              <Image
                src={img.secureUrl}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
