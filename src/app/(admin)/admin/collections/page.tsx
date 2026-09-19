import { headers } from "next/headers";
import { CollectionService } from "@/server/services/collection.service";
import { AuthService } from "@/server/services/auth.service";
import { UserRole } from "@prisma/client";
import { CollectionManager } from "@/components/admin/collections/CollectionManager";

export const metadata = {
  title: "Collections | Admin | AHANKARA STUDIOS",
  description: "Manage product collections and schedules",
};

export default async function CollectionsPage() {
  const reqHeaders = await headers();
  await AuthService.requireRole(reqHeaders, UserRole.ADMIN);

  let collectionsData: any[] = [];
  try {
    const rawCollections = await CollectionService.getCollections(false);
    collectionsData = JSON.parse(JSON.stringify(rawCollections));
  } catch (err) {
    console.error("Failed to load collections:", err);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Collections</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage merchandising collections and campaigns</p>
      </div>

      <CollectionManager initialCollections={collectionsData} />
    </div>
  );
}
