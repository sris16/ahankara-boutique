import { prisma } from '../src/lib/prisma';
import { UserRole, OrderStatus, PaymentStatus, ShippingProvider, ShipmentStatus, FulfillmentStatus } from '@prisma/client';
import { ShippingService } from '../src/server/services/shipping.service';

async function cleanup() {
  await prisma.shipmentTrackingEvent.deleteMany();
  await prisma.shipmentItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.orderAddress.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany({ where: { email: { startsWith: 'test_' } } });
}

async function run() {
  console.log('--- STARTING V11 RUNTIME TESTS ---');
  await cleanup();

  try {
    // 1. SETUP
    const customer = await prisma.user.create({
      data: { email: 'test_customer@example.com', name: 'Customer', role: UserRole.CUSTOMER }
    });
    
    const admin = await prisma.user.create({
      data: { email: 'test_admin@example.com', name: 'Admin', role: UserRole.ADMIN }
    });

    const category = await prisma.category.create({
      data: { name: 'Test Category', slug: 'test-category' }
    });

    const product = await prisma.product.create({
      data: { name: 'Test Product', slug: 'test-product', basePrice: 100000, categoryId: category.id }
    });

    const variantA = await prisma.productVariant.create({
      data: { productId: product.id, sku: 'SKU-A', price: 100000, size: 'M' }
    });

    await prisma.inventory.create({
      data: { variantId: variantA.id, quantity: 100, reservedQuantity: 0 }
    });

    const variantB = await prisma.productVariant.create({
      data: { productId: product.id, sku: 'SKU-B', price: 50000, size: 'L' }
    });

    await prisma.inventory.create({
      data: { variantId: variantB.id, quantity: 100, reservedQuantity: 0 }
    });

    const orderAddress = await prisma.orderAddress.create({
      data: { name: 'Shipping', phone: '12345', line1: 'Street', city: 'City', state: 'State', postalCode: '1000', country: 'Country' }
    });

    // Create a PAID order
    const paidOrder = await prisma.order.create({
      data: {
        orderNumber: 'ORD-PAID-001',
        userId: customer.id,
        status: OrderStatus.CONFIRMED, // Represents successfully paid order in this workflow
        paymentStatus: PaymentStatus.PAID,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
        subtotal: 150000,
        totalAmount: 150000,
        shippingAddressId: orderAddress.id,
        items: {
          create: [
            { productId: product.id, variantId: variantA.id, sku: 'SKU-A', productName: 'Prod A', productSlug: product.slug, unitPrice: 100000, quantity: 2, lineTotal: 200000 },
            { productId: product.id, variantId: variantB.id, sku: 'SKU-B', productName: 'Prod B', productSlug: product.slug, unitPrice: 50000, quantity: 1, lineTotal: 50000 }
          ]
        }
      },
      include: { items: true }
    });

    const orderItemA = paidOrder.items.find(i => i.sku === 'SKU-A')!;
    const orderItemB = paidOrder.items.find(i => i.sku === 'SKU-B')!;

    // 2. CREATE PARTIAL SHIPMENT
    const shipment1 = await ShippingService.createShipment(paidOrder.id, [
      { orderItemId: orderItemA.id, quantity: 1 } // Out of 2
    ], ShippingProvider.MOCK);

    if (shipment1.items.length !== 1) throw new Error('Shipment1 items count mismatch');
    
    let updatedOrder = await prisma.order.findUnique({ where: { id: paidOrder.id }});
    if (updatedOrder?.fulfillmentStatus !== FulfillmentStatus.PARTIALLY_FULFILLED) {
      throw new Error('Order fulfillment status should be PARTIALLY_FULFILLED');
    }

    // 3. OVER-FULFILLMENT TEST
    try {
      await ShippingService.createShipment(paidOrder.id, [
        { orderItemId: orderItemA.id, quantity: 2 } // Only 1 left unallocated
      ]);
      throw new Error('Over-fulfillment should have failed');
    } catch (e: any) {
      if (!e.message.includes('Cannot over-fulfill')) throw e;
      console.log('✅ Over-fulfillment correctly rejected');
    }

    // 4. MULTI-ITEM ATOMICITY CONCURRENCY/OVER-FULFILLMENT
    try {
      await ShippingService.createShipment(paidOrder.id, [
        { orderItemId: orderItemA.id, quantity: 1 },
        { orderItemId: orderItemB.id, quantity: 2 } // Over-fulfilling B
      ]);
      throw new Error('Multi-item over-fulfillment should have failed entirely');
    } catch (e: any) {
      if (!e.message.includes('Cannot over-fulfill')) throw e;
      
      const checkShipments = await prisma.shipmentItem.findMany({ where: { orderItemId: orderItemA.id } });
      if (checkShipments.length > 1) {
         throw new Error('Multi-item transaction leaked partial state');
      }
      console.log('✅ Multi-item atomicity correctly preserved');
    }

    // 5. REMAINING FULFILLMENT
    const shipment2 = await ShippingService.createShipment(paidOrder.id, [
      { orderItemId: orderItemA.id, quantity: 1 },
      { orderItemId: orderItemB.id, quantity: 1 }
    ], ShippingProvider.MOCK);

    updatedOrder = await prisma.order.findUnique({ where: { id: paidOrder.id }});
    if (updatedOrder?.fulfillmentStatus !== FulfillmentStatus.FULFILLED) {
      throw new Error(`Order fulfillment status should be FULFILLED, got ${updatedOrder?.fulfillmentStatus}`);
    }
    console.log('✅ Full shipment allocation correctly transitions order to FULFILLED');

    // 6. SIMULATE TRACKING AND IDEMPOTENCY
    const now = Date.now();
    await ShippingService.processTrackingEvent(shipment1.id, {
      providerEventId: `evt_${now}_1`,
      status: ShipmentStatus.PICKED_UP,
      eventTime: new Date()
    });

    await ShippingService.processTrackingEvent(shipment1.id, {
      providerEventId: `evt_${now}_2`,
      status: ShipmentStatus.IN_TRANSIT,
      eventTime: new Date()
    });

    // Idempotent duplicate event
    await ShippingService.processTrackingEvent(shipment1.id, {
      providerEventId: `evt_${now}_2`,
      status: ShipmentStatus.OUT_FOR_DELIVERY, // Should ignore status because eventId is dup
      eventTime: new Date()
    });

    let s1 = await prisma.shipment.findUnique({ where: { id: shipment1.id }, include: { trackingEvents: true } });
    if (s1?.status !== ShipmentStatus.IN_TRANSIT) {
      throw new Error('Duplicate provider event ID should be ignored completely');
    }

    // Out of order retrograde protection
    await ShippingService.processTrackingEvent(shipment1.id, {
      providerEventId: `evt_${now}_3`,
      status: ShipmentStatus.PICKUP_SCHEDULED, // Older status arriving late
      eventTime: new Date()
    });

    s1 = await prisma.shipment.findUnique({ where: { id: shipment1.id }, include: { trackingEvents: true } });
    if (s1?.status !== ShipmentStatus.IN_TRANSIT) {
      throw new Error('Out of order retrograde status incorrectly modified shipment state');
    }

    console.log('✅ Webhook idempotency and state machine validation successful');

    // 7. DELIVERY TIMESTAMPS
    await ShippingService.processTrackingEvent(shipment1.id, {
      providerEventId: `evt_${now}_4`,
      status: ShipmentStatus.DELIVERED,
      eventTime: new Date()
    });

    s1 = await prisma.shipment.findUnique({ where: { id: shipment1.id }, include: { trackingEvents: true } });
    if (!s1?.deliveredAt) {
      throw new Error('deliveredAt was not set upon DELIVERED transition');
    }
    
    const deliveryTime = s1.deliveredAt;
    
    // Attempt duplicate delivery event to ensure timestamp doesn't change
    await ShippingService.processTrackingEvent(shipment1.id, {
      providerEventId: `evt_${now}_5`, // different event ID but same DELIVERED status
      status: ShipmentStatus.DELIVERED,
      eventTime: new Date(Date.now() + 10000)
    });

    s1 = await prisma.shipment.findUnique({ where: { id: shipment1.id }, include: { trackingEvents: true } });
    if (s1?.deliveredAt?.getTime() !== deliveryTime.getTime()) {
      throw new Error('deliveredAt was overwritten by a subsequent delivery event');
    }

    console.log('✅ Delivery timestamp idempotency successful');

    // 8. UNPAID ORDER REJECTION
    const orderAddress2 = await prisma.orderAddress.create({
      data: { name: 'Shipping 2', phone: '12345', line1: 'Street', city: 'City', state: 'State', postalCode: '1000', country: 'Country' }
    });

    const unpaidOrder = await prisma.order.create({
      data: {
        orderNumber: 'ORD-UNPAID-001',
        userId: customer.id,
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: 100,
        totalAmount: 100,
        shippingAddressId: orderAddress2.id,
        items: {
          create: [{ productId: product.id, sku: 'SKU-A', productName: 'Prod A', productSlug: product.slug, unitPrice: 100, quantity: 1, lineTotal: 100 }]
        }
      },
      include: { items: true }
    });

    try {
      await ShippingService.createShipment(unpaidOrder.id, [{ orderItemId: unpaidOrder.items[0].id, quantity: 1 }]);
      throw new Error('Unpaid order shipment should fail');
    } catch(e: any) {
      if (!e.message.includes('Cannot create shipment')) throw e;
      console.log('✅ Unpaid order shipment creation safely rejected');
    }

    console.log('--- ALL V11 TESTS PASSED ---');

  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

run();
