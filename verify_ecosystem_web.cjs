const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\HULA\\.gemini\\antigravity\\brain\\279445f5-f8fb-4151-bf89-f5c8eafce648';

async function run() {
  console.log('Starting ecosystem web test...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Visit /secretary
  console.log('Navigating to /secretary...');
  await page.goto('http://localhost:4173/secretary', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview-secretary-login.png') });
  console.log('Saved preview-secretary-login.png');

  // 2. Submit secretary login
  console.log('Logging in as secretary...');
  await page.type('input[placeholder*="secretary"], input[type="text"]', 'secretary');
  await page.type('input[type="password"]', 'ElattarSecretary2026!');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview-secretary-dashboard.png') });
  console.log('Saved preview-secretary-dashboard.png');

  // 3. Visit /admin
  console.log('Navigating to /admin...');
  await page.goto('http://localhost:4173/admin', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Check if admin login form is visible
  const passwordInput = await page.$('input[type="password"]');
  if (passwordInput) {
    console.log('Logging into admin...');
    await page.type('input[type="email"]', 'admin@drelattar.com');
    await page.type('input[type="password"]', 'DrElattar2026!');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));
  }

  // Click Holidays Tab
  console.log('Checking Holidays Tab...');
  const holidayButtons = await page.$$('button');
  for (const btn of holidayButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('الإجازات والتعطيل')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview-admin-holidays-tab.png') });
  console.log('Saved preview-admin-holidays-tab.png');

  // Click Secretary Accounts Tab
  console.log('Checking Secretary Accounts Tab...');
  const allButtons = await page.$$('button');
  for (const btn of allButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('السكرتارية')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'preview-admin-secretary-tab.png') });
  console.log('Saved preview-admin-secretary-tab.png');

  await browser.close();
  console.log('Verification script completed successfully.');
}

run().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});
