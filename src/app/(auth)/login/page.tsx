"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        if (signInError.status === 429) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else {
          setError(signInError.message || "Invalid credentials. Please try again.");
        }
        setLoading(false);
        return;
      }

      await refresh();
      router.push("/");
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-10">
        <h1 className="font-serif text-3xl tracking-tight mb-3">Sign In</h1>
        <p className="text-sm text-muted-foreground uppercase tracking-widest">
          Access your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 text-sm text-destructive border border-destructive/20 bg-destructive/5 rounded-none" role="alert">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            autoComplete="email"
            className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0 focus-visible:border-foreground"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">Password</Label>
            <Link href="/forgot-password" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="current-password"
              className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 pr-10 focus-visible:ring-0 focus-visible:border-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full rounded-none uppercase tracking-widest text-xs h-12 mt-4" disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" className="mr-2" /> Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="mt-8 text-center text-xs uppercase tracking-widest">
        <p className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground hover:text-muted-foreground transition-colors ml-2 underline underline-offset-4">
            Create one
          </Link>
        </p>
      </div>
    </>
  );
}
