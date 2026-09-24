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
    redirect("/login");
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
    createdAt: user.createdAt.toISOString()
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="mb-8">
        <h2 className="font-serif text-3xl tracking-tight hidden md:block">My Profile</h2>
        <p className="text-muted-foreground mt-2">Manage your personal information and contact details.</p>
      </div>

      <ProfileFormClient initialUser={clientUser} />
      <ChangePasswordFormClient />
    </div>
  );
}
