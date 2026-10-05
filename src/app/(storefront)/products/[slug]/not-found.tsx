import Link from "next/link"
import { ArrowLeft, Compass } from "lucide-react"

export default function ProductNotFound() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 max-w-4xl flex flex-col items-center justify-center text-center select-none">
      <div className="w-12 h-12 rounded-full border border-border/60 bg-surface-muted/50 flex items-center justify-center text-accent mb-6">
        <Compass className="w-5 h-5 stroke-[1.5]" />
      </div>

      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent font-medium mb-3">
        Atelier Archive
      </span>

      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-foreground mb-4">
        Piece Not Found
      </h1>

      <p className="text-muted-foreground text-sm sm:text-base font-light max-w-md mx-auto leading-relaxed mb-8">
        The handcrafted creation you are seeking may have been archived, renamed, or is currently undergoing bespoke preservation in our atelier.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-primary text-primary-foreground text-xs uppercase tracking-[0.2em] font-medium rounded-xs hover:bg-primary/90 transition-all shadow-subtle"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Explore All Pieces</span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center justify-center h-12 px-8 border border-border/80 bg-surface/50 hover:bg-surface text-foreground text-xs uppercase tracking-[0.2em] font-medium rounded-xs transition-colors"
        >
          <span>Return to Atelier</span>
        </Link>
      </div>
    </div>
  )
}
