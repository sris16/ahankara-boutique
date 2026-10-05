"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Sparkles, ShieldCheck, Truck, Shirt } from "lucide-react"

interface ProductDetailsTabsProps {
  description: string | null
  shortDescription: string | null
  categoryName?: string
  productId: string
}

export function ProductDetailsTabs({
  description,
  shortDescription,
  categoryName,
  productId,
}: ProductDetailsTabsProps) {
  return (
    <div className="w-full pt-8 mt-6 border-t border-border/40">
      <Tabs defaultValue="story" className="w-full">
        <TabsList className="w-full border-b border-border/40 justify-start gap-4 sm:gap-8 pb-px overflow-x-auto hide-scrollbar whitespace-nowrap">
          <TabsTrigger value="story" className="text-xs font-mono tracking-[0.2em] uppercase py-2.5">
            Story & Craft
          </TabsTrigger>
          <TabsTrigger value="details" className="text-xs font-mono tracking-[0.2em] uppercase py-2.5">
            Details
          </TabsTrigger>
          <TabsTrigger value="care" className="text-xs font-mono tracking-[0.2em] uppercase py-2.5">
            Care
          </TabsTrigger>
          <TabsTrigger value="shipping" className="text-xs font-mono tracking-[0.2em] uppercase py-2.5">
            Shipping & Returns
          </TabsTrigger>
        </TabsList>

        {/* Story Tab */}
        <TabsContent value="story" className="pt-6">
          <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground text-sm sm:text-base leading-relaxed space-y-3">
            {description ? (
              <p className="whitespace-pre-wrap font-light">{description}</p>
            ) : shortDescription ? (
              <p className="font-light">{shortDescription}</p>
            ) : (
              <p className="font-light">
                Meticulously tailored in our dedicated design atelier. Each silhouette is shaped through time-honored artisanal methods, celebrating contemporary Indian couture with unwavering precision.
              </p>
            )}
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-3.5 bg-surface-muted/60 border border-border/40 rounded-xs flex items-start gap-3">
              <Shirt className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <div>
                <span className="font-medium text-foreground block uppercase tracking-wider text-[11px]">Silhouette & Style</span>
                <span className="text-muted-foreground">{categoryName || "Artisanal Couture"}</span>
              </div>
            </div>

            <div className="p-3.5 bg-surface-muted/60 border border-border/40 rounded-xs flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <div>
                <span className="font-medium text-foreground block uppercase tracking-wider text-[11px]">Atelier Reference</span>
                <span className="font-mono text-muted-foreground text-xs">{productId.substring(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Care Tab */}
        <TabsContent value="care" className="pt-6">
          <div className="p-4 bg-surface-muted/40 border border-border/60 rounded-xs space-y-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground font-medium uppercase tracking-wider text-[11px]">
              <ShieldCheck className="h-4 w-4 text-accent stroke-[1.5]" />
              Garment Preservation Guidelines
            </div>
            <ul className="list-disc pl-5 space-y-1.5 leading-relaxed pt-1">
              <li>Dry clean only by certified luxury garment specialists.</li>
              <li>Store in our complimentary breathable muslin garment cover.</li>
              <li>Avoid spraying perfumes, colognes, or direct moisture onto fine fabrics and metallic embroidery.</li>
              <li>Press inside out on low heat using a protective cotton pressing cloth.</li>
            </ul>
          </div>
        </TabsContent>

        {/* Shipping & Returns Tab */}
        <TabsContent value="shipping" className="pt-6">
          <div className="p-4 bg-surface-muted/40 border border-border/60 rounded-xs space-y-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground font-medium uppercase tracking-wider text-[11px]">
              <Truck className="h-4 w-4 text-accent stroke-[1.5]" />
              Complimentary Atelier Delivery
            </div>
            <p className="leading-relaxed pt-1">
              Every creation is inspected by our master tailors before being packaged in our signature tamper-evident presentation box.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
              <li><strong>Domestic Delivery:</strong> Dispatched within 2–4 business days via premium air express couriers.</li>
              <li><strong>Concierge Returns:</strong> We offer a seamless 7-day exchange and return policy on unadorned, unworn pieces with all original atelier tags attached.</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
