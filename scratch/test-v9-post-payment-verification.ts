import { prisma } from '../src/lib/prisma';
import { PaymentService } from '../src/server/services/payment.service';

async function verifyPostPaymentState() {
  console.log('=============== RAZORPAY POST-PAYMENT VERIFICATION ===============\n');

  const orderId = '646eed36-c67f-4315-8620-9d1b73cd8357';
  const providerOrderId = 'order_TJE1t5L41lt6sc';

  // 1. Inspect Order state
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true }
  });

  if (!order) {
    console.error('❌ Order not found');
    process.exit(1);
  }

  console.log('1. Application Order State:');
  console.log(`   - Order ID: ${order.id}`);
  console.log(`   - Order Number: ${order.orderNumber}`);
  console.log(`   - Status: ${order.status}`);
  console.log(`   - Payment Status: ${order.paymentStatus}`);
  console.log(`   - Total Amount: ${order.totalAmount} paise (${order.totalAmount / 100} INR)`);
  console.log(`   - Currency: ${order.currency}`);

  // 2. Inspect Payment record
  const payment = order.payments.find(p => p.providerOrderId === providerOrderId);
  console.log('\n2. Payment Record State:');
  console.log(`   - Payment ID: ${payment?.id}`);
  console.log(`   - Provider Order ID: ${payment?.providerOrderId}`);
  console.log(`   - Provider Payment ID: ${payment?.providerPaymentId}`);
  console.log(`   - Payment Status: ${payment?.status}`);
  console.log(`   - Signature Verified: ${payment?.signatureVerified}`);
  console.log(`   - Amount: ${payment?.amount}`);
  console.log(`   - Paid At: ${payment?.paidAt}`);

  // 3. Inspect Inventory state
  const variantId = order.items[0]?.variantId;
  let inventory = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let inventoryTx: any[] = [];
  if (variantId) {
    inventory = await prisma.inventory.findUnique({ where: { variantId } });
    inventoryTx = await prisma.inventoryTransaction.findMany({
      where: { inventoryId: inventory?.id },
      orderBy: { createdAt: 'asc' }
    });
  }

  console.log('\n3. Inventory & Audit Trail State:');
  console.log(`   - Available Quantity: ${inventory?.quantity}`);
  console.log(`   - Reserved Quantity: ${inventory?.reservedQuantity}`);
  console.log(`   - Inventory Transactions Count: ${inventoryTx.length}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inventoryTx.forEach((tx: any, idx: number) => {
    console.log(`     [Tx ${idx + 1}] Type: ${tx.type}, Change: ${tx.quantityChange}, QtyBefore: ${tx.quantityBefore}, QtyAfter: ${tx.quantityAfter}, ResBefore: ${tx.reservedBefore}, ResAfter: ${tx.reservedAfter}, Ref: ${tx.reference}`);
  });

  // 4. Inspect Cart state
  const cart = await prisma.cart.findUnique({
    where: { userId: order.userId },
    include: { items: true }
  });

  console.log('\n4. Cart State:');
  console.log(`   - Cart Items Remaining: ${cart?.items.length}`);

  // 5. Inspect Payment Webhook Events Table
  const webhookEvents = await prisma.paymentWebhookEvent.findMany({
    orderBy: { createdAt: 'asc' }
  });

  console.log('\n5. Webhook Events Audit:');
  console.log(`   - Webhook Events Count: ${webhookEvents.length}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webhookEvents.forEach((evt: any, idx: number) => {
    console.log(`     [Event ${idx + 1}] Provider Event ID: ${evt.providerEventId}, Type: ${evt.eventType}, ProcessedAt: ${evt.processedAt}`);
  });

  // 6. Test Webhook Idempotency by re-processing the webhook or calling finalize
  console.log('\n6. Testing Idempotency & Duplicate Replay Protection...');
  const initialQuantity = inventory?.quantity;
  const initialReserved = inventory?.reservedQuantity;

  // Attempt second finalization call
  if (payment) {
    await PaymentService.finalizeSuccessfulPayment(order.id, payment.id, providerOrderId, payment.providerPaymentId || 'pay_test_dummy');
  }

  const inventoryAfterReplay = await prisma.inventory.findUnique({ where: { variantId: variantId! } });
  console.log(`   - Quantity After Idempotent Finalization Replay: ${inventoryAfterReplay?.quantity} (Initial: ${initialQuantity})`);
  console.log(`   - Reserved After Idempotent Finalization Replay: ${inventoryAfterReplay?.reservedQuantity} (Initial: ${initialReserved})`);
  console.log(`   - Idempotency Protected (No double stock deduction): ${inventoryAfterReplay?.quantity === initialQuantity && inventoryAfterReplay?.reservedQuantity === initialReserved}`);

  await prisma.$disconnect();

  console.log('\n=============== VERIFICATION COMPLETED ===============\n');
}

verifyPostPaymentState().catch(err => {
  console.error('❌ Verification Error:', err);
  process.exit(1);
});
