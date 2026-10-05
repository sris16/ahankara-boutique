import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BrandIntro } from "@/components/layout/BrandIntro";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen overflow-x-clip bg-radial-subtle">
      {/* Skip to main content link for keyboard accessibility (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-primary focus:text-primary-foreground focus:rounded-xs focus:shadow-elevated focus:outline-none focus:ring-2 focus:ring-ring text-xs font-mono uppercase tracking-widest"
      >
        Skip to main content
      </a>
      <BrandIntro />
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
