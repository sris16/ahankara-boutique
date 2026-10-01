import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import { WishlistProvider } from "@/hooks/use-wishlist";
import { AddressProvider } from "@/hooks/use-address";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: {
    default: "AHANKARA STUDIOS",
    template: "%s | AHANKARA STUDIOS",
  },
  description: "AHANKARA STUDIOS — Contemporary Luxury & Fashion Studio",
  icons: {
    icon: "/images/brand/ahankara-studios-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        inter.variable,
        playfair.variable,
        "h-full antialiased"
      )}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AddressProvider>
                <ToastProvider>
                  <div className="flex min-h-screen flex-col selection:bg-primary selection:text-primary-foreground">
                    <main className="flex-1 min-h-screen">
                      {children}
                    </main>
                  </div>
                </ToastProvider>
              </AddressProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
