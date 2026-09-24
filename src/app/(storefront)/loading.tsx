import { Loader2 } from "lucide-react";

export default function StorefrontLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] bg-background">
      <div className="flex flex-col items-center gap-6 text-muted-foreground animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin text-foreground/40" />
      </div>
    </div>
  );
}
