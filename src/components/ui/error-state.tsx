import * as React from "react"
import { AlertCircle, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  homeHref?: string
  homeLabel?: string
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while loading this section. Please try again.",
  onRetry,
  retryLabel = "Try Again",
  homeHref = "/",
  homeLabel = "Return Home",
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-sm border border-destructive/20 bg-destructive/5 max-w-md mx-auto my-8",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive mb-4 shrink-0">
        <AlertCircle className="w-6 h-6 stroke-[1.75]" aria-hidden="true" />
      </div>
      <h3 className="font-serif text-xl font-medium tracking-tight text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
        {message}
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="w-full sm:w-auto uppercase tracking-widest text-xs min-h-[40px]"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-2 shrink-0" aria-hidden="true" />
            {retryLabel}
          </Button>
        )}
        {homeHref && (
          <Button
            asChild
            className="w-full sm:w-auto uppercase tracking-widest text-xs min-h-[40px]"
          >
            <a href={homeHref}>{homeLabel}</a>
          </Button>
        )}
      </div>
    </div>
  )
}
