"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

export function ChangePasswordFormClient() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
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
    setSuccess(false);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: changeError } = await (authClient as any).changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true, // Optional security best practice
      });

      if (changeError) {
        setError(changeError.message || "Failed to change password. Please verify your current password.");
        setLoading(false);
        return;
      }

      setSuccess(true);
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
    <div className="space-y-6 pt-10 border-t border-border mt-10">
      <div>
        <h3 className="font-serif text-2xl tracking-tight mb-2">Security</h3>
        <p className="text-sm text-muted-foreground">Change your password to keep your account secure.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        {error && (
          <div className="p-4 text-sm text-destructive border border-destructive/20 bg-destructive/5 rounded-none" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 text-sm text-green-600 dark:text-green-400 border border-green-500/20 bg-green-500/5 rounded-none flex items-center" role="alert">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Password changed successfully.
          </div>
        )}

        <div className="space-y-3">
          <Label htmlFor="currentPassword" className="text-xs uppercase tracking-widest text-muted-foreground">Current Password</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="current-password"
              className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 pr-10 focus-visible:ring-0 focus-visible:border-foreground"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              disabled={loading}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              aria-label={showCurrentPassword ? "Hide password" : "Show password"}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="newPassword" className="text-xs uppercase tracking-widest text-muted-foreground">New Password</Label>
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
              className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 pr-10 focus-visible:ring-0 focus-visible:border-foreground"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              disabled={loading}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Minimum 8 characters</p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="confirmNewPassword" className="text-xs uppercase tracking-widest text-muted-foreground">Confirm New Password</Label>
          <Input
            id="confirmNewPassword"
            type={showNewPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground"
          />
        </div>

        <Button type="submit" className="w-full sm:w-auto rounded-none uppercase tracking-widest text-xs h-12 px-8" disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" className="mr-2" /> Saving...
            </>
          ) : (
            "Change Password"
          )}
        </Button>
      </form>
    </div>
  );
}
