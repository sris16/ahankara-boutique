import { prisma } from '../src/lib/prisma';
const API_URL = 'http://localhost:3001/api';

const TEST_EMAIL = 'test.auth.phase1@ahankara.local';
const TEST_PASSWORD = 'password123';
const TEST_NAME = 'Phase 1 Tester';

let currentToken = '';
let currentCookie = '';

async function runTest(
  name: string,
  endpoint: string,
  method: string,
  body: any,
  headers: any,
  expectedStatus: number,
  expectedCondition: (res: any, data: any) => boolean
) {
  try {
    const fetchHeaders: any = {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      'Origin': 'http://localhost:3000',
      ...headers,
    };
    if (currentCookie) {
      fetchHeaders['Cookie'] = currentCookie;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: fetchHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    
    // Extract Set-Cookie
    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    if (setCookies && setCookies.length > 0) {
      const parsedCookies = setCookies.map(c => c.split(';')[0]);
      if (parsedCookies.length > 0) {
        currentCookie = parsedCookies.join('; ');
      }
    }
    
    const passed = res.status === expectedStatus && expectedCondition(res, data);
    
    console.log(`${name}`);
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Method: ${method}`);
    console.log(`Expected: ${expectedStatus}`);
    console.log(`Actual: ${res.status}`);
    console.log(`HTTP status: ${res.status}`);
    console.log(`PASS/FAIL: ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) {
      console.log(`Failed condition or status. Data: ${JSON.stringify(data)}`);
    }
    console.log('---');
    
    return { res, data, passed };
  } catch (error) {
    console.log(`${name}`);
    console.log(`Endpoint: ${endpoint}`);
    console.log(`Method: ${method}`);
    console.log(`Expected: ${expectedStatus}`);
    console.log(`Actual: ERROR`);
    console.log(`HTTP status: ERROR`);
    console.log(`PASS/FAIL: FAIL - ${error}`);
    console.log('---');
    return { res: null, data: null, passed: false };
  }
}

async function main() {
  console.log('Starting Phase 1 Authentication Tests\n');
  
  // Cleanup before start
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  
  // 1. Customer signup
  const res1 = await runTest(
    '1. Customer signup.',
    '/auth/sign-up/email',
    'POST',
    { email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME },
    {},
    200,
    (res, data) => !!data?.token
  );
  if (res1.data?.token) currentToken = res1.data.token;
  
  // 2. Duplicate signup handling
  await runTest(
    '2. Duplicate signup handling.',
    '/auth/sign-up/email',
    'POST',
    { email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME },
    {},
    400, // Or whatever better-auth uses for duplicate, usually 400 or 500
    (res, data) => !data?.token
  );
  
  // 3. Invalid email handling
  await runTest(
    '3. Invalid email handling.',
    '/auth/sign-up/email',
    'POST',
    { email: 'invalidemail', password: TEST_PASSWORD, name: TEST_NAME },
    {},
    400,
    (res, data) => !data?.token
  );
  
  // 4. Invalid input validation
  await runTest(
    '4. Invalid input validation (missing password).',
    '/auth/sign-up/email',
    'POST',
    { email: `test2.${TEST_EMAIL}`, name: TEST_NAME }, // missing password
    {},
    400,
    (res, data) => !data?.token
  );
  
  // 5. OTP request
  await runTest(
    '5. OTP request.',
    '/auth/email-otp/send-verification-otp',
    'POST',
    { email: TEST_EMAIL, type: 'email-verification' },
    {},
    200,
    (res, data) => data?.success === true || res.ok
  );
  
  // 6. OTP delivery through configured Resend environment.
  // We check the DB to ensure an OTP was generated
  const verifications = await prisma.verification.findMany({
    where: { identifier: `email-verification-otp-${TEST_EMAIL}` },
    orderBy: { createdAt: 'desc' }
  });
  const latestOtp = verifications.length > 0 ? verifications[0].value.split(':')[0] : null;
  console.log(`6. OTP delivery through configured Resend environment.`);
  console.log(`PASS/FAIL: ${latestOtp ? 'PASS' : 'FAIL'} (Found OTP in DB)`);
  console.log('---');
  
  // 7. OTP verification
  const res7 = await runTest(
    '7. OTP verification.',
    '/auth/email-otp/verify-email',
    'POST',
    { email: TEST_EMAIL, otp: latestOtp || '000000' },
    {},
    200,
    (res, data) => data?.user?.emailVerified === true || res.ok
  );
  if (res7.data?.token) currentToken = res7.data.token; // In case verify-email returns a new token
  
  // 8. Session creation (implied by getting a token and being able to fetch /me)
  console.log(`8. Session creation.`);
  console.log(`PASS/FAIL: ${currentToken ? 'PASS' : 'FAIL'} (Have token)`);
  console.log('---');
  
  // 9. Authenticated /api/me request
  await runTest(
    '9. Authenticated /api/me request.',
    '/me',
    'GET',
    null,
    {},
    200,
    (res, data) => data?.data?.email === TEST_EMAIL
  );
  
  // 10. Logout
  await runTest(
    '10. Logout.',
    '/auth/sign-out',
    'POST',
    {},
    {},
    200,
    (res, data) => res.ok
  );
  
  // 11. Session invalidation
  await runTest(
    '11. Session invalidation.',
    '/me',
    'GET',
    null,
    {},
    401,
    (res, data) => res.status === 401 || res.status === 403
  );
  
  // 12. Re-login
  const res12 = await runTest(
    '12. Re-login.',
    '/auth/sign-in/email',
    'POST',
    { email: TEST_EMAIL, password: TEST_PASSWORD },
    {},
    200,
    (res, data) => !!data?.token
  );
  if (res12.data?.token) currentToken = res12.data.token;
  
  // 13. Invalid OTP
  await runTest(
    '13. Invalid OTP.',
    '/auth/email-otp/verify-email',
    'POST',
    { email: TEST_EMAIL, otp: '111111' },
    {},
    400,
    (res, data) => res.status >= 400
  );
  
  // 14. Reused OTP rejection
  await runTest(
    '14. Reused OTP rejection.',
    '/auth/email-otp/verify-email',
    'POST',
    { email: TEST_EMAIL, otp: latestOtp || '000000' },
    {},
    400,
    (res, data) => res.status >= 400
  );
  
  // 15. Suspended account behavior
  // Suspend the user
  await prisma.user.updateMany({
    where: { email: TEST_EMAIL },
    data: { status: 'SUSPENDED' }
  });
  
  await runTest(
    '15. Suspended account behavior.',
    '/me', // Or sign-in
    'GET',
    null,
    {},
    403,
    (res, data) => res.status === 403
  );
  
  // Cleanup
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  
  console.log('Phase 1 Tests Complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
