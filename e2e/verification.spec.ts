import { test, expect } from '@playwright/test';

// Grouping tests sequentially
test.describe('AHANKARA STUDIOS - E2E Verification', () => {

  test('A1 - Home Page & Branding', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).not.toBeGreaterThanOrEqual(500);

    // Verify Title/Branding
    await expect(page).toHaveTitle(/AHANKARA STUDIOS/i);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/AHANKARA BOUTIQUE/i);

    // Verify Nav renders
    await expect(page.locator('nav')).toBeVisible();
  });

  test('A2 - Product Listing & Navigation', async ({ page }) => {
    await page.goto('/products');

    // Wait for product grid
    const products = page.locator('a[href^="/products/"]');
    if (await products.count() > 0) {
      await expect(products.first()).toBeVisible();
      // Click first product
      await products.first().click();
      await page.waitForURL(/\/products\/.+/);

      // A3 - Product Detail Page
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible();
    } else {
      // If no products, skip
      test.skip(true, 'No products available for testing.');
    }
  });

  test('I - Cart Management', async ({ page }) => {
    await page.goto('/products');
    const products = page.locator('a[href^="/products/"]');

    if (await products.count() > 0) {
      await products.first().click();
      await page.waitForURL(/\/products\/.+/);

      const addToCart = page.getByRole('button', { name: /add to cart/i });
      if (await addToCart.isEnabled()) {
        await addToCart.click();

        await page.goto('/cart');
        // Wait for body to be visible to confirm page loaded
        await expect(page.locator('body')).toBeVisible();
        await expect(page.getByRole('button', { name: /checkout/i })).toBeVisible();
      }
    } else {
      test.skip(true, 'No available products to add to cart.');
    }
  });

  test('C - Customer Registration / OTP (BLOCKED)', async () => {
    test.skip(true, 'BLOCKED — External email retrieval (Resend) unavailable in automated CI environment without mocked mail servers.');
  });

  test('D - Login (BLOCKED)', async () => {
    test.skip(true, 'BLOCKED — Requires verified test user account which relies on external email OTP.');
  });

  test('E - Account Dashboard (BLOCKED)', async () => {
    test.skip(true, 'BLOCKED — Requires authenticated session.');
  });

  test('K - Checkout Validation', async ({ page }) => {
    await page.goto('/checkout');
    const url = page.url();
    if (url.includes('login') || url.includes('auth')) {
      test.skip(true, 'Checkout requires authentication, blocked by OTP delivery limitation.');
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('O - Razorpay Payment (BLOCKED)', async () => {
    test.skip(true, 'BLOCKED — External Razorpay test environment requires manual network intercept or sandbox credentials unavailable locally.');
  });

  test('V - Returns & Exchanges (BLOCKED)', async () => {
    test.skip(true, 'BLOCKED — Requires an established order history which cannot be safely seeded dynamically without real checkout.');
  });

  test('Z - Admin Boundary', async ({ page }) => {
    const response = await page.goto('/admin');
    const status = response?.status();
    // It should either return a 401/403 OR successfully redirect to login (giving 200 for the login page)
    if (status === 200) {
      await expect(page).toHaveURL(/.*login.*/);
    } else {
      expect([401, 403, 404]).toContain(status);
    }
  });

  test('AC - Error Handling', async ({ page }) => {
    const response = await page.goto('/nonexistent-page-ahankara-test');
    expect(response?.status()).toBe(404);
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Prisma');
    expect(bodyText).not.toContain('Error:');
  });

  test('AB - SEO', async ({ page }) => {
    const robots = await page.goto('/robots.txt');
    expect(robots?.status()).toBe(200);
    const robotsText = await robots?.text();
    expect(robotsText).toContain('Disallow: /admin');

    const sitemap = await page.goto('/sitemap.xml');
    expect(sitemap?.status()).toBe(200);
  });
});
