import { prisma } from '../src/lib/prisma';
import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

const API_URL = 'http://localhost:3001/api';

const CUSTOMER_A = { email: 'customera_phase7@local.test', password: 'password123', name: 'Cust A P7' };
const CUSTOMER_B = { email: 'customerb_phase7@local.test', password: 'password123', name: 'Cust B P7' };
const ADMIN = { email: 'admin_phase7@local.test', password: 'password123', name: 'Admin P7' };

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

let orderAId = '';
let orderBId = '';
let orderItemAId = '';
let orderItemBId = '';
let shipmentAId = '';

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
  console.log('Cleaning up Phase 7 test data...');
  
  await prisma.shipmentTrackingEvent.deleteMany({
    where: { shipment: { order: { user: { email: { in: [CUSTOMER_A.email, CUSTOMER_B.email, ADMIN.email] } } } } }
  });
  
  await prisma.shipmentItem.deleteMany({
    where: { shipment: { order: { user: { email: { in: [CUSTOMER_A.email, CUSTOMER_B.email, ADMIN.email] } } } } }
  });
  
  await prisma.shipment.deleteMany({
    where: { order: { user: { email: { in: [CUSTOMER_A.email, CUSTOMER_B.email, ADMIN.email] } } } }
  });

  await prisma.user.deleteMany({ where: { email: { in: [CUSTOMER_A.email, CUSTOMER_B.email, ADMIN.email] } } });
  
  await prisma.productVariant.deleteMany({ where: { product: { slug: { startsWith: 'phase7-' } } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: 'phase7-' } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: 'phase7-' } } });
  
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
    data: { name: 'P7 Category', slug: 'phase7-category', isActive: true }
  });
  categoryId = category.id;

  const product = await prisma.product.create({
    data: {
      name: 'P7 Product',
      slug: 'phase7-product',
      basePrice: 1000,
      categoryId: category.id,
      status: 'PUBLISHED',
      variants: {
        create: [
          { sku: 'P7-VAR-1', price: 1000, isActive: true, inventory: { create: { quantity: 100, reservedQuantity: 0 } } },
          { sku: 'P7-VAR-2', price: 1000, isActive: true, inventory: { create: { quantity: 100, reservedQuantity: 0 } } }
        ]
      }
    },
    include: { variants: true }
  });
  productId = product.id;
  variant1Id = product.variants.find(v => v.sku === 'P7-VAR-1')!.id;
  variant2Id = product.variants.find(v => v.sku === 'P7-VAR-2')!.id;

  // Checkout Cust A
  await runTest('Add var1 to cart A', '/me/cart/items', 'POST', { variantId: variant1Id, quantity: 2 }, cookieA, [200, 201]);
  const checkA = await runTest('Checkout A', '/me/checkout', 'POST', { shippingAddressId: addressAId }, cookieA, [201], { 'Idempotency-Key': uuidv4() });
  orderAId = checkA.data?.data?.id;
  
  // Checkout Cust B
  await runTest('Add var2 to cart B', '/me/cart/items', 'POST', { variantId: variant2Id, quantity: 1 }, cookieB, [200, 201]);
  const checkB = await runTest('Checkout B', '/me/checkout', 'POST', { shippingAddressId: addressBId }, cookieB, [201], { 'Idempotency-Key': uuidv4() });
  orderBId = checkB.data?.data?.id;

  // Mark orders as PROCESSING to allow shipment creation
  await prisma.order.updateMany({
    where: { id: { in: [orderAId, orderBId] } },
    data: { status: 'PROCESSING' }
  });
  
  const orderA = await prisma.order.findUnique({ where: { id: orderAId }, include: { items: true } });
  orderItemAId = orderA?.items[0]?.id as string;
  
  const orderB = await prisma.order.findUnique({ where: { id: orderBId }, include: { items: true } });
  orderItemBId = orderB?.items[0]?.id as string;
}

