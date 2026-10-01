"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront Error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] bg-background px-4 py-16">
      <ErrorState
        title="Atelier Interruption"
        message="An unexpected discrepancy occurred while processing this experience. Our engineers have been alerted. Please retry or return to the salon."
        onRetry={() => reset()}
        retryLabel="Retry Experience"
        homeHref="/"
        homeLabel="Return to Salon"
        className="max-w-lg border-destructive/30"
      />
    </div>
  );
}
