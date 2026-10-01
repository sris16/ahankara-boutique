"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const { toast } = useToast();

  const callbackUrl = searchParams.get("callbackUrl") || searchParams.get("redirect") || "/";
  // Safe redirect check: must start with single '/' and not '//'
  const safeRedirect = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";

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
          setError(signInError.message || "Invalid credentials. Please verify your email and password.");
        }
        setLoading(false);
        return;
      }

      await refresh();
      toast({
        title: "Welcome back",
        description: "You have signed in successfully.",
      });
      router.push(safeRedirect);
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground mb-2">Sign In</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
          Access your personal wardrobe & orders
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div
            className="p-3.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xs flex items-start gap-2.5 animate-in fade-in duration-200"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="client@atelier.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            autoComplete="email"
            className="h-11 rounded-xs"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="current-password"
              className="h-11 rounded-xs pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer rounded-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full rounded-xs uppercase tracking-[0.2em] text-xs h-11 mt-2 font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner size="sm" className="mr-2" /> Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Alternative Login / Register Link */}
      <div className="mt-8 pt-6 border-t border-border/60 text-center text-xs">
        <p className="text-muted-foreground tracking-wide">
          New to AHANKARA STUDIOS?{" "}
          <Link
            href={callbackUrl !== "/" ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/signup"}
            className="text-foreground font-medium hover:text-accent transition-colors underline underline-offset-4 ml-1"
          >
            Create an Account
          </Link>
        </p>
        <div className="mt-4">
          <Link
            href="/verify"
            className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80 hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Sign in with email passcode →
          </Link>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner size="default" className="mb-3" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Loading...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

