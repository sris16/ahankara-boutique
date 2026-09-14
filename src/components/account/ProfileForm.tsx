"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { accountApi, UpdateProfileInput } from "@/lib/api/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";

export function ProfileForm() {
  const { user, refresh } = useAuth();
  
  const [formData, setFormData] = useState<UpdateProfileInput>({
    name: user?.name || "",
    phone: user?.phone || "",
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
      
      await refresh();
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const apiError = err as Error;
      setError(apiError.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-card border rounded-sm p-6 max-w-2xl">
      <h2 className="text-xl font-medium mb-6">Personal Information</h2>
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-sm mb-6 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-700 dark:text-green-400 p-4 rounded-sm mb-6 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Profile updated successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-muted-foreground">
              Email Address (Read-only)
            </label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted text-muted-foreground"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              Full Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
              Phone Number
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Changes...
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
