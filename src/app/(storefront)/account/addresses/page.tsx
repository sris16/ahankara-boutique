import { AddressManagerClient } from "@/components/account/AddressManagerClient";
import { AuthService } from "@/server/services/auth.service";
import { AddressService } from "@/server/services/address.service";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Address } from "@/types/address";

export const metadata = {
  title: "My Addresses | AHANKARA STUDIOS",
  description: "Manage your shipping and billing addresses.",
  robots: { index: false, follow: false }
};

export default async function AddressesPage() {
  const reqHeaders = await headers();
  let user;
  try {
    user = await AuthService.requireAuth(reqHeaders);
  } catch {
    redirect("/login");
  }

  // Fetch addresses securely on the server
  const addresses = await AddressService.getUserAddresses(user.id);

  // Serialize addresses to plain objects to avoid Date object issues with Server Components
  const serializedAddresses: Address[] = addresses.map(addr => ({
    ...addr,
    createdAt: addr.createdAt.toISOString(),
    updatedAt: addr.updatedAt.toISOString(),
  }));

  return (
    <AddressManagerClient initialAddresses={serializedAddresses} />
  );
}
