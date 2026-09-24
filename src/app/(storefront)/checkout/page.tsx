import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CartService } from "@/server/services/cart.service";
import { PricingService } from "@/server/services/pricing.service";
import { AddressService } from "@/server/services/address.service";
import CheckoutClient from "./checkout-client";

export const metadata = {
  title: "Checkout | AHANKARA STUDIOS",
  description: "Secure checkout.",
  robots: "noindex, nofollow"
};

export default async function CheckoutPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const cart = await CartService.getOrCreateCart(userId);

  let pricingInfo = null;
  if (cart.itemCount > 0) {
    try {
      pricingInfo = await PricingService.calculateCheckoutPricing(userId);
    } catch (e) {
      console.error("Failed to calculate initial checkout pricing", e);
    }
  }

  // AddressService returns dates which might need stringifying if they are Date objects,
  // but Prisma returns Date objects that Next.js Server Components serialize automatically to client components.
  // Wait, Next.js App Router (unlike pages) supports Date objects in props.
  // However, sometimes it's safer to just let Next.js handle it or map it.
  const rawAddresses = await AddressService.getUserAddresses(userId);
  const addresses = rawAddresses.map(addr => ({
    ...addr,
    createdAt: addr.createdAt.toISOString(),
    updatedAt: addr.updatedAt.toISOString(),
  }));

  return (
    <CheckoutClient
      initialCart={cart}
      initialPricing={pricingInfo as any}
      initialAddresses={addresses}
    />
  );
}
