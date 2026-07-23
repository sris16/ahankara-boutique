import { prisma } from '../src/lib/prisma';
import { ProductVariantService } from '../src/server/services/product-variant.service';
import { InventoryService } from '../src/server/services/inventory.service';
import { CartService } from '../src/server/services/cart.service';
import { OrderService } from '../src/server/services/order.service';
import { ProductStatus } from '@prisma/client';

async function run() {
  console.log('--- STARTING V8 RUNTIME TESTS ---');
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
    // Pre-cleanup in case of previous failure
    await prisma.orderAddress.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    
    await prisma.inventoryTransaction.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.address.deleteMany({});
    
    await prisma.user.deleteMany({ where: { email: { in: ['v8-test@example.com', 'v8-test-b@example.com', 'v8-admin@example.com'] } } });

    // Setup temporary User
    const user = await prisma.user.create({
      data: {
        email: 'v8-test@example.com',
        name: 'V8 Test User',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: 'v8-test-b@example.com',
        name: 'V8 Test User B',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    const admin = await prisma.user.create({
      data: {
        email: 'v8-admin@example.com',
        name: 'V8 Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Setup temporary Address
    const address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: 'V8 User Home',
        phone: '1234567890',
        addressLine1: '12 Example Street',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600001',
        country: 'India',
      }
    });

    const addressB = await prisma.address.create({
      data: {
        userId: userB.id,
        fullName: 'V8 User B Home',
        phone: '0987654321',
        addressLine1: '99 New Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      }
    });

    // Setup temporary Categories/Products
    const category = await prisma.category.create({
      data: { name: 'V8 Silk Sarees', slug: 'v8-silk-sarees' }
    });

    const productA = await prisma.product.create({
      data: {
        name: 'Royal Silk Saree',
        slug: 'v8-royal-silk-saree',
        shortDescription: 'Test',
        description: 'Test',
        basePrice: 149900,
        categoryId: category.id,
        status: 'PUBLISHED',
      }
    });
    
    const variantA = await ProductVariantService.createVariant(productA.id, {
      sku: 'V8-RS-RED-M',
      price: 149900,
      size: 'M',
      color: 'Red',
      quantity: 5,
      lowStockThreshold: 1,
    });

    const productB = await prisma.product.create({
      data: {
        name: 'Cotton Saree',
        slug: 'v8-cotton-saree',
        shortDescription: 'Test',
        description: 'Test',
        basePrice: 99900,
        categoryId: category.id,
        status: 'PUBLISHED',
      }
    });

    const variantB = await ProductVariantService.createVariant(productB.id, {
      sku: 'V8-CS-BLU-S',
      price: 99900,
      size: 'S',
      color: 'Blue',
      quantity: 5,
    });

    const variantB_Out = await ProductVariantService.createVariant(productB.id, {
      sku: 'V8-CS-BLU-L',
      price: 99900,
      size: 'L',
      color: 'Blue',
      quantity: 0,
    });

    // --- 1. Empty Cart result ---
    try {
      await OrderService.createCheckoutOrder(user.id, { shippingAddressId: address.id }, 'key-empty');
      assert(false, 'Should fail to checkout empty cart');
    } catch(e: any) {
      assert(e.name === 'ValidationError' || e.constructor.name === 'ValidationError', 'Empty Cart result');
    }

    // --- 2. Address ownership result ---
    await CartService.addItem(user.id, { variantId: variantA.id, quantity: 1 });
    try {
      await OrderService.createCheckoutOrder(user.id, { shippingAddressId: addressB.id }, 'key-addr');
      assert(false, 'Should fail cross-user address');
    } catch(e: any) {
      assert(e.name === 'NotFoundError' || e.constructor.name === 'NotFoundError', 'Address ownership result');
    }

    // --- 3. Out-of-stock Checkout result ---
    await prisma.inventory.update({ where: { variantId: variantB_Out.id }, data: { quantity: 1 }});
    await CartService.addItem(user.id, { variantId: variantB_Out.id, quantity: 1 });
    await prisma.inventory.update({ where: { variantId: variantB_Out.id }, data: { quantity: 0 }});
    try {
      await OrderService.createCheckoutOrder(user.id, { shippingAddressId: address.id }, 'key-oos');
      assert(false, 'Should fail out of stock checkout');
    } catch(e: any) {
      assert(e.name === 'ValidationError' || e.constructor.name === 'ValidationError', 'Out-of-stock Checkout result');
    }

    await CartService.removeItem(user.id, (await CartService.getOrCreateCart(user.id)).items.find(i => i.variant.id === variantB_Out.id)!.cartItemId);

    // --- 4. Insufficient-stock result ---
    const cartItemA = (await CartService.getOrCreateCart(user.id)).items.find(i => i.variant.id === variantA.id)!.cartItemId;
    await prisma.cartItem.update({ where: { id: cartItemA }, data: { quantity: 10 } });
    try {
      await OrderService.createCheckoutOrder(user.id, { shippingAddressId: address.id }, 'key-insuf');
      assert(false, 'Should fail insufficient stock checkout');
    } catch(e: any) {
      assert(e.name === 'ValidationError' || e.constructor.name === 'ValidationError', 'Insufficient-stock result');
    }
    
    // Reset quantity
    await prisma.cartItem.update({ where: { id: cartItemA }, data: { quantity: 1 } });

    // --- 5. Inactive Variant result ---
    await CartService.addItem(user.id, { variantId: variantB.id, quantity: 1 });
    await prisma.productVariant.update({ where: { id: variantB.id }, data: { isActive: false } });
    try {
      await OrderService.createCheckoutOrder(user.id, { shippingAddressId: address.id }, 'key-inact');
      assert(false, 'Should fail inactive variant checkout');
    } catch(e: any) {
      assert(e.name === 'ValidationError' || e.constructor.name === 'ValidationError', 'Inactive Variant result');
    }
    
    await prisma.productVariant.update({ where: { id: variantB.id }, data: { isActive: true } });
    
    // --- 6. Archived Product result ---
    // Variant B is back active, it's still in the cart!
    await prisma.product.update({ where: { id: productB.id }, data: { status: 'ARCHIVED' } });
    try {
      await OrderService.createCheckoutOrder(user.id, { shippingAddressId: address.id }, 'key-arch');
      assert(false, 'Should fail archived product checkout');
    } catch(e: any) {
      assert(e.name === 'ValidationError' || e.constructor.name === 'ValidationError', 'Archived Product result');
    }
    
    await prisma.product.update({ where: { id: productB.id }, data: { status: 'PUBLISHED' } });
    await CartService.removeItem(user.id, (await CartService.getOrCreateCart(user.id)).items.find(i => i.variant.id === variantB.id)!.cartItemId);

    // --- 7. Valid Checkout result (plus snapshots) ---
    await CartService.updateItemQuantity(user.id, (await CartService.getOrCreateCart(user.id)).items.find(i => i.variant.id === variantA.id)!.cartItemId, { quantity: 2 });
    
    const validOrder = await OrderService.createCheckoutOrder(user.id, { shippingAddressId: address.id }, 'key-valid-1');
    assert(validOrder.status === 'PENDING_PAYMENT', 'Valid Checkout result');
    assert(validOrder.totalAmount === 299800 && validOrder.subtotal === 299800, 'Integer-money result & Total invariant result');
    assert(validOrder.items.length === 1 && validOrder.items[0].quantity === 2, 'Valid Checkout line item quantity');

    // Verify inventory reservation logic (V6/V7 boundary)
    const invA = await prisma.inventory.findFirst({ where: { variantId: variantA.id }});
    assert(invA!.quantity === 5 && invA!.reservedQuantity === 2, 'Inventory reservation audit result');

    // --- 8. Price snapshot result ---
    await prisma.productVariant.update({ where: { id: variantA.id }, data: { price: 199900 } });
    const fetchedOrder = await OrderService.getCustomerOrderById(user.id, validOrder.id);
    assert(fetchedOrder.items[0].unitPrice === 149900, 'Price snapshot result');

    // --- 9. Product-name snapshot result ---
    await prisma.product.update({ where: { id: productA.id }, data: { name: 'Royal Heritage Silk Saree' } });
    const fetchedOrder2 = await OrderService.getCustomerOrderById(user.id, validOrder.id);
    assert(fetchedOrder2.items[0].productName === 'Royal Silk Saree', 'Product-name snapshot result');

    // --- 10. Address snapshot result ---
    await prisma.address.update({ where: { id: address.id }, data: { addressLine1: '99 Changed Street' } });
    const fetchedOrder3 = await OrderService.getCustomerOrderById(user.id, validOrder.id);
    assert(fetchedOrder3.shippingAddress!.line1 === '12 Example Street', 'Address snapshot result');

    // --- 11. Cart no-reservation regression ---
    const cartAfter = await CartService.getOrCreateCart(user.id);
    assert(cartAfter.itemCount === 2, 'Cart-after-checkout behavior (Cart remains intact)');
    
    await CartService.addItem(userB.id, { variantId: variantA.id, quantity: 1 });
    const invA2 = await prisma.inventory.findFirst({ where: { variantId: variantA.id }});
    assert(invA2!.reservedQuantity === 2, 'Cart no-reservation regression (Adding to cart did not change reservation)');

    // --- 12. Same-key idempotency result ---
    const dupOrder = await OrderService.createCheckoutOrder(user.id, { shippingAddressId: address.id }, 'key-valid-1');
    assert(dupOrder.id === validOrder.id, 'Same-key idempotency result');
    const invA3 = await prisma.inventory.findFirst({ where: { variantId: variantA.id }});
    assert(invA3!.reservedQuantity === 2, 'Same-key reservation idempotency (no double deduction)');

    // --- 13. Checkout concurrency result (overselling prevention) ---
    // User A has 2 variants. User B has 1. Total 3. Available = 5 - 2 = 3.
    // Let User B try to checkout 3. User A (who already has 2 reserved, 2 items in cart, but cart quantity can be updated to 3) try to checkout 3.
    await CartService.updateItemQuantity(user.id, cartAfter.items[0].cartItemId, { quantity: 3 });
    await CartService.updateItemQuantity(userB.id, (await CartService.getOrCreateCart(userB.id)).items[0].cartItemId, { quantity: 3 });

    // Available is 3 (qty 5, res 2). If User A checks out, 3 are reserved (fails because 2 are already from old order, wait! user A's old cart wasn't cleared!).
    // Let's just create a new product for clean concurrency test.
    const productC = await prisma.product.create({
      data: { name: 'Test C', slug: 'test-c', basePrice: 1000, categoryId: category.id, status: 'PUBLISHED' }
    });
    const variantC = await ProductVariantService.createVariant(productC.id, {
      sku: 'V8-C', price: 1000, quantity: 1
    });

    await CartService.addItem(user.id, { variantId: variantC.id, quantity: 1 });
    await CartService.addItem(userB.id, { variantId: variantC.id, quantity: 1 });

    const p1 = OrderService.createCheckoutOrder(user.id, { shippingAddressId: address.id }, 'key-concur-A');
    const p2 = OrderService.createCheckoutOrder(userB.id, { shippingAddressId: addressB.id }, 'key-concur-B');

    let successCount = 0;
    let failCount = 0;
    try { await p1; successCount++; } catch(e) { failCount++; }
    try { await p2; successCount++; } catch(e) { failCount++; }

    assert(successCount === 1 && failCount === 1, 'Checkout concurrency result (exactly one succeeds)');
    const invC = await prisma.inventory.findFirst({ where: { variantId: variantC.id }});
    assert(invC!.reservedQuantity === 1, 'Checkout concurrency reservation quantity check');

    // --- 14. Concurrent same-key result ---
    const productD = await prisma.product.create({
      data: { name: 'Test D', slug: 'test-d', basePrice: 1000, categoryId: category.id, status: 'PUBLISHED' }
    });
    const variantD = await ProductVariantService.createVariant(productD.id, {
      sku: 'V8-D', price: 1000, quantity: 5
    });

    await CartService.clearCart(user.id);
    await CartService.addItem(user.id, { variantId: variantD.id, quantity: 1 });

    const p3 = OrderService.createCheckoutOrder(user.id, { shippingAddressId: address.id }, 'key-same-conc');
    const p4 = OrderService.createCheckoutOrder(user.id, { shippingAddressId: address.id }, 'key-same-conc');

    let succ = 0;
    let orders = new Set();
    try { const o = await p3; succ++; orders.add(o.id); } catch(e) {}
    try { const o = await p4; succ++; orders.add(o.id); } catch(e) {}

    // Either both succeed returning the SAME order, or one succeeds and one throws unique constraint error
    // Prisma transaction might throw unique constraint if idempotency key is inserted concurrently
    assert(orders.size === 1, 'Concurrent same-key result (only 1 order created)');
    const invD = await prisma.inventory.findFirst({ where: { variantId: variantD.id }});
    assert(invD!.reservedQuantity === 1, 'Concurrent same-key inventory check');

    // --- 15. Reservation expiration result & Double-expiration result ---
    const orderToExpire = await OrderService.getCustomerOrderById(user.id, Array.from(orders)[0] as string);
    // Force expiration in past
    await prisma.order.update({
      where: { id: orderToExpire.id },
      data: { reservationExpiresAt: new Date(Date.now() - 10000) }
    });

    const expResult = await OrderService.expirePendingOrders();
    assert(expResult.successful >= 1, 'Reservation expiration result');
    
    const invD2 = await prisma.inventory.findFirst({ where: { variantId: variantD.id }});
    assert(invD2!.reservedQuantity === 0, 'Inventory release audit result (reserved quantity 0)');

    const expResult2 = await OrderService.expirePendingOrders();
    assert(expResult2.successful === 0, 'Double-expiration result (0 processed)');

    // --- 16. Expired Order history result ---
    const histOrder = await OrderService.getCustomerOrderById(user.id, orderToExpire.id);
    assert(histOrder.status === 'EXPIRED', 'Expired Order history result');

    // --- 17. Customer Order ownership result ---
    try {
      await OrderService.getCustomerOrderById(userB.id, orderToExpire.id);
      assert(false, 'Should reject cross user order access');
    } catch(e: any) {
      assert(e.name === 'NotFoundError' || e.constructor.name === 'NotFoundError', 'Customer Order ownership result');
    }

    // --- 18. Admin authorization result ---
    const adminOrder = await OrderService.getAdminOrderById(orderToExpire.id);
    assert(adminOrder.id === orderToExpire.id, 'Admin authorization result (Read success)');

    // --- 19. Order-number uniqueness result ---
    const userOrders = await OrderService.getCustomerOrders(user.id);
    const userBOrders = await OrderService.getCustomerOrders(userB.id);
    const allNums = new Set([...userOrders.orders.map(o => o.orderNumber), ...userBOrders.orders.map(o => o.orderNumber)]);
    assert(allNums.size === userOrders.orders.length + userBOrders.orders.length, 'Order-number uniqueness result');

    // Cleanup
    await prisma.orderAddress.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    
    await prisma.inventoryTransaction.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.address.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Temporary test-data cleanup result');

  } catch (error) {
    console.error(error);
    failures++;
  }

  if (failures > 0) {
    console.error(`\n--- ${failures} TESTS FAILED ---`);
    process.exit(1);
  } else {
    console.log('\n--- ALL V8 TESTS PASSED ---');
  }
}

run();
