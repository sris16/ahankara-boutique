import { Spinner } from "@/components/ui/spinner";

export default function StorefrontLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground animate-pulse tracking-widest uppercase">
        Loading...
      </p>
    </div>
  );
}
