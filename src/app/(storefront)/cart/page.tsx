import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CartService } from "@/server/services/cart.service";
import { CartClient } from "./cart-client";

export const metadata = {
  title: "Shopping Bag | AHANKARA STUDIOS",
  description: "Review and complete your selection of handcrafted atelier pieces.",
  robots: "noindex, nofollow",
};

export default async function CartPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let initialCart = null;
  if (session?.user) {
    initialCart = await CartService.getOrCreateCart(session.user.id);
  }

  return <CartClient initialCart={initialCart} />;
}
