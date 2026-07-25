// @ts-nocheck
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { CancellationService } from '../src/server/services/cancellation.service';
import { ReturnService } from '../src/server/services/return.service';
import { ExchangeService } from '../src/server/services/exchange.service';
import { RefundService } from '../src/server/services/refund.service';
import { PostPurchaseService } from '../src/server/services/post-purchase.service';
import { 
  OrderStatus, 
  PaymentStatus, 
  FulfillmentStatus, 
  UserRole, 
  ShipmentStatus, 
  ReturnReason, 
  ReturnStatus, 
  ExchangeStatus,
  RefundStatus
} from '@prisma/client';

async function cleanup() {
  await prisma.refund.deleteMany({});
  await prisma.exchangeItem.deleteMany({});
  await prisma.exchangeRequest.deleteMany({});
  await prisma.returnItem.deleteMany({});
  await prisma.returnRequest.deleteMany({});
  await prisma.orderCancellation.deleteMany({});
  await prisma.shipmentTrackingEvent.deleteMany({});
  await prisma.shipmentItem.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
}

async function runTests() {
  console.log("==========================================");
  console.log("V12: Cancellation, Returns, Exchanges & Refunds Runtime Verification");
  console.log("==========================================");

  await cleanup();

  // Seed Data
  const admin = await prisma.user.create({ data: { email: 'admin12@example.com', role: UserRole.ADMIN }});
  const customer = await prisma.user.create({ data: { email: 'customer12@example.com', role: UserRole.CUSTOMER }});
  const customer2 = await prisma.user.create({ data: { email: 'customer12_2@example.com', role: UserRole.CUSTOMER }});

  const cat = await prisma.category.create({ data: { name: 'V12 Cat', slug: 'v12-cat' }});
  const product = await prisma.product.create({
    data: {
      name: 'V12 Product', slug: 'v12-product', basePrice: 10000, categoryId: cat.id
    }
  });

  const variant1 = await prisma.productVariant.create({
    data: {
      productId: product.id, sku: 'V12-SKU-1',
      inventory: { create: { quantity: 10, reservedQuantity: 0 } }
    }
  });

  const variant2 = await prisma.productVariant.create({
    data: {
      productId: product.id, sku: 'V12-SKU-2',
      inventory: { create: { quantity: 10, reservedQuantity: 0 } }
    }
  });

  // Helper to create an order
  async function createTestOrder(
    user: any, payment: PaymentStatus, fulfillment: FulfillmentStatus, 
    items: { v: any, q: number, p: number }[], discount: number = 0
  ) {
    const subtotal = items.reduce((sum, item) => sum + item.q * item.p, 0);
    const totalAmount = subtotal - discount;

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD12-${Math.floor(Math.random()*10000)}`,
        userId: user.id,
        status: payment === PaymentStatus.PAID ? OrderStatus.CONFIRMED : OrderStatus.PENDING_PAYMENT,
        paymentStatus: payment,
        fulfillmentStatus: fulfillment,
        subtotal,
        discountAmount: discount,
        totalAmount,
        items: {
          create: items.map(item => ({
            productId: item.v.productId,
            variantId: item.v.id,
            productName: 'T',
            productSlug: 't',
            sku: item.v.sku,
            unitPrice: item.p,
            quantity: item.q,
            lineTotal: item.q * item.p
          }))
        }
      },
      include: { items: true, shipments: true, refunds: true }
    });

    if (payment === PaymentStatus.PAID) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          providerOrderId: `rzp_${order.id}`,
          amount: totalAmount,
          status: PaymentStatus.PAID
        }
      });
    }

    return order;
  }

  try {
    // ---------------------------------------------------------
    // TEST 1: Unpaid Cancellation (Releases reservation)
    // ---------------------------------------------------------
    // Set reserved stock
    await prisma.inventory.update({ where: { variantId: variant1.id }, data: { reservedQuantity: 2 }});
    const order1 = await createTestOrder(customer, PaymentStatus.PENDING, FulfillmentStatus.UNFULFILLED, [
      { v: variant1, q: 2, p: 5000 }
    ]);
    
    await CancellationService.cancelOrder(order1.id, customer.id, UserRole.CUSTOMER, { reason: 'Changed mind' });
    const c1 = await prisma.orderCancellation.findUnique({ where: { orderId: order1.id }});
    if (!c1) throw new Error("OrderCancellation record not created");

    const inv1 = await prisma.inventory.findUnique({ where: { variantId: variant1.id }});
    if (inv1!.reservedQuantity !== 0) throw new Error("Reservation not released correctly");

    const refund1 = await prisma.refund.findFirst({ where: { orderId: order1.id }});
    if (refund1) throw new Error("Refund created for unpaid order");
    console.log("✅ TEST 1: Unpaid Order Cancellation (Releases reservation exactly once) PASSED");

    // ---------------------------------------------------------
    // TEST 2: Paid/Unshipped Cancellation (Restocks and creates Refund)
    // ---------------------------------------------------------
    await prisma.inventory.update({ where: { variantId: variant1.id }, data: { quantity: 10 }});
    const order2 = await createTestOrder(customer, PaymentStatus.PAID, FulfillmentStatus.UNFULFILLED, [
      { v: variant1, q: 3, p: 5000 } // Total 15000
    ]);

    await CancellationService.cancelOrder(order2.id, customer.id, UserRole.CUSTOMER, { reason: 'Bought another' });
    
    const inv2 = await prisma.inventory.findUnique({ where: { variantId: variant1.id }});
    if (inv2!.quantity !== 13) throw new Error(`Inventory not restocked correctly. Expected 13, got ${inv2!.quantity}`);

    const refund2 = await prisma.refund.findFirst({ where: { orderId: order2.id }});
    if (!refund2 || refund2.amount !== 15000) throw new Error("Refund liability not created correctly");
    console.log("✅ TEST 2: Paid/Unshipped Cancellation (Restocks & Refund Liability) PASSED");

    // ---------------------------------------------------------
    // TEST 3: Duplicate Cancellation Idempotency
    // ---------------------------------------------------------
    try {
      await CancellationService.cancelOrder(order2.id, customer.id, UserRole.CUSTOMER, { reason: 'Duplicate' });
      throw new Error("Should have thrown ConflictError");
    } catch (e: any) {
      if (e.statusCode !== 409) throw new Error(`Expected 409 Conflict, got ${e.statusCode}`);
    }
    const refunds = await prisma.refund.findMany({ where: { orderId: order2.id }});
    if (refunds.length !== 1) throw new Error("Duplicate cancellation created duplicate refund");
    console.log("✅ TEST 3: Duplicate Cancellation Idempotency PASSED");

    // ---------------------------------------------------------
    // TEST 4: Shipped Order Customer Cancellation Rejection
    // ---------------------------------------------------------
    const order4 = await createTestOrder(customer, PaymentStatus.PAID, FulfillmentStatus.PARTIALLY_FULFILLED, [
      { v: variant1, q: 1, p: 5000 }
    ]);
    await prisma.shipment.create({
      data: { orderId: order4.id, status: ShipmentStatus.IN_TRANSIT }
    });

    try {
      await CancellationService.cancelOrder(order4.id, customer.id, UserRole.CUSTOMER, { reason: 'Try cancel' });
      throw new Error("Should have thrown ForbiddenError");
    } catch (e: any) {
      if (e.statusCode !== 403) throw new Error(`Expected 403 Forbidden, got ${e.statusCode}`);
    }
    console.log("✅ TEST 4: Shipped Order Cancellation Rejection PASSED");

    // ---------------------------------------------------------
    // TEST 5: Delivered Return Eligibility & Return Request
    // ---------------------------------------------------------
    const order5 = await createTestOrder(customer, PaymentStatus.PAID, FulfillmentStatus.DELIVERED, [
      { v: variant2, q: 2, p: 10000 }
    ]);
    await prisma.shipment.create({
      data: { orderId: order5.id, status: ShipmentStatus.DELIVERED, deliveredAt: new Date(Date.now() - 2 * 86400000) } // 2 days ago
    });

    const retReq = await ReturnService.createReturnRequest(order5.id, customer.id, {
      items: [{ orderItemId: order5.items[0].id, quantity: 1, reason: ReturnReason.SIZE_ISSUE }]
    });
    if (!retReq || retReq.status !== ReturnStatus.REQUESTED) throw new Error("Return request not created correctly");
    console.log("✅ TEST 5: Return request creation & delivered eligibility PASSED");

    // ---------------------------------------------------------
    // TEST 6: Over-return Rejection & Previous return quantity accounting
    // ---------------------------------------------------------
    try {
      await ReturnService.createReturnRequest(order5.id, customer.id, {
        items: [{ orderItemId: order5.items[0].id, quantity: 2, reason: ReturnReason.SIZE_ISSUE }]
      });
      throw new Error("Should have thrown ConflictError for over-return");
    } catch (e: any) {
      if (e.statusCode !== 409) throw new Error("Expected 409 Conflict");
    }
    console.log("✅ TEST 6: Partial Return & Over-return rejection PASSED");

    // ---------------------------------------------------------
    // TEST 7: Return Approval & Inspection (Partial Acceptance) & Inventory Restock
    // ---------------------------------------------------------
    // First, complete the existing return request
    await ReturnService.approveReturn(retReq.id);
    
    // Inspect and accept
    const retReqWithItems = await prisma.returnRequest.findUnique({ where: { id: retReq.id }, include: { items: true }});
    
    const initialInv = await prisma.inventory.findUnique({ where: { variantId: variant2.id }});
    
    await ReturnService.inspectAndAcceptReturn(retReq.id, [{
      returnItemId: retReqWithItems!.items[0].id,
      acceptedQuantity: 1
    }]);

    const postInv = await prisma.inventory.findUnique({ where: { variantId: variant2.id }});
    if (postInv!.quantity !== initialInv!.quantity + 1) throw new Error("Inventory not restocked after inspection acceptance");

    const retRefund = await prisma.refund.findFirst({ where: { returnRequestId: retReq.id }});
    if (!retRefund || retRefund.amount !== 10000) throw new Error("Refund liability not created correctly for return");
    
    console.log("✅ TEST 7: Return Approval, Inspection Acceptance & Exactly-Once Restock PASSED");

    // ---------------------------------------------------------
    // TEST 8: Full/Partial Refund Calculation (Coupon-Aware)
    // ---------------------------------------------------------
    const order8 = await createTestOrder(customer, PaymentStatus.PAID, FulfillmentStatus.DELIVERED, [
      { v: variant1, q: 2, p: 5000 }, // lineTotal: 10000
      { v: variant2, q: 1, p: 3000 }  // lineTotal: 3000
    ], 1300); // Discount 1300. subtotal 13000, totalPaid: 11700
    // variant1 alloc: floor((10000/13000)*1300) = floor(1000) = 1000
    // variant2 alloc: floor((3000/13000)*1300) = floor(300) = 300
    
    const refundV1 = PostPurchaseService.calculateItemRefundValue(order8, order8.items, order8.items[0].id, 1);
    // V1 lineTotal = 10000. totalDiscount = 1000. finalLineTotal = 9000. unit refund = 4500.
    if (refundV1 !== 4500) throw new Error(`Expected 4500, got ${refundV1}`);
    console.log("✅ TEST 8: Historical Discount Allocation & Coupon-Aware Refund Calculation PASSED");

    // ---------------------------------------------------------
    // TEST 9: Mock Provider Refund Processing & Max Protection
    // ---------------------------------------------------------
    // We have retRefund which is PENDING for 10000.
    const processRes = await RefundService.processRefund(retRefund!.id);
    if (processRes.status !== RefundStatus.SUCCEEDED || !processRes.providerRefundId) {
      throw new Error("Refund processing failed");
    }

    try {
      // Trying to process the same refund again should fail (idempotency/state machine)
      await RefundService.processRefund(retRefund!.id);
      throw new Error("Should have failed duplicate processing");
    } catch (e: any) {
      if (e.statusCode !== 409) throw new Error("Expected 409 Conflict");
    }
    console.log("✅ TEST 9: Mock provider refund processing & exactly-once transition PASSED");

    // ---------------------------------------------------------
    // TEST 10: Exchange Architecture & Replacement Reservation
    // ---------------------------------------------------------
    const order10 = await createTestOrder(customer, PaymentStatus.PAID, FulfillmentStatus.DELIVERED, [
      { v: variant1, q: 1, p: 5000 }
    ]);
    await prisma.shipment.create({
      data: { orderId: order10.id, status: ShipmentStatus.DELIVERED, deliveredAt: new Date(Date.now() - 1 * 86400000) }
    });

    const initVariant2Inv = await prisma.inventory.findUnique({ where: { variantId: variant2.id }});

    const exReq = await ExchangeService.createExchangeRequest(order10.id, customer.id, {
      items: [{ orderItemId: order10.items[0].id, quantity: 1, replacementVariantId: variant2.id }]
    });
    if (!exReq) throw new Error("Exchange request not created");
    // Approve exchange (reserves stock)
    await ExchangeService.approveExchange(exReq.id);
    
    const postVariant2Inv = await prisma.inventory.findUnique({ where: { variantId: variant2.id }});
    if (postVariant2Inv!.reservedQuantity !== initVariant2Inv!.reservedQuantity + 1) {
      throw new Error("Replacement stock not reserved");
    }
    if (postVariant2Inv!.quantity !== initVariant2Inv!.quantity - 1) {
      throw new Error("Replacement stock not decremented from available");
    }

    // Complete exchange (restores original, finalizes replacement)
    const initVariant1Inv = await prisma.inventory.findUnique({ where: { variantId: variant1.id }});
    await ExchangeService.completeExchange(exReq.id);

    const postVariant1Inv = await prisma.inventory.findUnique({ where: { variantId: variant1.id }});
    if (postVariant1Inv!.quantity !== initVariant1Inv!.quantity + 1) {
      throw new Error("Original item stock not restored");
    }

    const finalVariant2Inv = await prisma.inventory.findUnique({ where: { variantId: variant2.id }});
    if (finalVariant2Inv!.reservedQuantity !== postVariant2Inv!.reservedQuantity - 1) {
      throw new Error("Replacement stock reservation not finalized");
    }

    console.log("✅ TEST 10: Exchange Architecture, Replacement Reservation & Immutability PASSED");

    // ---------------------------------------------------------
    // TEST 11: Return vs Exchange Race Protection (Quantity Protection)
    // ---------------------------------------------------------
    // Try to return the item that was just exchanged
    try {
      await ReturnService.createReturnRequest(order10.id, customer.id, {
        items: [{ orderItemId: order10.items[0].id, quantity: 1, reason: ReturnReason.SIZE_ISSUE }]
      });
      throw new Error("Should not be able to return an exchanged item");
    } catch (e: any) {
      if (e.statusCode !== 409) throw new Error("Expected 409 Conflict for returning exchanged item");
    }
    console.log("✅ TEST 11: Return/Exchange Quantity Protection (No Double Recovery) PASSED");


  } catch (e) {
    console.error("❌ TEST FAILED:", e);
    process.exit(1);
  }

  console.log("==========================================");
  console.log("V12 RUNTIME TESTS: ALL TESTS PASSED");
  console.log("==========================================");
}

runTests();
