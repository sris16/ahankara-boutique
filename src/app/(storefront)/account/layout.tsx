import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Package } from "lucide-react";

export const metadata = {
  title: "My Account | AHANKARA STUDIOS",
  description: "Manage your AHANKARA STUDIOS orders and account settings.",
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Define navigation items here. As per requirements, only "My Orders" exists in F8.
  const navItems = [
    { label: "My Orders", href: "/account/orders", icon: Package, active: true },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight">My Account</h1>
        <p className="text-muted-foreground mt-2">Welcome back, {session.user.name || "Customer"}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Navigation - Horizontal on mobile, Vertical on desktop */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col overflow-x-auto pb-2 md:pb-0 hide-scrollbar gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-sm whitespace-nowrap transition-colors ${
                    item.active
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
        </aside>

        {/* Page Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
