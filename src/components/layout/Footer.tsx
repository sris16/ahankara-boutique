import Link from "next/link"
import Image from "next/image"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface text-foreground" aria-label="Storefront Footer">
      <div className="container mx-auto px-6 py-16 lg:py-24">
        <h2 className="sr-only">Footer Directory</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-14">
          {/* Column 1: Brand Ethos */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-3 select-none group"
              aria-label="AHANKARA STUDIOS Home"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border/80 shadow-xs shrink-0 group-hover:border-accent transition-colors">
                <Image
                  src="/images/brand/ahankara-studios-logo.jpg"
                  alt="AHANKARA STUDIOS Monogram"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
              <span className="font-serif text-lg tracking-[0.18em] font-normal uppercase text-foreground group-hover:opacity-90 transition-opacity">
                AHANKARA STUDIOS
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm font-light">
              Dedicated to elegance, mindful craft, and sophisticated minimalism. Designed for those who appreciate the quiet luxury of timeless fashion.
            </p>
            <span className="text-[10px] uppercase tracking-[0.25em] text-accent font-medium block pt-1 select-none">
              Artisanal Couture · Global Dispatch
            </span>
          </div>

          {/* Column 2: Catalog */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground">
              Catalog
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link
                  href="/products?sortBy=newest"
                  className="hover:text-foreground transition-colors inline-block py-1 sm:py-0.5 font-light tracking-wide"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="hover:text-foreground transition-colors inline-block py-1 sm:py-0.5 font-light tracking-wide"
                >
                  All Silhouettes
                </Link>
              </li>
              <li>
                <Link
                  href="/lookbook"
                  className="hover:text-foreground transition-colors inline-block py-1 sm:py-0.5 font-light tracking-wide"
                >
                  Seasonal Lookbook
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Client Care */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground">
              Client Care
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link
                  href="/account"
                  className="hover:text-foreground transition-colors inline-block py-1 sm:py-0.5 font-light tracking-wide"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  href="/account/orders"
                  className="hover:text-foreground transition-colors inline-block py-1 sm:py-0.5 font-light tracking-wide"
                >
                  Track Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="hover:text-foreground transition-colors inline-block py-1 sm:py-0.5 font-light tracking-wide"
                >
                  Private Wishlist
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-foreground transition-colors inline-block py-1 sm:py-0.5 font-light tracking-wide"
                >
                  Client Concierge
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-foreground transition-colors inline-block py-1 sm:py-0.5 font-light tracking-wide"
                >
                  About The Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Studio Legal & Policies */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground">
              Information
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-foreground transition-colors inline-block py-1 sm:py-0.5 font-light tracking-wide"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="hover:text-foreground transition-colors inline-block py-1 sm:py-0.5 font-light tracking-wide"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
            <p className="text-[11px] text-muted-foreground/75 leading-relaxed pt-2 font-light">
              Inclusive of duties & taxes. Complimentary insured express delivery on all atelier orders.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p className="font-light">© {currentYear} AHANKARA STUDIOS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy-policy"
              className="hover:text-foreground transition-colors font-light"
            >
              Privacy Policy
            </Link>
            <span className="text-border" aria-hidden="true">·</span>
            <Link
              href="/terms-of-service"
              className="hover:text-foreground transition-colors font-light"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
