"use client";

import * as React from "react";

const INTRO_SESSION_KEY = "ahankara-intro-seen";
const MAX_FALLBACK_TIMEOUT_MS = 8000;
const FADE_OUT_DURATION_MS = 700;

export function BrandIntro() {
  const [stage, setStage] = React.useState<"idle" | "playing" | "fading" | "done">("idle");
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const fallbackTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const dismissIntro = React.useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, "true");
    } catch {
      // Ignore sessionStorage errors in restricted environments
    }

    setStage("fading");

    setTimeout(() => {
      setStage("done");
      // Restore scrolling immediately
      document.body.style.overflow = "";
    }, FADE_OUT_DURATION_MS);
  }, []);

  React.useEffect(() => {
    // 1. Check if user already saw intro in current session
    try {
      const alreadySeen = sessionStorage.getItem(INTRO_SESSION_KEY);
      if (alreadySeen === "true") {
        return;
      }
    } catch {
      // If sessionStorage is unavailable, bypass
      return;
    }

    // 2. Respect prefers-reduced-motion
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      try {
        sessionStorage.setItem(INTRO_SESSION_KEY, "true");
      } catch {
        // no-op
      }
      return;
    }

    // 3. Activate intro on client
    const frameId = requestAnimationFrame(() => {
      setStage("playing");
    });

    // 4. Lock background page scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 5. Safety fallback timer if video fails to complete within expected window
    fallbackTimerRef.current = setTimeout(() => {
      dismissIntro();
    }, MAX_FALLBACK_TIMEOUT_MS);

    // 6. Listen for ESC key for keyboard dismissal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismissIntro();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
      document.body.style.overflow = originalOverflow;
    };
  }, [dismissIntro]);

  // Attempt autoplay when entering playing stage
  React.useEffect(() => {
    if (stage === "playing" && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Brand intro video autoplay interrupted or restricted:", err);
          // If browser restricts video playback, gracefully dismiss overlay
          dismissIntro();
        });
      }
    }
  }, [stage, dismissIntro]);

  if (stage === "idle" || stage === "done") {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="AHANKARA STUDIOS Brand Introduction"
      aria-modal="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-700 ease-out select-none ${
        stage === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Brand Reveal Video */}
        <video
          ref={videoRef}
          src="/videos/brand/ahankara-intro.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          controls={false}
          onEnded={dismissIntro}
          onError={dismissIntro}
          className="w-full h-full object-contain pointer-events-none"
          tabIndex={-1}
          aria-hidden="true"
        />

        {/* Subtle, accessible skip button */}
        <button
          type="button"
          onClick={dismissIntro}
          className="absolute top-6 right-6 md:top-8 md:right-8 z-10 px-3 py-1.5 rounded-xs border border-white/20 text-[10px] md:text-xs font-mono tracking-[0.2em] uppercase text-white/70 hover:text-white hover:border-white/50 bg-black/40 backdrop-blur-xs transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-white"
          aria-label="Skip brand intro"
        >
          Skip Intro
        </button>
      </div>
    </div>
  );
}
