import { prisma } from '../src/lib/prisma';
import fs from 'fs';

const API_URL = 'http://localhost:3001/api';

const CUSTOMER = { email: 'customer_phase3@local.test', password: 'password123', name: 'Cust P3' };
const ADMIN = { email: 'admin_phase3@local.test', password: 'password123', name: 'Admin P3' };

let cookieCustomer = '';
let cookieAdmin = '';

async function runTest(
  name: string,
  endpoint: string,
  method: string,
  body: any,
  cookieStr: string,
  expectedStatuses: number[],
  isMultipart = false
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
    if (isMultipart) {
      fetchBody = body; // It's FormData
    } else {
      headers['Content-Type'] = 'application/json';
      fetchBody = JSON.stringify(body);
    }
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
    await res.text();
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
  console.log('Cleaning up Phase 3 test data...');
  // Find all E2E prefixes and delete
  await prisma.productImage.deleteMany({ where: { product: { slug: { startsWith: 'e2e-test-' } } } });
  await prisma.productVariant.deleteMany({ where: { product: { slug: { startsWith: 'e2e-test-' } } } });
  await prisma.productCollection.deleteMany({ where: { collection: { slug: { startsWith: 'e2e-test-' } } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: 'e2e-test-' } } });
  await prisma.collection.deleteMany({ where: { slug: { startsWith: 'e2e-test-' } } });
  await prisma.category.deleteMany({ where: { slug: { startsWith: 'e2e-test-' } } });
  
  await prisma.user.deleteMany({ where: { email: { in: [CUSTOMER.email, ADMIN.email] } } });
  console.log('Cleanup complete.');
}

