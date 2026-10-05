"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CategoryItem {
  id: string
  name: string
  slug: string
}

export interface CollectionItem {
  id: string
  name: string
  slug: string
}

export interface MegaMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  const [categories, setCategories] = React.useState<CategoryItem[]>([])
  const [collections, setCollections] = React.useState<CollectionItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Fetch active categories and collections once on mount
  React.useEffect(() => {
    let isMounted = true

    async function loadNavData() {
      setIsLoading(true)
      try {
        const [catRes, colRes] = await Promise.all([
          fetch("/api/categories").catch(() => null),
          fetch("/api/collections").catch(() => null),
        ])

        if (catRes && catRes.ok) {
          const catJson = await catRes.json()
          if (isMounted && catJson.success && Array.isArray(catJson.data)) {
            setCategories(catJson.data)
          }
        }

        if (colRes && colRes.ok) {
          const colJson = await colRes.json()
          if (isMounted && colJson.success && Array.isArray(colJson.data)) {
            setCollections(colJson.data)
          }
        }
      } catch (err) {
        console.error("Failed to load navigation data", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadNavData()

    return () => {
      isMounted = false
    }
  }, [])

  // Listen for Escape key
  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        const trigger = document.getElementById("mega-menu-trigger")
        if (trigger) trigger.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Click outside to dismiss
  React.useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const trigger = document.getElementById("mega-menu-trigger")
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        trigger &&
        !trigger.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={menuRef}
      id="mega-menu"
      role="region"
      aria-label="Shop Catalog Mega Menu"
      onMouseLeave={onClose}
      className={cn(
        "absolute top-full left-0 right-0 z-40 w-full bg-surface/98 backdrop-blur-md border-b border-border shadow-drawer transition-all duration-standard ease-standard",
        isOpen ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-2 invisible"
      )}
    >
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 items-start">
          {/* Column 1: Catalog Directives */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground border-b border-border/50 pb-2.5">
              Catalog
            </h4>
            <ul className="space-y-3 text-[13px]">
              <li>
                <Link
                  href="/products"
                  onClick={onClose}
                  className="text-foreground hover:text-accent transition-colors flex items-center justify-between group py-1"
                >
                  <span className="font-light tracking-wide">All Silhouettes</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accent" />
                </Link>
              </li>
              <li>
                <Link
                  href="/products?sortBy=newest"
                  onClick={onClose}
                  className="text-foreground hover:text-accent transition-colors flex items-center justify-between group py-1"
                >
                  <span className="font-light tracking-wide flex items-center gap-2">
                    New Arrivals
                    <Sparkles className="h-3 w-3 text-accent" />
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accent" />
                </Link>
              </li>
              <li>
                <Link
                  href="/lookbook"
                  onClick={onClose}
                  className="text-foreground hover:text-accent transition-colors flex items-center justify-between group py-1"
                >
                  <span className="font-light tracking-wide">Seasonal Lookbook</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accent" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Categories (Dynamic from Backend) */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground border-b border-border/50 pb-2.5">
              Categories
            </h4>
            <ul className="space-y-2.5 text-[13px] text-muted-foreground">
              {categories.length > 0 ? (
                categories.slice(0, 6).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/products?category=${cat.id}`}
                      onClick={onClose}
                      className="hover:text-foreground transition-colors block py-0.5 font-light tracking-wide"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground italic py-1 font-light">
                  {isLoading ? "Consulting atelier catalog..." : "Explore all in catalog"}
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Collections (Dynamic from Backend) */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground border-b border-border/50 pb-2.5">
              Editions
            </h4>
            <ul className="space-y-2.5 text-[13px] text-muted-foreground">
              {collections.length > 0 ? (
                collections.slice(0, 6).map((col) => (
                  <li key={col.id}>
                    <Link
                      href={`/products?collection=${col.slug}`}
                      onClick={onClose}
                      className="hover:text-foreground transition-colors block py-0.5 font-light tracking-wide"
                    >
                      {col.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground italic py-1 font-light">
                  {isLoading ? "Consulting current edits..." : "Explore all in catalog"}
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: The Atelier Editorial Feature */}
          <div className="space-y-4 rounded-xs bg-surface-muted/40 p-6 border border-border/60">
            <span className="text-[10px] uppercase tracking-[0.25em] text-accent font-medium select-none block">
              Atelier Note
            </span>
            <h4 className="font-serif text-base font-normal tracking-wide text-foreground">
              AHANKARA STUDIOS
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-light">
              Meticulously tailored garments crafted with deliberate restraint, celebrating contemporary Indian couture with unwavering precision.
            </p>
            <div className="pt-2 flex flex-col gap-2.5 border-t border-border/40">
              <Link
                href="/about"
                onClick={onClose}
                className="text-[11px] uppercase tracking-widest font-medium text-foreground hover:text-accent transition-colors flex items-center justify-between group"
              >
                <span>The Studio Story</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" />
              </Link>
              <Link
                href="/contact"
                onClick={onClose}
                className="text-[11px] uppercase tracking-widest font-medium text-foreground hover:text-accent transition-colors flex items-center justify-between group"
              >
                <span>Client Concierge</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
