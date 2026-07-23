/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { ConflictError, NotFoundError } from '@/utils/errors';

export class CollectionService {
  static async getCollections(activeOnly = false, includeFeatured = false) {
    const where: any = {};
    
    if (activeOnly) {
      where.isActive = true;
      const now = new Date();
      where.OR = [
        {
          startsAt: null,
          endsAt: null,
        },
        {
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
        {
          startsAt: { lte: now },
          endsAt: null,
        },
        {
          startsAt: null,
          endsAt: { gte: now },
        },
      ];
    }

    if (includeFeatured) {
      where.isFeatured = true;
    }

    return prisma.collection.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  static async getCollectionById(id: string, activeOnly = false) {
    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) throw new NotFoundError('Collection not found');
    
    if (activeOnly) {
      if (!this.isCollectionActive(collection)) {
        throw new NotFoundError('Collection not found or inactive');
      }
    }
    return collection;
  }

  static async getCollectionBySlug(slug: string, activeOnly = false) {
    const collection = await prisma.collection.findUnique({ where: { slug } });
    if (!collection) throw new NotFoundError('Collection not found');

    if (activeOnly) {
      if (!this.isCollectionActive(collection)) {
        throw new NotFoundError('Collection not found or inactive');
      }
    }
    return collection;
  }

  static async createCollection(data: any) {
    const existing = await prisma.collection.findUnique({ where: { slug: data.slug } });
    if (existing) {
      throw new ConflictError('A collection with this slug already exists');
    }

    return prisma.collection.create({ data });
  }

  static async updateCollection(id: string, data: any) {
    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) throw new NotFoundError('Collection not found');

    if (data.slug && data.slug !== collection.slug) {
      const existing = await prisma.collection.findUnique({ where: { slug: data.slug as string } });
      if (existing) {
        throw new ConflictError('A collection with this slug already exists');
      }
    }

    // Validation for startsAt / endsAt on partial updates
    const startsAt = data.startsAt !== undefined ? data.startsAt : collection.startsAt;
    const endsAt = data.endsAt !== undefined ? data.endsAt : collection.endsAt;
    
    if (startsAt && endsAt && new Date(startsAt as Date | string) >= new Date(endsAt as Date | string)) {
      throw new ConflictError('endsAt must be after startsAt');
    }

    return prisma.collection.update({
      where: { id },
      data,
    });
  }

  static async deleteCollection(id: string) {
    const collection = await prisma.collection.findUnique({ where: { id } });
    if (!collection) {
      throw new NotFoundError('Collection not found');
    }

    await prisma.collection.delete({ where: { id } });
    return { success: true };
  }

  private static isCollectionActive(collection: any): boolean {
    if (!collection.isActive) return false;
    const now = new Date();
    if (collection.startsAt && new Date(collection.startsAt) > now) return false;
    if (collection.endsAt && new Date(collection.endsAt) < now) return false;
    return true;
  }
}
