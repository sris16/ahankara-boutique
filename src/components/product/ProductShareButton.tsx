"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductShareButtonProps {
  productName: string;
  className?: string;
}

export function ProductShareButton({ productName, className }: ProductShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Check out ${productName} at AHANKARA STUDIOS`,
          url,
        });
      } catch (err) {
        // Only fallback to copy if it's not a user cancellation
        if (err instanceof Error && err.name !== "AbortError") {
          fallbackCopy(url);
        }
      }
    } else {
      fallbackCopy(url);
    }
  };

  const fallbackCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link");
    }
  };

  return (
    <button
      onClick={handleShare}
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2",
        className
      )}
      aria-label="Share product"
      aria-live="polite"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span>Link copied</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </>
      )}
    </button>
  );
}
