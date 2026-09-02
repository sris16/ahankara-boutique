"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Menu, X, ShoppingBag, Heart } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, loading, refresh } = useAuth();
  const { cart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      await refresh();
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Mobile Menu Button */}
        <div className="flex-1 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle Menu">
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex flex-1 items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-muted-foreground transition-colors">
            New Arrivals
          </Link>
          <Link href="/" className="text-sm font-medium hover:text-muted-foreground transition-colors">
            Collections
          </Link>
        </nav>

        {/* Logo */}
        <div className="flex-1 md:flex-none flex justify-center">
          <Link href="/" className="font-serif text-xl tracking-widest font-semibold">
            AHANKARA STUDIOS
          </Link>
        </div>

        {/* Actions */}
        <div className="flex flex-1 items-center justify-end gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/wishlist" className="text-muted-foreground hover:text-foreground">
              <Heart className="h-5 w-5" />
            </Link>
            <Link href="/cart" className="text-muted-foreground hover:text-foreground relative">
              <ShoppingBag className="h-5 w-5" />
              {cart && cart.itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center">
                  {cart.itemCount > 99 ? '99+' : cart.itemCount}
                </span>
              )}
            </Link>
          </div>
          
          <div className="flex items-center">
            {loading ? (
              <Skeleton className="h-9 w-20" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <Link href="/" className="text-sm font-medium hidden sm:block">
                  Account
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button asChild size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col px-4 py-6 gap-4">
            <Link href="/" className="text-sm font-medium hover:text-muted-foreground transition-colors">
              New Arrivals
            </Link>
            <Link href="/" className="text-sm font-medium hover:text-muted-foreground transition-colors">
              Collections
            </Link>
            <div className="h-px bg-border my-2" />
            <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" /> Wishlist
            </Link>
            <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Cart
              {cart && cart.itemCount > 0 && (
                <span className="bg-foreground text-background text-xs px-2 py-0.5 rounded-full">
                  {cart.itemCount}
                </span>
              )}
            </Link>
            {user && (
              <Link href="/" className="text-sm font-medium">
                Account
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
