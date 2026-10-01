import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: "sm" | "default" | "lg"
}

export function Spinner({ className, size = "default", ...props }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center justify-center">
      <Loader2
        className={cn(
          "animate-spin text-muted-foreground",
          {
            "h-4 w-4": size === "sm",
            "h-6 w-6": size === "default",
            "h-8 w-8": size === "lg",
          },
          className
        )}
        aria-hidden="true"
        {...props}
      />
      <span className="sr-only">Loading...</span>
    </span>
  )
}
