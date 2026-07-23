import { prisma } from '../src/lib/prisma';
import { ProductVariantService } from '../src/server/services/product-variant.service';
import { InventoryService } from '../src/server/services/inventory.service';
import { CartService } from '../src/server/services/cart.service';
import { WishlistService } from '../src/server/services/wishlist.service';
import { ProductStatus } from '@prisma/client';

async function run() {
  console.log('--- STARTING V7 RUNTIME TESTS ---');
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
    // Setup temporary User
    const user = await prisma.user.create({
      data: { email: 'v7-test@example.com', name: 'V7 Test User' }
    });
    const userB = await prisma.user.create({
      data: { email: 'v7-test-b@example.com', name: 'V7 Test User B' }
    });

    const category = await prisma.category.create({
      data: { name: 'V7 Test Category', slug: 'v7-test-cat', isActive: true }
    });

    const product = await prisma.product.create({
      data: {
        name: 'V7 Test Product',
        slug: 'v7-test-prod',
        basePrice: 149900,
        categoryId: category.id,
        status: ProductStatus.PUBLISHED
      }
    });

    const variant = await ProductVariantService.createVariant(product.id, {
      sku: 'V7-TEST-BLK-M',
      size: 'M',
      color: 'Black',
      price: null,
      quantity: 10
    });

    // 1. Empty Cart Test
    const emptyCart = await CartService.getOrCreateCart(user.id);
    assert(emptyCart.items.length === 0 && emptyCart.itemCount === 0 && emptyCart.subtotal === 0, 'Empty Cart result');

    // 2. Add-to-Cart Test & No-stock-reservation
    const beforeAddInv = await prisma.inventory.findUnique({ where: { variantId: variant.id } });
    
    await CartService.addItem(user.id, { variantId: variant.id, quantity: 2 });
    const cartAfterAdd = await CartService.getOrCreateCart(user.id);
    const addedItem = cartAfterAdd.items[0];
    
    assert(addedItem.quantity === 2 && addedItem.pricing.unitPrice === 149900 && addedItem.pricing.lineTotal === 299800, 'Add-to-Cart result');
    
    const afterAddInv = await prisma.inventory.findUnique({ where: { variantId: variant.id } });
    assert(afterAddInv!.reservedQuantity === beforeAddInv!.reservedQuantity && afterAddInv!.quantity === beforeAddInv!.quantity, 'No-stock-reservation result (Mandatory check)');

    // 3. Duplicate Add result
    await CartService.addItem(user.id, { variantId: variant.id, quantity: 3 });
    const cartAfterDup = await CartService.getOrCreateCart(user.id);
    assert(cartAfterDup.items.length === 1 && cartAfterDup.items[0].quantity === 5, 'Duplicate Add result');

    // 4. Quantity update result
    await CartService.updateItemQuantity(user.id, addedItem.cartItemId, { quantity: 3 });
    const cartAfterUpdate = await CartService.getOrCreateCart(user.id);
    assert(cartAfterUpdate.items[0].quantity === 3, 'Quantity update result');

    // 5. Insufficient-stock Add result
    try {
      await CartService.addItem(user.id, { variantId: variant.id, quantity: 15 });
      assert(false, 'Insufficient stock should be rejected');
    } catch (e: unknown) {
      assert(e instanceof Error && (e.name === 'ValidationError' || e.constructor.name === 'ValidationError' || e.name === 'ZodError' || e.constructor.name === 'ZodError'), 'Insufficient-stock Add result');
    }

    // 6. Insufficient-stock Update result
    try {
      await CartService.updateItemQuantity(user.id, addedItem.cartItemId, { quantity: 15 });
      assert(false, 'Insufficient stock update should be rejected');
    } catch (e: unknown) {
      assert(e instanceof Error && (e.name === 'ValidationError' || e.constructor.name === 'ValidationError' || e.name === 'ZodError' || e.constructor.name === 'ZodError'), 'Insufficient-stock Update result');
    }

    // 7. Stale Cart & Price-change result
    await prisma.productVariant.update({ where: { id: variant.id }, data: { price: 159900 } });
    await InventoryService.adjustStock(product.id, variant.id, { delta: -9, reason: 'test' }); // 1 available left, but cart has 3
    
    const cartStale = await CartService.getOrCreateCart(user.id);
    const staleItem = cartStale.items[0];
    assert(staleItem.quantity === 3 && staleItem.availability.available === false && staleItem.availability.stockStatus === 'INSUFFICIENT_STOCK', 'Stale Cart result');
    assert(staleItem.pricing.unitPrice === 159900, 'Price-change result');

    // 8. Out-of-stock result
    await InventoryService.adjustStock(product.id, variant.id, { delta: -1, reason: 'test' }); // 0 available left
    try {
      await CartService.addItem(user.id, { variantId: variant.id, quantity: 1 });
      assert(false, 'Out of stock should be rejected');
    } catch (e: unknown) {
      assert(e instanceof Error && (e.name === 'ValidationError' || e.constructor.name === 'ValidationError' || e.name === 'ZodError' || e.constructor.name === 'ZodError'), 'Out-of-stock result');
    }

    const cartStaleOut = await CartService.getOrCreateCart(user.id);
    assert(cartStaleOut.items[0].availability.stockStatus === 'OUT_OF_STOCK', 'Stale cart stock status OUT_OF_STOCK');

    // Restore stock
    await InventoryService.adjustStock(product.id, variant.id, { delta: 10, reason: 'restore' });

    // 9. Inactive Variant result
    await prisma.productVariant.update({ where: { id: variant.id }, data: { isActive: false } });
    try {
      await CartService.addItem(user.id, { variantId: variant.id, quantity: 1 });
      assert(false, 'Inactive variant should be rejected');
    } catch (e: unknown) {
      assert(e instanceof Error && (e.name === 'ValidationError' || e.constructor.name === 'ValidationError' || e.name === 'ZodError' || e.constructor.name === 'ZodError'), 'Inactive Variant result');
    }

    // 10. Non-published Product result
    await prisma.productVariant.update({ where: { id: variant.id }, data: { isActive: true } });
    await prisma.product.update({ where: { id: product.id }, data: { status: 'DRAFT' } });
    try {
      await CartService.addItem(user.id, { variantId: variant.id, quantity: 1 });
      assert(false, 'Non-published product should be rejected');
    } catch (e: unknown) {
      assert(e instanceof Error && (e.name === 'ValidationError' || e.constructor.name === 'ValidationError' || e.name === 'ZodError' || e.constructor.name === 'ZodError'), 'Non-published Product result');
    }
    await prisma.product.update({ where: { id: product.id }, data: { status: 'PUBLISHED' } });

    // 11. Cart total result
    const cartTotals = await CartService.getOrCreateCart(user.id);
    assert(cartTotals.subtotal === 159900 * 3, 'Cart total result');

    // 12. Cross-user Cart isolation result
    try {
      await CartService.removeItem(userB.id, cartTotals.items[0].cartItemId);
      assert(false, 'Should reject cross user deletion');
    } catch (e: unknown) {
      assert(e instanceof Error && (e.name === 'NotFoundError' || e.constructor.name === 'NotFoundError'), 'Cross-user Cart isolation result');
    }

    // 13. Remove CartItem result
    await CartService.removeItem(user.id, cartTotals.items[0].cartItemId);
    const cartAfterRemove = await CartService.getOrCreateCart(user.id);
    assert(cartAfterRemove.items.length === 0, 'Remove CartItem result');

    // 14. Clear Cart result
    await CartService.addItem(user.id, { variantId: variant.id, quantity: 1 });
    await CartService.clearCart(user.id);
    const cartAfterClear = await CartService.getOrCreateCart(user.id);
    assert(cartAfterClear.items.length === 0 && cartAfterClear.subtotal === 0, 'Clear Cart result');

    // 15. Wishlist Add result
    const wlAdd = await WishlistService.addProduct(user.id, { productId: product.id });
    assert(wlAdd.success, 'Wishlist Add result');

    // 16. Duplicate Wishlist result
    const wlDup = await WishlistService.addProduct(user.id, { productId: product.id });
    assert(wlDup.success && wlDup.message === 'Already in wishlist', 'Duplicate Wishlist result');

    const wishlist = await WishlistService.getWishlist(user.id);
    assert(wishlist.length === 1 && wishlist[0].productId === product.id, 'Wishlist contains exact item');

    // 17. Cross-user Wishlist isolation result
    try {
      await WishlistService.removeProduct(userB.id, wishlist[0].id);
      assert(false, 'Should reject cross user wishlist remove');
    } catch(e: unknown) {
      assert(e instanceof Error && (e.name === 'NotFoundError' || e.constructor.name === 'NotFoundError'), 'Cross-user Wishlist isolation result');
    }

    // 18. Wishlist -> Cart result
    await WishlistService.moveToCart(user.id, wishlist[0].id, {});
    const wlAfterMove = await WishlistService.getWishlist(user.id);
    const cartAfterMove = await CartService.getOrCreateCart(user.id);
    assert(wlAfterMove.length === 0 && cartAfterMove.items.length === 1 && cartAfterMove.items[0].variant.id === variant.id, 'Wishlist -> Cart result');

    // 19. Cross-product Variant rejection result
    const productB = await prisma.product.create({
      data: { name: 'Prod B', slug: 'pb', basePrice: 100, categoryId: category.id, status: 'PUBLISHED' }
    });
    const variantB = await ProductVariantService.createVariant(productB.id, { sku: 'PB', quantity: 1 });
    const wlAddB = await WishlistService.addProduct(user.id, { productId: product.id });
    
    try {
      await WishlistService.moveToCart(user.id, (await WishlistService.getWishlist(user.id))[0].id, { variantId: variantB.id });
      assert(false, 'Should reject variant from different product');
    } catch(e: unknown) {
      assert(e instanceof Error && (e.name === 'ValidationError' || e.constructor.name === 'ValidationError' || e.name === 'ZodError' || e.constructor.name === 'ZodError'), 'Cross-product Variant rejection result');
    }

    // 20. Wishlist Remove result
    await WishlistService.removeProduct(user.id, (await WishlistService.getWishlist(user.id))[0].id);
    assert((await WishlistService.getWishlist(user.id)).length === 0, 'Wishlist Remove result');

    // 21. V6 concurrency regression (two simultaneous reserve)
    await InventoryService.adjustStock(product.id, variant.id, { delta: -9, reason: 'test' }); // 1 available left
    
    let concurrencySuccesses = 0;
    let concurrencyFailures = 0;
    
    await Promise.all([
      InventoryService.reserveStock(product.id, variant.id, { quantity: 1 }).then(() => concurrencySuccesses++).catch(() => concurrencyFailures++),
      InventoryService.reserveStock(product.id, variant.id, { quantity: 1 }).then(() => concurrencySuccesses++).catch(() => concurrencyFailures++)
    ]);
    assert(concurrencySuccesses === 1 && concurrencyFailures === 1, 'V6 concurrency regression result');


    // Clean up
    await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
    await prisma.cart.deleteMany({ where: { userId: user.id } });
    await prisma.wishlistItem.deleteMany({ where: { userId: user.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.product.delete({ where: { id: productB.id } });
    await prisma.category.delete({ where: { id: category.id } });
    await prisma.user.deleteMany({ where: { email: { in: ['v7-test@example.com', 'v7-test-b@example.com'] } } });
    
    console.log('✅ Temporary test-data cleanup result');

  } catch (error) {
    console.error(error);
    failures++;
  }

  if (failures > 0) {
    console.error(`\n--- ${failures} TESTS FAILED ---`);
    process.exit(1);
  } else {
    console.log('\n--- ALL V7 TESTS PASSED ---');
    process.exit(0);
  }
}

run();
