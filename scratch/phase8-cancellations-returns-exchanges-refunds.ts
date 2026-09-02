import { PaymentStatus, OrderStatus, FulfillmentStatus, ShipmentStatus } from '@prisma/client';
import { ReturnService } from '../src/server/services/return.service';
import { ExchangeService } from '../src/server/services/exchange.service';
import { RefundService } from '../src/server/services/refund.service';
import { CancellationService } from '../src/server/services/cancellation.service';
import { prisma } from '../src/lib/prisma';

const BASE_URL = 'http://localhost:3001/api';

const PREFIX = 'phase8_test_';
const EMAILS = {
  ADMIN: `${PREFIX}admin@example.com`,
  CUST_A: `${PREFIX}custa@example.com`,
  CUST_B: `${PREFIX}custb@example.com`,
};
const PASS = 'TestP@ssw0rd!';

async function runTest(name: string, path: string, method: string, body: any, cookie: string, expectedStatus: number | number[]) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { 'Cookie': cookie } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const isSuccess = Array.isArray(expectedStatus) ? expectedStatus.includes(res.status) : res.status === expectedStatus;
  console.log(`${name}`);
  console.log(`PASS/FAIL: ${isSuccess ? 'PASS' : 'FAIL'} (Got ${res.status}, Expected: ${Array.isArray(expectedStatus) ? expectedStatus.join(' or ') : expectedStatus})`);
  
  const resBody = await res.text();
  if (!isSuccess) {
    console.error(`Failed condition or status. Data: ${resBody}`);
  }
  console.log('---');
  return { status: res.status, ok: res.ok, data: resBody ? JSON.parse(resBody) : null };
}

