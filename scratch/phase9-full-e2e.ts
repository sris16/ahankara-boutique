import { PaymentStatus, OrderStatus, FulfillmentStatus, ShipmentStatus } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import crypto from 'crypto';

const uuidv4 = () => crypto.randomUUID();
const BASE_URL = 'http://localhost:3001/api';

const PREFIX = 'p9_e2e_';
const EMAILS = {
  ADMIN: `${PREFIX}admin@example.com`,
  CUST_A: `${PREFIX}custa@example.com`,
  CUST_B: `${PREFIX}custb@example.com`,
};
const PASS = 'TestP@ssw0rd!';

async function runTest(name: string, path: string, method: string, body: any, cookie: string, expectedStatus: number | number[], headersOverrides: Record<string, string> = {}) {
  console.log(`\n▶ [${method}] ${path}`);
  console.log(`  Test: ${name}`);
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3000',
      ...(cookie ? { 'Cookie': cookie } : {}),
      ...headersOverrides
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const isSuccess = Array.isArray(expectedStatus) ? expectedStatus.includes(res.status) : res.status === expectedStatus;
  console.log(`  PASS/FAIL: ${isSuccess ? 'PASS' : 'FAIL'} (Got ${res.status}, Expected: ${Array.isArray(expectedStatus) ? expectedStatus.join(' or ') : expectedStatus})`);
  
  const resBody = await res.text();
  if (!isSuccess) {
    console.error(`  Failed condition or status. Data: ${resBody}`);
  }
  return { status: res.status, ok: res.ok, data: resBody ? JSON.parse(resBody) : null };
}

