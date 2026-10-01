"use client"

import * as React from "react"
import { X, Ruler } from "lucide-react"

interface ProductSizeGuideProps {
  open: boolean
  onClose: () => void
}

export function ProductSizeGuide({ open, onClose }: ProductSizeGuideProps) {
  const [unit, setUnit] = React.useState<"in" | "cm">("in")

  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  // Sizing data in inches (converted to cm dynamically when requested)
  const sizeData = [
    { size: "XS / 36", chest: 36, waist: 30, hip: 37, shoulder: 16.5, length: 42 },
    { size: "S / 38", chest: 38, waist: 32, hip: 39, shoulder: 17.0, length: 42.5 },
    { size: "M / 40", chest: 40, waist: 34, hip: 41, shoulder: 17.5, length: 43 },
    { size: "L / 42", chest: 42, waist: 36, hip: 43, shoulder: 18.0, length: 43.5 },
    { size: "XL / 44", chest: 44, waist: 38, hip: 45, shoulder: 18.5, length: 44 },
    { size: "XXL / 46", chest: 46, waist: 40, hip: 47, shoulder: 19.0, length: 44.5 },
  ]

  const formatMeasure = (inches: number) => {
    if (unit === "cm") {
      return (inches * 2.54).toFixed(1)
    }
    return inches.toString()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-fast"
    >
      <div className="relative w-full max-w-2xl bg-surface border border-border shadow-elevated rounded-xs p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <Ruler className="h-5 w-5 text-accent stroke-[1.5]" />
            <h2 id="size-guide-title" className="font-serif text-xl sm:text-2xl font-normal text-foreground">
              Atelier Measurement Guide
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close size guide"
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Unit Toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Standard Garment Dimensions
          </p>
          <div className="inline-flex items-center border border-border rounded-xs p-0.5 bg-surface-muted text-xs">
            <button
              type="button"
              onClick={() => setUnit("in")}
              className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                unit === "in" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Inches
            </button>
            <button
              type="button"
              onClick={() => setUnit("cm")}
              className={`px-3 py-1 rounded-xs transition-colors cursor-pointer ${
                unit === "cm" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Centimeters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-border/80 rounded-xs mb-6">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-surface-muted border-b border-border text-foreground font-medium uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Size</th>
                <th className="py-3 px-3.5">Chest / Bust ({unit})</th>
                <th className="py-3 px-3.5">Waist ({unit})</th>
                <th className="py-3 px-3.5">Hips ({unit})</th>
                <th className="py-3 px-3.5">Shoulder ({unit})</th>
                <th className="py-3 px-3.5">Length ({unit})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sizeData.map((row) => (
                <tr key={row.size} className="hover:bg-surface-muted/40 transition-colors">
                  <td className="py-2.5 px-3.5 font-medium font-mono text-foreground">{row.size}</td>
                  <td className="py-2.5 px-3.5 text-muted-foreground font-mono">{formatMeasure(row.chest)}</td>
                  <td className="py-2.5 px-3.5 text-muted-foreground font-mono">{formatMeasure(row.waist)}</td>
                  <td className="py-2.5 px-3.5 text-muted-foreground font-mono">{formatMeasure(row.hip)}</td>
                  <td className="py-2.5 px-3.5 text-muted-foreground font-mono">{formatMeasure(row.shoulder)}</td>
                  <td className="py-2.5 px-3.5 text-muted-foreground font-mono">{formatMeasure(row.length)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Measurement Tips */}
        <div className="border-t border-border/60 pt-4 text-xs text-muted-foreground space-y-2">
          <p className="font-medium text-foreground uppercase tracking-widest text-[11px]">
            How to Take Measurements
          </p>
          <ul className="list-disc pl-4 space-y-1 leading-relaxed">
            <li><strong>Chest / Bust:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</li>
            <li><strong>Waist:</strong> Measure around the narrowest part of your natural waistline.</li>
            <li><strong>Garment Fit:</strong> Our silhouettes are tailored with a classic relaxed drape. If you prefer a closer fit, we recommend selecting one size down.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
