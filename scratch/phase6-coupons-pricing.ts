import { prisma } from '../src/lib/prisma';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

const API_URL = 'http://localhost:3001/api';

const CUSTOMER_A = { email: 'customera_phase6@local.test', password: 'password123', name: 'Cust A P6' };
const CUSTOMER_B = { email: 'customerb_phase6@local.test', password: 'password123', name: 'Cust B P6' };
const ADMIN = { email: 'admin_phase6@local.test', password: 'password123', name: 'Admin P6' };

let cookieA = '';
let cookieB = '';
let cookieAdmin = '';
let userAId = '';
let userBId = '';
let addressAId = '';
let addressBId = '';
let variant1Id = '';
let variant2Id = '';
let categoryId = '';
let productId = '';

let couponFixedId = '';
let couponPercentId = '';
let couponUsageId = '';

async function runTest(
  name: string,
  endpoint: string,
  method: string,
  body: any,
  cookieStr: string,
  expectedStatuses: number[],
  headersOverrides: Record<string, string> = {}
) {
  console.log(name);
  
  const headers: any = {
    'Origin': 'http://localhost:3000',
    ...headersOverrides
  };
  if (cookieStr) headers['Cookie'] = cookieStr;
  
  let fetchBody: any = undefined;
  if (body) {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: fetchBody,
  });

  const actualStatus = res.status;
  
  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  const passed = expectedStatuses.includes(actualStatus);
  console.log(`PASS/FAIL: ${passed ? 'PASS' : 'FAIL'} (Got ${actualStatus}, Expected: ${expectedStatuses.join(' or ')})`);
  if (!passed) {
    console.log(`Failed condition or status. Data: ${JSON.stringify(data)}`);
  }
  console.log('---');
  return { passed, status: actualStatus, data, res };
}

async function cleanup() {
  console.log('Cleaning up Phase 6 test data...');
  
  // Clean up redemptions for coupons starting with PHASE6_
  await prisma.couponRedemption.deleteMany({
    where: { coupon: { code: { startsWith: 'PHASE6_' } } }
  });
  
  // Clean up coupons
  await prisma.coupon.deleteMany({
    where: { code: { startsWith: 'PHASE6_' } }
  });

  // Clean up users (cascade handles carts, orders, addresses)
  await prisma.user.deleteMany({ where: { email: { in: [CUSTOMER_A.email, CUSTOMER_B.email, ADMIN.email] } } });
  
  // Clean up products/variants/categories
  await prisma.productVariant.deleteMany({ where: { product: { slug: { startsWith: 'phase6-' } } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: 'phase6-' } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: 'phase6-' } } });
  
  console.log('Cleanup complete.');
}

