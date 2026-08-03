import { prisma } from '../src/lib/prisma';
import { CartService } from '../src/server/services/cart.service';
import { OrderService } from '../src/server/services/order.service';
import { PaymentService } from '../src/server/services/payment.service';

async function prepareLatePaymentTest() {
  console.log('=============== RAZORPAY STEP 8 — LATE PAYMENT TEST PREPARATION ===============\n');

  const testEmail = 'srisakthi7890@gmail.com';
  const user = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!user) {
    console.error('❌ User not found');
    process.exit(1);
  }

  const variant = await prisma.productVariant.findFirst({
    where: { sku: 'RAZORPAY-TEST-SKU-001' }
  });
  if (!variant) {
    console.error('❌ Variant not found');
    process.exit(1);
  }

  const address = await prisma.address.findFirst({ where: { userId: user.id } });
  if (!address) {
    console.error('❌ Address not found');
    process.exit(1);
  }

  // --- PHASE A: Create Fresh Test Checkout ---
  console.log('Phase A: Creating fresh test checkout...');
  await CartService.clearCart(user.id);
  await CartService.addItem(user.id, { variantId: variant.id, quantity: 1 });

  const idempotencyKey = `idempotency-key-late-payment-${Date.now()}`;
  const order = await OrderService.createCheckoutOrder(
    user.id,
    { shippingAddressId: address.id, billingAddressId: address.id },
    idempotencyKey
  );

  const paymentAttempt = await PaymentService.createPaymentAttempt(user.id, order.id);

  const invPhaseA = await prisma.inventory.findUnique({ where: { variantId: variant.id } });
  const cartPhaseA = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });

  console.log('Phase A Results:');
  console.log(`- New Order ID: ${order.id}`);
  console.log(`- New Order Number: ${order.orderNumber}`);
  console.log(`- New Provider Order ID (Razorpay): ${paymentAttempt.providerOrderId}`);
  console.log(`- Order Status: ${order.status}`);
  console.log(`- Payment Status: ${paymentAttempt.currency} ${paymentAttempt.amount} (${order.paymentStatus})`);
  console.log(`- Inventory Quantity: ${invPhaseA?.quantity}`);
  console.log(`- Reserved Quantity: ${invPhaseA?.reservedQuantity}`);
  console.log(`- Cart Item Count: ${cartPhaseA?.items.length}`);

  // Assertions for Phase A
  if (order.status !== 'PENDING_PAYMENT' || invPhaseA?.reservedQuantity !== 1 || cartPhaseA?.items.length !== 1) {
    console.error('❌ Phase A Assertions Failed!');
    process.exit(1);
  }

  // --- PHASE B: Expire Order via OrderService.expirePendingOrders() ---
  console.log('\nPhase B: Making order eligible for expiry & invoking OrderService.expirePendingOrders()...');

  // Set reservationExpiresAt to 30 minutes in the past so it is eligible for expiry
  const pastExpiresAt = new Date(Date.now() - 30 * 60 * 1000);
  await prisma.order.update({
    where: { id: order.id },
    data: { reservationExpiresAt: pastExpiresAt }
  });

  // Call official application expiry service
  const expiryResults = await OrderService.expirePendingOrders();
  console.log(`- Expiry Service Results: ${JSON.stringify(expiryResults)}`);

  // Verify DB state after application expiry
  const orderPhaseB = await prisma.order.findUnique({ where: { id: order.id } });
  const paymentPhaseB = await prisma.payment.findUnique({ where: { id: paymentAttempt.id } });
  const invPhaseB = await prisma.inventory.findUnique({ where: { variantId: variant.id } });
  const cartPhaseB = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });

  console.log('\nPhase B Expiry Verification:');
  console.log(`- Order Status Transition: PENDING_PAYMENT -> ${orderPhaseB?.status}`);
  console.log(`- Payment Status: ${paymentPhaseB?.status}`);
  console.log(`- Reserved Quantity Transition: 1 -> ${invPhaseB?.reservedQuantity}`);
  console.log(`- Inventory Physical Quantity: ${invPhaseB?.quantity} (Unchanged)`);
  console.log(`- Cart Item Count: ${cartPhaseB?.items.length} (Intact)`);

  // Assertions for Phase B
  const isOrderExpired = orderPhaseB?.status === 'EXPIRED';
  const isReservedReleased = invPhaseB?.reservedQuantity === 0;
  const isQtyUnchanged = invPhaseB?.quantity === invPhaseA?.quantity;
  const isCartIntact = cartPhaseB?.items.length === 1;

  if (!isOrderExpired || !isReservedReleased || !isQtyUnchanged || !isCartIntact) {
    console.error('❌ Phase B Expiry Assertions Failed! Aborting before Phase C.');
    process.exit(1);
  }

  console.log('\n✅ Phase A and Phase B completed successfully with 100% assertion pass!');

  // Export metadata for Phase C script setup
  console.log('\nMETADATA_FOR_CHECKOUT:');
  console.log(JSON.stringify({
    orderId: order.id,
    orderNumber: order.orderNumber,
    providerOrderId: paymentAttempt.providerOrderId,
    amount: paymentAttempt.amount,
    currency: paymentAttempt.currency,
  }));

  await prisma.$disconnect();
}

prepareLatePaymentTest().catch(err => {
  console.error('❌ Late Payment Preparation Error:', err);
  process.exit(1);
});
