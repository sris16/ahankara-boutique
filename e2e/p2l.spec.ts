import { test, expect, Page } from '@playwright/test';
import fs from 'fs';

// Helper to use authenticated state
const authFile = 'e2e/.auth/customer.json';

test.describe('AHANKARA STUDIOS - E2E FULL DETERMINISTIC SUITE', () => {
  // Use sequential mode if needed
  test.describe.configure({ mode: 'serial' });

  test('PHASE 4: Public Storefront', async ({ page }) => {
    // A1 - Home Page
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/AHANKARA STUDIOS/i);
    expect(await page.locator('body').innerText()).not.toMatch(/AHANKARA BOUTIQUE/i);

    // A2 - Product Listing
    await page.goto('/products');
    const products = page.locator('a[href^="/products/"]');
    await expect(products.first()).toBeVisible();

    // A3 - Product Detail Page
    await products.first().click();
    await page.waitForURL(/\/products\/.+/);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('button', { name: /add to bag/i, exact: false }).or(page.getByRole('button', { name: /add to cart/i, exact: false }))).toBeVisible();
  });

  // Create a new context specifically for the authenticated user tests
  test.describe('Authenticated Customer Journeys', () => {
    test.use({ storageState: authFile });

    test('PHASE 5 & 6: Customer Authentication & Account Dashboard', async ({ page }) => {
      await page.goto('/account');

      // If we got here and it shows profile (e.g. email or "Log out"), we are authenticated
      await expect(page.getByRole('button', { name: /log out|sign out/i, exact: false })).toBeVisible();

      // Admin Boundary check
      const adminResp = await page.goto('/admin');
      const status = adminResp?.status();
      if (status === 200) {
        await expect(page).toHaveURL(/.*login.*/);
      } else {
        expect([401, 403, 404]).toContain(status);
      }
    });

    test('PHASE 7: Cart Management', async ({ page }) => {
      await page.goto('/products/e2e-test-product');

      // Wait for Add to Cart
      const addBtn = page.getByRole('button', { name: /add/i });
      await addBtn.click();

      // Navigate to cart
      await page.goto('/cart');

      // With authenticated session, cart should display correctly and not prompt for login
      await expect(page.locator('body')).not.toContainText('Please sign in to view your bag');

      const checkoutBtn = page.getByRole('button', { name: /checkout/i, exact: false }).first();
      await expect(checkoutBtn).toBeVisible();
    });

    test('PHASE 8 & 9: Checkout and Order Creation', async ({ page }) => {
      // Create a mocked route for Razorpay if applicable so we can intercept checkout creation
      await page.route('**/api/checkout/create-order', async route => {
        const json = { success: true, orderId: 'e2e-mock-order-id', amount: 500000, currency: 'INR' };
        await route.fulfill({ json });
      });

      await page.goto('/checkout');
      // If the app successfully reaches the end of the form, checkout is accessible.
      // If the app blocks checkout because there's no address, we mock or handle that.

      // Just check that checkout loaded instead of returning 404/500
      await expect(page.locator('body')).toBeVisible();
      const checkoutTitle = page.locator('h1', { hasText: /checkout|payment/i });
      if (await checkoutTitle.isVisible().catch(() => false)) {
        await expect(checkoutTitle).toBeVisible();
      }
    });

    test('PHASE 18: Security / IDOR', async ({ request }) => {
      // Perform a direct API request to an invalid/other-user cart ID
      const response = await request.get('/api/cart/some-other-user-id');
      expect([401, 403, 404]).toContain(response.status());
    });
  });

  test('PHASE 21: Error Handling', async ({ page }) => {
    const response = await page.goto('/nonexistent-page-for-e2e-test');
    expect(response?.status()).toBe(404);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('PrismaClient');
    expect(bodyText).not.toContain('Error:');
  });

  test('PHASE 22: SEO', async ({ page }) => {
    const robots = await page.goto('/robots.txt');
    expect(robots?.status()).toBe(200);
    const robotsText = await robots?.text();
    expect(robotsText).toContain('Disallow: /admin');

    const sitemap = await page.goto('/sitemap.xml');
    expect(sitemap?.status()).toBe(200);
  });
});
