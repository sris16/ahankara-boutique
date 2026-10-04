"use client"

import * as React from "react"
import Image from "next/image"
import { ProductImage } from "@/types/catalog"
import { cn } from "@/lib/utils"
import { Maximize2, ChevronLeft, ChevronRight } from "lucide-react"
import { ProductLightbox } from "./ProductLightbox"

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const [mousePos, setMousePos] = React.useState({ x: 50, y: 50 })
  const [isHovering, setIsHovering] = React.useState(false)
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null)

  // Empty images fallback
  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[3/4] md:aspect-[4/5] bg-surface-muted/60 border border-border/60 rounded-xs flex flex-col items-center justify-center p-8 select-none">
        <div className="relative w-20 h-20 rounded-full overflow-hidden border border-border/80 mb-4 opacity-70">
          <Image
            src="/images/brand/ahankara-studios-logo.jpg"
            alt="AHANKARA STUDIOS"
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <span className="font-serif text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium text-center">
          AHANKARA ATELIER
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mt-1">
          Handcrafted Silhouette
        </span>
      </div>
    )
  }

  const activeImage = images[activeIndex] || images[0]

  // Mouse move for desktop zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({ x, y })
  }

  // Mobile touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX - touchEndX

    if (diff > 50 && activeIndex < images.length - 1) {
      setActiveIndex((prev) => prev + 1)
    } else if (diff < -50 && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1)
    }
    setTouchStartX(null)
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row-reverse md:items-start select-none">
        {/* Main Editorial Image Area */}
        <div
          className="flex-1 w-full aspect-[3/4] md:aspect-[4/5] relative bg-surface-muted/40 rounded-xs overflow-hidden border border-border/40 group cursor-crosshair"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseMove={handleMouseMove}
          onClick={() => setLightboxOpen(true)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setLightboxOpen(true)
            }
          }}
          aria-label={`View enlarged image ${activeIndex + 1} of ${images.length} for ${productName}`}
        >
          {/* Zoomable Image Container */}
          <div
            className="w-full h-full relative transition-transform duration-fast ease-out motion-reduce:!transform-none"
            style={{
              transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
              transform: isHovering ? "scale(1.35)" : "scale(1)",
            }}
          >
            <Image
              src={activeImage.secureUrl}
              alt={activeImage.altText || `${productName} view ${activeIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 55vw, 650px"
              priority
            />
          </div>

          {/* Floating Expand Icon Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxOpen(true)
            }}
            aria-label="Expand image to fullscreen"
            className="absolute top-3.5 right-3.5 z-10 p-2.5 rounded-full bg-background/80 hover:bg-background text-foreground/80 hover:text-foreground backdrop-blur-md shadow-subtle border border-border/60 transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {/* Mobile Image Counter Pill */}
          <div className="absolute bottom-3.5 right-3.5 z-10 px-2.5 py-1 rounded-full bg-background/85 text-foreground/80 text-[11px] font-mono tracking-wider backdrop-blur-md border border-border/60 shadow-subtle md:hidden">
            {activeIndex + 1} / {images.length}
          </div>

          {/* Mobile Left/Right Tap Chevrons */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveIndex((prev) => Math.max(0, prev - 1))
                }}
                disabled={activeIndex === 0}
                aria-label="Previous image"
                className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/70 text-foreground border border-border/40 disabled:opacity-0 transition-opacity"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveIndex((prev) => Math.min(images.length - 1, prev + 1))
                }}
                disabled={activeIndex === images.length - 1}
                aria-label="Next image"
                className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/70 text-foreground border border-border/40 disabled:opacity-0 transition-opacity"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Navigation (Desktop Left Sidebar / Mobile Bottom Scroll) */}
        {images.length > 1 && (
          <div
            className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto md:w-20 lg:w-24 shrink-0 hide-scrollbar py-1 md:py-0"
            role="tablist"
            aria-label="Product thumbnails"
          >
            {images.map((image, index) => {
              const isSelected = index === activeIndex
              return (
                <button
                  key={image.id || index}
                  type="button"
                  role="tab"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "relative aspect-[3/4] w-16 md:w-full shrink-0 overflow-hidden rounded-xs border transition-all duration-fast cursor-pointer",
                    isSelected
                      ? "border-primary ring-1 ring-primary shadow-subtle opacity-100 scale-102"
                      : "border-border/60 opacity-60 hover:opacity-100 hover:border-border-strong"
                  )}
                  aria-label={`View image ${index + 1} of ${images.length}: ${image.altText || productName}`}
                  aria-selected={isSelected}
                >
                  <Image
                    src={image.secureUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 64px, 96px"
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <ProductLightbox
          images={images}
          productName={productName}
          activeIndex={activeIndex}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onSelectIndex={setActiveIndex}
        />
      )}
    </>
  )
}
