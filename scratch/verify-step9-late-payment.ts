import { prisma } from '../src/lib/prisma';
import { PaymentService } from '../src/server/services/payment.service';

async function verifyStep9LatePayment() {
  console.log('=============== RAZORPAY STEP 9 — LATE PAYMENT FINAL VERIFICATION ===============\n');

  const lateOrderId = '98b4cc24-3810-44e4-9ac8-65a783e8d150';
  const lateProviderOrderId = 'order_TJEMF8fKs3qMxK';
  const prevOrderId = '646eed36-c67f-4315-8620-9d1b73cd8357';

  // 1. Inspect Late Order state
  const lateOrder = await prisma.order.findUnique({
    where: { id: lateOrderId },
    include: { items: true, payments: true }
  });

  if (!lateOrder) {
    console.error('❌ Late Order not found');
    process.exit(1);
  }

  const latePayment = lateOrder.payments.find(p => p.providerOrderId === lateProviderOrderId);

  console.log('1. Late Order State:');
  console.log(`   - Order ID: ${lateOrder.id}`);
  console.log(`   - Order Number: ${lateOrder.orderNumber}`);
  console.log(`   - Status: ${lateOrder.status}`);
  console.log(`   - Payment Status: ${lateOrder.paymentStatus}`);
  console.log(`   - Total Amount: ${lateOrder.totalAmount} paise (${lateOrder.totalAmount / 100} INR)`);
  console.log(`   - Currency: ${lateOrder.currency}`);

  console.log('\n2. Late Payment Record State:');
  console.log(`   - Payment ID: ${latePayment?.id}`);
  console.log(`   - Provider Order ID: ${latePayment?.providerOrderId}`);
  console.log(`   - Provider Payment ID: ${latePayment?.providerPaymentId}`);
  console.log(`   - Payment Status: ${latePayment?.status}`);
  console.log(`   - Signature Verified: ${latePayment?.signatureVerified}`);
  console.log(`   - Amount: ${latePayment?.amount}`);
  console.log(`   - Paid At: ${latePayment?.paidAt}`);

  // 3. Inspect Inventory state
  const variantId = lateOrder.items[0]?.variantId;
  const inventory = await prisma.inventory.findUnique({ where: { variantId: variantId! } });
  const inventoryTx = await prisma.inventoryTransaction.findMany({
    where: { inventoryId: inventory?.id },
    orderBy: { createdAt: 'asc' }
  });

  console.log('\n3. Inventory State:');
  console.log(`   - Available Quantity: ${inventory?.quantity}`);
  console.log(`   - Reserved Quantity: ${inventory?.reservedQuantity}`);
  console.log(`   - Inventory Transactions Count: ${inventoryTx.length}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inventoryTx.forEach((tx: any, idx: number) => {
    console.log(`     [Tx ${idx + 1}] Type: ${tx.type}, Change: ${tx.quantityChange}, QtyBefore: ${tx.quantityBefore}, QtyAfter: ${tx.quantityAfter}, ResBefore: ${tx.reservedBefore}, ResAfter: ${tx.reservedAfter}, Ref: ${tx.reference}`);
  });

  // Check if any SALE audit transaction was created for late order
  const lateOrderSaleTx = inventoryTx.find(tx => tx.type === 'SALE' && tx.reference?.includes(lateOrder.orderNumber));
  console.log(`   - SALE Audit Created for Late Order: ${!!lateOrderSaleTx}`);

  // 4. Inspect Cart state
  const cart = await prisma.cart.findUnique({
    where: { userId: lateOrder.userId },
    include: { items: true }
  });

  console.log('\n4. Cart State:');
  console.log(`   - Cart Items Remaining: ${cart?.items.length}`);

  // 5. If Payment status is still PENDING (because handler in test-checkout.html only logged payment),
  // execute finalization with simulated real provider payment ID or process finalization
  if (latePayment && latePayment.status === 'PENDING') {
    console.log('\n5. Executing Payment finalization for captured Late Payment...');
    const simulatedProviderPaymentId = 'pay_late_test_real_001';
    await PaymentService.finalizeSuccessfulPayment(lateOrder.id, latePayment.id, lateProviderOrderId, simulatedProviderPaymentId);
  }

  // Refetch Late Order and Payment after finalization
  const lateOrderFinal = await prisma.order.findUnique({
    where: { id: lateOrderId },
    include: { items: true, payments: true }
  });
  const latePaymentFinal = lateOrderFinal?.payments.find(p => p.providerOrderId === lateProviderOrderId);
  const inventoryFinal = await prisma.inventory.findUnique({ where: { variantId: variantId! } });
  const cartFinal = await prisma.cart.findUnique({
    where: { userId: lateOrder.userId },
    include: { items: true }
  });

  console.log('\n6. Final State After Late Payment Processing:');
  console.log(`   - Order Status: ${lateOrderFinal?.status} (Expected: PAYMENT_REVIEW)`);
  console.log(`   - Order Payment Status: ${lateOrderFinal?.paymentStatus} (Expected: PAID)`);
  console.log(`   - Payment Status: ${latePaymentFinal?.status} (Expected: PAID)`);
  console.log(`   - Provider Payment ID: ${latePaymentFinal?.providerPaymentId}`);
  console.log(`   - Physical Stock Quantity: ${inventoryFinal?.quantity} (Expected: 99)`);
  console.log(`   - Reserved Quantity: ${inventoryFinal?.reservedQuantity} (Expected: 0)`);
  console.log(`   - Cart Items Remaining: ${cartFinal?.items.length} (Expected: 1)`);

  // 7. Test Idempotency Replay on PAYMENT_REVIEW Order
  console.log('\n7. Testing Late Payment Replay Idempotency...');
  if (lateOrderFinal && latePaymentFinal) {
    await PaymentService.finalizeSuccessfulPayment(lateOrderFinal.id, latePaymentFinal.id, lateProviderOrderId, latePaymentFinal.providerPaymentId || 'pay_late_test_real_001');
  }
  const inventoryAfterReplay = await prisma.inventory.findUnique({ where: { variantId: variantId! } });
  const cartAfterReplay = await prisma.cart.findUnique({ where: { userId: lateOrder.userId }, include: { items: true } });
  console.log(`   - Stock After Replay: ${inventoryAfterReplay?.quantity} (Expected: 99)`);
  console.log(`   - Reserved After Replay: ${inventoryAfterReplay?.reservedQuantity} (Expected: 0)`);
  console.log(`   - Cart After Replay: ${cartAfterReplay?.items.length} (Expected: 1)`);

  // 8. Verify Previous Successful Order Integrity
  const prevOrder = await prisma.order.findUnique({ where: { id: prevOrderId }, include: { payments: true } });
  console.log('\n8. Previous Successful Order Integrity:');
  console.log(`   - Previous Order ID: ${prevOrder?.id}`);
  console.log(`   - Previous Order Status: ${prevOrder?.status} (Expected: CONFIRMED)`);
  console.log(`   - Previous Order Payment Status: ${prevOrder?.paymentStatus} (Expected: PAID)`);

  await prisma.$disconnect();
  console.log('\n=============== STEP 9 VERIFICATION COMPLETED ===============\n');
}

verifyStep9LatePayment().catch(err => {
  console.error('❌ Verification Error:', err);
  process.exit(1);
});
