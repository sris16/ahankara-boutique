import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StorefrontNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] bg-background px-4 text-center">
      <h1 className="font-serif text-5xl md:text-7xl tracking-tight mb-6">404</h1>
      <p className="text-muted-foreground text-lg mb-10 max-w-md">
        The page you are looking for cannot be found. It may have been moved or no longer exists.
      </p>
      <Button asChild size="lg" className="uppercase tracking-widest text-xs">
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
