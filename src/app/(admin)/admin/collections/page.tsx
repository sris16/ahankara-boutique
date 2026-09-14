import { headers } from "next/headers";
import { adminApi } from "@/lib/api/admin";
import { CollectionManager } from "@/components/admin/collections/CollectionManager";

export const metadata = {
  title: "Collections | Admin | AHANKARA STUDIOS",
  description: "Manage product collections and schedules",
};

export default async function CollectionsPage() {
  const reqHeaders = await headers();
  
  const collections = await adminApi.getCollections(reqHeaders).catch(() => []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Collections</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage merchandising collections and campaigns</p>
      </div>

      <CollectionManager initialCollections={collections} />
    </div>
  );
}
