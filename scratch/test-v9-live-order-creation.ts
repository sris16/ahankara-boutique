import { prisma } from '../src/lib/prisma';
import { CartService } from '../src/server/services/cart.service';
import { OrderService } from '../src/server/services/order.service';
import { PaymentService } from '../src/server/services/payment.service';
import { UserRole, UserStatus, ProductStatus } from '@prisma/client';

async function testLiveRazorpayOrderCreation() {
  console.log('=============== RAZORPAY STEP 5 — REAL TEST MODE ORDER CREATION ===============\n');

  // 1. Ensure test customer exists
  const testEmail = 'srisakthi7890@gmail.com';
  let user = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Sri Sakthi',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      }
    });
  }

  // 2. Ensure test Category & Product with Variant exist
  let category = await prisma.category.findFirst({ where: { slug: 'test-category-razorpay' } });
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'Test Category', slug: 'test-category-razorpay', isActive: true }
    });
  }

  let product = await prisma.product.findFirst({ where: { slug: 'test-product-razorpay' } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: 'Test Boutique Sari',
        slug: 'test-product-razorpay',
        basePrice: 150000, // 1500.00 INR (150000 paise)
        categoryId: category.id,
        status: ProductStatus.PUBLISHED,
      }
    });
  }

  let variant = await prisma.productVariant.findFirst({ where: { productId: product.id } });
  if (!variant) {
    variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: 'RAZORPAY-TEST-SKU-001',
        size: 'Free Size',
        color: 'Silk Blue',
        price: 150000,
        isActive: true,
      }
    });
  }

  // Ensure stock exists in inventory
  await prisma.inventory.upsert({
    where: { variantId: variant.id },
    create: { variantId: variant.id, quantity: 100, reservedQuantity: 0 },
    update: { quantity: 100 }
  });

  // 3. Ensure test Address exists
  let address = await prisma.address.findFirst({ where: { userId: user.id } });
  if (!address) {
    address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: 'Sri Sakthi',
        phone: '9876543210',
        addressLine1: '123 Boutique Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600001',
        country: 'India',
        isDefaultShipping: true,
        isDefaultBilling: true,
      }
    });
  }

  // 4. Populate Cart with 1 item
  await CartService.clearCart(user.id);
  await CartService.addItem(user.id, { variantId: variant.id, quantity: 1 });

  // 5. Create Checkout Order
  console.log('Creating application checkout order...');
  const idempotencyKey = `idempotency-key-live-razorpay-${Date.now()}`;
  const order = await OrderService.createCheckoutOrder(
    user.id,
    { shippingAddressId: address.id, billingAddressId: address.id },
    idempotencyKey
  );

  console.log(`- Application Order ID: ${order.id}`);
  console.log(`- Order Number: ${order.orderNumber}`);
  console.log(`- Order Total Amount: ${order.totalAmount} paise (INR ${order.totalAmount / 100})`);
  console.log(`- Order Status Before Payment: ${order.status}`);
  console.log(`- Payment Status Before Payment: ${order.paymentStatus}`);

  // Inspect inventory state before payment
  const inventoryBefore = await prisma.inventory.findUnique({ where: { variantId: variant.id } });
  console.log(`- Stock Quantity Before Payment: ${inventoryBefore?.quantity}`);
  console.log(`- Reserved Stock Before Payment: ${inventoryBefore?.reservedQuantity}`);

  // Inspect cart state before payment
  const cartBefore = await prisma.cart.findUnique({ where: { userId: user.id }, include: { items: true } });
  console.log(`- Cart Item Count Before Payment: ${cartBefore?.items.length}`);

  // 6. Execute REAL Razorpay Order Creation Attempt
  console.log('\nExecuting REAL Razorpay Order Creation via PaymentService.createPaymentAttempt...');
  const paymentAttempt1 = await PaymentService.createPaymentAttempt(user.id, order.id);

  console.log('REAL Razorpay Network Order Response Received:');
  console.log(`- Payment Record ID: ${paymentAttempt1.id}`);
  console.log(`- Provider Order ID (Razorpay): ${paymentAttempt1.providerOrderId}`);
  console.log(`- Amount Sent: ${paymentAttempt1.amount} paise`);
  console.log(`- Currency: ${paymentAttempt1.currency}`);
  console.log(`- Provider Order ID Prefix Check (starts with 'order_'): ${paymentAttempt1.providerOrderId.startsWith('order_')}`);

  // 7. Verify DB persistence of Payment record
  const dbPayment = await prisma.payment.findUnique({ where: { id: paymentAttempt1.id } });
  console.log(`- DB Persisted Payment Provider Order ID: ${dbPayment?.providerOrderId}`);
  console.log(`- DB Payment Status: ${dbPayment?.status}`);

  // 8. Test Payment-Attempt Idempotency by calling createPaymentAttempt second time
  console.log('\nTesting Payment Attempt Idempotency (calling createPaymentAttempt second time)...');
  const paymentAttempt2 = await PaymentService.createPaymentAttempt(user.id, order.id);
  console.log(`- Second Call Payment ID: ${paymentAttempt2.id}`);
  console.log(`- Second Call Provider Order ID: ${paymentAttempt2.providerOrderId}`);
  console.log(`- Idempotency Verification (Same Provider Order ID Returned): ${paymentAttempt1.providerOrderId === paymentAttempt2.providerOrderId}`);

  const totalPaymentCount = await prisma.payment.count({ where: { orderId: order.id } });
  console.log(`- Total Payment Attempts in DB for this Order: ${totalPaymentCount}`);

  await prisma.$disconnect();

  console.log('\n=============== STEP 5 TEST COMPLETED ===============\n');
}

testLiveRazorpayOrderCreation().catch(err => {
  console.error('❌ Razorpay Live Order Creation Failed:', err);
  process.exit(1);
});
