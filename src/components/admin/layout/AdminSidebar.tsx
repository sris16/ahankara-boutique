"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, ListTree, Tags, Users } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

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
    <aside className="hidden lg:flex w-64 flex-col border-r bg-card min-h-screen">
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <Link href="/admin/dashboard" className="font-serif text-lg tracking-wide uppercase font-bold text-foreground hover:opacity-80 transition-opacity">
          AHANKARA STUDIOS
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navigation.map((item) => {
          const isActivePath = item.active && pathname === item.href;
          return item.active ? (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
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
              className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium text-muted-foreground/50 cursor-not-allowed select-none"
              aria-disabled="true"
              title="Coming Soon"
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.name}
              <span className="ml-auto text-[10px] uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm">
                Soon
              </span>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t mt-auto text-xs text-muted-foreground text-center">
        Admin Portal v1.0
      </div>
    </aside>
  );
}
