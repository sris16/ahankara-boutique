import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-sm border border-border/60 bg-surface/50 max-w-md mx-auto my-8",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted/70 text-foreground mb-5 shrink-0">
          <Icon className="w-6 h-6 stroke-[1.5]" aria-hidden="true" />
        </div>
      )}
      <h3 className="font-serif text-xl md:text-2xl font-medium tracking-tight text-foreground mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
          {description}
        </p>
      )}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        {action && (
          action.href ? (
            <Button asChild className="w-full sm:w-auto uppercase tracking-widest text-xs min-h-[40px]">
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button onClick={action.onClick} className="w-full sm:w-auto uppercase tracking-widest text-xs min-h-[40px]">
              {action.label}
            </Button>
          )
        )}
        {secondaryAction && (
          secondaryAction.href ? (
            <Button asChild variant="outline" className="w-full sm:w-auto uppercase tracking-widest text-xs min-h-[40px]">
              <a href={secondaryAction.href}>{secondaryAction.label}</a>
            </Button>
          ) : (
            <Button onClick={secondaryAction.onClick} variant="outline" className="w-full sm:w-auto uppercase tracking-widest text-xs min-h-[40px]">
              {secondaryAction.label}
            </Button>
          )
        )}
      </div>
    </div>
  )
}
