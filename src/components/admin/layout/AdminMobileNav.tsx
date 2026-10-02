"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { adminNavigation } from "@/lib/config/admin-navigation";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden flex items-center">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-foreground rounded-sm"
            aria-label="Open admin menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </SheetTrigger>

        <SheetContent side="left" className="w-72 p-0 flex flex-col bg-card" showCloseButton={true}>
          <div className="flex items-center h-16 px-6 border-b shrink-0">
            <SheetTitle className="sr-only">Admin Navigation Menu</SheetTitle>
            <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="font-serif text-lg tracking-wide uppercase font-bold text-foreground">
              AHANKARA STUDIOS
            </Link>
          </div>

          <nav className="p-4 space-y-2 overflow-y-auto flex-1">
            {adminNavigation.map((item) => {
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
        </SheetContent>
      </Sheet>
    </div>
  );
}
