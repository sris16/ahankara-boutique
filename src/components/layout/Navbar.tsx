"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Menu, X, ShoppingBag, Heart, Search, User } from "lucide-react";
import { useState, FormEvent, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function Navbar() {
  const { user, loading, refresh } = useAuth();
  const { cart, openCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set("q", searchQuery.trim());
      setIsMobileMenuOpen(false);
      setSearchQuery("");
      router.push(`/products?${params.toString()}`);
    }
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      await refresh();
      router.push("/");
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Mobile Menu Button */}
        <div className="flex-1 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
            aria-expanded={isMobileMenuOpen}
            className="p-2 -ml-2 text-foreground hover:text-muted-foreground transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex flex-1 items-center gap-8">
          <Link href="/products?sortBy=newest" className="text-xs uppercase tracking-widest font-medium hover:text-muted-foreground transition-colors">
            New Arrivals
          </Link>
          <Link href="/products" className="text-xs uppercase tracking-widest font-medium hover:text-muted-foreground transition-colors">
            Collections
          </Link>
        </nav>

        {/* Logo */}
        <div className="flex-1 md:flex-none flex justify-center">
          <Link href="/" className="font-serif text-xl md:text-2xl tracking-widest font-semibold hover:opacity-80 transition-opacity">
            AHANKARA STUDIOS
          </Link>
        </div>

        {/* Actions */}
        <div className="flex flex-1 items-center justify-end gap-3 sm:gap-5">
          <div className="hidden sm:flex items-center">
            <form onSubmit={handleSearch} className="relative group flex items-center" role="search">
              <label htmlFor="desktop-search" className="sr-only">Search</label>
              <input
                id="desktop-search"
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-0 opacity-0 group-hover:w-48 group-hover:opacity-100 group-hover:px-3 focus:w-48 focus:opacity-100 focus:px-3 transition-all duration-300 bg-transparent border-b border-transparent hover:border-foreground focus:border-foreground focus:outline-none text-sm py-1 mr-2 placeholder:text-muted-foreground/50"
              />
              <button
                type={searchQuery ? "button" : "submit"}
                onClick={() => {
                  if(searchQuery) {
                    setSearchQuery("");
                  } else {
                    document.getElementById("desktop-search")?.focus();
                  }
                }}
                className="text-foreground hover:text-muted-foreground transition-colors absolute right-2"
                aria-label={searchQuery ? "Clear Search" : "Search"}
              >
                {searchQuery ? <X className="h-4 w-4" /> : <Search className="h-5 w-5 stroke-[1.5]" />}
              </button>
            </form>
          </div>

          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/account" className="hidden sm:block text-foreground hover:text-muted-foreground transition-colors" aria-label="Account">
              <User className="h-5 w-5 stroke-[1.5]" />
            </Link>
            <Link href="/wishlist" className="text-foreground hover:text-muted-foreground transition-colors hidden sm:block" aria-label="Wishlist">
              <Heart className="h-5 w-5 stroke-[1.5]" />
            </Link>
            <button
              onClick={openCart}
              className="text-foreground hover:text-muted-foreground transition-colors relative"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="h-5 w-5 stroke-[1.5]" />
              {cart && cart.itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-4 h-4">
                  {cart.itemCount > 99 ? '99+' : cart.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-background overflow-y-auto border-t border-border flex flex-col">
          <div className="px-6 py-6 border-b border-border">
            <form onSubmit={handleSearch} className="relative" role="search">
              <label htmlFor="mobile-search" className="sr-only">Search</label>
              <input
                id="mobile-search"
                type="text"
                placeholder="Search for items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-muted/30 border border-border rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
              />
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground stroke-[1.5]" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear Search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
          </div>

          <nav className="flex flex-col px-6 py-8 gap-6 flex-1">
            <Link href="/products?sortBy=newest" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-serif tracking-wide hover:text-muted-foreground transition-colors">
              New Arrivals
            </Link>
            <Link href="/products" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-serif tracking-wide hover:text-muted-foreground transition-colors">
              Shop Collections
            </Link>

            <div className="h-px bg-border my-4" />

            <Link href="/account" onClick={() => setIsMobileMenuOpen(false)} className="text-sm uppercase tracking-widest font-medium flex items-center gap-3">
              <User className="h-4 w-4 stroke-[1.5]" /> My Account
            </Link>
            <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="text-sm uppercase tracking-widest font-medium flex items-center gap-3">
              <Heart className="h-4 w-4 stroke-[1.5]" /> Wishlist
            </Link>

            <div className="mt-auto pt-8 flex flex-col gap-4">
              {loading ? (
                <Skeleton className="h-10 w-full rounded-sm" />
              ) : user ? (
                <Button variant="outline" className="w-full uppercase tracking-widest" onClick={handleLogout}>
                  Sign Out
                </Button>
              ) : (
                <Button asChild className="w-full uppercase tracking-widest">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Global Cart Drawer */}
      <CartDrawer />
    </>
  );
}
