import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-sm border bg-surface px-3.5 py-2.5 text-base sm:text-sm text-foreground transition-colors duration-fast placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30 resize-y",
          hasError
            ? "border-destructive text-destructive focus-visible:ring-destructive"
            : "border-border hover:border-border-strong focus-visible:ring-ring focus-visible:border-primary",
          className
        )}
        aria-invalid={hasError ? "true" : undefined}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
