"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { Search, Heart, ShoppingBag, User, Menu, ChevronDown } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { authClient } from "@/lib/auth-client"
import dynamic from "next/dynamic"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { Button } from "@/components/ui/button"
import { MegaMenu } from "./MegaMenu"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const CartDrawer = dynamic(
  () => import("@/components/cart/CartDrawer").then((mod) => mod.CartDrawer),
  { ssr: false }
)
const SearchDialog = dynamic(
  () => import("./SearchDialog").then((mod) => mod.SearchDialog),
  { ssr: false }
)

export function Navbar() {
  const { user, loading, refresh } = useAuth()
  const { cart, openCart, isCartOpen } = useCart()
  const { wishlist } = useWishlist()
  const router = useRouter()
  const pathname = usePathname()

  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isMegaMenuOpen, setIsMegaMenuOpen] = React.useState(false)

  // Scroll listener for subtle masthead styling without vertical height jumping
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      await refresh()
      setIsMobileMenuOpen(false)
      router.push("/")
    } catch (err) {
      console.error("Failed to sign out", err)
    }
  }

  const wishlistCount = wishlist?.length || 0
  const cartCount = cart?.itemCount || 0

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-colors duration-standard ease-standard",
          isScrolled
            ? "bg-background/98 backdrop-blur-sm border-b border-border shadow-subtle"
            : "bg-background border-b border-border/50"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between relative">
          {/* Mobile Menu Trigger (44x44px touch target) */}
          <div className="flex items-center md:hidden flex-1">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-foreground hover:text-accent transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5 stroke-[1.5]" />
            </button>
          </div>

          {/* Desktop Left Navigation */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-9 flex-1" aria-label="Main Navigation">
            <div
              className="relative"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
            >
              <button
                type="button"
                id="mega-menu-trigger"
                aria-controls="mega-menu"
                aria-haspopup="true"
                onClick={() => setIsMegaMenuOpen((prev) => !prev)}
                className={cn(
                  "text-xs uppercase tracking-[0.2em] font-medium transition-colors flex items-center gap-1.5 py-4 cursor-pointer select-none relative group",
                  isMegaMenuOpen ? "text-accent" : "text-foreground hover:text-accent"
                )}
                aria-expanded={isMegaMenuOpen}
              >
                <span>Shop</span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-fast text-muted-foreground group-hover:text-accent",
                    isMegaMenuOpen && "rotate-180 text-accent"
                  )}
                />
              </button>
            </div>

            <Link
              href="/products?sortBy=newest"
              className={cn(
                "text-xs uppercase tracking-[0.2em] font-medium transition-colors py-4 relative group",
                pathname === "/products" ? "text-accent" : "text-foreground hover:text-accent"
              )}
            >
              <span>New Arrivals</span>
              {pathname === "/products" && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-accent" aria-hidden="true" />
              )}
            </Link>

            <Link
              href="/lookbook"
              className={cn(
                "text-xs uppercase tracking-[0.2em] font-medium transition-colors py-4 relative group",
                pathname === "/lookbook" ? "text-accent" : "text-foreground hover:text-accent"
              )}
            >
              <span>Lookbook</span>
              {pathname === "/lookbook" && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-accent" aria-hidden="true" />
              )}
            </Link>

            <Link
              href="/about"
              className={cn(
                "text-xs uppercase tracking-[0.2em] font-medium transition-colors py-4 relative group",
                pathname === "/about" ? "text-accent" : "text-foreground hover:text-accent"
              )}
            >
              <span>About</span>
              {pathname === "/about" && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-accent" aria-hidden="true" />
              )}
            </Link>
          </nav>

          {/* Center Brand Identity with Official Logo */}
          <div className="flex-shrink-0 flex items-center justify-center">
            <Link
              href="/"
              className="flex items-center gap-2.5 sm:gap-3 group select-none cursor-pointer"
              aria-label="AHANKARA STUDIOS Home"
            >
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-border/80 shadow-xs group-hover:border-accent transition-colors shrink-0">
                <Image
                  src="/images/brand/ahankara-studios-logo.jpg"
                  alt="AHANKARA STUDIOS Monogram"
                  fill
                  sizes="32px"
                  className="object-cover"
                  priority
                />
              </div>
              <span className="font-serif text-lg sm:text-xl tracking-[0.18em] font-normal uppercase text-foreground group-hover:opacity-90 transition-opacity">
                AHANKARA STUDIOS
              </span>
            </Link>
          </div>

          {/* Right Action Icons (Consistent 44x44px touch targets) */}
          <div className="flex items-center justify-end gap-1 sm:gap-1.5 flex-1">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search catalog"
              aria-expanded={isSearchOpen}
              aria-controls="search-dialog"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground hover:text-accent transition-colors cursor-pointer"
            >
              <Search className="h-4.5 w-4.5 stroke-[1.5]" />
            </button>

            {/* Account Link */}
            <Link
              href={user ? "/account" : "/login"}
              aria-label={user ? `Account (${user.name || user.email})` : "Sign In"}
              className="min-w-[44px] min-h-[44px] hidden sm:flex items-center justify-center text-foreground hover:text-accent transition-colors"
            >
              <User className="h-4.5 w-4.5 stroke-[1.5]" />
            </Link>

            {/* Wishlist Link with dynamic badge */}
            <Link
              href="/wishlist"
              aria-label={`Wishlist (${wishlistCount} items)`}
              className="min-w-[44px] min-h-[44px] hidden sm:flex items-center justify-center text-foreground hover:text-accent transition-colors relative"
            >
              <Heart className="h-4.5 w-4.5 stroke-[1.5]" />
              {wishlistCount > 0 && (
                <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-[10px] font-mono font-medium h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center tabular-nums leading-none">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Bag / Cart Trigger with dynamic badge */}
            <button
              type="button"
              onClick={openCart}
              aria-label={`Shopping Bag (${cartCount} items)`}
              aria-expanded={isCartOpen}
              aria-controls="cart-drawer"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground hover:text-accent transition-colors relative cursor-pointer"
            >
              <ShoppingBag className="h-4.5 w-4.5 stroke-[1.5]" />
              {cartCount > 0 && (
                <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-mono font-medium h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center tabular-nums leading-none">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Mega Menu Overlay */}
        <MegaMenu
          isOpen={isMegaMenuOpen}
          onClose={() => setIsMegaMenuOpen(false)}
        />
      </header>

      {/* Luxury Search Dialog */}
      <SearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
      />

      {/* Mobile Navigation Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent id="mobile-menu" side="left" className="w-[88vw] sm:max-w-md p-0 flex flex-col bg-surface border-r border-border shadow-drawer">
          {/* Mobile Sheet Header */}
          <div className="flex items-center gap-3 p-6 border-b border-border/60">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border shrink-0">
              <Image
                src="/images/brand/ahankara-studios-logo.jpg"
                alt="AHANKARA STUDIOS"
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
            <span className="font-serif text-lg tracking-[0.16em] font-normal uppercase text-foreground">
              AHANKARA STUDIOS
            </span>
          </div>

          {/* Mobile Search Button */}
          <div className="p-6 pb-2">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false)
                setIsSearchOpen(true)
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xs bg-surface-muted border border-border/80 text-muted-foreground text-sm cursor-pointer hover:text-foreground hover:border-border transition-colors min-h-[44px]"
            >
              <Search className="h-4 w-4 stroke-[1.5]" />
              <span className="text-xs tracking-wide">Search atelier catalog...</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-1" aria-label="Mobile Navigation">
            <Link
              href="/products?sortBy=newest"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-sm font-serif tracking-wide py-3.5 border-b border-border/30 hover:text-accent transition-colors flex items-center justify-between min-h-[44px]",
                pathname === "/products" && "text-accent"
              )}
            >
              <span>New Arrivals</span>
              <span className="text-[10px] uppercase tracking-widest text-accent font-sans font-medium">New</span>
            </Link>

            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-sm font-serif tracking-wide py-3.5 border-b border-border/30 hover:text-accent transition-colors min-h-[44px] flex items-center",
                pathname === "/products" && "text-accent"
              )}
            >
              All Silhouettes
            </Link>

            <Link
              href="/lookbook"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-sm font-serif tracking-wide py-3.5 border-b border-border/30 hover:text-accent transition-colors min-h-[44px] flex items-center",
                pathname === "/lookbook" && "text-accent"
              )}
            >
              Lookbook
            </Link>

            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-sm font-serif tracking-wide py-3.5 border-b border-border/30 hover:text-accent transition-colors min-h-[44px] flex items-center",
                pathname === "/about" && "text-accent"
              )}
            >
              About The Studio
            </Link>

            <Link
              href="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-sm font-serif tracking-wide py-3.5 border-b border-border/30 hover:text-accent transition-colors min-h-[44px] flex items-center",
                pathname === "/contact" && "text-accent"
              )}
            >
              Client Concierge
            </Link>

            {/* Client Account Area */}
            <div className="pt-6 pb-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground block mb-2">
                Client Care
              </span>
              <div className="flex flex-col gap-1">
                <Link
                  href="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs font-medium uppercase tracking-wider py-2.5 flex items-center gap-3 text-foreground hover:text-accent transition-colors min-h-[44px]"
                >
                  <User className="h-4 w-4 stroke-[1.5]" />
                  <span>My Account</span>
                </Link>
                <Link
                  href="/account/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs font-medium uppercase tracking-wider py-2.5 flex items-center gap-3 text-foreground hover:text-accent transition-colors min-h-[44px]"
                >
                  <ShoppingBag className="h-4 w-4 stroke-[1.5]" />
                  <span>Order History</span>
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs font-medium uppercase tracking-wider py-2.5 flex items-center justify-between text-foreground hover:text-accent transition-colors min-h-[44px]"
                >
                  <span className="flex items-center gap-3">
                    <Heart className="h-4 w-4 stroke-[1.5]" />
                    <span>Private Wishlist</span>
                  </span>
                  {wishlistCount > 0 && (
                    <span className="text-[10px] font-mono font-medium bg-muted px-2 py-0.5 rounded-full tabular-nums">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </nav>

          {/* Mobile Sheet Footer */}
          <div className="p-6 pb-[max(1.5rem,calc(1.25rem+env(safe-area-inset-bottom,0px)))] border-t border-border/60 bg-surface-muted/40 mt-auto">
            {loading ? (
              <div className="h-11 bg-muted/60 animate-pulse rounded-xs" />
            ) : user ? (
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground truncate">
                  Signed in as <strong className="text-foreground">{user.name || user.email}</strong>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full uppercase tracking-widest text-xs min-h-[44px] rounded-xs"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Button
                  asChild
                  className="w-full uppercase tracking-widest text-xs min-h-[44px] rounded-xs"
                >
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Link
                  href="/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center text-xs text-muted-foreground hover:text-foreground py-1 transition-colors"
                >
                  Create an Account
                </Link>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Global Cart Drawer */}
      <CartDrawer />
    </>
  )
}
