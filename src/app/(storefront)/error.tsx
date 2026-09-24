"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error("Storefront Error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] bg-background px-4 text-center">
      <h1 className="font-serif text-3xl md:text-4xl tracking-tight mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-10 max-w-md">
        We apologize for the inconvenience. Please try again or return to the homepage.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="outline" className="uppercase tracking-widest text-xs">
          Try Again
        </Button>
        <Button asChild className="uppercase tracking-widest text-xs">
          <a href="/">Return Home</a>
        </Button>
      </div>
    </div>
  );
}
