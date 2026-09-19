"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, ShoppingBag, Package, ListTree, Tags, Users } from "lucide-react";

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();


  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, active: true },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag, active: true },
    { name: "Customers", href: "/admin/customers", icon: Users, active: true },
    { name: "Products", href: "/admin/products", icon: Package, active: true },
    { name: "Categories", href: "/admin/categories", icon: ListTree, active: true },
    { name: "Collections", href: "/admin/collections", icon: Tags, active: true },
    { name: "Inventory", href: "/admin/inventory", icon: Package, active: true },
    { name: "Coupons", href: "/admin/coupons", icon: Tags, active: true },
  ];

  return (
    <div className="lg:hidden flex items-center">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 -ml-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-foreground rounded-sm"
        aria-label="Open admin menu"
        aria-expanded={isOpen}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Admin Navigation Menu"
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <Link href="/admin/dashboard" className="font-serif text-lg tracking-wide uppercase font-bold text-foreground">
            AHANKARA STUDIOS
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-foreground rounded-sm"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-4rem)]">
          {navigation.map((item) => {
            const isActivePath = item.active && pathname === item.href;
            return item.active ? (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm text-base font-medium transition-colors ${
                  isActivePath
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                aria-current={isActivePath ? "page" : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.name}
              </Link>
            ) : (
              <div
                key={item.name}
                className="flex items-center gap-3 px-4 py-3 rounded-sm text-base font-medium text-muted-foreground/50 cursor-not-allowed select-none"
                aria-disabled="true"
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.name}
                <span className="ml-auto text-[10px] uppercase tracking-wider bg-muted text-muted-foreground px-2 py-1 rounded-sm">
                  Soon
                </span>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
