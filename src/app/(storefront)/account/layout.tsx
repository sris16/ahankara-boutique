import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { AccountNav } from "@/components/account/AccountNav";

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

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight">My Account</h1>
        <p className="text-muted-foreground mt-2">Welcome back, {session.user.name || "Customer"}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Navigation - Horizontal on mobile, Vertical on desktop */}
        <aside className="w-full md:w-64 shrink-0">
          <AccountNav />
        </aside>

        {/* Page Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
