import { prisma } from '@/lib/prisma';
import { ProductStatus, Prisma } from '@prisma/client';
import { ConflictError, NotFoundError, ValidationError } from '@/utils/errors';
import { createProductSchema, updateProductSchema, productListFilterSchema } from '../validators/product.validator';

export class ProductService {
  static async createProduct(data: unknown) {
    const validated = createProductSchema.parse(data);

    const existing = await prisma.product.findUnique({ where: { slug: validated.slug } });
    if (existing) throw new ConflictError('A product with this slug already exists');

    const category = await prisma.category.findUnique({ where: { id: validated.categoryId } });
    if (!category) throw new NotFoundError('Category not found');

    let collectionsData: { collectionId: string, sortOrder: number }[] = [];
    if (validated.collectionIds && validated.collectionIds.length > 0) {
      const collections = await prisma.collection.findMany({ where: { id: { in: validated.collectionIds } } });
      if (collections.length !== validated.collectionIds.length) {
        throw new ValidationError('One or more collections are invalid');
      }
      collectionsData = validated.collectionIds.map((cid, idx) => ({ collectionId: cid, sortOrder: idx }));
    }

    return prisma.product.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        shortDescription: validated.shortDescription,
        description: validated.description,
        basePrice: validated.basePrice,
        compareAtPrice: validated.compareAtPrice,
        categoryId: validated.categoryId,
        isFeatured: validated.isFeatured,
        status: validated.status,
        metaTitle: validated.metaTitle,
        metaDescription: validated.metaDescription,
        collections: {
          create: collectionsData,
        }
      },
      include: {
        category: true,
        collections: { include: { collection: true }, orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } }
      }
    });
  }

  static async updateProduct(id: string, data: unknown) {
    const validated = updateProductSchema.parse(data);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product not found');

    if (validated.slug && validated.slug !== product.slug) {
      const existing = await prisma.product.findUnique({ where: { slug: validated.slug } });
      if (existing) throw new ConflictError('A product with this slug already exists');
    }

    if (validated.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: validated.categoryId } });
      if (!category) throw new NotFoundError('Category not found');
    }

    // Prepare update data
    const updateData: Record<string, unknown> = { ...validated };
    delete updateData.collectionIds;

    // Run within a transaction if collections are being updated
    return prisma.$transaction(async (tx) => {
      if (validated.collectionIds) {
        const collections = await tx.collection.findMany({ where: { id: { in: validated.collectionIds } } });
        if (collections.length !== validated.collectionIds.length) {
          throw new ValidationError('One or more collections are invalid');
        }
        
        await tx.productCollection.deleteMany({ where: { productId: id } });
        
        if (validated.collectionIds.length > 0) {
          await tx.productCollection.createMany({
            data: validated.collectionIds.map((cid, idx) => ({
              productId: id,
              collectionId: cid,
              sortOrder: idx
            }))
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          collections: { include: { collection: true }, orderBy: { sortOrder: 'asc' } },
          images: { orderBy: { sortOrder: 'asc' } }
        }
      });
    });
  }

  static async getProductById(id: string, requirePublic = false) {
    const where: Prisma.ProductWhereInput = { id };
    if (requirePublic) {
      where.status = ProductStatus.PUBLISHED;
      where.category = { isActive: true };
    }
    const product = await prisma.product.findFirst({
      where,
      include: {
        category: true,
        collections: { include: { collection: true }, orderBy: { sortOrder: 'asc' } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { 
          where: requirePublic ? { isActive: true } : undefined,
          include: { inventory: true }
        }
      }
    });
    if (!product) throw new NotFoundError('Product not found');
    
    if (requirePublic) {
      return {
        ...product,
        variants: product.variants.map(v => {
          const availableQty = v.inventory ? (v.inventory.quantity - v.inventory.reservedQuantity) : 0;
          let stockStatus = 'IN_STOCK';
          if (availableQty <= 0) stockStatus = 'OUT_OF_STOCK';
          else if (availableQty <= (v.inventory?.lowStockThreshold || 0)) stockStatus = 'LOW_STOCK';
          
          return {
            id: v.id,
            size: v.size,
            color: v.color,
            effectivePrice: v.price !== null ? v.price : product.basePrice,
            compareAtPrice: v.compareAtPrice,
            available: availableQty > 0,
            stockStatus
          };
        })
      };
    }
    return product;
  }

  static async getProductBySlug(slug: string, requirePublic = false) {
    const where: Prisma.ProductWhereInput = { slug };
    if (requirePublic) {
      where.status = ProductStatus.PUBLISHED;
      where.category = { isActive: true };
    }
    const product = await prisma.product.findFirst({
      where,
      include: {
        category: true,
        collections: { 
          include: { collection: true }, 
          orderBy: { sortOrder: 'asc' },
          where: requirePublic ? {
            collection: {
              isActive: true,
              OR: [
                { startsAt: null, endsAt: null },
                { startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
                { startsAt: { lte: new Date() }, endsAt: null }
              ]
            }
          } : undefined
        },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { 
          where: requirePublic ? { isActive: true } : undefined,
          include: { inventory: true },
          orderBy: [ { color: 'asc' }, { size: 'asc' } ]
        }
      }
    });
    if (!product) throw new NotFoundError('Product not found');

    if (requirePublic) {
      return {
        ...product,
        variants: product.variants.map(v => {
          const availableQty = v.inventory ? (v.inventory.quantity - v.inventory.reservedQuantity) : 0;
          let stockStatus = 'IN_STOCK';
          if (availableQty <= 0) stockStatus = 'OUT_OF_STOCK';
          else if (availableQty <= (v.inventory?.lowStockThreshold || 0)) stockStatus = 'LOW_STOCK';
          
          return {
            id: v.id,
            size: v.size,
            color: v.color,
            effectivePrice: v.price !== null ? v.price : product.basePrice,
            compareAtPrice: v.compareAtPrice !== null ? v.compareAtPrice : product.compareAtPrice,
            available: availableQty > 0,
            stockStatus
          };
        })
      };
    }
    return product;
  }

  static async getPublicProducts(query: unknown) {
    const filters = productListFilterSchema.parse(query);
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.PUBLISHED,
      category: { isActive: true }
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { shortDescription: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.categoryId) {
      // In a real hierarchical setup, we might find all descendant IDs. For V5, direct match is fine unless recursive queries are configured.
      where.categoryId = filters.categoryId;
    }

    if (filters.collectionSlug) {
      where.collections = {
        some: {
          collection: {
            slug: filters.collectionSlug,
            isActive: true,
            OR: [
              { startsAt: null, endsAt: null },
              { startsAt: { lte: new Date() }, endsAt: { gte: new Date() } },
              { startsAt: { lte: new Date() }, endsAt: null }
            ]
          }
        }
      };
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.basePrice = {};
      if (filters.minPrice !== undefined) where.basePrice.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.basePrice.lte = filters.maxPrice;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    switch (filters.sortBy) {
      case 'price-low-high': orderBy.basePrice = 'asc'; break;
      case 'price-high-low': orderBy.basePrice = 'desc'; break;
      case 'name': orderBy.name = 'asc'; break;
      case 'newest': default: orderBy.createdAt = 'desc'; break;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: filters.limit,
        include: {
          category: true,
          collections: { include: { collection: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          variants: {
            where: { isActive: true },
            include: { inventory: true }
          }
        }
      })
    ]);

    const mappedItems = items.map(item => {
      const hasAvailableStock = item.variants.some(v => v.inventory && (v.inventory.quantity - v.inventory.reservedQuantity) > 0);
      const { variants: _, ...rest } = item;
      return {
        ...rest,
        hasAvailableStock
      };
    });

    return {
      data: mappedItems,
      meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) }
    };
  }

  static async getAdminProducts(query: unknown) {
    const filters = productListFilterSchema.parse(query);
    const where: Prisma.ProductWhereInput = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.status) where.status = filters.status;
    if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
    if (filters.collectionSlug) {
      where.collections = { some: { collection: { slug: filters.collectionSlug } } };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    switch (filters.sortBy) {
      case 'price-low-high': orderBy.basePrice = 'asc'; break;
      case 'price-high-low': orderBy.basePrice = 'desc'; break;
      case 'name': orderBy.name = 'asc'; break;
      case 'newest': default: orderBy.createdAt = 'desc'; break;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: filters.limit,
        include: { 
          category: true, 
          images: { orderBy: { sortOrder: 'asc' } },
          variants: { include: { inventory: true } }
        }
      })
    ]);

    return {
      data: items,
      meta: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) }
    };
  }

  static async publishProduct(id: string) {
    return this.updateProduct(id, { status: ProductStatus.PUBLISHED });
  }

  static async archiveProduct(id: string) {
    return this.updateProduct(id, { status: ProductStatus.ARCHIVED });
  }
}
