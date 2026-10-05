"use client"

import * as React from "react"
import { Minus, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  isLoading?: boolean
  className?: string
  size?: "default" | "sm"
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  isLoading = false,
  className,
  size = "default",
}: QuantitySelectorProps) {
  const canDecrement = value > min && !disabled && !isLoading
  const canIncrement = value < max && !disabled && !isLoading

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault()
    if (canDecrement) {
      onChange(value - 1)
    }
  }

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault()
    if (canIncrement) {
      onChange(value + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || isLoading) return
    if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault()
      if (value > min) onChange(value - 1)
    } else if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault()
      if (value < max) onChange(value + 1)
    }
  }

  return (
    <div
      role="group"
      aria-label="Quantity selector"
      className={cn(
        "inline-flex items-center border border-border bg-surface rounded-sm select-none",
        size === "default" ? "h-11 sm:h-10 min-h-[44px] sm:min-h-[40px]" : "h-10 sm:h-9 min-h-[40px] sm:min-h-[36px]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={!canDecrement}
        aria-label="Decrease quantity"
        className={cn(
          "flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-l-xs cursor-pointer relative before:absolute before:-inset-1 before:content-['']",
          size === "default" ? "w-11 sm:w-10 h-full" : "w-10 sm:w-8 h-full"
        )}
      >
        <Minus className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
      </button>

      <div
        tabIndex={disabled || isLoading ? -1 : 0}
        onKeyDown={handleKeyDown}
        role="spinbutton"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label="Quantity"
        className={cn(
          "flex items-center justify-center font-medium font-mono text-sm tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring px-2 border-x border-border/50",
          size === "default" ? "min-w-[40px] h-full" : "min-w-[34px] sm:min-w-[32px] h-full"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden="true" />
        ) : (
          value
        )}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={!canIncrement}
        aria-label="Increase quantity"
        className={cn(
          "flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-r-xs cursor-pointer relative before:absolute before:-inset-1 before:content-['']",
          size === "default" ? "w-11 sm:w-10 h-full" : "w-10 sm:w-8 h-full"
        )}
      >
        <Plus className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
      </button>
    </div>
  )
}
