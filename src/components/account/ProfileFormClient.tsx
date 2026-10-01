"use client";

import { useState } from "react";
import { accountApi, UpdateProfileInput } from "@/lib/api/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { Lock, AlertCircle } from "lucide-react";
import type { User } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

export function ProfileFormClient({ initialUser }: { initialUser: User }) {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState<UpdateProfileInput>({
    name: initialUser?.name || "",
    phone: initialUser?.phone || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await accountApi.updateProfile({
        name: formData.name?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
      });

      toast({
        title: "Profile Updated",
        description: "Your personal details have been saved.",
      });

      router.refresh();
    } catch (err: unknown) {
      const apiError = err as Error;
      const msg = apiError.message || "Failed to update profile. Please try again.";
      setError(msg);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background border border-border/80 rounded-xs p-6 sm:p-8 shadow-xs max-w-2xl">
      <div className="mb-6 pb-4 border-b border-border/60">
        <h3 className="font-serif text-lg tracking-tight text-foreground">Personal Information</h3>
        <p className="text-xs text-muted-foreground font-mono">Your primary couture client identity</p>
      </div>

      {error && (
        <div
          className="p-3.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xs flex items-start gap-2.5 mb-6 animate-in fade-in duration-200"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Email (Read-Only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                Email Address
              </Label>
              <span className="text-[10px] font-mono text-muted-foreground/70 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Primary Identifier
              </span>
            </div>
            <Input
              id="email"
              type="email"
              value={initialUser.email}
              disabled
              className="bg-surface-muted/60 text-muted-foreground border-border/60 h-11 rounded-xs cursor-not-allowed font-mono text-xs"
            />
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="Victoria Sterling"
              className="h-11 rounded-xs"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone || ""}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="h-11 rounded-xs"
            />
            <p className="text-[10px] text-muted-foreground/70 font-mono">
              Used for delivery coordination and bespoke alterations
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border/60 flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xs h-11 px-8 uppercase tracking-[0.2em] text-xs font-medium"
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" /> Saving Changes...
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

