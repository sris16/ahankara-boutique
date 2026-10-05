import * as React from "react"
import { cn } from "@/lib/utils"

export interface AmbientGlowProps {
  position?: "top" | "center" | "bottom" | "top-right"
  tone?: "warm" | "editorial" | "parchment"
  className?: string
}

/**
 * AmbientGlow
 * A 100% static, pointer-events-none radial light layer for subtle architectural depth.
 * Zero JavaScript, zero continuous animation, zero GPU blur filters.
 */
export function AmbientGlow({
  position = "top",
  tone = "warm",
  className,
}: AmbientGlowProps) {
  const positionClasses = {
    top: "bg-[radial-gradient(ellipse_90%_45%_at_50%_-10%,var(--glow-color)_0%,transparent_65%)]",
    center: "bg-[radial-gradient(ellipse_75%_50%_at_50%_50%,var(--glow-color)_0%,transparent_70%)]",
    bottom: "bg-[radial-gradient(ellipse_90%_45%_at_50%_110%,var(--glow-color)_0%,transparent_65%)]",
    "top-right": "bg-[radial-gradient(ellipse_60%_50%_at_85%_0%,var(--glow-color)_0%,transparent_60%)]",
  }[position]

  const toneColorStyle = {
    warm: { "--glow-color": "hsl(38 25% 94% / 0.55)" } as React.CSSProperties,
    editorial: { "--glow-color": "hsl(31 33% 43% / 0.04)" } as React.CSSProperties,
    parchment: { "--glow-color": "hsl(38 18% 95% / 0.8)" } as React.CSSProperties,
  }[tone]

  return (
    <div
      aria-hidden="true"
      style={toneColorStyle}
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none",
        positionClasses,
        className
      )}
    />
  )
}

export interface EditorialDividerProps {
  notch?: boolean
  label?: string
  fade?: boolean
  className?: string
}

/**
 * EditorialDivider
 * A restrained, hairline architectural divider for section transitions.
 */
export function EditorialDivider({
  notch = false,
  label,
  fade = false,
  className,
}: EditorialDividerProps) {
  if (label) {
    return (
      <div
        role="separator"
        className={cn("relative flex items-center justify-center my-10 sm:my-14", className)}
      >
        <div
          className={cn(
            "absolute inset-0 flex items-center",
            fade ? "hairline-fade" : "hairline-h"
          )}
          aria-hidden="true"
        />
        <span className="relative z-10 bg-background px-4 text-[10px] uppercase tracking-[0.3em] font-medium text-muted-foreground/80 select-none">
          {label}
        </span>
      </div>
    )
  }

  if (notch) {
    return (
      <div
        role="separator"
        className={cn("relative flex items-center justify-center my-8 sm:my-12", className)}
      >
        <div
          className={cn(
            "absolute inset-0 flex items-center",
            fade ? "hairline-fade" : "hairline-h"
          )}
          aria-hidden="true"
        />
        <div
          className="relative z-10 w-2 h-2 rotate-45 border border-border/80 bg-background"
          aria-hidden="true"
        />
      </div>
    )
  }

  return (
    <hr
      className={cn(
        "border-0 my-8 sm:my-12",
        fade ? "hairline-fade" : "hairline-h",
        className
      )}
    />
  )
}

export interface SectionAtmosphereProps {
  children: React.ReactNode
  tone?: "canvas" | "parchment" | "alabaster" | "editorial"
  withSeamTop?: boolean
  withSeamBottom?: boolean
  withGrain?: boolean
  className?: string
  as?: "section" | "div" | "article"
  id?: string
}

/**
 * SectionAtmosphere
 * Tonal layout wrapper that provides intentional visual depth to page sections
 * while maintaining pure accessibility and zero layout shift.
 */
export function SectionAtmosphere({
  children,
  tone = "canvas",
  withSeamTop = false,
  withSeamBottom = false,
  withGrain = false,
  className,
  as: Component = "section",
  id,
}: SectionAtmosphereProps) {
  const toneClasses = {
    canvas: "bg-background",
    parchment: "bg-surface-muted/40",
    alabaster: "bg-surface",
    editorial: "bg-background bg-radial-editorial",
  }[tone]

  return (
    <Component
      id={id}
      className={cn(
        "relative",
        toneClasses,
        withSeamTop && "seam-t",
        withSeamBottom && "seam-b",
        withGrain && "fine-grain",
        className
      )}
    >
      {children}
    </Component>
  )
}
