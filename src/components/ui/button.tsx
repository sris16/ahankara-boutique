import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "secondary" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    const compClassName = cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium tracking-wide transition-all duration-fast select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
      {
        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-subtle": variant === "default",
        "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
        "border border-border bg-transparent text-foreground hover:bg-muted/60": variant === "outline",
        "hover:bg-muted/60 text-foreground": variant === "ghost",
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-subtle": variant === "destructive",
        "text-primary underline-offset-4 hover:underline": variant === "link",
        "h-10 px-4 py-2 min-h-[40px]": size === "default",
        "h-9 px-3 text-xs min-h-[36px]": size === "sm",
        "h-11 px-8 text-base min-h-[44px]": size === "lg",
        "h-11 w-11 min-h-[44px] min-w-[44px] p-0": size === "icon",
      },
      className
    )

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>
      const restProps = { ...props }
      delete (restProps as { children?: React.ReactNode }).children
      return React.cloneElement(child, {
        ...restProps,
        ref,
        className: cn(compClassName, child.props?.className),
      } as React.HTMLAttributes<HTMLElement>)
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={compClassName}
        {...props}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-current shrink-0" aria-hidden="true" />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
