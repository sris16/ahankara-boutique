import { test, expect } from '@playwright/test';

const adminCreds = { email: 'admin2@ahankarastudios.test', password: 'Password123!' };
const custCreds = { email: 'cust2@ahankarastudios.test', password: 'Password123!' };

test.describe('AHANKARA STUDIOS - ADMIN API EXHAUSTIVE CERTIFICATION', () => {

  const endpoints = [
    { method: 'GET', url: '/api/admin/categories' },
    { method: 'POST', url: '/api/admin/categories' },
    { method: 'GET', url: '/api/admin/categories/123' },
    { method: 'PATCH', url: '/api/admin/categories/123' },
    { method: 'DELETE', url: '/api/admin/categories/123' },
    { method: 'POST', url: '/api/admin/categories/reorder' },
    { method: 'GET', url: '/api/admin/collections' },
    { method: 'POST', url: '/api/admin/collections' },
    { method: 'GET', url: '/api/admin/collections/123' },
    { method: 'PATCH', url: '/api/admin/collections/123' },
    { method: 'DELETE', url: '/api/admin/collections/123' },
    { method: 'POST', url: '/api/admin/collections/reorder' },
    { method: 'GET', url: '/api/admin/coupons' },
    { method: 'POST', url: '/api/admin/coupons' },
    { method: 'GET', url: '/api/admin/coupons/123' },
    { method: 'PATCH', url: '/api/admin/coupons/123' },
    { method: 'DELETE', url: '/api/admin/coupons/123' },
    { method: 'GET', url: '/api/admin/inventory/low-stock' },
    { method: 'GET', url: '/api/admin/orders' },
    { method: 'GET', url: '/api/admin/orders/123' },
    { method: 'PATCH', url: '/api/admin/orders/123' },
    { method: 'POST', url: '/api/admin/orders/123/shipments' },
    { method: 'POST', url: '/api/admin/orders/123/cancel' },
    { method: 'GET', url: '/api/admin/products' },
    { method: 'POST', url: '/api/admin/products' },
    { method: 'GET', url: '/api/admin/products/123' },
    { method: 'PATCH', url: '/api/admin/products/123' },
    { method: 'DELETE', url: '/api/admin/products/123' },
    { method: 'POST', url: '/api/admin/products/123/archive' },
    { method: 'POST', url: '/api/admin/products/123/publish' },
    { method: 'GET', url: '/api/admin/products/123/images' },
    { method: 'POST', url: '/api/admin/products/123/images' },
    { method: 'POST', url: '/api/admin/products/123/images/reorder' },
    { method: 'DELETE', url: '/api/admin/products/123/images/456' },
    { method: 'POST', url: '/api/admin/products/123/images/456/primary' },
    { method: 'GET', url: '/api/admin/products/123/variants' },
    { method: 'POST', url: '/api/admin/products/123/variants' },
    { method: 'PATCH', url: '/api/admin/products/123/variants/456' },
    { method: 'DELETE', url: '/api/admin/products/123/variants/456' },
    { method: 'POST', url: '/api/admin/products/123/variants/456/inventory/adjust' },
    { method: 'GET', url: '/api/admin/products/123/variants/456/inventory/transactions' },
    { method: 'PATCH', url: '/api/admin/products/123/variants/456/inventory/threshold' },
    { method: 'GET', url: '/api/admin/shipments' },
    { method: 'GET', url: '/api/admin/shipments/123' },
    { method: 'PATCH', url: '/api/admin/shipments/123/status' },
    { method: 'POST', url: '/api/admin/shipments/123/cancel' },
    { method: 'POST', url: '/api/admin/shipments/123/awb' },
    { method: 'POST', url: '/api/admin/cron/expire-orders' },
    { method: 'POST', url: '/api/admin/returns/123/approve' },
    { method: 'POST', url: '/api/admin/returns/123/inspect' },
    { method: 'POST', url: '/api/admin/exchanges/123/approve' },
    { method: 'POST', url: '/api/admin/exchanges/123/complete' },
    { method: 'PATCH', url: '/api/admin/customers/123/status' },
    { method: 'POST', url: '/api/admin/refunds/123/process' },
    { method: 'POST', url: '/api/admin/media/upload' }
  ];

  test('Unauthenticated user cannot access admin APIs', async ({ request }) => {
    for (const ep of endpoints) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (request as any)[ep.method.toLowerCase()](ep.url, { data: {} });
      const status = res.status();
      // If it's 404 or 405, that's fine (route not implemented or method not allowed)
      // Otherwise, we strictly expect 401 or 403.
      if (status !== 404 && status !== 405) {
        expect([401, 403]).toContain(status);
      }
    }
  });

  test('Customer cannot access admin APIs', async ({ request }) => {
    const loginRes = await request.post('/api/auth/sign-in/email', {
      data: custCreds
    });
    expect(loginRes.status()).toBe(200);

    for (const ep of endpoints) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (request as any)[ep.method.toLowerCase()](ep.url, { data: {} });
      const status = res.status();
      if (status !== 404 && status !== 405) {
        if (status !== 401 && status !== 403) {
          console.error(`SECURITY FLAW: Customer accessed ${ep.method} ${ep.url} with status ${status}`);
        }
        expect([401, 403]).toContain(status);
      }
    }
  });

  test('Admin CAN access admin APIs', async ({ request }) => {
    const loginRes = await request.post('/api/auth/sign-in/email', {
      data: adminCreds
    });
    expect(loginRes.status()).toBe(200);

    for (const ep of endpoints) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (request as any)[ep.method.toLowerCase()](ep.url, { data: {} });
      const status = res.status();
      // Admin should NEVER get 401 or 403 for an admin route!
      if (status === 401 || status === 403) {
        console.error(`ADMIN BLOCKED: Admin blocked from ${ep.method} ${ep.url} with status ${status}`);
      }
      expect([401, 403]).not.toContain(status);
    }
  });
});
