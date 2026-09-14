import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata = {
  title: "My Profile | AHANKARA STUDIOS",
  description: "Manage your personal information.",
};

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="font-serif text-2xl hidden md:block">My Profile</h2>
        <p className="text-muted-foreground mt-1">Manage your personal information and contact details.</p>
      </div>

      <ProfileForm />
    </div>
  );
}
