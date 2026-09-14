"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, User as UserIcon, MapPin } from "lucide-react";

export function AccountNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "My Profile", href: "/account/profile", icon: UserIcon },
    { label: "Addresses", href: "/account/addresses", icon: MapPin },
    { label: "My Orders", href: "/account/orders", icon: Package },
  ];

  return (
    <nav className="flex md:flex-col overflow-x-auto pb-2 md:pb-0 hide-scrollbar gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-sm whitespace-nowrap transition-colors ${
              isActive
                ? "bg-foreground text-background font-medium"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
