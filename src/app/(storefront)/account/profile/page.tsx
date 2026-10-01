import { ProfileFormClient } from "@/components/account/ProfileFormClient";
import { ChangePasswordFormClient } from "@/components/account/ChangePasswordFormClient";
import { AuthService } from "@/server/services/auth.service";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/hooks/use-auth";

export const metadata = {
  title: "My Profile | AHANKARA STUDIOS",
  description: "Manage your personal information.",
  robots: { index: false, follow: false }
};

export default async function ProfilePage() {
  const reqHeaders = await headers();
  let user;
  try {
    user = await AuthService.requireAuth(reqHeaders);
  } catch {
    redirect("/login?callbackUrl=/account/profile");
  }

  // Map AuthenticatedUser to the expected Client User type (matching hooks/use-auth)
  const clientUser: User = {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      <div>
        <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-mono block mb-1">
          CLIENT CREDENTIALS
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground">
          Personal Profile & Security
        </h2>
        <p className="text-xs text-muted-foreground font-mono mt-1">
          Manage your contact credentials and security authentication.
        </p>
      </div>

      <ProfileFormClient initialUser={clientUser} />
      <ChangePasswordFormClient />
    </div>
  );
}