async function signupAndGetCookie(email: string, role: string) {
  let res = await fetch(`${BASE_URL}/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ email, password: PASS, name: email })
  });
  
  if (res.status === 429) {
    console.log(`Rate limit hit on signup for ${email}. Waiting 6 seconds...`);
    await new Promise(r => setTimeout(r, 6000));
    res = await fetch(`${BASE_URL}/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({ email, password: PASS, name: email })
    });
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Signup failed: ${res.status} - ${txt}`);
  }
  const data = await res.json();
  const userId = data.user.id;
  
  if (role === 'ADMIN') {
    await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
  }

  // OTP Verification
  await prisma.user.update({ where: { email }, data: { emailVerified: true } });

  let loginRes = await fetch(`${BASE_URL}/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ email, password: PASS })
  });
  
  if (loginRes.status === 429) {
    console.log(`Rate limit hit on login for ${email}. Waiting 6 seconds...`);
    await new Promise(r => setTimeout(r, 6000));
    loginRes = await fetch(`${BASE_URL}/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({ email, password: PASS })
    });
  }
  
  const cookies = loginRes.headers.get('set-cookie');
  const sessionCookie = cookies?.split(',').find(c => c.includes('better-auth.session_token'));
  if (!sessionCookie) throw new Error('No session cookie generated');
  
  return { userId, cookie: sessionCookie };
}

async function execute() {
  console.log('\\n==================================================');
  console.log('PHASE 8: CANCELLATIONS, RETURNS, EXCHANGES & REFUNDS');
  console.log('==================================================\\n');

  try {
    // ----------------------------------------------------
    // SETUP: Users, Categories, Products, Inventory
    // ----------------------------------------------------
    const { userId: adminId, cookie: cookieAdmin } = await signupAndGetCookie(EMAILS.ADMIN, 'ADMIN');
    const { userId: custAId, cookie: cookieA } = await signupAndGetCookie(EMAILS.CUST_A, 'CUSTOMER');
    const { userId: custBId, cookie: cookieB } = await signupAndGetCookie(EMAILS.CUST_B, 'CUSTOMER');

    const cat = await prisma.category.create({
      data: { name: `${PREFIX}Category`, slug: `${PREFIX}category`, description: 'Test' }
    });

    // Product 1: For Cancellations and Returns (₹1000)
    const p1 = await prisma.product.create({
      data: {
        name: `${PREFIX}Product 1`, slug: `${PREFIX}product1`, description: 'P1',
        basePrice: 1000, categoryId: cat.id, status: 'PUBLISHED',
        variants: {
          create: [{ sku: `${PREFIX}SKU1_M`, size: 'M', price: 1000 }]
        }
      },
      include: { variants: true }
    });
    
    // Product 2: For Exchanges (Same Product, different variants)
    const p2 = await prisma.product.create({
      data: {
        name: `${PREFIX}Product 2`, slug: `${PREFIX}product2`, description: 'P2',
        basePrice: 2000, categoryId: cat.id, status: 'PUBLISHED',
        variants: {
          create: [
            { sku: `${PREFIX}SKU2_M`, size: 'M', price: 2000 },
            { sku: `${PREFIX}SKU2_L`, size: 'L', price: 2000 } // Replacement Variant
          ]
        }
      },
      include: { variants: true }
    });

    const p1v1 = p1.variants[0];
    const p2vM = p2.variants[0];
    const p2vL = p2.variants[1];

    // Allocate Inventory
    await prisma.inventory.createMany({
      data: [
        { variantId: p1v1.id, quantity: 10, reservedQuantity: 0 },
        { variantId: p2vM.id, quantity: 10, reservedQuantity: 0 },
        { variantId: p2vL.id, quantity: 5, reservedQuantity: 0 }
      ]
    });

    const addrA = await prisma.address.create({
      data: {
        userId: custAId, isDefaultShipping: true, isDefaultBilling: true,
        fullName: 'Cust A', addressLine1: 'Line 1', city: 'City', state: 'State', postalCode: '111111', phone: '9999999999'
      }
    });

    const addrB = await prisma.address.create({
        data: {
          userId: custBId, isDefaultShipping: true, isDefaultBilling: true,
          fullName: 'Cust B', addressLine1: 'Line 1', city: 'City', state: 'State', postalCode: '222222', phone: '8888888888'
        }
      });

    // Helper to create an order quickly
    const createOrder = async (userId: string, addressId: string, variants: {id: string, qty: number, price: number}[], status: any, payStatus: any) => {
      const orderAddr = await prisma.orderAddress.create({
        data: {
          name: 'Test User', phone: '9999999999',
          line1: 'Test Address', city: 'Test City', state: 'Test State',
          postalCode: '111111', country: 'India'
        }
      });

      const order = await prisma.order.create({
        data: {
          userId,
          orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          status,
          paymentStatus: payStatus,
          fulfillmentStatus: 'UNFULFILLED',
          subtotal: variants.reduce((s, v) => s + (v.price * v.qty), 0),
          totalAmount: variants.reduce((s, v) => s + (v.price * v.qty), 0),
          currency: 'INR',
          shippingAddressId: orderAddr.id,
          billingAddressId: orderAddr.id,
          items: {
            create: variants.map(v => ({
              variantId: v.id, 
              productId: v.id === p1v1.id ? p1.id : p2.id,
              productSlug: v.id === p1v1.id ? p1.slug : p2.slug,
              sku: v.id === p1v1.id ? p1v1.sku : (v.id === p2vM.id ? p2vM.sku : p2vL.sku),
              quantity: v.qty, unitPrice: v.price, lineTotal: v.price * v.qty, productName: 'Test'
            }))
          }
        },
        include: { items: true }
      });
      return order;
    };


    // ----------------------------------------------------
    // A. CANCELLATION TESTS
    // ----------------------------------------------------
    console.log('\\n--- CANCELLATION WORKFLOW ---');
    
    // 1. Unpaid Order Cancellation (Reservation Release)
    const unpaidOrder = await createOrder(custAId, addrA.id, [{id: p1v1.id, qty: 2, price: 1000}], OrderStatus.PENDING_PAYMENT, PaymentStatus.PENDING);
    // Simulate Reservation physically
    await prisma.inventory.update({ where: { variantId: p1v1.id }, data: { reservedQuantity: 2 } });
    
    await runTest('Cancel Unpaid Order (Customer A)', `/me/orders/${unpaidOrder.id}/cancel`, 'POST', { reason: 'Changed mind' }, cookieA, 200);
    
    const invUnpaid = await prisma.inventory.findUnique({ where: { variantId: p1v1.id }});
    if (invUnpaid?.reservedQuantity === 0) console.log('PASS: Unpaid order cancellation correctly released inventory reservations.');
    else console.error('FAIL: Unpaid order cancellation failed to release inventory reservations.');

    // 2. Paid Order Cancellation (Logical Restock & Refund Liability)
    const paidOrder = await createOrder(custAId, addrA.id, [{id: p1v1.id, qty: 1, price: 1000}], OrderStatus.CONFIRMED, PaymentStatus.PAID);
    // Paid order reservations are technically converted to permanent deductions upon payment, 
    // but in our mock we'll just test that cancelling it creates a return transaction and refund.
    await prisma.inventory.update({ where: { variantId: p1v1.id }, data: { quantity: 9 } }); // deducted 1

    await runTest('Cancel Paid Order (Customer A)', `/me/orders/${paidOrder.id}/cancel`, 'POST', { reason: 'Found cheaper' }, cookieA, 200);
    
    const invPaid = await prisma.inventory.findUnique({ where: { variantId: p1v1.id }});
    if (invPaid?.quantity === 10) console.log('PASS: Paid order cancellation correctly restocked inventory.');
    else console.error(`FAIL: Paid order cancellation failed to restock. Qty: ${invPaid?.quantity}`);

    const cancelRefund = await prisma.refund.findFirst({ where: { orderId: paidOrder.id } });
    if (cancelRefund && cancelRefund.amount === 1000) console.log('PASS: Full pending refund generated securely for paid order cancellation.');
    else console.error('FAIL: Refund generation failed.');

    // 3. Duplicate Cancellation (Idempotency)
    await runTest('Cancel Same Paid Order Twice (Idempotency)', `/me/orders/${paidOrder.id}/cancel`, 'POST', { reason: 'Duplicate' }, cookieA, 409);

    // 4. Authorization: Customer B attempts to cancel Customer A's order
    const aOrder2 = await createOrder(custAId, addrA.id, [{id: p1v1.id, qty: 1, price: 1000}], OrderStatus.PENDING_PAYMENT, PaymentStatus.PENDING);
    await runTest('Customer B tries to cancel Customer A order', `/me/orders/${aOrder2.id}/cancel`, 'POST', { reason: 'Malicious' }, cookieB, [401, 403, 404]);

    // 5. Un-cancellable State (Already shipped)
    const shippedOrder = await createOrder(custAId, addrA.id, [{id: p1v1.id, qty: 1, price: 1000}], OrderStatus.PROCESSING, PaymentStatus.PAID);
    await prisma.order.update({
      where: { id: shippedOrder.id },
      data: { fulfillmentStatus: 'FULFILLED' }
    });

    await runTest('Cancel Shipped Order (Should Fail)', `/me/orders/${shippedOrder.id}/cancel`, 'POST', { reason: 'Too late' }, cookieA, 400);

    
    // ----------------------------------------------------
    // B. RETURNS & INSPECTION GATING
    // ----------------------------------------------------
    console.log('\n--- RETURN WORKFLOW ---');
    const returnOrder = await createOrder(custAId, addrA.id, [{id: p1v1.id, qty: 2, price: 1000}], OrderStatus.DELIVERED, PaymentStatus.PAID);
    await prisma.shipment.create({
        data: {
            orderId: returnOrder.id, provider: 'MOCK', providerShipmentId: 'S1', trackingNumber: 'T1', status: 'DELIVERED', deliveredAt: new Date()
        }
    });

    // 1. Customer creates return request
    const returnReqRes = await runTest('Customer requests return for 1 item', `/me/orders/${returnOrder.id}/returns`, 'POST', {
        items: [{ orderItemId: returnOrder.items[0].id, quantity: 1, reason: 'DEFECTIVE' }]
    }, cookieA, 201);
    
    const returnId = returnReqRes.data.id;
    const returnItemId = returnReqRes.data.items[0].id;

    // 2. Admin approves return (Server side directly since no API exists yet)
    await ReturnService.approveReturn(returnId);
    console.log('PASS: Admin approved return request.');

    // 3. Admin inspects and accepts return
    await ReturnService.inspectAndAcceptReturn(returnId, [{
        returnItemId: returnItemId,
        acceptedQuantity: 1
    }]);
    console.log('PASS: Admin inspected and accepted 1 returned item.');

    // Verify Restocking and Refund
    const retInv = await prisma.inventory.findUnique({ where: { variantId: p1v1.id }});
    // It started at 10, we technically didn't deduct for returnOrder initially, so it should be 11.
    if (retInv?.quantity === 11) console.log('PASS: Return successfully restocked accepted inventory.');
    else console.error(`FAIL: Return did not restock correctly. Qty: ${retInv?.quantity}`);

    const retRefund = await prisma.refund.findFirst({ where: { returnRequestId: returnId } });
    if (retRefund && retRefund.amount === 1000) console.log('PASS: Return securely generated exactly 1 pending refund for accepted item.');
    else console.error('FAIL: Return refund logic failed.');


    // ----------------------------------------------------
    // C. EXCHANGES & REPLACEMENT RESERVATION
    // ----------------------------------------------------
    console.log('\\n--- EXCHANGE WORKFLOW ---');
    const exchangeOrder = await createOrder(custAId, addrA.id, [{id: p2vM.id, qty: 1, price: 2000}], OrderStatus.DELIVERED, PaymentStatus.PAID);
    await prisma.shipment.create({
        data: {
            orderId: exchangeOrder.id, provider: 'MOCK', providerShipmentId: 'S2', trackingNumber: 'T2', status: 'DELIVERED', deliveredAt: new Date()
        }
    });

    // 1. Customer creates exchange request (M for L)
    const exReqRes = await runTest('Customer requests exchange', `/me/orders/${exchangeOrder.id}/exchanges`, 'POST', {
        items: [{ orderItemId: exchangeOrder.items[0].id, quantity: 1, replacementVariantId: p2vL.id }]
    }, cookieA, 201);

    const exchangeId = exReqRes.data.id;

    // 2. Admin approves exchange
    await ExchangeService.approveExchange(exchangeId);
    console.log('PASS: Admin approved exchange request.');

    // Verify reservation logic on replacement variant (p2vL)
    const exInv1 = await prisma.inventory.findUnique({ where: { variantId: p2vL.id } });
    if (exInv1?.quantity === 4 && exInv1?.reservedQuantity === 1) console.log('PASS: Exchange Approval correctly reserved replacement stock.');
    else console.error(`FAIL: Exchange Approval reservation failed. Qty: ${exInv1?.quantity}, Reserved: ${exInv1?.reservedQuantity}`);

    // 3. Admin completes exchange
    await ExchangeService.completeExchange(exchangeId);
    console.log('PASS: Admin completed exchange process (received item, shipped new).');

    // Verify final restock of original item
    const exInvOriginal = await prisma.inventory.findUnique({ where: { variantId: p2vM.id } });
    if (exInvOriginal?.quantity === 11) console.log('PASS: Original exchange item returned to stock successfully.');
    else console.error(`FAIL: Original item not restocked correctly. Qty: ${exInvOriginal?.quantity}`);

    const exInvReplacement = await prisma.inventory.findUnique({ where: { variantId: p2vL.id } });
    if (exInvReplacement?.reservedQuantity === 0) console.log('PASS: Replacement variant reservation finalized successfully.');
    else console.error('FAIL: Replacement variant reservation not finalized.');


    // ----------------------------------------------------
    // D. REFUND LIMITS & IDEMPOTENCY
    // ----------------------------------------------------
    console.log('\\n--- REFUND CALCULATION & CONCURRENCY ---');
    // We have retRefund which is pending for 1000.
    // Try to process it.
    await RefundService.processRefund(retRefund!.id);
    console.log('PASS: Processed refund successfully via mock provider.');

    // Attempt idempotency/double refund check
    try {
        await RefundService.processRefund(retRefund!.id);
        console.error('FAIL: System allowed double-processing of a refunded record!');
    } catch (e) {
        console.log('PASS: Idempotency protection prevented processing a succeeded refund.');
    }

    // Check maximum allowable limits manually
    // Order was 2000, 1000 is refunded. Max remaining should be 1000.
    const maxRefund = await RefundService.getMaximumRefundableAmount(returnOrder.id);
    if (maxRefund === 1000) console.log('PASS: Maximum Refund logic correctly accounted for prior refunds.');
    else console.error(`FAIL: Maximum refund miscalculated. Got ${maxRefund}`);


    // ----------------------------------------------------
    // E. TEARDOWN
    // ----------------------------------------------------
    console.log('\\nCleaning up Phase 8 test data...');
    await prisma.inventoryTransaction.deleteMany({ where: { inventory: { variant: { product: { slug: { startsWith: PREFIX } } } } } });
    await prisma.inventory.deleteMany({ where: { variant: { product: { slug: { startsWith: PREFIX } } } } });
    
    await prisma.refund.deleteMany({ where: { order: { user: { email: { in: Object.values(EMAILS) } } } } });
    await prisma.returnItem.deleteMany({ where: { returnRequest: { user: { email: { in: Object.values(EMAILS) } } } } });
    await prisma.returnRequest.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });
    
    await prisma.exchangeItem.deleteMany({ where: { exchangeRequest: { user: { email: { in: Object.values(EMAILS) } } } } });
    await prisma.exchangeRequest.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });

    await prisma.orderCancellation.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });

    await prisma.shipment.deleteMany({ where: { order: { user: { email: { in: Object.values(EMAILS) } } } } });
    await prisma.orderItem.deleteMany({ where: { order: { user: { email: { in: Object.values(EMAILS) } } } } });
    await prisma.order.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });
    
    await prisma.address.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });
    await prisma.session.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });
    await prisma.account.deleteMany({ where: { user: { email: { in: Object.values(EMAILS) } } } });
    await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAILS) } } });
    
    await prisma.productVariant.deleteMany({ where: { product: { slug: { startsWith: PREFIX } } } });
    await prisma.product.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.category.deleteMany({ where: { slug: { startsWith: PREFIX } } });

    console.log('Cleanup complete.');
    console.log('Phase 8 Tests Complete.');
    process.exit(0);

  } catch (error) {
    console.error('Test script crashed:', error);
    process.exit(1);
  }
}

execute();
