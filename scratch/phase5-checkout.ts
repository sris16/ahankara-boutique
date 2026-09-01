import { prisma } from '../src/lib/prisma';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();
import { OrderService } from '../src/server/services/order.service';

const API_URL = 'http://localhost:3001/api';

const CUSTOMER_A = { email: 'customerA_phase5@local.test', password: 'password123', name: 'Cust A P5' };
const CUSTOMER_B = { email: 'customerB_phase5@local.test', password: 'password123', name: 'Cust B P5' };

let cookieCustomerA = '';
let cookieCustomerB = '';
let userAId = '';
let userBId = '';
let addressAId = '';
let addressBId = '';
let productVariant1Id = '';
let productVariant2Id = '';
let productId = '';
let orderIdA = '';

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
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Method: ${method}`);
  
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
  console.log(`Expected Status: ${expectedStatuses.join(' or ')}`);
  console.log(`Actual Status: ${actualStatus}`);

  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  const passed = expectedStatuses.includes(actualStatus);
  console.log(`PASS/FAIL: ${passed ? 'PASS' : 'FAIL'}`);
  if (!passed) {
    console.log(`Failed condition or status. Data: ${JSON.stringify(data)}`);
  }
  console.log('---');
  return { passed, status: actualStatus, data, res };
}

async function cleanup() {
  console.log('Cleaning up Phase 5 test data...');
  await prisma.user.deleteMany({ where: { email: { in: [CUSTOMER_A.email, CUSTOMER_B.email] } } });
  await prisma.productImage.deleteMany({ where: { product: { slug: { startsWith: 'phase5-test-' } } } });
  await prisma.productVariant.deleteMany({ where: { product: { slug: { startsWith: 'phase5-test-' } } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: 'phase5-test-' } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: 'phase5-test-' } } });
  console.log('Cleanup complete.');
}

async function createAccountAndGetCookie(user: any) {
  const res = await fetch(`${API_URL}/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify(user)
  });
  if (!res.ok) {
    console.error(`Signup failed for ${user.email}:`, await res.text());
    return { cookie: '', userId: '' };
  }
  
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const cookie = setCookies.map(c => c.split(';')[0]).join('; ');

  const meRes = await fetch(`${API_URL}/me`, { headers: { 'Cookie': cookie, 'Origin': 'http://localhost:3000' }});
  const meData = await meRes.json();
  return { cookie, userId: meData.data?.id };
}

async function setup() {
  await cleanup();
  
  const aRes = await createAccountAndGetCookie(CUSTOMER_A);
  cookieCustomerA = aRes.cookie;
  userAId = aRes.userId;

  const bRes = await createAccountAndGetCookie(CUSTOMER_B);
  cookieCustomerB = bRes.cookie;
  userBId = bRes.userId;

  // Create test addresses directly for speed
  const addA = await prisma.address.create({
    data: { userId: userAId, fullName: 'Cust A', phone: '12345', addressLine1: 'Line 1', city: 'City', state: 'State', postalCode: '111', country: 'IN', type: 'HOME' }
  });
  addressAId = addA.id;

  const addB = await prisma.address.create({
    data: { userId: userBId, fullName: 'Cust B', phone: '54321', addressLine1: 'Line 2', city: 'City', state: 'State', postalCode: '222', country: 'IN', type: 'HOME' }
  });
  addressBId = addB.id;

  const category = await prisma.category.create({
    data: { name: 'P5 Category', slug: 'phase5-test-category', isActive: true }
  });

  const product = await prisma.product.create({
    data: {
      name: 'P5 Product',
      slug: 'phase5-test-product',
      basePrice: 1000,
      categoryId: category.id,
      status: 'PUBLISHED',
      variants: {
        create: [
          {
            sku: 'P5-VAR-1',
            price: 1000,
            isActive: true,
            inventory: { create: { quantity: 10, reservedQuantity: 0 } }
          },
          {
            sku: 'P5-VAR-OVERSOLD',
            price: 2000,
            isActive: true,
            inventory: { create: { quantity: 5, reservedQuantity: 0 } }
          }
        ]
      }
    },
    include: { variants: true }
  });

  productId = product.id;
  productVariant1Id = product.variants.find(v => v.sku === 'P5-VAR-1')!.id;
  productVariant2Id = product.variants.find(v => v.sku === 'P5-VAR-OVERSOLD')!.id;
}

async function getInventory(variantId: string) {
  const inv = await prisma.inventory.findUnique({ where: { variantId } });
  return inv;
}

