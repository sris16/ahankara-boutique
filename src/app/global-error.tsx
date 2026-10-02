"use client";

import { useEffect } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { trackEvent } from "@/lib/analytics";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Safely track the error without logging sensitive payloads
    trackEvent({
      name: "global_error",
      category: "system",
      properties: {
        message: error.message,
        digest: error.digest || "unknown",
      }
    });
    console.error("Critical Global Error:", error);
  }, [error]);

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative w-16 h-16 mx-auto mb-6 rounded-full overflow-hidden border border-border/80">
            <div className="w-full h-full bg-foreground flex items-center justify-center">
              <span className="text-background font-serif text-xl tracking-widest">A</span>
            </div>
          </div>
          
          <h1 className="font-serif text-2xl tracking-wide uppercase">Critical Interruption</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A severe error occurred at the application boundary. The engineering team has been notified.
          </p>
          
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-foreground text-background text-xs uppercase tracking-widest hover:bg-foreground/90 transition-colors"
          >
            Restart Application
          </button>
        </div>
      </body>
    </html>
  );
}