async function signupAndGetCookie(email: string, role: string) {
  let res = await fetch(`${BASE_URL}/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ email, password: PASS, name: role })
  });
  if (res.status === 429) {
    console.log(`Rate limit hit on signup for ${email}. Waiting 20 seconds...`);
    await new Promise(r => setTimeout(r, 20000));
    res = await fetch(`${BASE_URL}/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({ email, password: PASS, name: role })
    });
  }
  
  if (res.status === 429) {
    console.log(`Rate limit hit on signup for ${email}. Waiting 6 seconds...`);
    await new Promise(r => setTimeout(r, 6000));
    res = await fetch(`${BASE_URL}/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({ email, password: PASS, name: role })
    });
  }

  if (!res.ok) throw new Error(`Signup failed: ${res.status} - ${await res.text()}`);
  const data = await res.json();
  const userId = data.user.id;
  
  if (role === 'ADMIN') {
    await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
  }

  await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });

  let loginRes = await fetch(`${BASE_URL}/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ email, password: PASS })
  });
  
  if (loginRes.status === 429) {
    await new Promise(r => setTimeout(r, 6000));
    loginRes = await fetch(`${BASE_URL}/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({ email, password: PASS })
    });
  }
  
  const cookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie') || ''];
  const sessionCookie = cookies.map(c => c.split(';')[0]).join('; ');
  if (!sessionCookie) throw new Error('No session cookie generated');
  
  return { userId, cookie: sessionCookie };
}

async function cleanup() {
  console.log('\nCleaning up Phase 9 test data...');
  await prisma.inventoryTransaction.deleteMany({ where: { inventory: { variant: { product: { slug: { startsWith: PREFIX } } } } } });
  await prisma.inventory.deleteMany({ where: { variant: { product: { slug: { startsWith: PREFIX } } } } });
  await prisma.refund.deleteMany({ where: { order: { user: { email: { in: Object.values(EMAILS) } } } } });
  await prisma.returnItem.deleteMany({ where: { returnRequest: { user: { email: { in: Object.values(EMAILS) } } } } });
  await prisma.returnRequest.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });
  await prisma.exchangeItem.deleteMany({ where: { exchangeRequest: { user: { email: { in: Object.values(EMAILS) } } } } });
  await prisma.exchangeRequest.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });
  await prisma.orderCancellation.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });
  await prisma.shipmentTrackingEvent.deleteMany({ where: { shipment: { order: { user: { email: { in: Object.values(EMAILS) } } } } } });
  await prisma.shipmentItem.deleteMany({ where: { shipment: { order: { user: { email: { in: Object.values(EMAILS) } } } } } });
  await prisma.shipment.deleteMany({ where: { order: { user: { email: { in: Object.values(EMAILS) } } } } });
  await prisma.orderItem.deleteMany({ where: { order: { user: { email: { in: Object.values(EMAILS) } } } } });
  await prisma.payment.deleteMany({ where: { order: { user: { email: { in: Object.values(EMAILS) } } } } });
  await prisma.couponRedemption.deleteMany({ where: { order: { user: { email: { in: Object.values(EMAILS) } } } } });
  await prisma.order.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });
  await prisma.orderAddress.deleteMany({ where: { name: 'Test User' } });
  
  await prisma.cartItem.deleteMany({ where: { cart: { user: { email: { in: Object.values(EMAILS) } } } } });
  await prisma.cart.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });
  
  await prisma.wishlistItem.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });

  await prisma.coupon.deleteMany({ where: { code: { startsWith: PREFIX.toUpperCase() } } });
  await prisma.address.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });
  await prisma.session.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });
  await prisma.account.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } });
  await prisma.productVariant.deleteMany({ where: { product: { slug: { startsWith: PREFIX } } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  console.log('Cleanup complete.');
}

async function execute() {
  console.log('\n==================================================');
  console.log('PHASE 9: FULL END-TO-END CUSTOMER JOURNEY');
  console.log('==================================================\n');

  try {
    await cleanup();

    // ----------------------------------------------------
    // SETUP
    // ----------------------------------------------------
    console.log('\n--- SETUP ---');
    const cat = await prisma.category.create({ data: { name: 'Phase9 Test Category', slug: `${PREFIX}cat`, description: 'Test' } });
    const p1 = await prisma.product.create({
      data: { name: 'Phase9 Product 1', slug: `${PREFIX}prod1`, basePrice: 1000, categoryId: cat.id, isFeatured: true, status: 'PUBLISHED' }
    });
    const p1v1 = await prisma.productVariant.create({
      data: { productId: p1.id, sku: `${PREFIX}SKU1`, size: 'M', color: 'Red', price: 1000 }
    });
    const inv1 = await prisma.inventory.create({
      data: { variantId: p1v1.id, quantity: 10, reservedQuantity: 0, lowStockThreshold: 2 }
    });
    const coupon = await prisma.coupon.create({
      data: { name: 'Phase 9 Coupon', code: `${PREFIX.toUpperCase()}10OFF`, type: 'PERCENTAGE', value: 10, isActive: true, usageLimit: 100 }
    });
    console.log('Test catalog and coupon created.');

    const { userId: adminId, cookie: cookieAdmin } = await signupAndGetCookie(EMAILS.ADMIN, 'ADMIN');
    const { userId: custAId, cookie: cookieA } = await signupAndGetCookie(EMAILS.CUST_A, 'CUSTOMER');
    const { userId: custBId, cookie: cookieB } = await signupAndGetCookie(EMAILS.CUST_B, 'CUSTOMER');

    const addrA = await prisma.address.create({
      data: { userId: custAId, fullName: 'Test User', phone: '9999999999', addressLine1: 'Test Address', city: 'Test City', state: 'Test State', postalCode: '111111', country: 'India', type: 'HOME' }
    });

    // ----------------------------------------------------
    // JOURNEY START
    // ----------------------------------------------------
    console.log('\n--- CUSTOMER JOURNEY ---');

    await runTest('1. Verify Session (/api/me)', `/me`, 'GET', null, cookieA, 200);
    
    // Catalog Discovery
    const catalogRes = await runTest('2. Public Catalog Discovery', `/products`, 'GET', null, '', 200);
    let products = catalogRes.data?.products || catalogRes.data?.data || catalogRes.data;
    if (!Array.isArray(products)) {
      console.log('DEBUG: catalogRes.data =', JSON.stringify(catalogRes.data).substring(0, 200));
      products = [];
    }
    if (!products.find((p: any) => p.slug === p1.slug)) console.error('FAIL: Test product not found in catalog');
    else console.log('PASS: Test product is visible in public catalog');

    // Wishlist
    const wlAddRes = await runTest('3. Add to Wishlist', `/me/wishlist`, 'POST', { productId: p1.id }, cookieA, [200, 201]);
    let wishlistItemId = wlAddRes.data?.data?.wishlistItem?.id || wlAddRes.data?.data?.id || wlAddRes.data?.wishlistItem?.id;
    if (!wishlistItemId) {
       const wlGetRes = await runTest('Get wishlist to find ID', '/me/wishlist', 'GET', null, cookieA, [200]);
       wishlistItemId = wlGetRes.data?.data?.[0]?.id;
    }
    
    await runTest('4. Move Wishlist to Cart', `/me/wishlist/${wishlistItemId}/move-to-cart`, 'POST', { variantId: p1v1.id, quantity: 1 }, cookieA, [200, 201]);
    
    const wlCheck = await runTest('5. Check Wishlist is empty', `/me/wishlist`, 'GET', null, cookieA, 200);
    if (wlCheck.data?.data?.length === 0) console.log('PASS: Wishlist cleared properly');
    else console.error('FAIL: Wishlist not cleared');

    // Cart Management
    const cartCheck = await runTest('6. Check Cart has item', `/me/cart`, 'GET', null, cookieA, 200);
    const cartItem = cartCheck.data?.data?.items?.find((i: any) => i.variantId === p1v1.id);
    if (!cartItem) {
      console.error('FAIL: Cart does not contain the moved item');
    } else {
      await runTest('7. Update Cart Quantity', `/me/cart/items/${cartItem.id}`, 'PUT', { quantity: 2 }, cookieA, 200);
    }
    
    // Coupon Validation
    const valFixed = await runTest('8. Validate Coupon', '/me/cart/coupon/validate', 'POST', { code: coupon.code }, cookieA, 200);
    if (valFixed.data?.success || valFixed.data?.data?.code === coupon.code) console.log('PASS: Coupon validated');
    else console.error('FAIL: Coupon validation failed');

    // Checkout
    const idemp1 = uuidv4();
    const checkoutRes = await runTest('10. Checkout', `/me/checkout`, 'POST', { shippingAddressId: addrA.id, billingAddressId: addrA.id, couponCode: coupon.code }, cookieA, 201, { 'Idempotency-Key': idemp1 });
    const order1Id = checkoutRes.data?.data?.id;

    const invCheck1 = await prisma.inventory.findUnique({ where: { id: inv1.id } });
    if (invCheck1?.reservedQuantity === 2) console.log('PASS: Inventory physically reserved correctly.');
    else console.error(`FAIL: Inventory reservation incorrect. Expected 2, got ${invCheck1?.reservedQuantity}`);

    await runTest('11. Checkout Idempotency', `/me/checkout`, 'POST', { shippingAddressId: addrA.id, billingAddressId: addrA.id }, cookieA, 201, { 'Idempotency-Key': idemp1 });
    
    const invCheck2 = await prisma.inventory.findUnique({ where: { id: inv1.id } });
    if (invCheck2?.reservedQuantity === 2) console.log('PASS: Idempotency prevented duplicate inventory reservations.');
    else console.error(`FAIL: Idempotency broken. Reserved Qty = ${invCheck2?.reservedQuantity}`);

    // Mock Payment (Fulfilling the PENDING order)
    console.log('\n--- PAYMENT & FULFILLMENT ---');
    // Using internal mock service / webhook logic simulation. We'll directly patch via Prisma to mimic webhook success since Phase 9 shouldn't trigger Razorpay.
    await prisma.payment.create({
      data: { order: { connect: { id: order1Id } }, provider: 'RAZORPAY', providerOrderId: 'mock_pay_1', providerPaymentId: 'mock_pay_1', amount: 1800, currency: 'INR', status: 'PAID' }
    });
    await prisma.order.update({
      where: { id: order1Id }, data: { status: 'CONFIRMED', paymentStatus: 'PAID' }
    });
    // Physically deduct the reservation as payment succeeded.
    await prisma.inventory.update({
      where: { id: inv1.id }, data: { quantity: 8, reservedQuantity: 0 }
    });
    console.log('Simulated Payment Webhook Success (Reservation -> Permanent Deduction)');

    // Shipping & Tracking
    // First Admin creates shipment
    const shipmentRes = await runTest('12. Admin Create Shipment', `/admin/orders/${order1Id}/shipments`, 'POST', {
        provider: 'MOCK',
        trackingNumber: 'MOCK_AWB_12345',
        shippingCost: 0,
        items: [{ variantId: p1v1.id, quantity: 2 }]
    }, cookieAdmin, [200, 201]);
    const shipmentId = shipmentRes.data?.data?.id;

    // Simulate tracking events directly or via API if tracking webhook endpoint exists. We'll insert mock events to test retrieval.
    if (shipmentId) {
      await prisma.shipmentTrackingEvent.createMany({
        data: [
          { shipmentId, status: 'SHIPMENT_CREATED', location: 'Warehouse', message: 'Packed', providerEventId: 'mock1', eventTime: new Date() },
          { shipmentId, status: 'DELIVERED', location: 'Customer', message: 'Delivered to customer', providerEventId: 'mock2', eventTime: new Date() }
        ]
      });
      await prisma.order.update({ where: { id: order1Id }, data: { fulfillmentStatus: 'DELIVERED' } });
      await prisma.shipment.update({ where: { id: shipmentId }, data: { status: 'DELIVERED' } });
      console.log('Simulated Mock Tracking Events to DELIVERED');
    }

    // Customer Views Order
    const orderView = await runTest('13. Customer Views Confirmed Order', `/me/orders/${order1Id}`, 'GET', null, cookieA, 200);
    if (orderView.data?.data?.fulfillmentStatus === 'DELIVERED') console.log('PASS: Order fulfillment state correctly reflects DELIVERED to customer.');
    else console.error('FAIL: Order state is not DELIVERED.');

    // ----------------------------------------------------
    // RETURNS, EXCHANGES & REFUNDS
    // ----------------------------------------------------
    console.log('\n--- RETURNS & EXCHANGES ---');
    // Return Request
    const returnReqRes = await runTest('14. Request Return on Delivered Order', `/me/orders/${order1Id}/returns`, 'POST', {
      items: [{ variantId: p1v1.id, quantity: 1, reason: 'DEFECTIVE', customerNote: 'Damaged' }]
    }, cookieA, [200, 201]);

    const returnReqId = returnReqRes.data?.data?.id;

    // Refund Generation Mock (Max Refund verification)
    await prisma.refund.create({
        data: {
          orderId: order1Id, amount: 900, status: 'SUCCEEDED', reason: 'RETURN', returnRequestId: returnReqId, providerRefundId: 'mock_refund_1', idempotencyKey: uuidv4()
        }
    });
    console.log('Simulated partial Refund success via mock provider.');

    // Secondary Cancellation flow (Unpaid Order)
    const idemp2 = uuidv4();
    // Cart is already cleared by previous checkout, just add new item
    await fetch(`${BASE_URL}/me/cart/items`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Cookie': cookieA, 'Origin': 'http://localhost:3000' }, body: JSON.stringify({ variantId: p1v1.id, quantity: 1 }) });
    const checkoutRes2 = await runTest('15. Checkout Secondary Order', `/me/checkout`, 'POST', { shippingAddressId: addrA.id, billingAddressId: addrA.id }, cookieA, 201, { 'Idempotency-Key': idemp2 });
    const order2Id = checkoutRes2.data?.data?.id;

    await runTest('16. Cancel Unpaid Secondary Order', `/me/orders/${order2Id}/cancel`, 'POST', { reason: 'Changed mind' }, cookieA, 200);

    const invCheck3 = await prisma.inventory.findUnique({ where: { id: inv1.id } });
    if (invCheck3?.reservedQuantity === 0) console.log('PASS: Post-cancellation reservation released cleanly.');
    else console.error(`FAIL: Reservation not released. Reserved Qty = ${invCheck3?.reservedQuantity}`);


    // ----------------------------------------------------
    // SECURITY & ISOLATION
    // ----------------------------------------------------
    console.log('\n--- ISOLATION & SECURITY ---');
    await runTest('17. Customer B attempts to access Customer A order', `/me/orders/${order1Id}`, 'GET', null, cookieB, [401, 403, 404]);
    await runTest('18. Customer B attempts to cancel Customer A order', `/me/orders/${order1Id}/cancel`, 'POST', { reason: 'malicious' }, cookieB, [401, 403, 404]);


    // ----------------------------------------------------
    // INTEGRITY ASSERTS
    // ----------------------------------------------------
    console.log('\n--- INVENTORY INTEGRITY ASSERTS ---');
    const finalInv = await prisma.inventory.findUnique({ where: { id: inv1.id } });
    if (finalInv) {
        if (finalInv.quantity >= 0 && finalInv.reservedQuantity >= 0 && finalInv.quantity >= finalInv.reservedQuantity) {
            console.log(`PASS: Inventory mathematically valid: Total=${finalInv.quantity}, Reserved=${finalInv.reservedQuantity}`);
        } else {
            console.error(`FAIL: Inventory mathematically invalid: Total=${finalInv.quantity}, Reserved=${finalInv.reservedQuantity}`);
        }
    }

    console.log('\n==================================================');
    console.log('PHASE 9 CUSTOMER JOURNEY TESTS COMPLETE');
    console.log('==================================================\n');

  } catch (error) {
    console.error('Test script crashed:', error);
  } finally {
    await cleanup();
  }
}

execute();
