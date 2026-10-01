"use client"

import * as React from "react"
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastVariant = "default" | "success" | "warning" | "destructive"

export interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

export interface ToastItem extends ToastOptions {
  id: string
}

interface ToastContextValue {
  toasts: ToastItem[]
  toast: (options: ToastOptions) => string
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

// Standalone toast function dispatcher for calling outside component render
let globalToastDispatcher: ((options: ToastOptions) => string) | null = null

export function toast(options: ToastOptions): string {
  if (globalToastDispatcher) {
    return globalToastDispatcher(options)
  }
  return ""
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = React.useCallback(
    ({ title, description, variant = "default", duration = 4000 }: ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: ToastItem = { id, title, description, variant, duration }

      setToasts((prev) => [...prev.slice(-3), newToast]) // keep max 4 toasts

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id)
        }, duration)
      }

      return id
    },
    [dismiss]
  )

  React.useEffect(() => {
    globalToastDispatcher = addToast
    return () => {
      globalToastDispatcher = null
    }
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, toast: addToast, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    return {
      toast,
      dismiss: () => {},
      toasts: [],
    }
  }
  return context
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <aside
      aria-label="Notifications"
      aria-live="polite"
      role="region"
      className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2.5 max-w-[calc(100vw-2rem)] sm:max-w-sm w-full pointer-events-none"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </aside>
  )
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem
  onDismiss: (id: string) => void
}) {
  const icons = {
    default: <Info className="h-4 w-4 text-foreground shrink-0 mt-0.5" aria-hidden="true" />,
    success: <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" aria-hidden="true" />,
    warning: <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />,
    destructive: <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />,
  }

  const borderClasses = {
    default: "border-border",
    success: "border-success/30",
    warning: "border-warning/30",
    destructive: "border-destructive/30",
  }

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-sm bg-surface text-foreground shadow-elevated border transition-all duration-fast",
        borderClasses[item.variant || "default"]
      )}
    >
      {icons[item.variant || "default"]}
      <div className="flex-1 space-y-1 pr-2">
        {item.title && (
          <p className="font-serif text-sm font-medium tracking-tight text-foreground leading-snug">
            {item.title}
          </p>
        )}
        {item.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {item.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1 -mt-1 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}
