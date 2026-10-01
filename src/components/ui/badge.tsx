import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "secondary" | "destructive" | "sale" | "accent" | "success" | "warning"
  size?: "default" | "sm"
}

function Badge({
  className,
  variant = "default",
  size = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-medium uppercase tracking-widest rounded-xs select-none transition-colors",
        {
          "bg-muted text-foreground": variant === "default",
          "bg-secondary text-secondary-foreground": variant === "secondary",
          "border border-border text-foreground bg-transparent": variant === "outline",
          "bg-destructive text-destructive-foreground": variant === "destructive" || variant === "sale",
          "bg-accent text-accent-foreground": variant === "accent",
          "bg-success text-success-foreground": variant === "success",
          "bg-warning text-warning-foreground": variant === "warning",
          "text-[10px] px-2 py-0.5": size === "sm",
          "text-xs px-2.5 py-1": size === "default",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
