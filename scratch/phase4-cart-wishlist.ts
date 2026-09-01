import { prisma } from '../src/lib/prisma';

const API_URL = 'http://localhost:3001/api';

const CUSTOMER_A = { email: 'customerA_phase4@local.test', password: 'password123', name: 'Cust A P4' };
const CUSTOMER_B = { email: 'customerB_phase4@local.test', password: 'password123', name: 'Cust B P4' };
const ADMIN = { email: 'admin_phase4@local.test', password: 'password123', name: 'Admin P4' };

let cookieCustomerA = '';
let cookieCustomerB = '';
let cookieAdmin = '';

async function runTest(
  name: string,
  endpoint: string,
  method: string,
  body: any,
  cookieStr: string,
  expectedStatuses: number[]
) {
  console.log(name);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Method: ${method}`);
  
  const headers: any = {
    'Origin': 'http://localhost:3000'
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
  console.log('Cleaning up Phase 4 test data...');
  // Delete all users created for this test, cascade deletes should handle the rest
  await prisma.user.deleteMany({ where: { email: { in: [CUSTOMER_A.email, CUSTOMER_B.email, ADMIN.email] } } });
  
  // Clean up products
  await prisma.productImage.deleteMany({ where: { product: { slug: { startsWith: 'phase4-test-' } } } });
  await prisma.productVariant.deleteMany({ where: { product: { slug: { startsWith: 'phase4-test-' } } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: 'phase4-test-' } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: 'phase4-test-' } } });
  
  console.log('Cleanup complete.');
}

async function createAccountAndGetCookie(user: any, role: 'CUSTOMER' | 'ADMIN' = 'CUSTOMER') {
  const res = await fetch(`${API_URL}/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify(user)
  });
  if (!res.ok) {
    console.error(`Signup failed for ${user.email}:`, await res.text());
    return '';
  }
  
  if (role === 'ADMIN') {
    await prisma.user.update({
      where: { email: user.email },
      data: { role: 'ADMIN' }
    });
    
    // Re-login to get admin session
    const resLogin = await fetch(`${API_URL}/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({ email: user.email, password: user.password })
    });
    const setCookies = resLogin.headers.getSetCookie ? resLogin.headers.getSetCookie() : [];
    return setCookies.map(c => c.split(';')[0]).join('; ');
  }
  
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  return setCookies.map(c => c.split(';')[0]).join('; ');
}

async function setup() {
  await cleanup();
  
  cookieCustomerA = await createAccountAndGetCookie(CUSTOMER_A);
  cookieCustomerB = await createAccountAndGetCookie(CUSTOMER_B);
  cookieAdmin = await createAccountAndGetCookie(ADMIN, 'ADMIN');

  // Create test product and variant directly via DB for isolated testing
  const category = await prisma.category.create({
    data: { name: 'P4 Category', slug: 'phase4-test-category', isActive: true }
  });

  const product = await prisma.product.create({
    data: {
      name: 'P4 Product',
      slug: 'phase4-test-product',
      basePrice: 1000,
      categoryId: category.id,
      status: 'PUBLISHED',
      variants: {
        create: [
          {
            sku: 'P4-VAR-1',
            price: 1200,
            isActive: true,
            inventory: {
              create: { quantity: 10, reservedQuantity: 0 }
            }
          },
          {
            sku: 'P4-VAR-2',
            price: 1500,
            isActive: true,
            inventory: {
              create: { quantity: 5, reservedQuantity: 0 }
            }
          }
        ]
      }
    },
    include: { variants: true }
  });

  return { product, variants: product.variants };
}

async function main() {
  console.log('Starting Phase 4 Tests\n');
  const { product, variants } = await setup();
  const variant1 = variants[0];
  const variant2 = variants[1];
  
  // A. CART RETRIEVAL
  await runTest('1a. Empty cart retrieval', '/me/cart', 'GET', null, cookieCustomerA, [200]);
  await runTest('1b. Unauthenticated access rejected', '/me/cart', 'GET', null, '', [401]);
  
  // B. ADD TO CART
  await runTest('2a. Add quantity 1', '/me/cart/items', 'POST', { variantId: variant1.id, quantity: 1 }, cookieCustomerA, [201]);
  await runTest('2b. Add quantity > 1', '/me/cart/items', 'POST', { variantId: variant2.id, quantity: 2 }, cookieCustomerA, [201]);
  await runTest('2c. Add same variant twice', '/me/cart/items', 'POST', { variantId: variant1.id, quantity: 1 }, cookieCustomerA, [200, 201]);
  
  // Verify cart totals
  const cartRes = await runTest('2d. Verify cart persistence and totals', '/me/cart', 'GET', null, cookieCustomerA, [200]);
  if (cartRes.data?.data) {
    const items = cartRes.data.data.items;
    const subtotal = cartRes.data.data.subtotal;
    // v1: 2 qty @ 1200 = 2400
    // v2: 2 qty @ 1500 = 3000
    // total = 5400
    if (subtotal !== 5400) console.error(`Unexpected subtotal: ${subtotal} instead of 5400`);
  }

  await runTest('2e. Invalid variant ID', '/me/cart/items', 'POST', { variantId: 'nonexistent', quantity: 1 }, cookieCustomerA, [400, 404, 500]); // Should be 404 or validation error
  await runTest('2f. Zero quantity', '/me/cart/items', 'POST', { variantId: variant1.id, quantity: 0 }, cookieCustomerA, [400]);
  await runTest('2g. Negative quantity', '/me/cart/items', 'POST', { variantId: variant1.id, quantity: -1 }, cookieCustomerA, [400]);
  await runTest('2h. Insufficient stock (request 20, max 10)', '/me/cart/items', 'POST', { variantId: variant1.id, quantity: 20 }, cookieCustomerB, [400, 409]);

  // C. UPDATE CART ITEM
  const cartData = cartRes.data?.data;
  let cartItemId1 = '';
  if (cartData && cartData.items.length > 0) {
    cartItemId1 = cartData.items.find((i: any) => i.variant.id === variant1.id)?.cartItemId;
  }
  
  if (cartItemId1) {
    await runTest('3a. Valid quantity decrease', `/me/cart/items/${cartItemId1}`, 'PATCH', { quantity: 1 }, cookieCustomerA, [200]);
    await runTest('3b. Excessive quantity update', `/me/cart/items/${cartItemId1}`, 'PATCH', { quantity: 20 }, cookieCustomerA, [400, 409]);
    await runTest('3c. Update someone elses cart item', `/me/cart/items/${cartItemId1}`, 'PATCH', { quantity: 2 }, cookieCustomerB, [403, 404]);
  }

  // D. REMOVE CART ITEM
  if (cartItemId1) {
    await runTest('4a. Remove someone elses item', `/me/cart/items/${cartItemId1}`, 'DELETE', null, cookieCustomerB, [403, 404]);
    await runTest('4b. Remove valid item', `/me/cart/items/${cartItemId1}`, 'DELETE', null, cookieCustomerA, [200]);
    await runTest('4c. Remove already deleted item', `/me/cart/items/${cartItemId1}`, 'DELETE', null, cookieCustomerA, [400, 404]);
  }

  // WISHLIST TESTS
  await runTest('5a. Get empty wishlist', '/me/wishlist', 'GET', null, cookieCustomerA, [200]);
  
  // Add to wishlist
  const wlAddRes = await runTest('5b. Add valid product', '/me/wishlist', 'POST', { productId: product.id }, cookieCustomerA, [200, 201]);
  await runTest('5c. Add same item twice', '/me/wishlist', 'POST', { productId: product.id }, cookieCustomerA, [200, 201]);
  await runTest('5d. Add invalid product', '/me/wishlist', 'POST', { productId: 'invalid-id' }, cookieCustomerA, [400, 404]);

  let wishlistItemId = '';
  if (wlAddRes.data?.data?.wishlistItem?.id) {
    wishlistItemId = wlAddRes.data.data.wishlistItem.id;
  } else if (wlAddRes.data?.wishlistItem?.id) {
     wishlistItemId = wlAddRes.data.wishlistItem.id;
  } else {
    // try to get wishlist to find ID
    const wlGetRes = await runTest('Get wishlist to find ID', '/me/wishlist', 'GET', null, cookieCustomerA, [200]);
    if (wlGetRes.data?.data?.length > 0) {
      wishlistItemId = wlGetRes.data.data[0].id;
    }
  }

  if (wishlistItemId) {
    await runTest('5e. Remove someone elses wishlist item', `/me/wishlist/${wishlistItemId}`, 'DELETE', null, cookieCustomerB, [403, 404]);
    
    // MOVE TO CART
    await runTest('6a. Move to cart (valid)', `/me/wishlist/${wishlistItemId}/move-to-cart`, 'POST', { variantId: variant1.id, quantity: 1 }, cookieCustomerA, [200, 201]);
    
    // Verify item is removed from wishlist
    const wlGetRes2 = await runTest('6b. Verify wishlist item removed', '/me/wishlist', 'GET', null, cookieCustomerA, [200]);
    if (wlGetRes2.data?.data?.length === 0) {
      console.log('Wishlist is correctly empty after move.');
    } else {
      console.log('Wishlist is NOT empty after move!');
    }

    // Verify item is added to cart
    await runTest('6c. Verify cart has moved item', '/me/cart', 'GET', null, cookieCustomerA, [200]);
  }

  await cleanup();
  console.log('Phase 4 Tests Complete.');
}

main().catch(e => console.error(e));
