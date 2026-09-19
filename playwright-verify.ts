import { chromium } from 'playwright';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:3001/login');
  console.log('Page loaded successfully:', await page.title());

  await browser.close();
}

run().catch(console.error);
