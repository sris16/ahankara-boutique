import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CartService } from "@/server/services/cart.service";
import { CartClient } from "./cart-client";

export const metadata = {
  title: "Your Cart | AHANKARA STUDIOS",
  description: "View your cart.",
  robots: "noindex, nofollow"
};

export default async function CartPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  let initialCart = null;
  if (session?.user) {
    initialCart = await CartService.getOrCreateCart(session.user.id);
  }

  return <CartClient initialCart={initialCart} />;
}