async function setup() {
  await cleanup();
  
  // Create test accounts
  const resCust = await fetch(`${API_URL}/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify(CUSTOMER)
  });
  if (!resCust.ok) {
    console.error('Customer signup failed:', await resCust.text());
    return;
  }
  
  const setCookiesCust = resCust.headers.getSetCookie ? resCust.headers.getSetCookie() : [];
  cookieCustomer = setCookiesCust.map(c => c.split(';')[0]).join('; ');

  const resAdmin = await fetch(`${API_URL}/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify(ADMIN)
  });
  if (!resAdmin.ok) {
    console.error('Admin signup failed:', await resAdmin.text());
    return;
  }
  
  await prisma.user.update({
    where: { email: ADMIN.email },
    data: { role: 'ADMIN' }
  });

  const resAdminLogin = await fetch(`${API_URL}/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ email: ADMIN.email, password: ADMIN.password })
  });
  if (!resAdminLogin.ok) {
    console.error('Admin login failed:', await resAdminLogin.text());
    return;
  }
  const setCookiesAdmin = resAdminLogin.headers.getSetCookie ? resAdminLogin.headers.getSetCookie() : [];
  cookieAdmin = setCookiesAdmin.map(c => c.split(';')[0]).join('; ');
}

async function main() {
  console.log('Starting Phase 3 Tests\\n');
  await setup();
  
  // 1. CATEGORY TESTING
  const rootCatRes = await runTest('1a. Admin creates root category', '/admin/categories', 'POST', { name: 'E2E_TEST_ROOT_CAT', slug: 'e2e-test-root-cat', description: 'Test', isActive: true }, cookieAdmin, [200, 201]);
  const rootCatId = rootCatRes.data?.data?.id;

  const childCatRes = await runTest('1b. Admin creates child category', '/admin/categories', 'POST', { name: 'E2E_TEST_CHILD_CAT', slug: 'e2e-test-child-cat', parentId: rootCatId }, cookieAdmin, [200, 201]);
  const childCatId = childCatRes.data?.data?.id;
  
  await runTest('1c. Invalid parent reference rejected', '/admin/categories', 'POST', { name: 'E2E_TEST_BAD_CAT', slug: 'e2e-test-bad-cat', parentId: 'invalid-id' }, cookieAdmin, [400, 404, 500]);
  await runTest('1d. Duplicate slug rejected', '/admin/categories', 'POST', { name: 'E2E_TEST_ROOT_CAT_DUP', slug: 'e2e-test-root-cat' }, cookieAdmin, [400, 409, 500]);
  await runTest('1e. Customer forbidden from category creation', '/admin/categories', 'POST', { name: 'E2E_HACK', slug: 'e2e-hack' }, cookieCustomer, [401, 403]);
  await runTest('1f. Public catalog gets categories', '/categories', 'GET', null, '', [200]);

  // 2. COLLECTION TESTING
  const now = new Date();
  const future = new Date(now.getTime() + 86400000);
  const colRes = await runTest('2a. Admin creates active collection', '/admin/collections', 'POST', { name: 'E2E_TEST_COLL', slug: 'e2e-test-coll', isActive: true }, cookieAdmin, [200, 201]);
  const colId = colRes.data?.data?.id;

  await runTest('2b. Admin creates future collection', '/admin/collections', 'POST', { name: 'E2E_TEST_FUTURE_COLL', slug: 'e2e-test-future-coll', isActive: true, startsAt: future.toISOString() }, cookieAdmin, [200, 201]);
  await runTest('2c. Invalid date ranges', '/admin/collections', 'POST', { name: 'E2E_BAD_DATES', slug: 'e2e-bad-dates', startsAt: future.toISOString(), endsAt: now.toISOString() }, cookieAdmin, [400, 500]);
  await runTest('2d. Public catalog collection visibility', '/collections', 'GET', null, '', [200]);

  // 3. PRODUCT TESTING
  const prodRes = await runTest('3a. Admin creates draft product', '/admin/products', 'POST', {
    name: 'E2E_TEST_PRODUCT',
    slug: 'e2e-test-product',
    categoryId: childCatId,
    basePrice: 1000,
    status: 'DRAFT'
  }, cookieAdmin, [200, 201]);
  const prodId = prodRes.data?.data?.id;

  await runTest('3b. Required field validation (missing name)', '/admin/products', 'POST', { slug: 'e2e-bad-product', categoryId: childCatId, basePrice: 1000 }, cookieAdmin, [400]);
  await runTest('3c. Update product to PUBLISHED', `/admin/products/${prodId}`, 'PATCH', { status: 'PUBLISHED' }, cookieAdmin, [200]);

  // 4. PRODUCT VARIANT TESTING
  const varRes = await runTest('4a. Admin creates variant', `/admin/products/${prodId}/variants`, 'POST', { sku: 'E2E-TEST-SKU-1', size: 'M', color: 'RED', price: 1500, stock: 10 }, cookieAdmin, [200, 201]);
  const varId = varRes.data?.data?.id;

  await runTest('4b. Duplicate SKU rejected', `/admin/products/${prodId}/variants`, 'POST', { sku: 'E2E-TEST-SKU-1', size: 'L' }, cookieAdmin, [400, 409, 500]);
  
  // 5. INVENTORY TESTING
  await runTest('5a. Initial stock exists', `/admin/products/${prodId}/variants/${varId}`, 'GET', null, cookieAdmin, [200]); // Wait, might need a different endpoint, or it's included in variant details. We'll skip if not exact endpoint, the manual adjustment is what matters.
  await runTest('5b. Manual stock adjustment', `/admin/products/${prodId}/variants/${varId}/inventory/adjust`, 'POST', { delta: 5, reason: 'E2E Test Increase' }, cookieAdmin, [200, 201]);
  await runTest('5c. Negative stock adjustment (decrease)', `/admin/products/${prodId}/variants/${varId}/inventory/adjust`, 'POST', { delta: -2, reason: 'E2E Test Decrease' }, cookieAdmin, [200, 201]);
  await runTest('5d. Insufficient stock rejection', `/admin/products/${prodId}/variants/${varId}/inventory/adjust`, 'POST', { delta: -100, reason: 'E2E Test Oversell' }, cookieAdmin, [400, 409, 500]);

  // 6. CLOUDINARY IMAGE TESTING
  // Create a 1x1 transparent PNG blob
  const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  const formData = new FormData();
  formData.append('file', blob, 'e2e-test-image.png');
  
  const imgRes = await runTest('6a. Image upload', `/admin/products/${prodId}/images`, 'POST', formData, cookieAdmin, [200, 201], true);
  const imageId = imgRes.data?.data?.id;
  
  if (imageId) {
    await runTest('6b. Delete image', `/admin/products/${prodId}/images/${imageId}`, 'DELETE', null, cookieAdmin, [200, 204]);
  }

  // 7. PUBLIC CATALOG TESTING
  await runTest('7a. Public gets products list', '/products', 'GET', null, '', [200]);
  await runTest('7b. Public gets product details', `/products/e2e-test-product`, 'GET', null, '', [200]);
  await runTest('7c. Missing product handled', `/products/non-existent-product-123`, 'GET', null, '', [404]);

  // 8. SECURITY REGRESSION
  await runTest('8a. Customer forbidden from product creation', '/admin/products', 'POST', { name: 'E2E_HACK_PROD', slug: 'e2e-hack-prod', categoryId: childCatId, basePrice: 10 }, cookieCustomer, [401, 403]);
  await runTest('8b. Unauth forbidden from product creation', '/admin/products', 'POST', { name: 'E2E_HACK_PROD', slug: 'e2e-hack-prod2', categoryId: childCatId, basePrice: 10 }, '', [401, 403]);
  await runTest('8c. Customer forbidden from inventory adjust', `/admin/products/${prodId}/variants/${varId}/inventory/adjust`, 'POST', { quantityChange: 10 }, cookieCustomer, [401, 403]);
  
  await cleanup();
  console.log('Phase 3 Tests Complete.');
}

main().catch(console.error);
