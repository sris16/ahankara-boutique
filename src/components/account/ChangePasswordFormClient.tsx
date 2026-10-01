"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { Eye, EyeOff, ShieldCheck, AlertCircle, Check } from "lucide-react";

export function ChangePasswordFormClient() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all security fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: changeError } = await (authClient as any).changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true,
      });

      if (changeError) {
        const msg = changeError.message || "Failed to change password. Please verify your current password.";
        setError(msg);
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: msg,
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Password Updated",
        description: "Your security credentials have been updated successfully.",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background border border-border/80 rounded-xs p-6 sm:p-8 shadow-xs max-w-2xl">
      <div className="mb-6 pb-4 border-b border-border/60 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg tracking-tight text-foreground">Security Credentials</h3>
          <p className="text-xs text-muted-foreground font-mono">Update your account password</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/5 border border-border/80 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-accent" />
        </div>
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Current Password */}
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
            Current Password
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 rounded-xs pr-12"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              disabled={loading}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer rounded-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
            New Password
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••"
              className="h-11 rounded-xs pr-12"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              disabled={loading}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer rounded-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={showNewPassword ? "Hide new password" : "Show new password"}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1">
            <Check className={`w-3 h-3 ${newPassword.length >= 8 ? "text-accent" : "text-muted-foreground/40"}`} />
            <span className={newPassword.length >= 8 ? "text-foreground font-medium" : "text-muted-foreground/70"}>
              Minimum 8 characters
            </span>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmNewPassword" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
            Confirm New Password
          </Label>
          <Input
            id="confirmNewPassword"
            type={showNewPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            className="h-11 rounded-xs"
          />
        </div>

        <div className="pt-4 border-t border-border/60 flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="rounded-xs h-11 px-8 uppercase tracking-[0.2em] text-xs font-medium"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" /> Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