async function main() {
  console.log('Starting Phase 7 Tests\\n');
  await setup();
  
  // ----------------------------------------------------
  // A. ISOLATION AND AUTHORIZATION
  // ----------------------------------------------------
  await runTest('Customer tries to create shipment', `/admin/orders/${orderAId}/shipments`, 'POST', {
    items: [{ orderItemId: orderItemAId, quantity: 1 }],
    provider: 'MOCK'
  }, cookieA, [403]);

  // ----------------------------------------------------
  // B. SHIPMENT CREATION
  // ----------------------------------------------------
  const resCreateA = await runTest('Admin creates shipment for Order A', `/admin/orders/${orderAId}/shipments`, 'POST', {
    items: [{ orderItemId: orderItemAId, quantity: 1 }],
    provider: 'MOCK'
  }, cookieAdmin, [201]);
  shipmentAId = resCreateA.data?.id;
  
  if (resCreateA.passed && resCreateA.data) {
    if (resCreateA.data.providerShipmentId && resCreateA.data.awb && resCreateA.data.trackingNumber && resCreateA.data.courierName) {
      console.log('PASS: MockShippingProvider populated AWB, tracking, courier, and providerShipmentId.');
    } else {
      console.error('FAIL: MockShippingProvider failed to populate tracking details.');
    }
  }

  // ----------------------------------------------------
  // C. SHIPMENT ITEM ALLOCATION
  // ----------------------------------------------------
  await runTest('Admin tries to over-fulfill Order A', `/admin/orders/${orderAId}/shipments`, 'POST', {
    items: [{ orderItemId: orderItemAId, quantity: 2 }],
    provider: 'MOCK'
  }, cookieAdmin, [409]); // Remaining is 1 (originally 2, 1 shipped)

  // ----------------------------------------------------
  // D. CONCURRENCY & IDEMPOTENCY
  // ----------------------------------------------------
  console.log('\\n--- CONCURRENT SHIPMENT CREATION TEST ---');
  // Order B has 1 item. We try to create 2 shipments for 1 quantity each simultaneously.
  const req1 = fetch(`${API_URL}/admin/orders/${orderBId}/shipments`, { 
    method: 'POST', 
    headers: { 'Cookie': cookieAdmin, 'Origin': 'http://localhost:3000', 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ orderItemId: orderItemBId, quantity: 1 }], provider: 'MOCK' }) 
  });
  const req2 = fetch(`${API_URL}/admin/orders/${orderBId}/shipments`, { 
    method: 'POST', 
    headers: { 'Cookie': cookieAdmin, 'Origin': 'http://localhost:3000', 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ orderItemId: orderItemBId, quantity: 1 }], provider: 'MOCK' }) 
  });

  const [res1, res2] = await Promise.all([req1, req2]);
  console.log(`Concurrent Shipment 1 Status: ${res1.status}`);
  console.log(`Concurrent Shipment 2 Status: ${res2.status}`);
  if ((res1.status === 201 && res2.status === 409) || (res1.status === 409 && res2.status === 201)) {
    console.log('PASS: Concurrency test passed. Prevented over-allocation on simultaneous requests.');
  } else {
    console.error('FAIL: Concurrency vulnerability detected in shipment allocation!');
  }
  
  const bShipmentData = res1.status === 201 ? await res1.json() : await res2.json();

  // ----------------------------------------------------
  // E. TRACKING & CUSTOMER ISOLATION
  // ----------------------------------------------------
  await runTest('Customer A gets tracking for Order A', `/me/orders/${orderAId}/tracking`, 'GET', null, cookieA, [200]);
  await runTest('Customer B tries to get tracking for Order A', `/me/orders/${orderAId}/tracking`, 'GET', null, cookieB, [401, 403, 404]);

  // ----------------------------------------------------
  // F. MONOTONIC TRACKING LIFECYCLE & IDEMPOTENCY
  // ----------------------------------------------------
  console.log('\\n--- TRACKING STATUS LIFECYCLE ---');
  // Transition to PICKUP_SCHEDULED
  await runTest('Admin updates status to PICKUP_SCHEDULED', `/admin/shipments/${shipmentAId}/status`, 'PATCH', {
    status: 'PICKUP_SCHEDULED',
    message: 'Pickup arranged'
  }, cookieAdmin, [200]);

  // Idempotency check: Since the API endpoint for manual status update auto-generates 
  // providerEventId with Date.now(), we test the architecture directly via the Service.
  const { ShippingService } = require('../src/server/services/shipping.service');
  
  await ShippingService.processTrackingEvent(shipmentAId, {
    providerEventId: 'TEST_EVENT_001',
    status: 'PICKUP_SCHEDULED',
    message: 'Simulated webhook pickup',
    eventTime: new Date()
  });
  
  await ShippingService.processTrackingEvent(shipmentAId, {
    providerEventId: 'TEST_EVENT_001',
    status: 'PICKUP_SCHEDULED',
    message: 'Simulated webhook pickup duplicate',
    eventTime: new Date()
  });

  const countEvents = await prisma.shipmentTrackingEvent.count({ where: { providerEventId: 'TEST_EVENT_001' } });
  if (countEvents === 1) {
    console.log('PASS: Duplicate tracking event was ignored idempotently by the ShippingService.');
  } else {
    console.error('FAIL: Duplicate tracking event created multiple records!');
  }

  // Transition to IN_TRANSIT
  await runTest('Admin updates status to IN_TRANSIT', `/admin/shipments/${shipmentAId}/status`, 'PATCH', {
    status: 'IN_TRANSIT',
    message: 'On the way'
  }, cookieAdmin, [200]);

  // Try Regression
  await runTest('Admin attempts backward regression (IN_TRANSIT -> PENDING)', `/admin/shipments/${shipmentAId}/status`, 'PATCH', {
    status: 'PENDING',
    message: 'Lost in transit'
  }, cookieAdmin, [200]);
  
  const finalShipmentState = await prisma.shipment.findUnique({ where: { id: shipmentAId } });
  if (finalShipmentState?.status === 'IN_TRANSIT') {
    console.log('PASS: Monotonic tracking works. Backward regression was correctly ignored.');
  } else {
    console.error(`FAIL: Tracking regressed! Current status: ${finalShipmentState?.status}`);
  }

  // ----------------------------------------------------
  // G. SHIPMENT CANCELLATION
  // ----------------------------------------------------
  console.log('\\n--- SHIPMENT CANCELLATION ---');
  await runTest('Customer tries to cancel shipment', `/admin/shipments/${shipmentAId}/cancel`, 'POST', null, cookieA, [403]);
  await runTest('Admin cancels shipment', `/admin/shipments/${shipmentAId}/cancel`, 'POST', null, cookieAdmin, [200]);
  
  const cancelledShipmentState = await prisma.shipment.findUnique({ where: { id: shipmentAId } });
  if (cancelledShipmentState?.status === 'CANCELLED') {
    console.log('PASS: Shipment cancelled successfully.');
  } else {
    console.error(`FAIL: Shipment not cancelled! Current status: ${cancelledShipmentState?.status}`);
  }

  await cleanup();
  console.log('Phase 7 Tests Complete.');
}

main().catch(e => {
  console.error(e);
  cleanup();
});
