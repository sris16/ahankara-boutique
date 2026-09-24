"use client";

import { useState } from "react";
import { accountApi, UpdateProfileInput } from "@/lib/api/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { User } from "@/hooks/use-auth"; // Just using the type
import { useRouter } from "next/navigation";

export function ProfileFormClient({ initialUser }: { initialUser: User }) {
  const router = useRouter();
  const [formData, setFormData] = useState<UpdateProfileInput>({
    name: initialUser?.name || "",
    phone: initialUser?.phone || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await accountApi.updateProfile({
        name: formData.name?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
      });

      setSuccess(true);
      router.refresh(); // re-fetch Server Component data

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(apiError.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background border border-border/50 rounded-none p-6 md:p-8 max-w-2xl">
      <h2 className="font-serif text-xl tracking-tight mb-8">Personal Information</h2>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-none mb-6 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-none mb-6 text-sm flex items-center gap-2" aria-live="polite">
          <CheckCircle2 className="w-4 h-4" />
          Profile updated successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={initialUser.email}
              disabled
              className="bg-muted/50 text-muted-foreground border-border/50 rounded-none h-12"
            />
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wide">Email address cannot be changed</p>
          </div>

          <div>
            <label htmlFor="name" className="block text-xs font-medium uppercase tracking-widest mb-2">
              Full Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
              className="rounded-none h-12"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-medium uppercase tracking-widest mb-2">
              Phone Number
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              className="rounded-none h-12"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border/40 flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="rounded-none h-12 px-8 uppercase tracking-widest text-xs font-medium">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
