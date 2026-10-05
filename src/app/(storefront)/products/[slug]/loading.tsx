export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 max-w-7xl animate-in fade-in duration-300" aria-busy="true" aria-label="Loading product details">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-6 md:mb-8">
        <div className="h-3 w-12 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
        <div className="h-3 w-3 bg-surface-muted/60 rounded-xs motion-safe:animate-pulse" />
        <div className="h-3 w-20 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
        <div className="h-3 w-3 bg-surface-muted/60 rounded-xs motion-safe:animate-pulse" />
        <div className="h-3 w-28 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
      </div>

      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left: Gallery Skeleton (7 columns) */}
        <div className="lg:col-span-7 w-full flex flex-col md:flex-row-reverse gap-4">
          <div className="flex-1 aspect-[3/4] md:aspect-[4/5] bg-surface-muted rounded-xs border border-border/40 motion-safe:animate-pulse" />
          <div className="hidden md:flex flex-col gap-2.5 w-20 lg:w-22 shrink-0">
            <div className="aspect-[3/4] w-full bg-surface-muted rounded-xs border border-border/40 motion-safe:animate-pulse" />
            <div className="aspect-[3/4] w-full bg-surface-muted rounded-xs border border-border/40 motion-safe:animate-pulse" />
            <div className="aspect-[3/4] w-full bg-surface-muted rounded-xs border border-border/40 motion-safe:animate-pulse" />
          </div>
        </div>

        {/* Right: Product Purchasing Panel Skeleton (5 columns) */}
        <div className="lg:col-span-5 w-full flex flex-col gap-6">
          {/* Eyebrow & Title */}
          <div className="flex flex-col gap-3 border-b border-border/40 pb-5">
            <div className="h-3 w-24 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
            <div className="h-9 w-4/5 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
            <div className="h-4 w-full bg-surface-muted rounded-xs motion-safe:animate-pulse" />
          </div>

          {/* Price */}
          <div className="h-8 w-32 bg-surface-muted rounded-xs motion-safe:animate-pulse" />

          {/* Variants */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-2">
              <div className="h-3 w-16 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
                <div className="h-8 w-16 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="h-3 w-14 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
              <div className="flex gap-2">
                <div className="h-10 w-12 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
                <div className="h-10 w-12 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
                <div className="h-10 w-12 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
                <div className="h-10 w-12 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3.5 pt-4">
            <div className="flex-1 h-13 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
            <div className="w-13 h-13 bg-surface-muted rounded-xs motion-safe:animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
