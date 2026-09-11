"use client";

import { authClient } from "@/lib/auth-client";
import { AdminMobileNav } from "./AdminMobileNav";
import { User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-16 border-b bg-card shrink-0 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <AdminMobileNav />
        <h1 className="text-lg font-serif lg:hidden">ADMIN</h1>
      </div>

      <div className="flex items-center gap-4">
        {session?.user && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mr-4">
            <User className="w-4 h-4" />
            <span className="font-medium text-foreground">{session.user.name || session.user.email}</span>
            <span className="bg-foreground/10 text-foreground text-[10px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider ml-1">
              Admin
            </span>
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
          <LogOut className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
