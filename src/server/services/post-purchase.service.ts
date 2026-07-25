import { Order, OrderItem, ReturnItem, ExchangeItem, ReturnStatus, ExchangeStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface ReturnEligibility {
  purchasedQuantity: number;
  returnedQuantity: number;
  exchangedQuantity: number;
  returnRequestedQuantity: number;
  exchangeRequestedQuantity: number;
  remainingEligibleQuantity: number;
}

export class PostPurchaseService {
  /**
   * Calculate proportional discount for all items in an order to ensure 
   * the sum of item discounts equals the total order discount.
   */
  static allocateHistoricalDiscount(order: Order, items: OrderItem[]): Map<string, number> {
    const map = new Map<string, number>();
    if (order.discountAmount === 0 || order.subtotal === 0) {
      for (const item of items) {
        map.set(item.id, 0);
      }
      return map;
    }

    let allocatedTotal = 0;
    // Calculate proportional discount rounded down
    for (const item of items) {
      const proportion = item.lineTotal / order.subtotal;
      const allocated = Math.floor(proportion * order.discountAmount);
      map.set(item.id, allocated);
      allocatedTotal += allocated;
    }

    // Distribute remainder paise one by one to items starting with the most expensive
    let remainder = order.discountAmount - allocatedTotal;
    if (remainder > 0) {
      const sortedItems = [...items].sort((a, b) => b.lineTotal - a.lineTotal);
      let i = 0;
      while (remainder > 0) {
        const id = sortedItems[i % sortedItems.length].id;
        map.set(id, map.get(id)! + 1);
        remainder--;
        i++;
      }
    }

    return map;
  }

  /**
   * Retrieves the post-purchase status of an order item, accounting for
   * accepted returns, pending returns, and exchanges.
   */
  static async getItemEligibility(orderItemId: string): Promise<ReturnEligibility> {
    const item = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        returnItems: {
          include: { returnRequest: true }
        },
        exchangeItems: {
          include: { exchangeRequest: true }
        }
      }
    });

    if (!item) {
      throw new Error('OrderItem not found');
    }

    let returnedQuantity = 0;
    let returnRequestedQuantity = 0;
    
    for (const ri of item.returnItems) {
      if (ri.returnRequest.status === ReturnStatus.COMPLETED || ri.returnRequest.status === ReturnStatus.REFUNDED) {
        returnedQuantity += ri.acceptedQuantity;
      } else if (
        ri.returnRequest.status !== ReturnStatus.REJECTED && 
        ri.returnRequest.status !== ReturnStatus.CANCELLED &&
        ri.returnRequest.status !== ReturnStatus.REJECTED_AFTER_INSPECTION
      ) {
        returnRequestedQuantity += ri.quantity;
      }
    }

    let exchangedQuantity = 0;
    let exchangeRequestedQuantity = 0;
    
    for (const ei of item.exchangeItems) {
      if (ei.exchangeRequest.status === ExchangeStatus.COMPLETED) {
        exchangedQuantity += ei.quantity;
      } else if (
        ei.exchangeRequest.status !== ExchangeStatus.REJECTED &&
        ei.exchangeRequest.status !== ExchangeStatus.CANCELLED
      ) {
        exchangeRequestedQuantity += ei.quantity;
      }
    }

    const usedQuantity = returnedQuantity + returnRequestedQuantity + exchangedQuantity + exchangeRequestedQuantity;
    const remainingEligibleQuantity = item.quantity - usedQuantity;

    return {
      purchasedQuantity: item.quantity,
      returnedQuantity,
      returnRequestedQuantity,
      exchangedQuantity,
      exchangeRequestedQuantity,
      remainingEligibleQuantity: Math.max(0, remainingEligibleQuantity)
    };
  }

  /**
   * Calculate refundable amount for a given quantity of a specific order item.
   * Assumes the return is eligible.
   */
  static calculateItemRefundValue(
    order: Order,
    items: OrderItem[],
    targetOrderItemId: string,
    returnQuantity: number
  ): number {
    const targetItem = items.find(i => i.id === targetOrderItemId);
    if (!targetItem) throw new Error('Item not found in order');
    if (returnQuantity <= 0) return 0;
    if (returnQuantity > targetItem.quantity) throw new Error('Return quantity exceeds purchased quantity');

    const discountMap = this.allocateHistoricalDiscount(order, items);
    const itemTotalDiscount = discountMap.get(targetOrderItemId) || 0;
    
    // Pro-rate the item's discount across its quantity
    const itemFinalLineTotal = targetItem.lineTotal - itemTotalDiscount;
    
    // Calculate per-unit refund value (rounding down)
    const unitRefundValue = Math.floor(itemFinalLineTotal / targetItem.quantity);
    
    // If they return the full quantity, they get the exact line total minus discount to avoid rounding loss
    if (returnQuantity === targetItem.quantity) {
      return itemFinalLineTotal;
    }
    
    return unitRefundValue * returnQuantity;
  }
}
