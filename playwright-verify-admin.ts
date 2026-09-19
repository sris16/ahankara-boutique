import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();

  // Inject the session cookie
  await context.addCookies([{
    name: 'better-auth.session_token',
    value: 'cb0b537319a860b4ab98fda00f8c1bb6071f6e2a6cfb6b65eb756c36e3d6b5fd',
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: false, // Since it's HTTP localhost
  }]);

  const page = await context.newPage();

  console.log('Navigating to Admin Dashboard to verify auth...');
  const res = await page.goto('http://localhost:3001/admin/dashboard');

  console.log('Current URL:', page.url());
  if (page.url().includes('/login')) {
    console.error('Authentication failed, redirected to login.');
  } else {
    console.log('Authentication successful!');
  }

  await browser.close();
}

run().catch(console.error);
