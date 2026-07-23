import { prisma } from '../src/lib/prisma';
import { ProductVariantService } from '../src/server/services/product-variant.service';
import { InventoryService } from '../src/server/services/inventory.service';
import { CartService } from '../src/server/services/cart.service';
import { OrderService } from '../src/server/services/order.service';
import { PaymentService } from '../src/server/services/payment.service';
import { RazorpayService } from '../src/server/services/razorpay.service';
import { ProductStatus, PaymentStatus } from '@prisma/client';
import crypto from 'crypto';
import { env } from '../src/utils/env';

async function run() {
  console.log('--- STARTING V9 RUNTIME TESTS ---');
  let failures = 0;

  function assert(condition: boolean, message: string) {
    if (!condition) {
      console.error(`❌ TEST FAILED: ${message}`);
      failures++;
    } else {
      console.log(`✅ ${message}`);
    }
  }

  try {
    // 0. Mock Razorpay network requests for local verification
    const originalCreateOrder = RazorpayService.createOrder;
    RazorpayService.createOrder = async (amount: number, receipt: string) => {
      console.log('--- Mocking LIVE RAZORPAY NETWORK VERIFICATION ---');
      return { id: 'order_mock_' + Date.now(), amount, currency: 'INR', receipt, status: 'created', attempts: 0 } as any;
    };

    // 1. Setup Test Data
    let user = await prisma.user.findFirst({ where: { email: 'v9-test@example.com' } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: 'v9-test@example.com', name: 'V9 Test', role: 'CUSTOMER', status: 'ACTIVE' }
      });
    }
    
    let address = await prisma.address.findFirst({ where: { userId: user.id } });
    if (!address) {
      address = await prisma.address.create({
        data: { userId: user.id, fullName: 'Test', phone: '123', addressLine1: 'Line 1', city: 'City', state: 'State', postalCode: '123', country: 'IN', isDefaultShipping: true }
      });
    }

    const cat = await prisma.category.create({ data: { name: 'V9 Cat', slug: 'v9-cat-' + Date.now() } });
    const prod = await prisma.product.create({
      data: { name: 'V9 Prod', slug: 'v9-prod-' + Date.now(), basePrice: 100000, categoryId: cat.id, status: 'PUBLISHED' }
    });
    const variantA = await prisma.productVariant.create({
      data: { productId: prod.id, sku: 'V9-SKU-A-' + Date.now(), price: 100000 }
    });
    
    const invA = await prisma.inventory.create({
      data: { variantId: variantA.id, quantity: 10, reservedQuantity: 0 }
    });

    // Clean cart
    await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });

    // 2. Add to Cart & Checkout (V8 mechanism)
    await CartService.addItem(user.id, { variantId: variantA.id, quantity: 2 });
    
    const orderIdemp = 'v9-checkout-' + Date.now();
    const order = await OrderService.createCheckoutOrder(user.id, { shippingAddressId: address.id }, orderIdemp);
    console.log('Order:', order);
    assert(order.status === 'PENDING_PAYMENT', 'Order created successfully');
    
    // Check initial inventory reservation
    const invRes = await prisma.inventory.findFirst({ where: { variantId: variantA.id } });
    console.log('invRes', invRes);
    assert(invRes?.reservedQuantity === 2 && invRes?.quantity === 10, 'Initial reservation correct');

    // 3. Payment Creation
    const payment = await PaymentService.createPaymentAttempt(user.id, order.id);
    assert(payment.amount === 200000 && payment.currency === 'INR', 'Payment attempt amount/currency derived correctly');
    assert(!!payment.providerOrderId, 'Razorpay provider order created');

    // Idempotency creation test
    const payment2 = await PaymentService.createPaymentAttempt(user.id, order.id);
    assert(payment.id === payment2.id && payment.providerOrderId === payment2.providerOrderId, 'Payment creation idempotency');

    // 4. Invalid Signature Verification
    try {
      await PaymentService.verifyCheckoutPayment(user.id, order.id, payment.providerOrderId, 'pay_fake', 'bad_signature');
      assert(false, 'Should have failed invalid signature');
    } catch (e: any) {
      assert(e.message === 'Invalid payment signature', 'Invalid signature rejected securely');
    }

    // 5. Valid Signature Verification (Local Cryptographic bypass)
    const mockPaymentId = 'pay_test_valid_' + Date.now();
    const validSignature = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(payment.providerOrderId + '|' + mockPaymentId)
      .digest('hex');

    const confirmedOrder = await PaymentService.verifyCheckoutPayment(
      user.id, 
      order.id, 
      payment.providerOrderId, 
      mockPaymentId, 
      validSignature
    );
    assert(confirmedOrder.status === 'CONFIRMED' && confirmedOrder.paymentStatus === 'PAID', 'Order confirmed on valid signature');

    // Check Inventory exactly-once commit
    const invCom = await prisma.inventory.findUnique({ where: { id: invA.id } });
    assert(invCom?.reservedQuantity === 0 && invCom?.quantity === 8, 'Inventory committed exactly once (2 reserved -> 0, 10 total -> 8)');

    // Check SALE audit
    const saleTx = await prisma.inventoryTransaction.findFirst({
      where: { inventoryId: invA.id, type: 'SALE' }
    });
    assert(!!saleTx && saleTx.quantityChange === -2, 'SALE audit created accurately');

    // Duplicate verification (Idempotency)
    const dupOrder = await PaymentService.verifyCheckoutPayment(
      user.id, 
      order.id, 
      payment.providerOrderId, 
      mockPaymentId, 
      validSignature
    );
    assert(dupOrder.status === 'CONFIRMED', 'Duplicate verification returns safe idempotent success');
    
    const invComDup = await prisma.inventory.findUnique({ where: { id: invA.id } });
    assert(invComDup?.reservedQuantity === 0 && invComDup?.quantity === 8, 'Idempotent verification prevented double stock commit');

    // 6. Webhook Idempotency & Raw Body Verification
    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: { entity: { id: mockPaymentId, order_id: payment.providerOrderId } }
      }
    });
    const webhookSig = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(webhookPayload).digest('hex');
    
    await PaymentService.processWebhook(webhookPayload, webhookSig); // First time via webhook
    await PaymentService.processWebhook(webhookPayload, webhookSig); // Second time via webhook
    
    const invComWebhook = await prisma.inventory.findUnique({ where: { id: invA.id } });
    assert(invComWebhook?.reservedQuantity === 0 && invComWebhook?.quantity === 8, 'Webhook safely processes idempotently without double commit');

    const webhookEventCount = await prisma.paymentWebhookEvent.count({
      where: { providerEventId: 'payment.captured_' + mockPaymentId }
    });
    assert(webhookEventCount === 1, 'Webhook event persistence deduplicated successfully');

    // 7. Cart Selective Cleanup
    const finalCart = await prisma.cartItem.findMany({ where: { cart: { userId: user.id } } });
    assert(finalCart.length === 0, 'Purchased cart items selectively cleaned up');

    // 8. Expiration Race Test
    // Create new order
    await CartService.addItem(user.id, { variantId: variantA.id, quantity: 1 });
    const orderRaceIdemp = 'v9-checkout-race-' + Date.now();
    const orderRace = await OrderService.createCheckoutOrder(user.id, { shippingAddressId: address.id }, orderRaceIdemp);
    
    // Manually expire order
    await prisma.order.update({ where: { id: orderRace.id }, data: { status: 'EXPIRED' } });
    await InventoryService.releaseStock(variantA.productId, variantA.id, { quantity: 1, reference: 'EXPIRE' });

    // Payment arrives late!
    const lateOrderId = 'order_late_' + Date.now();
    const latePayment = await prisma.payment.create({
      data: { orderId: orderRace.id, providerOrderId: lateOrderId, amount: 100000, currency: 'INR', status: 'PENDING' }
    });

    const lateFinalized = await PaymentService.finalizeSuccessfulPayment(orderRace.id, latePayment.id, lateOrderId, 'pay_late_' + Date.now());
    assert((lateFinalized as any).status === 'PAYMENT_REVIEW', 'Late captured payment for expired order correctly flags PAYMENT_REVIEW safely');

    const invRace = await prisma.inventory.findUnique({ where: { id: invA.id } });
    console.log('invRace', invRace);
    assert(invRace?.quantity === 8, 'Late payment review did NOT falsely commit unreserved stock');

    console.log('--- ALL V9 TESTS PASSED ---');
  } catch (err: any) {
    console.error('Test execution error:', err.message);
    failures++;
  } finally {
    if (failures > 0) {
      console.error(`\n❌ ${failures} TESTS FAILED`);
      process.exit(1);
    } else {
      console.log(`\n✅ ALL TESTS SUCCESSFUL`);
      process.exit(0);
    }
  }
}

run();
