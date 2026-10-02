import { LayoutDashboard, ShoppingBag, Package, ListTree, Tags, Users } from "lucide-react";

export const adminNavigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, active: true },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag, active: true },
  { name: "Customers", href: "/admin/customers", icon: Users, active: true },
  { name: "Products", href: "/admin/products", icon: Package, active: true },
  { name: "Categories", href: "/admin/categories", icon: ListTree, active: true },
  { name: "Collections", href: "/admin/collections", icon: Tags, active: true },
  { name: "Inventory", href: "/admin/inventory", icon: Package, active: true },
  { name: "Coupons", href: "/admin/coupons", icon: Tags, active: true },
];
