import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminHeader } from "@/components/admin/layout/AdminHeader";

export const metadata = {
  title: "Admin Portal | AHANKARA STUDIOS",
  description: "Secure operational dashboard",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 1. Authoritative Server-Side UX Guard
  const reqHeaders = await headers();
  const sessionData = await auth.api.getSession({ headers: reqHeaders });

  // 2. Redirect logic
  if (!sessionData || !sessionData.user) {
    redirect("/login");
  }

  // Use database role retrieved by Better Auth
  if (sessionData.user.role !== "ADMIN") {
    // Authenticated CUSTOMER trying to access admin
    redirect("/account/orders");
  }

  // 3. Render Application Shell
  return (
    <div className="flex min-h-screen bg-muted/20">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
