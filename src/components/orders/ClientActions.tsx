"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied to Clipboard",
        description: `${label}: ${text}`,
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="h-7 px-2.5 text-[11px] uppercase tracking-wider font-mono gap-1.5 transition-all"
      aria-label={`${label} ${text}`}
    >
      {copied ? <Check className="w-3 h-3 text-green-600 dark:text-green-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 uppercase tracking-wider"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-foreground" : ""}`} />
      <span>{isRefreshing ? "Updating..." : "Refresh"}</span>
    </Button>
  );
}
