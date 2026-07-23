/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { AppError, ConflictError, NotFoundError } from '@/utils/errors';

export class CategoryService {
  /**
   * Retrieves all active categories, typically for public API.
   */
  static async getCategories(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    return prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Gets the category tree (nested structure)
   */
  static async getCategoryTree(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    
    // First, fetch all categories to build the tree in-memory
    const allCategories = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const categoryMap = new Map<string, any>();
    const tree: any[] = [];

    // Initialize map
    allCategories.forEach((cat: any) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Build tree
    categoryMap.forEach((cat: any) => {
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(cat);
        }
      } else {
        tree.push(cat);
      }
    });

    return tree;
  }

  static async getCategoryById(id: string, activeOnly = false) {
    const where: any = { id };
    if (activeOnly) {
      where.isActive = true;
    }
    const category = await prisma.category.findFirst({
      where,
      include: { children: true, parent: true },
    });
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  static async getCategoryBySlug(slug: string, activeOnly = false) {
    const where: any = { slug };
    if (activeOnly) {
      where.isActive = true;
    }
    const category = await prisma.category.findFirst({
      where,
      include: { children: true, parent: true },
    });
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  static async createCategory(data: any) {
    // Check slug uniqueness
    const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ConflictError('A category with this slug already exists');
    }

    // Check parent exists and is valid
    if (data.parentId) {
      await this.getCategoryById(data.parentId);
    }

    return prisma.category.create({ data });
  }

  static async updateCategory(id: string, data: any) {
    const category = await this.getCategoryById(id);

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== category.slug) {
      const existing = await prisma.category.findUnique({ where: { slug: data.slug as string } });
      if (existing) {
        throw new ConflictError('A category with this slug already exists');
      }
    }

    // Cycle and self-parent checks
    if (data.parentId !== undefined) {
      const newParentId = data.parentId as string | null;
      if (newParentId === id) {
        throw new AppError('A category cannot be its own parent', 400, 'BAD_REQUEST');
      }

      if (newParentId) {
        // Check cycle: ensure newParentId is not a descendant of id
        const isDescendant = await this.checkIsDescendant(id, newParentId);
        if (isDescendant) {
          throw new AppError('Cannot set a descendant category as a parent (cycle detected)', 400, 'BAD_REQUEST');
        }
      }
    }

    return prisma.category.update({
      where: { id },
      data,
    });
  }

  static async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { children: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (category._count.children > 0) {
      throw new ConflictError('Cannot delete a category that has child categories. Reassign or delete children first.');
    }

    await prisma.category.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Helper to detect cycle: is targetId a descendant of sourceId?
   */
  private static async checkIsDescendant(sourceId: string, targetId: string): Promise<boolean> {
    let currentId: string | null = targetId;
    while (currentId) {
      if (currentId === sourceId) return true;
      const categoryRecord: any = await prisma.category.findUnique({ where: { id: currentId }, select: { parentId: true } });
      if (!categoryRecord) break;
      currentId = categoryRecord.parentId;
    }
    return false;
  }
}
