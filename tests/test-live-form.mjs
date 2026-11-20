import { chromium } from '@playwright/test';

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to https://cosmiqos.com/contact ...');
  await page.goto('https://cosmiqos.com/contact', { waitUntil: 'networkidle' });

  console.log('Filling contact form fields...');
  await page.fill('input[name="name"]', 'Anand Nair');
  await page.fill('input[name="role"]', 'VP Operations');
  await page.fill('input[name="domain"]', 'Alpha Dynamics Logistics');
  await page.fill('input[name="email"]', 'anand@alphadynamics.com');
  await page.fill('input[name="phone"]', '+91 98765 43210');

  // Select automation checkbox
  await page.check('input[value="All of the above"]');

  await page.fill('textarea[name="notes"]', 'Live test inquiry submitted from browser automation.');

  console.log('Clicking Submit ("Send message →")...');
  await page.click('button[type="submit"]');

  console.log('Waiting for response message...');
  await page.waitForSelector('.formmsg', { timeout: 15000 });
  const msgClass = await page.getAttribute('.formmsg', 'class');
  const msgText = await page.textContent('.formmsg');

  console.log(`[RESULT] class="${msgClass}", text="${msgText}"`);

  // Take screenshot of the submitted form
  const screenshotPath = 'C:/Users/lenovo/.gemini/antigravity/brain/3e66263d-f47a-47f3-9591-18689f43e904/live-form-test-success.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to: ${screenshotPath}`);

  await browser.close();

  if (!msgClass.includes('ok')) {
    throw new Error(`Form submission failed with message: ${msgText}`);
  }
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
