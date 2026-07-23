import { prisma } from '../src/lib/prisma';
import { ProductVariantService } from '../src/server/services/product-variant.service';
import { InventoryService } from '../src/server/services/inventory.service';
import { ProductStatus } from '@prisma/client';

async function run() {
  console.log('--- STARTING V6 RUNTIME TESTS ---');
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
    // 1. Setup temporary Category and Product
    const category = await prisma.category.create({
      data: { name: 'V6 Test Category', slug: 'v6-test-cat', isActive: true }
    });
    const product = await prisma.product.create({
      data: {
        name: 'V6 Test Product',
        slug: 'v6-test-prod',
        basePrice: 100000,
        categoryId: category.id,
        status: ProductStatus.PUBLISHED
      }
    });

    // 2. Variant Creation
    const variant1 = await ProductVariantService.createVariant(product.id, {
      sku: 'V6-TEST-BLK-M',
      size: 'M',
      color: 'Black',
      price: null,
      quantity: 10,
      lowStockThreshold: 3
    });
    assert(variant1.inventory!.quantity === 10, 'Variant creation initializes inventory');
    assert(variant1.size === 'M', 'Variant size normalized properly');

    const variant2 = await ProductVariantService.createVariant(product.id, {
      sku: 'v6-test-red-s ',
      size: ' s ',
      color: ' RED',
      price: 120000,
      quantity: 0
    });
    assert(variant2.sku === 'V6-TEST-RED-S', 'SKU normalized to uppercase');
    assert(variant2.size === 'S', 'Size normalized to uppercase');
    assert(variant2.color === 'Red', 'Color normalized to title case');

    // 3. Variant Uniqueness (Duplicate Logical)
    try {
      await ProductVariantService.createVariant(product.id, {
        sku: 'V6-TEST-DUP',
        size: 's',
        color: 'red'
      });
      assert(false, 'Duplicate logical variant should be rejected');
    } catch (e: any) {
      assert(e.constructor.name === 'ConflictError', 'Duplicate logical variant rejected');
    }

    // 4. SKU Uniqueness
    try {
      await ProductVariantService.createVariant(product.id, {
        sku: 'V6-TEST-BLK-M',
        size: 'L',
        color: 'Blue'
      });
      assert(false, 'Duplicate SKU should be rejected');
    } catch (e: any) {
      assert(e.constructor.name === 'ConflictError', 'Duplicate SKU rejected');
    }

    // 5. Stock Adjustment
    const adjusted = await InventoryService.adjustStock(product.id, variant1.id, { delta: 5, reason: 'Test' });
    assert(adjusted!.quantity === 15, 'Stock adjustment increases quantity');

    const decreased = await InventoryService.adjustStock(product.id, variant1.id, { delta: -2, reason: 'Test' });
    assert(decreased!.quantity === 13, 'Stock adjustment decreases quantity');

    try {
      await InventoryService.adjustStock(product.id, variant1.id, { delta: -20, reason: 'Test' });
      assert(false, 'Negative stock adjustment should fail');
    } catch (e: any) {
      assert(e.constructor.name === 'ConflictError', 'Negative stock adjustment rejected');
    }

    // 6. Reservation
    const reserved = await InventoryService.reserveStock(product.id, variant1.id, { quantity: 3 });
    assert(reserved!.reservedQuantity === 3, 'Stock reserved');
    
    // 7. Over-reservation
    try {
      await InventoryService.reserveStock(product.id, variant1.id, { quantity: 15 });
      assert(false, 'Over-reservation should fail');
    } catch (e: any) {
      assert(e.constructor.name === 'ConflictError', 'Over-reservation rejected');
    }

    // 8. Release Reservation
    const released = await InventoryService.releaseStock(product.id, variant1.id, { quantity: 1 });
    assert(released!.reservedQuantity === 2, 'Stock reservation released');

    try {
      await InventoryService.releaseStock(product.id, variant1.id, { quantity: 5 });
      assert(false, 'Excessive release should fail');
    } catch (e: any) {
      assert(e.constructor.name === 'ConflictError', 'Excessive release rejected');
    }

    // 9. Commit Reservation
    const committed = await InventoryService.commitStock(product.id, variant1.id, { quantity: 2 });
    assert(committed!.quantity === 11 && committed!.reservedQuantity === 0, 'Reserved stock committed');

    // 10. Concurrency Safety
    let concurrencySuccesses = 0;
    let concurrencyFailures = 0;
    
    await InventoryService.adjustStock(product.id, variant2.id, { delta: 1 });
    
    await Promise.all([
      InventoryService.reserveStock(product.id, variant2.id, { quantity: 1 }).then(() => concurrencySuccesses++).catch(() => concurrencyFailures++),
      InventoryService.reserveStock(product.id, variant2.id, { quantity: 1 }).then(() => concurrencySuccesses++).catch(() => concurrencyFailures++)
    ]);
    assert(concurrencySuccesses === 1 && concurrencyFailures === 1, 'Concurrency: exactly one succeeds, one fails');

    // Clean up
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.category.delete({ where: { id: category.id } });
    console.log('✅ Temporary test-data cleanup passed');

  } catch (error) {
    console.error(error);
    failures++;
  }

  if (failures > 0) {
    console.error(`\n--- ${failures} TESTS FAILED ---`);
    process.exit(1);
  } else {
    console.log('\n--- ALL V6 TESTS PASSED ---');
    process.exit(0);
  }
}

run();