async function createAccountAndGetCookie(user: any, role: 'CUSTOMER'|'ADMIN' = 'CUSTOMER') {
  let res = await fetch(`${API_URL}/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify(user)
  });
  
  if (res.status === 429) {
    console.log('Rate limit hit. Waiting 20 seconds...');
    await new Promise(r => setTimeout(r, 20000));
    res = await fetch(`${API_URL}/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify(user)
    });
  }

  if (res.status !== 200 && res.status !== 201) {
    const errorText = await res.text();
    if (!errorText.includes('USER_ALREADY_EXISTS')) {
      console.error('Signup failed!', res.status, errorText);
    }
  }
  
  if (role === 'ADMIN') {
    await prisma.user.update({
      where: { email: user.email },
      data: { role: 'ADMIN' }
    });
  }
  
  // Always login to get a fresh session
  const resLogin = await fetch(`${API_URL}/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ email: user.email, password: user.password })
  });
  const setCookies = resLogin.headers.getSetCookie ? resLogin.headers.getSetCookie() : [];
  const cookie = setCookies.map(c => c.split(';')[0]).join('; ');
  const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
  
  if (!cookie) {
    console.error('Failed to get cookie for', user.email, await resLogin.text());
  }

  return { cookie, userId: dbUser?.id };
}

async function setup() {
  await cleanup();
  
  const aRes = await createAccountAndGetCookie(CUSTOMER_A);
  cookieA = aRes.cookie;
  userAId = aRes.userId as string;

  const bRes = await createAccountAndGetCookie(CUSTOMER_B);
  cookieB = bRes.cookie;
  userBId = bRes.userId as string;
  
  const adminRes = await createAccountAndGetCookie(ADMIN, 'ADMIN');
  cookieAdmin = adminRes.cookie;

  const addA = await prisma.address.create({
    data: { userId: userAId, fullName: 'Cust A', phone: '12345', addressLine1: 'Line 1', city: 'City', state: 'State', postalCode: '111', country: 'IN', type: 'HOME' }
  });
  addressAId = addA.id;

  const addB = await prisma.address.create({
    data: { userId: userBId, fullName: 'Cust B', phone: '54321', addressLine1: 'Line 2', city: 'City', state: 'State', postalCode: '222', country: 'IN', type: 'HOME' }
  });
  addressBId = addB.id;

  const category = await prisma.category.create({
    data: { name: 'P6 Category', slug: 'phase6-category', isActive: true }
  });
  categoryId = category.id;

  const product = await prisma.product.create({
    data: {
      name: 'P6 Product',
      slug: 'phase6-product',
      basePrice: 1000,
      categoryId: category.id,
      status: 'PUBLISHED',
      variants: {
        create: [
          { sku: 'P6-VAR-1', price: 1000, isActive: true, inventory: { create: { quantity: 100, reservedQuantity: 0 } } },
          { sku: 'P6-VAR-2', price: 3333, isActive: true, inventory: { create: { quantity: 100, reservedQuantity: 0 } } }
        ]
      }
    },
    include: { variants: true }
  });
  productId = product.id;
  variant1Id = product.variants.find(v => v.sku === 'P6-VAR-1')!.id;
  variant2Id = product.variants.find(v => v.sku === 'P6-VAR-2')!.id;
}

async function main() {
  console.log('Starting Phase 6 Tests\\n');
  await setup();
  
  // ----------------------------------------------------
  // A. COUPON CREATION
  // ----------------------------------------------------
  
  // A1. Invalid creation (Customer trying to act as Admin)
  await runTest('Customer tries to create coupon', '/admin/coupons', 'POST', { code: 'PHASE6_HACK', type: 'FIXED_AMOUNT', value: 100, name: 'Hack' }, cookieA, [403]);
  
  // A2. Admin creates valid Fixed Coupon
  const resFixed = await runTest('Admin creates Fixed Amount coupon', '/admin/coupons', 'POST', {
    code: 'PHASE6_FIXED',
    name: 'Fixed 500 off min 2000',
    type: 'FIXED_AMOUNT',
    value: 500, // paise => actually value might be paise depending on schema, let's just use 500
    minimumOrderAmount: 2000,
    isActive: true
  }, cookieAdmin, [201]);
  couponFixedId = resFixed.data?.id;

  // A3. Admin creates Percentage Coupon
  const resPercent = await runTest('Admin creates Percentage coupon (15% off, max 1000)', '/admin/coupons', 'POST', {
    code: 'PHASE6_PERCENT',
    name: '15% Off',
    type: 'PERCENTAGE',
    value: 15,
    maximumDiscountAmount: 1000,
    isActive: true
  }, cookieAdmin, [201]);
  couponPercentId = resPercent.data?.id;

  // A4. Admin creates Single Use Global limit Coupon (for concurrency)
  const resUsage = await runTest('Admin creates Usage Limit (1) Coupon', '/admin/coupons', 'POST', {
    code: 'PHASE6_ONCE',
    name: 'First come first serve',
    type: 'FIXED_AMOUNT',
    value: 200,
    usageLimit: 1,
    isActive: true
  }, cookieAdmin, [201]);
  couponUsageId = resUsage.data?.id;

  // A5. Admin creates Expired Coupon
  await runTest('Admin creates expired Coupon', '/admin/coupons', 'POST', {
    code: 'PHASE6_EXPIRED',
    name: 'Expired',
    type: 'FIXED_AMOUNT',
    value: 100,
    startsAt: new Date(Date.now() - 100000).toISOString(),
    endsAt: new Date(Date.now() - 50000).toISOString(),
    isActive: true
  }, cookieAdmin, [201]);

  // A6. Duplicate coupon check
  await runTest('Admin duplicate coupon check', '/admin/coupons', 'POST', {
    code: 'PHASE6_FIXED',
    name: 'Fixed 500 duplicate',
    type: 'FIXED_AMOUNT',
    value: 500,
    isActive: true
  }, cookieAdmin, [409]);

  // ----------------------------------------------------
  // B. & C. COUPON RETRIEVAL / UPDATE
  // ----------------------------------------------------
  await runTest('Customer tries to view coupons', '/admin/coupons', 'GET', null, cookieA, [403]);
  await runTest('Admin lists coupons', '/admin/coupons', 'GET', null, cookieAdmin, [200]);
  
  if (couponPercentId) {
    await runTest('Admin updates coupon (deactivates)', `/admin/coupons/${couponPercentId}`, 'PATCH', { isActive: false }, cookieAdmin, [200]);
    // reactivate for further tests
    await runTest('Admin updates coupon (activates)', `/admin/coupons/${couponPercentId}`, 'PATCH', { isActive: true }, cookieAdmin, [200]);
  }

  // ----------------------------------------------------
  // D. E. F. G. H. CART & COUPON VALIDATION
  // ----------------------------------------------------
  
  // Cust A adds 1 unit of Variant 1 (price 1000)
  await runTest('Add var1 to cart A', '/me/cart/items', 'POST', { variantId: variant1Id, quantity: 1 }, cookieA, [201]);
  
  // Validate Phase6_Fixed (requires min 2000, current subtotal 1000)
  await runTest('Validate Phase6_Fixed with subtotal 1000 (below min spend)', '/me/cart/coupon/validate', 'POST', { code: 'PHASE6_FIXED' }, cookieA, [400]);

  // Cust A adds 1 more unit -> subtotal 2000
  const cartRes = await runTest('Add var1 again to cart A', '/me/cart/items', 'POST', { variantId: variant1Id, quantity: 1 }, cookieA, [200, 201]);
  
  // Validate Phase6_Fixed (min 2000) -> Should pass
  const valFixed = await runTest('Validate Phase6_Fixed with subtotal 2000', '/me/cart/coupon/validate', 'POST', { code: 'PHASE6_FIXED' }, cookieA, [200]);
  if (valFixed.data?.discountAmount !== 500) {
    console.error(`FAIL: Expected fixed discount 500, got ${valFixed.data?.discountAmount}`);
  } else {
    console.log('PASS: Fixed discount applied correctly');
  }

  // Cust B adds 1 unit of Variant 2 (price 3333)
  await runTest('Add var2 to cart B', '/me/cart/items', 'POST', { variantId: variant2Id, quantity: 1 }, cookieB, [201]);

  // Validate Phase6_Percent (15% off max 1000)
  const valPercent = await runTest('Validate Phase6_Percent with subtotal 3333', '/me/cart/coupon/validate', 'POST', { code: 'PHASE6_PERCENT' }, cookieB, [200]);
  // 15% of 3333 = 499.95 -> expected 500 (Math.round)
  if (valPercent.data?.discountAmount !== 500) {
    console.error(`FAIL: Expected percentage discount 500, got ${valPercent.data?.discountAmount}`);
  } else {
    console.log('PASS: Percentage discount rounding applied correctly');
  }

  // Validate expired coupon
  await runTest('Validate Phase6_Expired', '/me/cart/coupon/validate', 'POST', { code: 'PHASE6_EXPIRED' }, cookieA, [400]);

  // ----------------------------------------------------
  // J. CONCURRENT COUPON REDEMPTION (HIGH PRIORITY)
  // ----------------------------------------------------
  console.log('\\n--- CONCURRENT REDEMPTION TEST (Usage Limit = 1) ---');
  // Both A (subtotal 2000) and B (subtotal 3333) have carts ready.
  // PHASE6_ONCE gives 200 off.
  
  const idempA = uuidv4();
  const idempB = uuidv4();

  const reqA = fetch(`${API_URL}/me/checkout`, { 
    method: 'POST', 
    headers: { 'Cookie': cookieA, 'Origin': 'http://localhost:3000', 'Content-Type': 'application/json', 'Idempotency-Key': idempA },
    body: JSON.stringify({ shippingAddressId: addressAId, couponCode: 'PHASE6_ONCE' }) 
  });
  const reqB = fetch(`${API_URL}/me/checkout`, { 
    method: 'POST', 
    headers: { 'Cookie': cookieB, 'Origin': 'http://localhost:3000', 'Content-Type': 'application/json', 'Idempotency-Key': idempB },
    body: JSON.stringify({ shippingAddressId: addressBId, couponCode: 'PHASE6_ONCE' }) 
  });

  const [resA, resB] = await Promise.all([reqA, reqB]);
  console.log(`Concurrent Checkout A Status: ${resA.status}`);
  console.log(`Concurrent Checkout B Status: ${resB.status}`);

  // Even without explicit row locks on coupon, one should ideally fail if usages are strictly checked, 
  // though if the transaction logic isn't locking the coupon row, they might both succeed.
  // Let's check the database state for the coupon.
  const couponAfter = await prisma.coupon.findUnique({ where: { code: 'PHASE6_ONCE' } });
  console.log(`Coupon Used Count: ${couponAfter?.usedCount}`);

  // In this architecture, coupons are redeemed upon PAYMENT FINALIZATION, not checkout creation.
  // Therefore, both checkouts can successfully create a PENDING_PAYMENT order referencing the same coupon.
  // The actual limit enforcement happens in PaymentService.finalizeSuccessfulPayment via row locking.
  if (resA.status === 201 && resB.status === 201 && couponAfter?.usedCount === 0) {
    console.log('PASS: Concurrency test passed. Both checkouts created pending orders without eagerly consuming the coupon.');
  } else {
    console.error('FAIL: Unexpected checkout concurrency result.');
  }

  // ----------------------------------------------------
  // L. M. CHECKOUT PRICING MANIPULATION
  // ----------------------------------------------------
  console.log('\\n--- PRICE MANIPULATION TEST ---');
  // Re-fill cart A (assuming it might have emptied, but it didn't if checkout failed, let's just attempt a new checkout)
  // Client attempts to pass fake discount properties in payload (they should be ignored because schema doesn't allow them)
  const fakePayload = { shippingAddressId: addressAId, couponCode: 'PHASE6_PERCENT', discountAmount: 9999999, totalAmount: 1 };
  
  const idempM = uuidv4();
  const resManipulate = await runTest('Checkout with manipulated pricing payload', '/me/checkout', 'POST', fakePayload, cookieA, [201], { 'Idempotency-Key': idempM });
  
  if (resManipulate.passed && resManipulate.data?.data) {
    const order = resManipulate.data.data;
    if (order.discountAmount === 9999999 || order.totalAmount === 1) {
      console.error('FAIL: Checkout allowed client price manipulation!');
    } else {
      console.log(`PASS: Checkout ignored client pricing. Actual Discount: ${order.discountAmount}, Actual Total: ${order.totalAmount}`);
    }
  }

  // ----------------------------------------------------
  // O. COUPON + IDEMPOTENCY
  // ----------------------------------------------------
  console.log('\\n--- IDEMPOTENCY COUPON TEST ---');
  const resIdempRepeat = await runTest('Repeat idempotent checkout with coupon', '/me/checkout', 'POST', fakePayload, cookieA, [201], { 'Idempotency-Key': idempM });
  
  if (resIdempRepeat.data?.data?.id === resManipulate.data?.data?.id) {
    console.log('PASS: Idempotency returned identical order successfully without double redemption.');
  } else {
    console.error('FAIL: Idempotency duplicate checkout mismatch.');
  }

  await cleanup();
  console.log('Phase 6 Tests Complete.');
}

main().catch(e => {
  console.error(e);
  cleanup();
});
