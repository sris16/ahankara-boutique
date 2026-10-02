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
        // Restore focus to trigger
        const trigger = document.getElementById("mega-menu-trigger")
        if (trigger) trigger.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      id="mega-menu"
      role="region"
      aria-label="Mega Menu"
      onMouseLeave={onClose}
      className={cn(
        "absolute top-full left-0 right-0 z-40 w-full bg-surface/98 backdrop-blur-md border-b border-border shadow-elevated transition-all duration-standard ease-standard",
        isOpen ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-2 invisible"
      )}
    >
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Shop Core */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground border-b border-border/60 pb-2">
              Catalog
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/products"
                  onClick={onClose}
                  className="text-foreground hover:text-accent transition-colors flex items-center justify-between group"
                >
                  <span>All Products</span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accent" />
                </Link>
              </li>
              <li>
                <Link
                  href="/products?sortBy=newest"
                  onClick={onClose}
                  className="text-foreground hover:text-accent transition-colors flex items-center justify-between group"
                >
                  <span className="flex items-center gap-1.5">
                    New Arrivals
                    <Sparkles className="h-3 w-3 text-accent" />
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accent" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Categories (Dynamic from Backend) */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground border-b border-border/60 pb-2">
              Categories
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {categories.length > 0 ? (
                categories.slice(0, 6).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/products?category=${cat.id}`}
                      onClick={onClose}
                      className="hover:text-foreground transition-colors block py-0.5"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground italic">
                  {isLoading ? "Loading categories..." : "Explore all in catalog"}
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Collections (Dynamic from Backend) */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground border-b border-border/60 pb-2">
              Collections
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {collections.length > 0 ? (
                collections.slice(0, 6).map((col) => (
                  <li key={col.id}>
                    <Link
                      href={`/products?collection=${col.slug}`}
                      onClick={onClose}
                      className="hover:text-foreground transition-colors block py-0.5"
                    >
                      {col.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-xs text-muted-foreground italic">
                  {isLoading ? "Loading collections..." : "Explore all in catalog"}
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: The Studio (Real Legitimate Routes) */}
          <div className="space-y-4 rounded-sm bg-surface-muted/60 p-5 border border-border/50">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              AHANKARA STUDIOS
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mindfully designed contemporary fashion rooted in refined craftsmanship and timeless silhouettes.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/about"
                onClick={onClose}
                className="text-xs uppercase tracking-widest font-medium text-foreground hover:text-accent transition-colors flex items-center gap-1.5"
              >
                <span>About The Studio</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link
                href="/contact"
                onClick={onClose}
                className="text-xs uppercase tracking-widest font-medium text-foreground hover:text-accent transition-colors flex items-center gap-1.5"
              >
                <span>Client Services</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
