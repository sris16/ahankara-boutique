"use client";

import { useState, useMemo } from "react";
import { AdminCollection } from "@/types/admin";
import { CollectionForm } from "./CollectionForm";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Plus,
  Edit2,
  Trash2,
  Tags,
  Search,
  Star,
  AlertTriangle,
  ImageIcon,
  CalendarDays,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function CollectionManager({ initialCollections }: { initialCollections: AdminCollection[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<AdminCollection | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Deletion state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<AdminCollection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "not_featured">("all");

  const router = useRouter();

  const handleCreate = () => {
    setEditingCollection(null);
    setIsFormOpen(true);
  };

  const handleEdit = (collection: AdminCollection) => {
    setEditingCollection(collection);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (collection: AdminCollection) => {
    setCollectionToDelete(collection);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!collectionToDelete) return;
    setOperationError(null);
    setIsDeleting(true);
    try {
      await adminApi.deleteCollection(collectionToDelete.id);
      setIsDeleteDialogOpen(false);
      setCollectionToDelete(null);
      router.refresh();
    } catch (error) {
      const err = error as Error;
      setOperationError(err.message || "Failed to complete operation");
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const executeReorder = async (newList: AdminCollection[]) => {
    setOperationError(null);
    setIsReordering(true);

    // Normalize new sort orders based on strict array index
    const updates = newList.map((col, index) => ({
      id: col.id,
      sortOrder: index,
    }));

    try {
      await adminApi.reorderCollections(updates);
      router.refresh();
    } catch (error) {
      const err = error as Error;
      setOperationError(err.message || "Operation Failed");
    } finally {
      setIsReordering(false);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newList = [...initialCollections];
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    executeReorder(newList);
  };

  const handleMoveDown = (index: number) => {
    if (index >= initialCollections.length - 1) return;
    const newList = [...initialCollections];
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    executeReorder(newList);
  };

  // Filter Collections
  const filteredCollections = useMemo(() => {
    return initialCollections.filter((col) => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!col.name.toLowerCase().includes(query) && !col.slug.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Status
      if (statusFilter === "active" && !col.isActive) return false;
      if (statusFilter === "inactive" && col.isActive) return false;

      // Featured
      if (featuredFilter === "featured" && !col.isFeatured) return false;
      if (featuredFilter === "not_featured" && col.isFeatured) return false;

      return true;
    });
  }, [initialCollections, searchQuery, statusFilter, featuredFilter]);

  // Derived Date Helper
  const getScheduleStatus = (col: AdminCollection) => {
    if (!col.isActive) return { label: "Inactive", variant: "destructive" as const };

    const now = new Date();
    const start = col.startsAt ? new Date(col.startsAt) : null;
    const end = col.endsAt ? new Date(col.endsAt) : null;

    if (start && now < start) return { label: "Scheduled", variant: "secondary" as const };
    if (end && now > end) return { label: "Expired", variant: "outline" as const };

    return { label: "Active", variant: "default" as const };
  };

  const canReorder =
    searchQuery.trim() === "" &&
    statusFilter === "all" &&
    featuredFilter === "all";

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-serif">Collections</h3>
          <p className="text-sm text-muted-foreground">
            {initialCollections.length === 0
              ? "No collections"
              : filteredCollections.length === initialCollections.length
                ? `${initialCollections.length} collections`
                : `Showing ${filteredCollections.length} of ${initialCollections.length} collections`
            }
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto" disabled={isReordering}>
          <Plus className="w-4 h-4 mr-2" />
          Add Collection
        </Button>
      </div>

      {operationError && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm">Operation Failed</h4>
            <p className="text-sm opacity-90">{operationError}</p>
          </div>
        </div>
      )}

      {initialCollections.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 bg-card p-4 border rounded-sm">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search collections"
              disabled={isReordering}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 md:flex-nowrap">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              aria-label="Filter by Status"
              disabled={isReordering}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>

            <Select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value as "all" | "featured" | "not_featured")}
              aria-label="Filter by Featured"
              disabled={isReordering}
            >
              <option value="all">All Visibility</option>
              <option value="featured">Featured Only</option>
              <option value="not_featured">Not Featured</option>
            </Select>
          </div>
        </div>
      )}

      {/* Main List Area */}
      {initialCollections.length === 0 ? (
        // Empty State: Zero collections exist
        <div className="p-12 text-center bg-card border rounded-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Tags className="w-6 h-6 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-medium mb-2">No collections yet</h4>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Create your first collection to organize products into curated groups for the storefront.
          </p>
          <Button onClick={handleCreate} variant="outline" disabled={isReordering}>
            <Plus className="w-4 h-4 mr-2" />
            Create Collection
          </Button>
        </div>
      ) : filteredCollections.length === 0 ? (
        // Empty State: Zero search/filter matches
        <div className="p-12 text-center bg-card border rounded-sm text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-foreground mb-1">No collections found</p>
          <p className="text-sm">Try changing your search or filters.</p>
        </div>
      ) : (
        // Results List
        <div className="space-y-3">
          {filteredCollections.map((col) => {
            const status = getScheduleStatus(col);
            const globalIndex = initialCollections.findIndex((c) => c.id === col.id);
            const isFirst = globalIndex === 0;
            const isLast = globalIndex === initialCollections.length - 1;
            const upDisabled = isFirst || !canReorder || isReordering;
            const downDisabled = isLast || !canReorder || isReordering;
            const reorderTitle = !canReorder ? "Reordering is disabled while searching or filtering." : undefined;

            return (
              <div
                key={col.id}
                className="bg-card border rounded-sm p-4 hover:border-border/80 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 shrink-0 rounded-sm bg-muted overflow-hidden flex items-center justify-center border">
                  {col.imageUrl ? (
                    <Image
                      src={col.imageUrl}
                      alt={`Thumbnail for ${col.name}`}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                  )}
                </div>

                {/* Primary Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-base truncate">{col.name}</h4>
                    <Badge variant={status.variant} className="text-[10px] uppercase tracking-wider px-1.5 py-0">
                      {status.label}
                    </Badge>
                    {col.isFeatured && (
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider px-1.5 py-0 gap-1 bg-amber-100/50 text-amber-800 hover:bg-amber-100/50 border-amber-200">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded-sm">/{col.slug}</span>
                    <span className="text-xs text-muted-foreground/70" title="Sort Order">
                      Order: {col.sortOrder}
                    </span>
                  </div>

                  {/* Dates if scheduled */}
                  {(col.startsAt || col.endsAt) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>
                        {col.startsAt ? new Date(col.startsAt).toLocaleDateString() : 'Now'}
                        {" → "}
                        {col.endsAt ? new Date(col.endsAt).toLocaleDateString() : 'Forever'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-border/50">
                  <div className="flex flex-row items-center border rounded-sm mr-2 overflow-hidden bg-background" title={reorderTitle}>
                    <button
                      type="button"
                      onClick={() => handleMoveUp(globalIndex)}
                      disabled={upDisabled}
                      aria-label={`Move ${col.name} up`}
                      className="px-2 py-1.5 hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <div className="w-px h-full bg-border" />
                    <button
                      type="button"
                      onClick={() => handleMoveDown(globalIndex)}
                      disabled={downDisabled}
                      aria-label={`Move ${col.name} down`}
                      className="px-2 py-1.5 hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(col)}
                    aria-label={`Edit ${col.name}`}
                    disabled={isReordering}
                  >
                    <Edit2 className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(col)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${col.name}`}
                    disabled={isReordering}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
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

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Collection"
        description={`Are you sure you want to delete collection "${collectionToDelete?.name}"?`}
        confirmText="Yes, Delete"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
