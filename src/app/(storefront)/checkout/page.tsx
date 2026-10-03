import { AuthService } from "@/server/services/auth.service";
import { UnauthorizedError } from "@/utils/errors";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CartService } from "@/server/services/cart.service";
import { PricingService } from "@/server/services/pricing.service";
import { AddressService } from "@/server/services/address.service";
import CheckoutClient from "./checkout-client";
import { CouponValidationResponse } from "@/types/checkout";

export const metadata = {
  title: "Checkout | AHANKARA STUDIOS",
  description: "Secure checkout for handcrafted atelier creations.",
  robots: "noindex, nofollow",
};

export default async function CheckoutPage() {
  let user;
  try {
    user = await AuthService.requireAuth(await headers());
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw error;
  }

  const userId = user.id;

  const cart = await CartService.getOrCreateCart(userId);

  let pricingInfo: CouponValidationResponse | null = null;
  if (cart.itemCount > 0) {
    try {
      pricingInfo = (await PricingService.calculateCheckoutPricing(
        userId
      )) as unknown as CouponValidationResponse;
    } catch (e) {
      console.error("Failed to calculate initial checkout pricing", e);
    }
  }

  const rawAddresses = await AddressService.getUserAddresses(userId);
  const addresses = rawAddresses.map((addr) => ({
    ...addr,
    createdAt: addr.createdAt.toISOString(),
    updatedAt: addr.updatedAt.toISOString(),
  }));

  return (
    <CheckoutClient
      initialCart={cart}
      initialPricing={pricingInfo}
      initialAddresses={addresses}
    />
  );
}
