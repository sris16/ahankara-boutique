"use client";

import * as React from "react";
import { Volume2, VolumeX } from "lucide-react";

const INTRO_SESSION_KEY = "ahankara-intro-seen";
const MAX_FALLBACK_TIMEOUT_MS = 12000; // Increased fallback slightly to allow for loading over slower mobile
const FADE_OUT_DURATION_MS = 700;

export function BrandIntro() {
  const [stage, setStage] = React.useState<"idle" | "playing" | "fading" | "done">("idle");
  const [isMuted, setIsMuted] = React.useState(true);
  const [isVideoReady, setIsVideoReady] = React.useState(false);
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
          // If browser restricts video playback completely (even muted), gently dismiss
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
      className={`fixed inset-0 z-[100] bg-black transition-opacity duration-700 ease-out select-none ${
        stage === "fading" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative w-full h-[100dvh] overflow-hidden">
        
        {/* Loading / Fallback State (shows until video is ready) */}
        {!isVideoReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <span className="text-white/50 font-mono text-sm tracking-[0.3em] uppercase animate-pulse">
              Ahankara Studios
            </span>
          </div>
        )}

        {/* Brand Reveal Video */}
        <video
          ref={videoRef}
          src="/videos/brand/ahankara-intro.mp4"
          autoPlay
          muted={isMuted}
          playsInline
          preload="auto"
          controls={false}
          onEnded={dismissIntro}
          onError={dismissIntro}
          onCanPlay={() => setIsVideoReady(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isVideoReady ? "opacity-100" : "opacity-0"
          }`}
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

        {/* Audio Control */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className={`absolute bottom-8 right-6 md:bottom-12 md:right-12 z-10 p-3 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/50 bg-black/40 backdrop-blur-xs transition-all duration-500 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white flex items-center justify-center ${
            isVideoReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
          ) : (
            <Volume2 className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
          )}
        </button>
      </div>
    </div>
  );
}
