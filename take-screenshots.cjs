const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\HULA\\.gemini\\antigravity\\brain\\279445f5-f8fb-4151-bf89-f5c8eafce648';

async function capture() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });

  console.log('Navigating to homepage...');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Hero Screenshot
  console.log('Taking hero screenshot...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'preview-hero.png'),
    clip: { x: 0, y: 0, width: 1366, height: 850 }
  });

  // 2. Services & Equipment
  console.log('Taking services screenshot...');
  const servicesEl = await page.$('#services');
  if (servicesEl) {
    await servicesEl.screenshot({
      path: path.join(ARTIFACT_DIR, 'preview-services.png')
    });
  }

  // 3. Location & Contact
  console.log('Taking location screenshot...');
  const locationEl = await page.$('#location');
  if (locationEl) {
    await locationEl.screenshot({
      path: path.join(ARTIFACT_DIR, 'preview-location.png')
    });
  }

  // 4. Mobile view
  console.log('Taking mobile screenshot...');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true });
  await mobilePage.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, 'preview-mobile.png'),
    clip: { x: 0, y: 0, width: 390, height: 844 }
  });

  // 5. Admin Dashboard
  console.log('Taking admin login and dashboard screenshots...');
  const adminPage = await browser.newPage();
  await adminPage.setViewport({ width: 1366, height: 900 });
  await adminPage.goto('http://localhost:4173/admin', { waitUntil: 'networkidle0' });
  
  // Fill password
  await adminPage.type('input[type="password"]', 'DrElattar2026!');
  await adminPage.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));

  await adminPage.screenshot({
    path: path.join(ARTIFACT_DIR, 'preview-admin.png')
  });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
