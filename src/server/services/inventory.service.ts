import { prisma } from '@/lib/prisma';
import { ConflictError, NotFoundError } from '@/utils/errors';
import { InventoryTransactionType } from '@prisma/client';
import { adjustStockSchema, reserveStockSchema, releaseStockSchema, commitStockSchema, updateThresholdSchema } from '../validators/inventory.validator';

export class InventoryService {
  
  static async adjustStock(productId: string, variantId: string, data: unknown) {
    const validated = adjustStockSchema.parse(data);
    
    const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId }, include: { inventory: true }});
    if (!variant || !variant.inventory) throw new NotFoundError('Inventory not found for this product variant');
    
    return prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: string, quantity: number, reservedQuantity: number }[]>`
        UPDATE "inventories"
        SET "quantity" = "quantity" + ${validated.delta},
            "updatedAt" = NOW()
        WHERE "id" = ${variant.inventory!.id}
          AND "quantity" + ${validated.delta} >= "reservedQuantity"
        RETURNING "id", "quantity", "reservedQuantity"
      `;
      
      if (!rows || rows.length === 0) {
        throw new ConflictError('Adjustment would cause stock to drop below reserved quantity, or negative');
      }
      
      const newInv = rows[0] as { id?: string, quantity: number, reservedQuantity: number };
      
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: variant.inventory!.id,
          type: InventoryTransactionType.ADJUSTMENT,
          quantityChange: validated.delta,
          quantityBefore: variant.inventory!.quantity,
          quantityAfter: newInv.quantity,
          reservedBefore: variant.inventory!.reservedQuantity,
          reservedAfter: newInv.reservedQuantity,
          reason: validated.reason,
          reference: validated.reference
        }
      });
      
      return tx.inventory.findUnique({ where: { id: variant.inventory!.id } });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async reserveStock(productId: string, variantId: string, data: unknown, txClient?: any) {
    const validated = reserveStockSchema.parse(data);
    const client = txClient || prisma;
    const variant = await client.productVariant.findFirst({ where: { id: variantId, productId }, include: { inventory: true }});
    if (!variant || !variant.inventory) throw new NotFoundError('Inventory not found');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const execute = async (tx: any) => {
      const rows = await tx.$queryRaw<unknown[]>`
        UPDATE "inventories"
        SET "reservedQuantity" = "reservedQuantity" + ${validated.quantity},
            "updatedAt" = NOW()
        WHERE "id" = ${variant.inventory!.id}
          AND "quantity" - "reservedQuantity" >= ${validated.quantity}
        RETURNING "quantity", "reservedQuantity"
      `;
      if (!rows || rows.length === 0) {
        throw new ConflictError('Insufficient available stock');
      }
      const newInv = rows[0] as { id?: string, quantity: number, reservedQuantity: number };
      
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: variant.inventory!.id,
          type: InventoryTransactionType.RESERVATION,
          quantityChange: 0,
          quantityBefore: newInv.quantity,
          quantityAfter: newInv.quantity,
          reservedBefore: variant.inventory!.reservedQuantity,
          reservedAfter: newInv.reservedQuantity,
          reference: validated.reference
        }
      });
      return tx.inventory.findUnique({ where: { id: variant.inventory!.id } });
    };

    if (txClient) {
      return execute(txClient);
    } else {
      return prisma.$transaction(execute);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async releaseStock(productId: string, variantId: string, data: unknown, txClient?: any) {
    const validated = releaseStockSchema.parse(data);
    const client = txClient || prisma;
    const variant = await client.productVariant.findFirst({ where: { id: variantId, productId }, include: { inventory: true }});
    if (!variant || !variant.inventory) throw new NotFoundError('Inventory not found');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const execute = async (tx: any) => {
      const rows = await tx.$queryRaw<unknown[]>`
        UPDATE "inventories"
        SET "reservedQuantity" = "reservedQuantity" - ${validated.quantity},
            "updatedAt" = NOW()
        WHERE "id" = ${variant.inventory!.id}
          AND "reservedQuantity" >= ${validated.quantity}
        RETURNING "quantity", "reservedQuantity"
      `;
      if (!rows || rows.length === 0) {
        throw new ConflictError('Cannot release more stock than currently reserved');
      }
      const newInv = rows[0] as { id?: string, quantity: number, reservedQuantity: number };
      
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: variant.inventory!.id,
          type: InventoryTransactionType.RESERVATION_RELEASE,
          quantityChange: 0,
          quantityBefore: newInv.quantity,
          quantityAfter: newInv.quantity,
          reservedBefore: variant.inventory!.reservedQuantity,
          reservedAfter: newInv.reservedQuantity,
          reference: validated.reference
        }
      });
      return tx.inventory.findUnique({ where: { id: variant.inventory!.id } });
    };

    if (txClient) {
      return execute(txClient);
    } else {
      return prisma.$transaction(execute);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async commitStock(productId: string, variantId: string, data: unknown, txClient?: any) {
    const validated = commitStockSchema.parse(data);
    const client = txClient || prisma;
    const variant = await client.productVariant.findFirst({ where: { id: variantId, productId }, include: { inventory: true }});
    if (!variant || !variant.inventory) throw new NotFoundError('Inventory not found');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const execute = async (tx: any) => {
      const rows = await tx.$queryRaw<unknown[]>`
        UPDATE "inventories"
        SET "quantity" = "quantity" - ${validated.quantity},
            "reservedQuantity" = "reservedQuantity" - ${validated.quantity},
            "updatedAt" = NOW()
        WHERE "id" = ${variant.inventory!.id}
          AND "reservedQuantity" >= ${validated.quantity}
        RETURNING "quantity", "reservedQuantity"
      `;
      if (!rows || rows.length === 0) {
        throw new ConflictError('Cannot commit more stock than currently reserved');
      }
      const newInv = rows[0] as { id?: string, quantity: number, reservedQuantity: number };
      
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: variant.inventory!.id,
          type: InventoryTransactionType.SALE,
          quantityChange: -validated.quantity,
          quantityBefore: variant.inventory!.quantity,
          quantityAfter: newInv.quantity,
          reservedBefore: variant.inventory!.reservedQuantity,
          reservedAfter: newInv.reservedQuantity,
          reference: validated.reference
        }
      });
      return tx.inventory.findUnique({ where: { id: variant.inventory!.id } });
    };

    if (txClient) {
      return execute(txClient);
    } else {
      return prisma.$transaction(execute);
    }
  }

  static async getLowStockVariants() {
    const items = await prisma.$queryRaw<unknown[]>`
      SELECT i.*, v.sku, v.size, v.color, v."productId" 
      FROM "inventories" i
      JOIN "product_variants" v ON i."variantId" = v.id
      WHERE (i.quantity - i."reservedQuantity") > 0
        AND (i.quantity - i."reservedQuantity") <= i."lowStockThreshold"
    `;
    return items;
  }

  static async getInventoryTransactions(productId: string, variantId: string, page = 1, limit = 20) {
    const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId }, include: { inventory: true } });
    if (!variant || !variant.inventory) throw new NotFoundError('Inventory not found');

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.inventoryTransaction.count({ where: { inventoryId: variant.inventory.id } }),
      prisma.inventoryTransaction.findMany({
        where: { inventoryId: variant.inventory.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  static async updateLowStockThreshold(productId: string, variantId: string, data: unknown) {
    const validated = updateThresholdSchema.parse(data);
    
    const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId }, include: { inventory: true } });
    if (!variant || !variant.inventory) throw new NotFoundError('Inventory not found');

    return prisma.inventory.update({
      where: { id: variant.inventory.id },
      data: { lowStockThreshold: validated.lowStockThreshold }
    });
  }
}
