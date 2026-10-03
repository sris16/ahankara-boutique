"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Error:", error);
  }, [error]);

  const isAuthError = 
    error.message?.toLowerCase().includes("access denied") || 
    error.message?.toLowerCase().includes("unauthorized") || 
    error.name === "UnauthorizedError" || 
    error.name === "ForbiddenError";

  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] px-4 py-8">
      <ErrorState
        title={isAuthError ? "Access Denied" : "System Error"}
        message={isAuthError ? "You do not have the required permissions to view this admin panel." : "An unexpected operational discrepancy occurred. Our engineers have been alerted. Please retry."}
        onRetry={!isAuthError ? () => reset() : undefined}
        retryLabel="Retry Operation"
        homeHref="/account"
        homeLabel="Return to Account"
        className="max-w-lg border-destructive/30 bg-white"
      />
    </div>
  );
}
