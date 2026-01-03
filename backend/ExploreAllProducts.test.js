const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to dashboard page with Explore Products button');
  await page.goto('http://localhost:3000/admin/dashboard', { waitUntil: 'networkidle' });

  console.log('Waiting for dashboard content');
  await page.waitForSelector('body', { timeout: 60000 });

  console.log('Clicking Explore Products button');
  await page.click('a[href="/user/products"]');

  console.log('Waiting for User Products page to load');
  await page.waitForSelector('h1, body', { timeout: 60000 });

  console.log('USER PRODUCTS PAGE LOADED');

  await page.waitForTimeout(10000);

  console.log('Closing browser');
  await browser.close();
})();
