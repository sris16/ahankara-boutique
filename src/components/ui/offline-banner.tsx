"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

const getSnapshot = () => {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
};

const getServerSnapshot = () => {
  return true; // Always assume online during SSR
};

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  
  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2",
        "bg-foreground text-background text-xs uppercase tracking-widest font-medium",
        "animate-in slide-in-from-top-full duration-300"
      )}
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>You are currently offline.</span>
    </div>
  );
}
