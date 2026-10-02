"use client";

import { useState } from "react";
import { AdminCollection } from "@/types/admin";
import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";
import { ImageUpload } from "@/components/admin/ui/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface CollectionFormProps {
  collection: AdminCollection | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CollectionForm({ collection, onClose, onSuccess }: CollectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(collection?.name || "");
  const [slug, setSlug] = useState(collection?.slug || "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(!!collection);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!isSlugManuallyEdited) {
      setSlug(generateSlug(newName));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setIsSlugManuallyEdited(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const startsAt = formData.get("startsAt") as string;
    const endsAt = formData.get("endsAt") as string;

    // Ensure endsAt is strictly greater than startsAt if both provided
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setError("End date must be strictly after start date.");
      setIsSubmitting(false);
      return;
    }

    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      imageUrl: formData.get("imageUrl") as string || null,
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
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const formatDateForInput = (isoString?: string | null) => {
    if (!isoString) return "";
    return new Date(isoString).toISOString().slice(0, 16); // format: YYYY-MM-DDThh:mm
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 gap-0 overflow-hidden max-w-2xl flex flex-col">
        <DialogHeader className="p-4 border-b m-0 pb-4 pr-12">
          <DialogTitle>
            {collection ? "Edit Collection" : "New Collection"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Form to {collection ? "edit an existing" : "create a new"} collection.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[75vh] flex flex-col space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" value={name} onChange={handleNameChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input id="slug" name="slug" value={slug} onChange={handleSlugChange} required pattern="^[a-z0-9-]+$" title="Only lowercase letters, numbers, and hyphens" />
                <p className="text-xs text-muted-foreground">Automatically generated from name. Can be edited.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={collection?.description || ""}
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Collection Media */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Collection Media</h3>
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <ImageUpload name="imageUrl" purpose="collection" defaultValue={collection?.imageUrl} />
            </div>
          </div>

          {/* Visibility & Sorting */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Visibility & Sorting</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-sm border">

              <div className="space-y-2 lg:col-span-1">
                <Label htmlFor="sortOrder" className="font-medium text-base">Sort Order</Label>
                <Input id="sortOrder" name="sortOrder" type="number" defaultValue={collection?.sortOrder ?? 0} className="w-full" />
                <p className="text-xs text-muted-foreground mt-1">Manual integer priority.</p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="pt-0.5">
                  <Checkbox
                    id="isActive"
                    name="isActive"
                    defaultChecked={collection ? collection.isActive : true}
                  />
                </div>
                <div>
                  <Label htmlFor="isActive" className="font-medium text-base cursor-pointer">Active</Label>
                  <p className="text-xs text-muted-foreground mt-1">Collection is available according to its configured visibility rules.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="pt-0.5">
                  <Checkbox
                    id="isFeatured"
                    name="isFeatured"
                    defaultChecked={collection ? collection.isFeatured : false}
                  />
                </div>
                <div>
                  <Label htmlFor="isFeatured" className="font-medium text-base cursor-pointer">Featured</Label>
                  <p className="text-xs text-muted-foreground mt-1">Collection can appear in featured/spotlight storefront areas.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-sm">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Starts At (Optional)</Label>
                <Input type="datetime-local" id="startsAt" name="startsAt" defaultValue={formatDateForInput(collection?.startsAt)} />
                <p className="text-xs text-muted-foreground mt-1">Collection becomes eligible according to the existing scheduling logic.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">Ends At (Optional)</Label>
                <Input type="datetime-local" id="endsAt" name="endsAt" defaultValue={formatDateForInput(collection?.endsAt)} />
                <p className="text-xs text-muted-foreground mt-1">Collection stops being active according to the existing scheduling logic.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 flex justify-end gap-2 border-t mt-4 mb-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Collection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
