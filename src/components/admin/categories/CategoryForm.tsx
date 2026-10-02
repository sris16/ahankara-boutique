"use client";

import { useState } from "react";
import { AdminCategory } from "@/types/admin";
import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";
import { ImageUpload } from "@/components/admin/ui/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface CategoryFormProps {
  category: AdminCategory | null;
  flatCategories: AdminCategory[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CategoryForm({ category, flatCategories, onClose, onSuccess }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(!!category);

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
    const data = {
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      imageUrl: formData.get("imageUrl") as string || null,
      description: formData.get("description") as string || null,
      parentId: formData.get("parentId") as string || null,
      sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
      isActive: formData.get("isActive") === "on",
    };

    try {
      if (category) {
        await adminApi.updateCategory(category.id, data);
      } else {
        await adminApi.createCategory(data);
      }
      onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  // Filter out the category itself and its descendants from parent options (done loosely here, backend will strictly validate)
  const validParents = flatCategories.filter(c => c.id !== category?.id);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 gap-0 overflow-hidden max-w-lg flex flex-col">
        <DialogHeader className="p-4 border-b m-0 pb-4 pr-12">
          <DialogTitle>
            {category ? "Edit Category" : "New Category"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Form to {category ? "edit an existing" : "create a new"} category.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[75vh] flex flex-col space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" value={name} onChange={handleNameChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input id="slug" name="slug" value={slug} onChange={handleSlugChange} required pattern="^[a-z0-9-]+$" title="Only lowercase letters, numbers, and hyphens" />
            <p className="text-xs text-muted-foreground">Automatically generated from the category name. You can edit it.</p>
          </div>

          <div className="space-y-2">
            <Label>Category Image</Label>
            <ImageUpload name="imageUrl" purpose="category" defaultValue={category?.imageUrl} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={category?.description || ""}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Category</Label>
            <Select
              id="parentId"
              name="parentId"
              defaultValue={category?.parentId || ""}
            >
              <option value="">None (Top Level)</option>
              {validParents.map(parent => (
                <option key={parent.id} value={parent.id}>{parent.name}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input id="sortOrder" name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} />
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="isActive"
                name="isActive"
                defaultChecked={category ? category.isActive : true}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <DialogFooter className="pt-4 flex justify-end gap-2 border-t mt-4 mb-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
