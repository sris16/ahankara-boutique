import { ShippingService } from '../src/server/services/shipping.service';
import { ShippingProvider } from '@prisma/client';
import { prisma } from '../src/lib/prisma';

async function testShiprocketShipmentCreation() {
  console.log('=============== SHIPROCKET STEP 3 — REAL LIVE SHIPMENT CREATION ===============\n');

  const orderId = '646eed36-c67f-4315-8620-9d1b73cd8357';
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shippingAddress: true, shipments: true }
  });

  if (!order) {
    console.error('❌ Target Order not found');
    process.exit(1);
  }

  console.log('Target Order State:');
  console.log(`- Order ID: ${order.id}`);
  console.log(`- Order Number: ${order.orderNumber}`);
  console.log(`- Status: ${order.status}`);
  console.log(`- Payment Status: ${order.paymentStatus}`);
  console.log(`- Item to ship: ${order.items[0]?.productName} (${order.items[0]?.sku})`);

  const itemsToShip = [
    { orderItemId: order.items[0].id, quantity: 1 }
  ];

  console.log('\nExecuting REAL Shiprocket Shipment Creation via ShippingService.createShipment...');

  const shipment = await ShippingService.createShipment(
    order.id,
    itemsToShip,
    ShippingProvider.SHIPROCKET
  );

  console.log('\nShipment Creation Results:');
  console.log(`- Shipment Record ID: ${shipment.id}`);
  console.log(`- Provider: ${shipment.provider}`);
  console.log(`- Provider Shipment ID (Shiprocket): ${shipment.providerShipmentId}`);
  console.log(`- Status: ${shipment.status}`);
  console.log(`- Tracking Number: ${shipment.trackingNumber || 'N/A'}`);

  // Fetch updated DB order fulfillment status
  const updatedOrder = await prisma.order.findUnique({ where: { id: orderId } });
  console.log(`- Updated Order Fulfillment Status: ${updatedOrder?.fulfillmentStatus}`);

  if (!shipment.providerShipmentId || shipment.provider !== 'SHIPROCKET') {
    console.error('❌ Shiprocket Shipment Creation Verification FAILED');
    process.exit(1);
  }

  console.log('\n=============== SHIPROCKET SHIPMENT CREATION SUCCESSFUL ===============\n');
}

testShiprocketShipmentCreation().catch(err => {
  console.error('❌ Shiprocket Shipment Creation Error:', err);
  process.exit(1);
});
