import { chromium } from 'playwright';
import { expect } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // 1. Verify unauthenticated mutation is rejected with 401
  console.log('Testing unauthenticated mutation...');
  const unauthContext = await browser.newContext();
  const unauthPage = await unauthContext.newPage();
  const unauthRes = await unauthPage.request.patch('http://localhost:3001/api/admin/coupons/0007dc1a-7b41-484f-983c-1393dbde7c5f', {
    data: { name: 'Hacked' }
  });
  expect(unauthRes.status()).toBe(401);
  console.log('Unauthenticated mutation rejected successfully (401).');
  await unauthContext.close();

  // 2. Login as ADMIN
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:3001/login');

  console.log('Logging in...');
  await page.fill('input[type="email"]', 'admin_test@ahankarastudios.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign In")');

  await page.waitForTimeout(3000); // Wait for redirect
  console.log('Login successful! Current URL:', page.url());

  // 3. Locate the E2E_ADMIN_TEST_COUPON
  const couponId = '0007dc1a-7b41-484f-983c-1393dbde7c5f';
  console.log(`\nNavigating to Coupon Edit Workflow...`);
  await page.goto(`http://localhost:3001/admin/coupons/${couponId}`, { waitUntil: 'load' });
  await page.waitForTimeout(2000); // Give time for React to render

  const isNotFound = await page.locator('text="could not be found"').count();
  const is404 = await page.locator('text="404"').count();
  if (isNotFound > 0 || is404 > 0) {
    console.log("PAGE RETURNED 404!");
    console.log(await page.content());
    await browser.close();
    return;
  }

  // 4. Modify a safe field
  console.log('Modifying coupon name...');
  const nameInput = page.locator('input[name="name"]');
  const originalName = await nameInput.inputValue();
  console.log(`Original name: ${originalName}`);
  const newName = 'E2E Test Coupon Edited';

  await nameInput.fill(newName);

  // 5. Save
  console.log('Saving coupon...');
  await page.click('button:has-text("Save Changes")');
  await page.waitForURL('http://localhost:3001/admin/coupons', { timeout: 10000 });

  // 6. Navigate back & Verify persistence
  console.log('Navigating back to verify persistence...');
  await page.goto(`http://localhost:3001/admin/coupons/${couponId}`, { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  const reloadedName = await nameInput.inputValue();
  expect(reloadedName).toBe(newName);
  console.log('Persistence verified successfully.');

  // 7. Restore the original value
  console.log('Restoring original value...');
  await nameInput.fill(originalName);
  await page.click('button:has-text("Save Changes")');
  await page.waitForURL('http://localhost:3001/admin/coupons', { timeout: 10000 });
  console.log('Original value restored successfully.');

  // 8. Verify missing coupon returns 404
  console.log('Testing missing coupon 404...');
  await page.goto('http://localhost:3001/admin/coupons/non-existent-id', { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  const notFoundTextMissing = page.locator('text="could not be found"');
  const is404Missing = await page.locator('text="404"').count();
  if (await notFoundTextMissing.count() > 0 || is404Missing > 0) {
    console.log('Missing coupon correctly returns 404 Not Found UI.');
  } else {
    console.error('Missing coupon did not return 404 Not Found. HTML follows:');
    console.error(await page.content());
    throw new Error('404 UI not displayed for missing coupon!');
  }

  console.log('\nE2E verification complete.');
  await browser.close();
}

run().catch(console.error);
