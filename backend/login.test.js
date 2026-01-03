const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser');
  const browser = await chromium.launch({ headless: false });

  console.log('Opening new page');
  const page = await browser.newPage();

  console.log('Navigating to login page');
  await page.goto('http://localhost:3000/authentication/auth', {
    waitUntil: 'networkidle'
  });

  console.log('Filling email');
  await page.fill('input[type="email"]', 'adminshopsphere@example.com');

  console.log('Filling password');
  await page.fill('input[type="password"]', 'shopspherehost123');

  console.log('Submitting login form');
  await page.click('button[type="submit"]');

  console.log('Waiting for authentication and Firebase processing');
  await page.waitForTimeout(12000);

  console.log('Waiting for redirect to admin dashboard');
  await page.waitForURL('**/admin/dashboard', {
    timeout: 60000
  });

  console.log('Admin dashboard URL detected');

  console.log('Waiting for dashboard content to render');
  await page.waitForSelector('body', {
    timeout: 60000
  });

  console.log('ADMIN DASHBOARD LOADED SUCCESSFULLY');

  console.log('Keeping browser open for observation');
  await page.waitForTimeout(15000);

  console.log('Closing browser');
  await browser.close();
})();
