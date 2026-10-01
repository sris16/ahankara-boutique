import Link from "next/link"
import Image from "next/image"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface text-foreground" aria-label="Storefront Footer">
      <div className="container mx-auto px-6 py-14 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Column 1: Brand Ethos */}
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-3 select-none group"
              aria-label="AHANKARA STUDIOS Home"
            >
              <div className="relative w-7 h-7 rounded-full overflow-hidden border border-border/80 shadow-subtle shrink-0">
                <Image
                  src="/images/brand/ahankara-studios-logo.jpg"
                  alt="AHANKARA STUDIOS Monogram"
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              </div>
              <span className="font-serif text-lg tracking-[0.18em] font-medium uppercase text-foreground group-hover:opacity-80 transition-opacity">
                AHANKARA STUDIOS
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Dedicated to elegance, mindful craft, and sophisticated minimalism. Designed for those who appreciate the quiet luxury of timeless fashion.
            </p>
          </div>

          {/* Column 2: Catalog */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              Catalog
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/products?sortBy=newest"
                  className="hover:text-foreground transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="hover:text-foreground transition-colors"
                >
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Client Services */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              Client Care
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/account"
                  className="hover:text-foreground transition-colors"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  href="/account/orders"
                  className="hover:text-foreground transition-colors"
                >
                  Track Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="hover:text-foreground transition-colors"
                >
                  Wishlist
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-foreground transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-foreground transition-colors"
                >
                  About The Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Studio Legal & Policies */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
              Information
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} AHANKARA STUDIOS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy-policy"
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-border" aria-hidden="true">·</span>
            <Link
              href="/terms-of-service"
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
