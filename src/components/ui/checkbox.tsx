"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  hasError?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      disabled,
      hasError,
      ...props
    },
    ref
  ) => {
    const isControlled = controlledChecked !== undefined
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked)
    const isChecked = isControlled ? controlledChecked : uncontrolledChecked

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return
      const nextChecked = e.target.checked
      if (!isControlled) {
        setUncontrolledChecked(nextChecked)
      }
      onCheckedChange?.(nextChecked)
    }

    return (
      <label
        className={cn(
          "relative inline-flex items-center justify-center select-none cursor-pointer group",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only peer"
          aria-invalid={hasError ? "true" : undefined}
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 shrink-0 rounded-xs border transition-all duration-fast flex items-center justify-center",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            isChecked
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-surface border-border hover:border-border-strong",
            hasError && "border-destructive",
            className
          )}
          aria-hidden="true"
        >
          {isChecked && <Check className="h-3 w-3 stroke-[2.5]" />}
        </div>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
