import { prisma } from '../src/lib/prisma';

const API_URL = 'http://localhost:3001/api';

const CUSTOMER_A = { email: 'customera@phase2.local', password: 'password123', name: 'Cust A' };
const CUSTOMER_B = { email: 'customerb@phase2.local', password: 'password123', name: 'Cust B' };
const ADMIN = { email: 'admin@phase2.local', password: 'password123', name: 'Admin User' };

let cookieA = '';
let cookieB = '';
let cookieAdmin = '';

async function runTest(
  name: string,
  endpoint: string,
  method: string,
  body: any,
  cookie: string,
  expectedStatuses: number[],
  expectedCondition: (res: any, data: any) => boolean
) {
  try {
    const fetchHeaders: any = {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      'Origin': 'http://localhost:3000',
    };
    if (cookie) {
      fetchHeaders['Cookie'] = cookie;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: fetchHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    // Some endpoints may return empty body on 204 or DELETE
    let data = null;
    if (res.status !== 204) {
      data = await res.json().catch(() => null);
    }
    
    let setCookieStr = '';
    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    if (setCookies && setCookies.length > 0) {
      const parsedCookies = setCookies.map(c => c.split(';')[0]);
      if (parsedCookies.length > 0) {
        setCookieStr = parsedCookies.join('; ');
      }
    }
    
    const passed = expectedStatuses.includes(res.status) && expectedCondition(res, data);
    
    console.log(`${name}`);
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Method: ${method}`);
    console.log(`Expected Status: ${expectedStatuses.join(' or ')}`);
    console.log(`Actual Status: ${res.status}`);
    console.log(`PASS/FAIL: ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) {
      console.log(`Failed condition or status. Data: ${JSON.stringify(data)}`);
    }
    console.log('---');
    
    return { res, data, passed, setCookieStr };
  } catch (error) {
    console.log(`${name}`);
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Method: ${method}`);
    console.log(`Expected Status: ${expectedStatuses.join(' or ')}`);
    console.log(`Actual Status: ERROR`);
    console.log(`PASS/FAIL: FAIL - ${error}`);
    console.log('---');
    return { res: null, data: null, passed: false, setCookieStr: '' };
  }
}

async function cleanup() {
  await prisma.address.deleteMany({
    where: { user: { email: { in: [CUSTOMER_A.email, CUSTOMER_B.email, ADMIN.email] } } }
  });
  await prisma.user.deleteMany({
    where: { email: { in: [CUSTOMER_A.email, CUSTOMER_B.email, ADMIN.email] } }
  });
}

async function main() {
  console.log('Starting Phase 2 Security Tests\n');
  await cleanup();

  // Create accounts
  const resA = await runTest('Setup Customer A', '/auth/sign-up/email', 'POST', CUSTOMER_A, '', [200], () => true);
  cookieA = resA.setCookieStr;

  const resB = await runTest('Setup Customer B', '/auth/sign-up/email', 'POST', CUSTOMER_B, '', [200], () => true);
  cookieB = resB.setCookieStr;

  const resAdmin = await runTest('Setup Admin', '/auth/sign-up/email', 'POST', ADMIN, '', [200], () => true);
  cookieAdmin = resAdmin.setCookieStr;

  // Promote admin in DB
  await prisma.user.updateMany({
    where: { email: ADMIN.email },
    data: { role: 'ADMIN' }
  });

  // A. CUSTOMER -> ADMIN ISOLATION
  await runTest('A1. Customer access to admin products', '/admin/products', 'GET', null, cookieA, [401, 403], () => true);
  await runTest('A2. Customer access to admin categories', '/admin/categories', 'GET', null, cookieA, [401, 403], () => true);
  
  // B. ADMIN AUTHORIZATION
  await runTest('B1. Admin access to admin products', '/admin/products', 'GET', null, cookieAdmin, [200], () => true);

  // C. CUSTOMER TENANT ISOLATION / IDOR
  const addressPayload = {
    fullName: 'Test A',
    phone: '9999999999',
    addressLine1: '123 Main',
    city: 'City',
    state: 'State',
    postalCode: '123456',
    country: 'IN',
    isDefaultShipping: true
  };
  const addrRes = await runTest('C1. Customer A creates address', '/me/addresses', 'POST', addressPayload, cookieA, [200, 201], () => true);
  const addressId = addrRes.data?.data?.id;

  if (addressId) {
    await runTest('C2. Customer B attempts to GET Customer A address', `/me/addresses/${addressId}`, 'GET', null, cookieB, [401, 403, 404], () => true);
    await runTest('C3. Customer B attempts to UPDATE Customer A address', `/me/addresses/${addressId}`, 'PUT', addressPayload, cookieB, [401, 403, 404], () => true);
  } else {
    console.log('Skipping IDOR test because address creation failed.\n---');
  }

  // D. ADMIN RESOURCE ACCESS CONTROL
  await runTest('D1. Unauthenticated access to admin', '/admin/products', 'GET', null, '', [401, 403], () => true);
  await runTest('D2. Admin GET unknown product', '/admin/products/invalid-id-123', 'GET', null, cookieAdmin, [400, 404], () => true);

  // E. SESSION / AUTHORIZATION BOUNDARIES
  // Log out A
  await runTest('E1. Logout Customer A', '/auth/sign-out', 'POST', {}, cookieA, [200], () => true);
  await runTest('E2. Logged out session rejected', '/me', 'GET', null, cookieA, [401], () => true);

  // F. INPUT / PARAMETER SECURITY
  await runTest('F1. Malformed address creation', '/me/addresses', 'POST', { pincode: 'short' }, cookieB, [400], (res, data) => !data?.stack && !data?.trace);

  // G. PRIVILEGE ESCALATION
  await runTest('G1. Privilege escalation via signup', '/auth/sign-up/email', 'POST', { email: 'hacker@phase2.local', password: 'password123', name: 'Hacker', role: 'ADMIN' }, '', [200, 400], () => true);
  const hacker = await prisma.user.findFirst({ where: { email: 'hacker@phase2.local' } });
  console.log('G1. Privilege escalation check');
  console.log(`PASS/FAIL: ${hacker?.role === 'CUSTOMER' ? 'PASS' : 'FAIL'} (Role is ${hacker?.role})`);
  console.log('---');
  if (hacker) await prisma.user.delete({ where: { id: hacker.id } });

  // H. HTTP SECURITY BEHAVIOR (Checked implicitly in F1, no stack traces leaked)
  
  // I. RATE LIMITING
  console.log('I1. Rate limiting check (auth endpoints)');
  let rateLimited = false;
  let retryAfterValid = false;

  // 1 & 2: Normal auth attempts work, but eventually 429
  for (let i = 1; i <= 10; i++) {
    const res = await fetch(`${API_URL}/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
      body: JSON.stringify({ email: 'rate@limit.test', password: 'password123' })
    });
    if (res.status === 429) {
      rateLimited = true;
      if (res.headers.get('Retry-After')) {
        retryAfterValid = true;
      }
      break;
    }
  }

  console.log(`I1a. 429 Received: ${rateLimited ? 'PASS' : 'FAIL'}`);
  console.log(`I1b. Retry-After Header: ${retryAfterValid ? 'PASS' : 'FAIL'}`);

  // 5. Unrelated authenticated endpoints not interfered with
  const healthRes = await fetch(`${API_URL}/health`);
  console.log(`I1c. Unrelated endpoint works: ${healthRes.status === 200 ? 'PASS' : 'FAIL'}`);

  // 6. IP Simulation Bypass Check (Sending different x-forwarded-for but same account - wait, rate limit is per IP.
  // The rate limit uses: \`${req.nextUrl.pathname}:${ip}\`. If IP changes, rate limit resets.
  // This is correct behavior for IP rate limiting. Wait, if it resets, does the test account bypass?
  // Yes, if attacker rotates IP, they bypass IP rate limit. That's a known limitation of simple IP rate limits.
  // The prompt: "Different dedicated test accounts/IP simulation cannot trivially bypass the intended protection through user-controlled request fields."
  // Wait! The user controlled request fields include \`x-forwarded-for\`! If the attacker sends \`x-forwarded-for\`, the Next.js server might trust it if not behind a proxy!
  // Wait, if it's not behind a proxy, trusting \`x-forwarded-for\` allows bypass!
  // Let's test if we can bypass it by changing \`x-forwarded-for\`.
  const spoofRes = await fetch(`${API_URL}/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000', 'X-Forwarded-For': '192.168.1.99' },
    body: JSON.stringify({ email: 'rate@limit.test', password: 'password123' })
  });
  console.log(`I1d. IP spoofing check (expected 429 if we correctly don't trust the header, or 200/400 if bypassed): ${spoofRes.status === 429 ? 'PASS (Protected)' : 'FAIL (Spoofable)'}`);

  // We will wait 62 seconds to test reset (since window is 60s)
  console.log('Waiting 62 seconds for rate limit reset...');
  await new Promise(resolve => setTimeout(resolve, 62000));

  // 4. Legitimate auth works after reset
  const resetRes = await fetch(`${API_URL}/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000' },
    body: JSON.stringify({ email: 'rate@limit.test', password: 'password123' })
  });
  console.log(`I1e. Works after reset: ${resetRes.status !== 429 ? 'PASS' : 'FAIL'}`);

  console.log('---');

  await cleanup();
  console.log('Phase 2 Tests Complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
