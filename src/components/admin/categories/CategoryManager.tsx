"use client";

import { useState } from "react";
import { AdminCategory, AdminCategoryTree } from "@/types/admin";
import { CategoryForm } from "./CategoryForm";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, FolderTree, Folder, AlertTriangle } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { useRouter } from "next/navigation";

export function CategoryManager({ 
  initialTree, 
  flatCategories 
}: { 
  initialTree: AdminCategoryTree[], 
  flatCategories: AdminCategory[] 
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = async (category: AdminCategory) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) return;
    setDeleteError(null);
    try {
      await adminApi.deleteCategory(category.id);
      router.refresh();
    } catch (error: any) {
      setDeleteError(error.message || "Failed to delete category");
    }
  };

  const renderTree = (nodes: AdminCategoryTree[], depth = 0) => {
    if (!nodes || nodes.length === 0) return null;

    return (
      <ul className="space-y-2">
        {nodes.map(node => (
          <li key={node.id} className="w-full">
            <div className={`flex items-center justify-between p-3 bg-card border rounded-sm hover:bg-muted/5 transition-colors ${depth > 0 ? "ml-6" : ""}`}>
              <div className="flex items-center gap-3">
                {depth === 0 ? <FolderTree className="w-5 h-5 text-muted-foreground" /> : <Folder className="w-4 h-4 text-muted-foreground" />}
                <div>
                  <span className="font-medium text-sm">{node.name}</span>
                  {!node.isActive && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-sm">
                      Inactive
                    </span>
                  )}
                  {node.description && <p className="text-xs text-muted-foreground line-clamp-1">{node.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-4">Order: {node.sortOrder}</span>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(node)} aria-label={`Edit ${node.name}`}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(node)} className="text-destructive hover:bg-destructive/10" aria-label={`Delete ${node.name}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {node.children && node.children.length > 0 && (
              <div className="mt-2 border-l-2 ml-6 pl-2 border-muted/30">
                {renderTree(node.children, depth + 1)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-serif">Category Hierarchy</h3>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {deleteError && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-sm">Cannot Delete Category</h4>
            <p className="text-sm opacity-90">{deleteError}</p>
          </div>
        </div>
      )}

      {initialTree.length === 0 ? (
        <div className="p-8 text-center bg-card border rounded-sm text-muted-foreground">
          <FolderTree className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No categories found. Create one to organize your catalog.</p>
        </div>
      ) : (
        <div className="bg-background rounded-sm">
          {renderTree(initialTree)}
        </div>
      )}

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
    </div>
  );
}
