import { EmptyState } from "@/components/ui/empty-state";
import { Compass } from "lucide-react";

export default function StorefrontNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] bg-background px-4 py-16">
      <EmptyState
        icon={Compass}
        title="404 — Silhouette Not Found"
        description="The editorial piece or destination you sought does not exist or may have been archived from our current collection."
        action={{
          label: "Explore Collections",
          href: "/products",
        }}
        secondaryAction={{
          label: "Return Home",
          href: "/",
        }}
        className="max-w-lg border-border/70"
      />
    </div>
  );
}
