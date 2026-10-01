"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, X, ArrowRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = React.useState("")
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setQuery("")
    }
    onOpenChange(newOpen)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      onOpenChange(false)
      const params = new URLSearchParams()
      params.set("q", trimmed)
      router.push(`/products?${params.toString()}`)
    }
  }

  const handleQuickLink = (href: string) => {
    handleOpenChange(false)
    router.push(href)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-sm border-border bg-surface shadow-elevated">
        <DialogHeader className="p-6 pb-2 border-b border-border/40">
          <DialogTitle className="font-serif text-lg md:text-xl font-normal tracking-wide text-foreground">
            Search AHANKARA STUDIOS
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="p-6 pt-4 space-y-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground shrink-0 pointer-events-none" />
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search by product name, fabric, or style..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base rounded-sm bg-surface-muted/50 border-border"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search query"
                className="absolute right-3.5 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Popular Searches
            </span>
            <Button
              type="submit"
              disabled={!query.trim()}
              size="sm"
              className="uppercase tracking-widest text-xs px-4"
            >
              Search
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Quick Links using only existing routes */}
          <div className="flex flex-wrap gap-2 pt-1 pb-2">
            <button
              type="button"
              onClick={() => handleQuickLink("/products?sortBy=newest")}
              className="text-xs px-3 py-1.5 rounded-xs border border-border bg-surface hover:bg-muted/60 transition-colors text-foreground select-none cursor-pointer"
            >
              New Arrivals
            </button>
            <button
              type="button"
              onClick={() => handleQuickLink("/products")}
              className="text-xs px-3 py-1.5 rounded-xs border border-border bg-surface hover:bg-muted/60 transition-colors text-foreground select-none cursor-pointer"
            >
              All Products
            </button>
            <button
              type="button"
              onClick={() => handleQuickLink("/about")}
              className="text-xs px-3 py-1.5 rounded-xs border border-border bg-surface hover:bg-muted/60 transition-colors text-foreground select-none cursor-pointer"
            >
              About the Studio
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
