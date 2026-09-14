"use client";

import { useState } from "react";
import { AdminCollection } from "@/types/admin";
import { CollectionForm } from "./CollectionForm";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Tags, Calendar, Star, AlertTriangle } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { useRouter } from "next/navigation";

export function CollectionManager({ initialCollections }: { initialCollections: AdminCollection[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<AdminCollection | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = () => {
    setEditingCollection(null);
    setIsFormOpen(true);
  };

  const handleEdit = (collection: AdminCollection) => {
    setEditingCollection(collection);
    setIsFormOpen(true);
  };

  const handleDelete = async (collection: AdminCollection) => {
    if (!window.confirm(`Are you sure you want to delete collection "${collection.name}"?`)) return;
    setDeleteError(null);
    try {
      await adminApi.deleteCollection(collection.id);
      router.refresh();
    } catch (error) {
      const err = error as Error;
      setDeleteError(err.message || "Failed to delete collection");
    }
  };

  const getScheduleStatus = (col: AdminCollection) => {
    if (!col.isActive) return <span className="text-destructive font-medium">Inactive</span>;
    if (!col.startsAt && !col.endsAt) return <span className="text-green-600">Always Active</span>;
    
    const now = new Date();
    const start = col.startsAt ? new Date(col.startsAt) : null;
    const end = col.endsAt ? new Date(col.endsAt) : null;

    if (start && now < start) return <span className="text-amber-500">Scheduled</span>;
    if (end && now > end) return <span className="text-muted-foreground">Expired</span>;
    
    return <span className="text-green-600">Currently Active</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-serif">All Collections</h3>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Collection
        </Button>
      </div>

      {deleteError && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm">Cannot Delete Collection</h4>
            <p className="text-sm opacity-90">{deleteError}</p>
          </div>
        </div>
      )}

      {initialCollections.length === 0 ? (
        <div className="p-8 text-center bg-card border rounded-sm text-muted-foreground">
          <Tags className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No collections found. Create one to start merchandising.</p>
        </div>
      ) : (
        <div className="bg-card border rounded-sm overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Schedule</th>
                <th className="px-4 py-3 font-medium">Sort Order</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialCollections.map((col) => (
                <tr key={col.id} className="hover:bg-muted/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{col.name}</span>
                      {col.isFeatured && <span title="Featured"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /></span>}
                    </div>
                    <div className="text-xs text-muted-foreground">/{col.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    {getScheduleStatus(col)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{col.startsAt ? new Date(col.startsAt).toLocaleDateString() : 'Now'} - {col.endsAt ? new Date(col.endsAt).toLocaleDateString() : 'Forever'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{col.sortOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(col)} aria-label={`Edit ${col.name}`}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(col)} className="text-destructive hover:bg-destructive/10" aria-label={`Delete ${col.name}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isFormOpen && (
        <CollectionForm 
          collection={editingCollection}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
