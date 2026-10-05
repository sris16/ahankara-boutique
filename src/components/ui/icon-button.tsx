import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg"
  shape?: "circle" | "square"
  isLoading?: boolean
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = "ghost",
      size = "default",
      shape = "circle",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center shrink-0 select-none cursor-pointer transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          shape === "circle" ? "rounded-full" : "rounded-sm",
          {
            "bg-primary text-primary-foreground hover:bg-neutral-800 shadow-subtle": variant === "default",
            "border border-border bg-surface text-foreground hover:bg-muted": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-surface-elevated": variant === "secondary",
            "hover:bg-muted text-foreground": variant === "ghost",
            "w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px]": size === "default",
            "w-9 h-9 sm:w-8 sm:h-8 min-w-[36px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] relative before:absolute before:-inset-1.5 before:content-['']": size === "sm",
            "w-12 h-12 min-w-[48px] min-h-[48px]": size === "lg",
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" aria-hidden="true" />
        ) : (
          children
        )}
      </button>
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton }
