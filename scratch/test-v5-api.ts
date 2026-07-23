import { prisma } from '../src/lib/prisma';
import { ProductStatus } from '@prisma/client';

async function run() {
  console.log('--- STARTING V5 API & RUNTIME TESTS ---');
  const baseUrl = 'http://localhost:3000';
  const auth = (await import('../src/lib/auth')).auth;

  // 1. Setup Test Users
  const adminEmail = 'admin_test_v5@example.com';
  const customerEmail = 'customer_test_v5@example.com';
  await prisma.user.deleteMany({ where: { email: { in: [customerEmail, adminEmail] } } });
  
  // Register Customer
  await auth.api.signUpEmail({ body: { email: customerEmail, password: 'Password123!', name: 'Customer' } });
  
  // Register Admin
  await auth.api.signUpEmail({ body: { email: adminEmail, password: 'Password123!', name: 'Admin' } });
  await prisma.user.updateMany({ where: { email: { in: [customerEmail, adminEmail] } }, data: { emailVerified: true } });
  await prisma.user.update({ where: { email: adminEmail }, data: { role: 'ADMIN' } });

  // Get Cookies natively
  const loginAdminRes = await auth.api.signInEmail({ body: { email: adminEmail, password: 'Password123!' }, asResponse: true });
  const adminCookies = loginAdminRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');

  const loginCustomerRes = await auth.api.signInEmail({ body: { email: customerEmail, password: 'Password123!' }, asResponse: true });
  const customerCookies = loginCustomerRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');

  // Cleanup potential leftover product
  await prisma.product.deleteMany({ where: { slug: 'kanjivaram-v5-test' } });
  
  await prisma.category.deleteMany({ where: { slug: 'sarees-v5-test' } });
  const category = await prisma.category.create({
    data: { name: 'Sarees', slug: 'sarees-v5-test', isActive: true }
  });

  await prisma.collection.deleteMany({ where: { slug: { in: ['wedding-v5-test', 'festive-v5-test'] } } });
  const collection1 = await prisma.collection.create({
    data: { name: 'Wedding', slug: 'wedding-v5-test', isActive: true }
  });
  const collection2 = await prisma.collection.create({
    data: { name: 'Festive', slug: 'festive-v5-test', isActive: true }
  });

  // 3. Authorization Tests
  const unauthRes = await fetch(`${baseUrl}/api/admin/products`, { method: 'POST', body: JSON.stringify({}) });
  if (unauthRes.status !== 401) throw new Error(`Unauth failed: expected 401, got ${unauthRes.status} - ${await unauthRes.text()}`);
  console.log('✅ Unauthenticated -> 401');

  const custRes = await fetch(`${baseUrl}/api/admin/products`, { method: 'POST', headers: { 'Cookie': customerCookies }, body: JSON.stringify({}) });
  if (custRes.status !== 403) throw new Error('Customer admin mutation failed');
  console.log('✅ CUSTOMER admin mutation -> 403');

  // 4. Product Creation & Validation Tests
  const validProductPayload = {
    name: 'Kanjivaram Silk Saree',
    slug: 'kanjivaram-v5-test',
    basePrice: 499900,
    compareAtPrice: 599900,
    categoryId: category.id,
    collectionIds: [collection1.id],
    status: 'DRAFT',
    isFeatured: true
  };

  const createRes = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookies },
    body: JSON.stringify(validProductPayload)
  });
  if (createRes.status !== 201) throw new Error(`Create failed: ${await createRes.text()}`);
  const createdProduct = await createRes.json();
  console.log('✅ Admin creation works');

  // Duplicate slug
  const dupRes = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookies },
    body: JSON.stringify(validProductPayload)
  });
  if (dupRes.status !== 409) throw new Error('Duplicate slug allowed!');
  console.log('✅ Duplicate slug protection works');

  // Price validation
  const invalidPricePayload = { ...validProductPayload, slug: 'test-slug-2', basePrice: 400, compareAtPrice: 300 };
  const priceRes = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookies },
    body: JSON.stringify(invalidPricePayload)
  });
  if (priceRes.status !== 400) throw new Error('Price validation failed');
  console.log('✅ Price validation works');

  // 5. Product Update & Collections Replacement
  const updateRes = await fetch(`${baseUrl}/api/admin/products/${createdProduct.data.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookies },
    body: JSON.stringify({ collectionIds: [collection2.id] })
  });
  if (updateRes.status !== 200) throw new Error(`Update failed: expected 200, got ${updateRes.status} - ${await updateRes.text()}`);
  const updated = await updateRes.json();
  if (updated.data.collections.length !== 1 || updated.data.collections[0].collectionId !== collection2.id) {
    throw new Error('Collection replacement failed');
  }
  console.log('✅ Collection replacement works');

  // 6. Publication Lifecycle & Public API Visibility
  const publicBefore = await fetch(`${baseUrl}/api/products`);
  let publicData = await publicBefore.json();
  if (publicData.data.data.some((p: any) => p.slug === 'kanjivaram-v5-test')) throw new Error('DRAFT product is public');
  console.log('✅ Draft Product hidden');

  await fetch(`${baseUrl}/api/admin/products/${createdProduct.data.id}/publish`, {
    method: 'PATCH',
    headers: { 'Cookie': adminCookies }
  });

  const publicAfter = await fetch(`${baseUrl}/api/products?search=kanjivaram`);
  publicData = await publicAfter.json();
  if (!publicData.data.data.some((p: any) => p.slug === 'kanjivaram-v5-test')) throw new Error('PUBLISHED product is hidden');
  console.log('✅ Published Product visible');
  console.log('✅ Search works');

  await fetch(`${baseUrl}/api/admin/products/${createdProduct.data.id}/archive`, {
    method: 'PATCH',
    headers: { 'Cookie': adminCookies }
  });
  const publicArchived = await fetch(`${baseUrl}/api/products`);
  publicData = await publicArchived.json();
  if (publicData.data.data.some((p: any) => p.slug === 'kanjivaram-v5-test')) throw new Error('ARCHIVED product is public');
  console.log('✅ Archived Product hidden');

  // 7. Image Upload Logic via Mock (We'll just hit the endpoint with an empty file to test validation)
  const formData = new FormData();
  formData.append('file', new Blob(['fake content'], { type: 'text/plain' }), 'test.txt');

  const imgRes = await fetch(`${baseUrl}/api/admin/products/${createdProduct.data.id}/images`, {
    method: 'POST',
    headers: { 'Cookie': adminCookies },
    body: formData
  });
  const imgData = await imgRes.json();
  if (imgRes.status !== 400 || !imgData.message.includes('Invalid file format')) {
    throw new Error('Image file validation failed. Expected format error.');
  }
  console.log('✅ Image file validation works');
  console.log('NOT TESTED — external configuration required for live Cloudinary upload & delete & orphan cleanup');

  // 8. Regression tests
  const healthRes = await fetch(`${baseUrl}/api/health`);
  if (healthRes.status !== 200) throw new Error('Health check failed');
  console.log('✅ /api/health works');
  
  const meRes = await fetch(`${baseUrl}/api/me`, { headers: { 'Cookie': customerCookies } });
  if (meRes.status !== 200) throw new Error('Auth regression failed');
  console.log('✅ /api/me works');

  // Cleanup
  await prisma.product.deleteMany({ where: { slug: 'kanjivaram-v5-test' } });
  await prisma.category.deleteMany({ where: { slug: 'sarees-v5-test' } });
  await prisma.collection.deleteMany({ where: { slug: { in: ['wedding-v5-test', 'festive-v5-test'] } } });
  await prisma.user.deleteMany({ where: { email: { in: [customerEmail, adminEmail] } } });
  console.log('✅ Temporary test-data cleanup passed');
  
  console.log('--- ALL RUNTIME TESTS PASSED ---');
}

run().catch(e => {
  console.error('❌ TEST FAILED:', e);
  process.exit(1);
});