async function main() {
  console.log('Starting Phase 5 Tests\\n');
  await setup();
  
  // 1. HAPPY PATH CHECKOUT
  await runTest('Add to Cart A', '/me/cart/items', 'POST', { variantId: productVariant1Id, quantity: 3 }, cookieCustomerA, [201]);
  
  const idempotencyKey1 = uuidv4();
  const checkoutRes = await runTest('1a. Valid Checkout A', '/me/checkout', 'POST', { shippingAddressId: addressAId }, cookieCustomerA, [201], { 'Idempotency-Key': idempotencyKey1 });
  orderIdA = checkoutRes.data?.data?.id;

  if (orderIdA) {
    const inv1 = await getInventory(productVariant1Id);
    console.log(`Inventory after checkout 1: Qty=${inv1?.quantity}, Res=${inv1?.reservedQuantity}`);
    if (inv1?.reservedQuantity !== 3) console.error('FAIL: Reservation mismatch');

    // 2. IDEMPOTENCY (duplicate checkout returns same order without new reservation)
    await runTest('2a. Idempotency duplicate checkout', '/me/checkout', 'POST', { shippingAddressId: addressAId }, cookieCustomerA, [201], { 'Idempotency-Key': idempotencyKey1 });
    const invIdemp = await getInventory(productVariant1Id);
    if (invIdemp?.reservedQuantity !== 3) console.error('FAIL: Idempotency failed, reserved qty changed');
  }

  // 3. ADDRESS SNAPSHOT TEST
  if (orderIdA) {
    await prisma.address.update({ where: { id: addressAId }, data: { addressLine1: 'MODIFIED LINE 1' } });
    const orderRes = await runTest('3a. Fetch order to verify snapshot', `/me/orders/${orderIdA}`, 'GET', null, cookieCustomerA, [200]);
    if (orderRes.data?.data?.shippingAddress?.line1 === 'Line 1') {
      console.log('PASS: Address snapshot preserved');
    } else {
      console.error('FAIL: Address snapshot corrupted');
    }
  }

  // 4. PRODUCT PRICE MODIFICATION SNAPSHOT TEST
  if (orderIdA) {
    await prisma.productVariant.update({ where: { id: productVariant1Id }, data: { price: 9999 } });
    const orderRes = await runTest('4a. Fetch order to verify item snapshot', `/me/orders/${orderIdA}`, 'GET', null, cookieCustomerA, [200]);
    if (orderRes.data?.data?.items[0]?.unitPrice === 1000) {
      console.log('PASS: Order Item snapshot preserved');
    } else {
      console.error('FAIL: Order Item snapshot corrupted');
    }
  }

  // 5. CUSTOMER ISOLATION
  if (orderIdA) {
    await runTest('5a. Customer B fetches Customer A order', `/me/orders/${orderIdA}`, 'GET', null, cookieCustomerB, [403, 404]);
  }

  // 6. EXPIRATION TEST
  console.log('6a. Forcing order expiration');
  // Backdate the order's reservation expires at to 1 hour ago
  await prisma.order.update({ where: { id: orderIdA }, data: { reservationExpiresAt: new Date(Date.now() - 3600000) } });
  await OrderService.expirePendingOrders();
  
  const expOrder = await prisma.order.findUnique({ where: { id: orderIdA } });
  if (expOrder?.status === 'EXPIRED') {
    console.log('PASS: Order marked as EXPIRED');
  } else {
    console.error('FAIL: Order not expired');
  }
  
  const invExp = await getInventory(productVariant1Id);
  if (invExp?.reservedQuantity === 0) {
    console.log('PASS: Inventory reservation released correctly');
  } else {
    console.error(`FAIL: Inventory reservation not released. Res=${invExp?.reservedQuantity}`);
  }

  // 7. DOUBLE EXPIRATION (IDEMPOTENCY)
  console.log('7a. Testing double expiration');
  await OrderService.expirePendingOrders();
  const invExp2 = await getInventory(productVariant1Id);
  if (invExp2?.reservedQuantity === 0) {
    console.log('PASS: Double expiration is safe');
  } else {
    console.error('FAIL: Double expiration corrupted inventory');
  }

  // 8. CONCURRENCY & OVERSELLING
  // Stock of Variant2 is 5
  await runTest('Add to Cart A (Variant 2)', '/me/cart/items', 'POST', { variantId: productVariant2Id, quantity: 4 }, cookieCustomerA, [200, 201]);
  await runTest('Add to Cart B (Variant 2)', '/me/cart/items', 'POST', { variantId: productVariant2Id, quantity: 4 }, cookieCustomerB, [200, 201]);

  console.log('8a. Triggering concurrent checkouts for overselling stock (4 + 4 > 5)');
  
  const idempotencyA2 = uuidv4();
  const idempotencyB2 = uuidv4();
  
  const headersA = { 'Cookie': cookieCustomerA, 'Origin': 'http://localhost:3000', 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyA2 };
  const headersB = { 'Cookie': cookieCustomerB, 'Origin': 'http://localhost:3000', 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyB2 };

  const fetchA = fetch(`${API_URL}/me/checkout`, { method: 'POST', headers: headersA, body: JSON.stringify({ shippingAddressId: addressAId }) });
  const fetchB = fetch(`${API_URL}/me/checkout`, { method: 'POST', headers: headersB, body: JSON.stringify({ shippingAddressId: addressBId }) });

  const [resA, resB] = await Promise.all([fetchA, fetchB]);
  
  console.log(`Concurrent A Status: ${resA.status}`);
  console.log(`Concurrent B Status: ${resB.status}`);

  if (resA.status === 201 && resB.status === 201) {
    console.error('FAIL: Overselling occurred! Both checkouts succeeded.');
  } else if ((resA.status === 201 && resB.status !== 201) || (resA.status !== 201 && resB.status === 201)) {
    console.log('PASS: Overselling prevented. Only one checkout succeeded.');
  } else {
    console.log('Both checkouts failed. (This could be fine if both triggered DB lock conflicts)');
  }

  const invOver = await getInventory(productVariant2Id);
  console.log(`Final Oversell Variant Inventory: Qty=${invOver?.quantity}, Res=${invOver?.reservedQuantity}`);
  if (invOver!.reservedQuantity > invOver!.quantity) {
    console.error('FAIL: Reserved quantity exceeds actual quantity!');
  } else if (invOver!.reservedQuantity < 0) {
    console.error('FAIL: Reserved quantity is negative!');
  }

  await cleanup();
  console.log('Phase 5 Tests Complete.');
}

main().catch(e => console.error(e));
