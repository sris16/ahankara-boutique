"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, User as UserIcon, MapPin, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { refresh } = useAuth();

  const navItems = [
    { label: "My Profile", href: "/account/profile", icon: UserIcon },
    { label: "Addresses", href: "/account/addresses", icon: MapPin },
    { label: "My Orders", href: "/account/orders", icon: Package },
  ];

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      await refresh();
      router.push("/");
    } catch (err) {
      console.error("Failed to sign out", err);
    }
  };

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

      <div className="hidden md:block h-px bg-border my-2" />

      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 px-4 py-3 rounded-sm whitespace-nowrap transition-colors hover:bg-muted text-muted-foreground hover:text-destructive text-left w-full"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </nav>
  );
}
