import { prisma } from '../src/lib/prisma';
import { AuthService } from '../src/server/services/auth.service';

async function run() {
  console.log('--- STARTING V4 API REGRESSION TESTS ---');

  // We will run this script while the next dev server is running on port 3000
  const baseUrl = 'http://localhost:3000';

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/api/health`);
  if (!healthRes.ok) throw new Error(`Health check failed: ${healthRes.status}`);
  const healthData = await healthRes.json();
  if (healthData.database !== 'connected') throw new Error('DB not connected in health API');
  console.log('✅ 27. Health API -> 200 (database connected)');

  // 2. Unauthenticated Admin Request
  const unauthRes = await fetch(`${baseUrl}/api/admin/categories`, { method: 'POST', body: JSON.stringify({}) });
  if (unauthRes.status !== 401) throw new Error(`Expected 401, got ${unauthRes.status}`);
  console.log('✅ 20. Unauthenticated admin request -> 401');

  // Setup Test Users via AuthService directly
  const customerEmail = 'customer_test_v4@example.com';
  const adminEmail = 'admin_test_v4@example.com';
  
  // Cleanup previous if exists
  await prisma.user.deleteMany({ where: { email: { in: [customerEmail, adminEmail] } } });
  await prisma.category.deleteMany({ where: { slug: 'admin-test-category' } });

  const customer = await AuthService.registerCustomer({
    email: customerEmail,
    password: 'Password123!',
    name: 'Customer Test'
  });

  const admin = await AuthService.seedAdminUser({
    email: adminEmail,
    password: 'Password123!',
    name: 'Admin Test'
  });

  await prisma.user.updateMany({
    where: { email: { in: [customerEmail, adminEmail] } },
    data: { emailVerified: true }
  });

  // Login natively using Better Auth API
  const auth = (await import('../src/lib/auth')).auth;
  const loginCustomerRes = await auth.api.signInEmail({
    body: { email: customerEmail, password: 'Password123!' },
    asResponse: true
  });
  if (!loginCustomerRes || loginCustomerRes.status !== 200) {
    throw new Error(`Customer login failed: ${loginCustomerRes?.status} - ${await loginCustomerRes?.text()}`);
  }
  const customerCookies = loginCustomerRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');

  const loginAdminRes = await auth.api.signInEmail({
    body: { email: adminEmail, password: 'Password123!' },
    asResponse: true
  });
  const adminCookies = loginAdminRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');

  // 3. CUSTOMER Admin Mutation
  const customerAdminRes = await fetch(`${baseUrl}/api/admin/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': customerCookies },
    body: JSON.stringify({ name: 'Should Fail', slug: 'should-fail' })
  });
  if (customerAdminRes.status !== 403) throw new Error(`Expected 403 for Customer, got ${customerAdminRes.status}`);
  console.log('✅ 21. CUSTOMER admin mutation -> 403');

  // 4. ADMIN Mutation
  const adminMutationRes = await fetch(`${baseUrl}/api/admin/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookies },
    body: JSON.stringify({ name: 'Admin Test Category', slug: 'admin-test-category' })
  });
  if (adminMutationRes.status !== 201) {
    const errText = await adminMutationRes.text();
    throw new Error(`Expected 201 for Admin, got ${adminMutationRes.status}. Details: ${errText}`);
  }
  const createdCategory = await adminMutationRes.json();
  console.log('✅ 22. ADMIN mutation -> success');

  // 5. Public APIs
  const publicCatsRes = await fetch(`${baseUrl}/api/categories`);
  if (publicCatsRes.status !== 200) throw new Error('Public categories failed');
  const publicCollsRes = await fetch(`${baseUrl}/api/collections`);
  if (publicCollsRes.status !== 200) throw new Error('Public collections failed');
  console.log('✅ 23 & 24. Public APIs -> success');

  // 6. V3 Auth regression
  const meRes = await fetch(`${baseUrl}/api/me`, { headers: { 'Cookie': customerCookies } });
  if (meRes.status !== 200) throw new Error('V3 Auth regression failed');
  console.log('✅ 25. V3 /api/me authentication regression -> passed');

  // 7. V2 Addresses regression
  const addressRes = await fetch(`${baseUrl}/api/me/addresses`, { headers: { 'Cookie': customerCookies } });
  if (addressRes.status !== 200) throw new Error('V2 Address regression failed');
  console.log('✅ 26. V2 /api/me/addresses regression -> passed');

  // Cleanup
  if (createdCategory?.data?.id) {
    await prisma.category.delete({ where: { id: createdCategory.data.id } });
  } else if (createdCategory?.id) {
    await prisma.category.delete({ where: { id: createdCategory.id } });
  }
  await prisma.user.deleteMany({ where: { email: { in: [customerEmail, adminEmail] } } });
  console.log('✅ 28. Temporary test-data cleanup -> passed');

  console.log('--- ALL API TESTS PASSED ---');
}

run().catch(e => {
  console.error('❌ TEST FAILED:', e);
  process.exit(1);
});
