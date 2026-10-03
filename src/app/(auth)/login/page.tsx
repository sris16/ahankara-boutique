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

// Inline Google Icon for the button
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

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
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: `/onboarding?redirect=${encodeURIComponent(safeRedirect)}`,
      });
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to connect to Google. Please try again.");
      setGoogleLoading(false);
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

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
            <span className="bg-background px-4 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
          className="w-full rounded-xs h-11 font-medium bg-background hover:bg-surface transition-colors"
        >
          {googleLoading ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <GoogleIcon className="w-4 h-4 mr-3" />
          )}
          Continue with Google
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

