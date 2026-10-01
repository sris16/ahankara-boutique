"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, User as UserIcon, MapPin, Heart, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { refresh } = useAuth();
  const { toast } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  const navItems = [
    { label: "Overview", href: "/account", icon: LayoutDashboard, exact: true },
    { label: "My Profile", href: "/account/profile", icon: UserIcon, exact: false },
    { label: "Saved Addresses", href: "/account/addresses", icon: MapPin, exact: false },
    { label: "Order History", href: "/account/orders", icon: Package, exact: false },
    { label: "Saved Pieces", href: "/wishlist", icon: Heart, exact: false },
  ];

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      await refresh();
      toast({
        title: "Signed Out",
        description: "You have been securely signed out of your account.",
      });
      router.push("/");
    } catch (err) {
      console.error("Failed to sign out", err);
      toast({
        variant: "destructive",
        title: "Sign Out Failed",
        description: "An unexpected error occurred. Please try again.",
      });
      setSigningOut(false);
    }
  };

  return (
    <nav className="bg-background border border-border/80 rounded-xs p-2 sm:p-3 shadow-xs flex md:flex-col overflow-x-auto hide-scrollbar gap-1.5 w-full">
      <span className="hidden md:block text-[10px] uppercase font-mono tracking-[0.25em] text-muted-foreground/70 px-3 py-2">
        PORTAL NAVIGATION
      </span>

      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname?.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xs whitespace-nowrap text-xs font-medium uppercase tracking-[0.15em] transition-all duration-150 ${
              isActive
                ? "bg-foreground text-background shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-muted/60"
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-background" : "text-muted-foreground"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <div className="hidden md:block h-px bg-border/60 my-2" />

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xs whitespace-nowrap text-xs font-medium uppercase tracking-[0.15em] transition-all duration-150 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-left w-full cursor-pointer disabled:opacity-50"
      >
        {signingOut ? (
          <Spinner size="sm" className="w-4 h-4" />
        ) : (
          <LogOut className="w-4 h-4 shrink-0" />
        )}
        <span>{signingOut ? "Signing Out..." : "Sign Out"}</span>
      </button>
    </nav>
  );
}

