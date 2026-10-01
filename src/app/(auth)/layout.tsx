import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-surface-muted/30 px-4 py-8 md:py-12 relative overflow-hidden">
      {/* Subtle atmospheric ambient glow */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/5 rounded-full blur-3xl opacity-50"
        aria-hidden="true"
      />

      {/* Top Navigation Bar with Return to Boutique */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors group py-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Return to Boutique</span>
        </Link>

        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 hidden sm:inline-block font-mono">
          ATELIER CLIENT PORTAL
        </span>
      </header>

      {/* Main Auth Container */}
      <main className="w-full max-w-md mx-auto my-auto py-8 z-10">
        {/* Brand Crest & Heading */}
        <div className="mb-8 text-center flex flex-col items-center">
          <Link href="/" className="inline-block group mb-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border/80 shadow-xs transition-transform group-hover:scale-105">
              <Image
                src="/images/brand/ahankara-studios-logo.jpg"
                alt="AHANKARA STUDIOS"
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
            </div>
          </Link>
          <Link
            href="/"
            className="font-serif text-xl sm:text-2xl tracking-[0.25em] font-medium text-foreground hover:opacity-85 transition-opacity uppercase"
          >
            AHANKARA STUDIOS
          </Link>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/80 mt-1 font-mono">
            HAUTE COUTURE & READY-TO-WEAR
          </span>
        </div>

        {/* Auth Porcelain Card */}
        <div className="bg-background/95 backdrop-blur-md border border-border/80 rounded-xs shadow-sm p-6 sm:p-8">
          {children}
        </div>
      </main>

      {/* Footer Security Badging */}
      <footer className="w-full max-w-5xl mx-auto pt-6 text-center text-xs text-muted-foreground/70 z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 font-mono text-[11px]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <span>256-BIT ENCRYPTED SESSION</span>
        </div>
        <span className="hidden sm:inline text-border">•</span>
        <span>© {new Date().getFullYear()} AHANKARA STUDIOS. ALL RIGHTS RESERVED.</span>
      </footer>
    </div>
  );
}

