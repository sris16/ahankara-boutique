import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { WishlistService } from "@/server/services/wishlist.service";
import { WishlistClient } from "./wishlist-client";

export const metadata = {
  title: "Wishlist | AHANKARA STUDIOS",
  description: "View your saved pieces.",
  robots: "noindex, nofollow"
};

export default async function WishlistPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    redirect("/login");
  }

  const initialWishlist = (await WishlistService.getWishlist(session.user.id)).map(item => ({
    ...item,
    createdAt: item.createdAt.toISOString()
  }));

  return <WishlistClient initialWishlist={initialWishlist} />;
}
