import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthService } from "@/server/services/auth.service";
import { UnauthorizedError } from "@/utils/errors";
import { AccountNav } from "@/components/account/AccountNav";
import { ShieldCheck, Sparkles } from "lucide-react";

export const metadata = {
  title: "Client Portal | AHANKARA STUDIOS",
  description: "Manage your AHANKARA STUDIOS personal wardrobe, orders, and addresses.",
  robots: "noindex, nofollow",
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await AuthService.requireAuth(await headers());
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login?callbackUrl=/account");
    }
    throw error;
  }

  const userName = user.name || "Client";
  const userInitials = (user.name || user.email || "A")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-surface-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14 max-w-6xl">
        {/* Atelier Client Profile Banner */}
        <div className="bg-background border border-border/80 rounded-xs p-6 md:p-8 mb-8 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Initials Monogram Avatar */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-surface-muted border border-border/80 flex items-center justify-center font-serif text-lg sm:text-xl font-medium tracking-wider text-foreground shrink-0 shadow-xs">
              {userInitials}
            </div>

            <div>
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <h1 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground">
                  {userName}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] bg-accent/10 text-accent border border-accent/25 font-medium">
                  <Sparkles className="w-2.5 h-2.5" />
                  Atelier Member
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground border-t md:border-t-0 md:border-l border-border/60 pt-4 md:pt-0 md:pl-8">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span className="tracking-wider">VERIFIED CLIENTELE</span>
            </div>
          </div>
        </div>

        {/* Content & Navigation Shell */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-10 items-start">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 shrink-0">
            <AccountNav />
          </aside>

          {/* Sub-route Content */}
          <main className="flex-1 min-w-0 w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

