"use client";

import { useState } from "react";
import { AdminCollection } from "@/types/admin";
import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, AlertCircle } from "lucide-react";

interface CollectionFormProps {
  collection: AdminCollection | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CollectionForm({ collection, onClose, onSuccess }: CollectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    let startsAt = formData.get("startsAt") as string;
    let endsAt = formData.get("endsAt") as string;
    
    // Ensure endsAt is strictly greater than startsAt if both provided
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setError("End date must be strictly after start date.");
      setIsSubmitting(false);
      return;
    }

    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      description: formData.get("description") as string || null,
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
      isActive: formData.get("isActive") === "on",
      isFeatured: formData.get("isFeatured") === "on",
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    };

    try {
      if (collection) {
        await adminApi.updateCollection(collection.id, data);
      } else {
        await adminApi.createCollection(data);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const formatDateForInput = (isoString?: string | null) => {
    if (!isoString) return "";
    return new Date(isoString).toISOString().slice(0, 16); // format: YYYY-MM-DDThh:mm
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border shadow-xl rounded-sm w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-serif font-medium">
            {collection ? "Edit Collection" : "New Collection"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" defaultValue={collection?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" name="slug" defaultValue={collection?.slug} required pattern="^[a-z0-9-]+$" title="Only lowercase letters, numbers, and hyphens" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea 
              id="description" 
              name="description" 
              defaultValue={collection?.description || ""} 
              className="flex min-h-[80px] w-full rounded-sm border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-sm border">
            <div className="space-y-2">
              <Label htmlFor="startsAt">Start Date & Time (Optional)</Label>
              <Input type="datetime-local" id="startsAt" name="startsAt" defaultValue={formatDateForInput(collection?.startsAt)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endsAt">End Date & Time (Optional)</Label>
              <Input type="datetime-local" id="endsAt" name="endsAt" defaultValue={formatDateForInput(collection?.endsAt)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input id="sortOrder" name="sortOrder" type="number" defaultValue={collection?.sortOrder ?? 0} />
            </div>
            
            <div className="flex items-center space-x-2 pt-8">
              <input 
                type="checkbox" 
                id="isActive" 
                name="isActive" 
                defaultChecked={collection ? collection.isActive : true} 
                className="w-4 h-4 rounded-sm border-input"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <input 
                type="checkbox" 
                id="isFeatured" 
                name="isFeatured" 
                defaultChecked={collection ? collection.isFeatured : false} 
                className="w-4 h-4 rounded-sm border-input"
              />
              <Label htmlFor="isFeatured">Featured</Label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Collection"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
