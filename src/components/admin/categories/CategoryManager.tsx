"use client";

import { useState, useMemo } from "react";
import { AdminCategory, AdminCategoryTree } from "@/types/admin";
import { CategoryForm } from "./CategoryForm";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit2,
  Trash2,
  FolderTree,
  AlertTriangle,
  Search,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { useRouter } from "next/navigation";
import Image from "next/image";

type FilterStatus = "all" | "active" | "inactive";

export function CategoryManager({
  initialTree,
  flatCategories
}: {
  initialTree: AdminCategoryTree[];
  flatCategories: AdminCategory[];
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const router = useRouter();

  // Deletion state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  // Expansion state
  // We initialize with top-level nodes expanded (depth 0).
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    return new Set(initialTree.map((node) => node.id));
  });

  const handleCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (category: AdminCategory) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await adminApi.deleteCategory(categoryToDelete.id);
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
      router.refresh();
    } catch (error: unknown) {
      const err = error as Error;
      setDeleteError(err.message || "Failed to delete category");
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMove = async (node: AdminCategoryTree, direction: "up" | "down", index: number, siblings: AdminCategoryTree[]) => {
    if (isReordering) return;
    setIsReordering(true);
    setDeleteError(null);

    const newSiblings = [...siblings];
    if (direction === "up") {
      [newSiblings[index - 1], newSiblings[index]] = [newSiblings[index], newSiblings[index - 1]];
    } else {
      [newSiblings[index + 1], newSiblings[index]] = [newSiblings[index], newSiblings[index + 1]];
    }

    const updates = newSiblings.map((sibling, idx) => ({
      id: sibling.id,
      sortOrder: idx,
    }));

    try {
      await adminApi.reorderCategories(updates);
      router.refresh();
    } catch (error: unknown) {
      const err = error as Error;
      setDeleteError(err.message || "Failed to reorder categories");
    } finally {
      setIsReordering(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // --- Search & Filter Algorithm ---
  const { filteredTree, totalCount, activeCount, requiredNodes } = useMemo(() => {
    const total = flatCategories.length;
    const active = flatCategories.filter((c) => c.isActive).length;

    const lowerQuery = searchQuery.toLowerCase().trim();

    // 1. Identify explicitly matching IDs based on query and filter
    const explicitMatches = new Set<string>();

    for (const cat of flatCategories) {
      const matchesSearch =
        !lowerQuery ||
        cat.name.toLowerCase().includes(lowerQuery) ||
        cat.slug.toLowerCase().includes(lowerQuery);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && cat.isActive) ||
        (statusFilter === "inactive" && !cat.isActive);

      if (matchesSearch && matchesStatus) {
        explicitMatches.add(cat.id);
      }
    }

    // 2. Trace ancestors for all explicit matches to keep them visible
    const reqNodes = new Set<string>();
    const parentMap = new Map<string, string | null>();
    flatCategories.forEach((c) => parentMap.set(c.id, c.parentId));

    explicitMatches.forEach((id) => {
      let currentId: string | null = id;
      while (currentId) {
        reqNodes.add(currentId);
        currentId = parentMap.get(currentId) || null;
      }
    });

    // 3. Rebuild the tree preserving only required nodes
    function buildFilteredTree(nodes: AdminCategoryTree[]): AdminCategoryTree[] {
      const result: AdminCategoryTree[] = [];
      for (const node of nodes) {
        if (reqNodes.has(node.id)) {
          result.push({
            ...node,
            children: node.children ? buildFilteredTree(node.children) : [],
          });
        }
      }
      return result;
    }

    const builtTree = buildFilteredTree(initialTree);

    return {
      filteredTree: builtTree,
      totalCount: total,
      activeCount: active,
      requiredNodes: reqNodes,
    };
  }, [flatCategories, initialTree, searchQuery, statusFilter]);

  const renderTree = (nodes: AdminCategoryTree[], depth = 0) => {
    if (!nodes || nodes.length === 0) return null;

    const isSearching = searchQuery.trim().length > 0;

    return (
      <ul className={`space-y-1 ${depth > 0 ? 'ml-3 sm:ml-6 pl-2 border-l-2 border-border/50' : ''}`}>
        {nodes.map((node, index) => {
          const hasChildren = node.children && node.children.length > 0;
          // Auto-expand if it's part of the required path during a search.
          const isExpanded = isSearching ? requiredNodes.has(node.id) || expandedNodes.has(node.id) : expandedNodes.has(node.id);
          const isFirst = index === 0;
          const isLast = index === nodes.length - 1;
          const canReorder = !isSearching && statusFilter === 'all';

          return (
            <li key={node.id} className="w-full mt-1">
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-card border rounded-sm hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  {/* Expand/Collapse Button */}
                  <div className="w-6 flex items-center justify-center shrink-0">
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(node.id)}
                        className="p-1 rounded-sm hover:bg-muted text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    ) : (
                      <span className="w-4 h-4 flex items-center justify-center opacity-20"><FolderTree className="w-3 h-3" /></span>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 bg-muted rounded-sm border overflow-hidden flex items-center justify-center relative">
                    {node.imageUrl ? (
                      <Image
                        src={node.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm truncate max-w-[180px] sm:max-w-none">{node.name}</span>
                      {node.isActive ? (
                        <Badge variant="secondary" size="sm">Active</Badge>
                      ) : (
                        <Badge variant="destructive" size="sm">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate" title={node.slug}>
                      /{node.slug}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 sm:mt-0 ml-10 sm:ml-0 self-start sm:self-auto shrink-0">
                  <div className="flex items-center bg-muted/50 rounded-sm mr-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMove(node, "up", index, nodes)}
                      disabled={isFirst || !canReorder || isReordering}
                      aria-label={`Move ${node.name} up`}
                      title={!canReorder ? "Reordering is disabled while searching or filtering" : `Move ${node.name} up`}
                      className="h-8 px-2 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMove(node, "down", index, nodes)}
                      disabled={isLast || !canReorder || isReordering}
                      aria-label={`Move ${node.name} down`}
                      title={!canReorder ? "Reordering is disabled while searching or filtering" : `Move ${node.name} down`}
                      className="h-8 px-2 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(node)}
                    aria-label={`Edit ${node.name}`}
                    className="h-8 px-2"
                  >
                    <Edit2 className="w-4 h-4 sm:mr-0 mr-1" />
                    <span className="sm:hidden text-xs">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(node)}
                    className="text-destructive hover:bg-destructive/10 h-8 px-2"
                    aria-label={`Delete ${node.name}`}
                  >
                    <Trash2 className="w-4 h-4 sm:mr-0 mr-1" />
                    <span className="sm:hidden text-xs">Delete</span>
                  </Button>
                </div>
              </div>

              {/* Children */}
              {hasChildren && isExpanded && (
                <div className="mt-1">
                  {renderTree(node.children, depth + 1)}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-serif">Category Hierarchy</h3>
          <p className="text-sm text-muted-foreground">
            {totalCount} categories &middot; {activeCount} active
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-3 border rounded-sm">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 w-full rounded-sm"
            aria-label="Search categories"
          />
        </div>
        <div className="flex rounded-sm bg-muted p-1 overflow-x-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
              statusFilter === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
              statusFilter === "active" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("inactive")}
            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
              statusFilter === "inactive" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Error Message */}
      {deleteError && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm">Operation Failed</h4>
            <p className="text-sm opacity-90">{deleteError}</p>
          </div>
        </div>
      )}

      {/* Tree Render */}
      <div className="rounded-sm">
        {flatCategories.length === 0 ? (
          <div className="p-12 text-center bg-card border rounded-sm text-muted-foreground">
            <FolderTree className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-foreground">No categories yet</p>
            <p className="text-sm mt-1">Create one to organize your catalog.</p>
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="p-12 text-center bg-card border rounded-sm text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-foreground">No categories found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          renderTree(filteredTree)
        )}
      </div>

      {isFormOpen && (
        <CategoryForm
          category={editingCategory}
          flatCategories={flatCategories}
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
        title="Delete Category"
        description={`Are you sure you want to delete "${categoryToDelete?.name}"?`}
        confirmText="Yes, Delete"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
