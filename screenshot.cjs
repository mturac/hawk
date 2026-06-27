const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Dashboard
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/dashboard.png', fullPage: false });
  console.log('Dashboard screenshot taken');

  // Reviews list
  await page.goto('http://localhost:3000/reviews', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/reviews.png', fullPage: false });
  console.log('Reviews screenshot taken');

  // Review detail — click first ReviewCard link
  const firstCard = page.locator('a[href^="/reviews/"]').first();
  if (await firstCard.count() > 0) {
    await firstCard.click();
  } else {
    await page.goto('http://localhost:3000/reviews/1', { waitUntil: 'networkidle' });
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/review-detail.png', fullPage: true });
  console.log('Review detail screenshot taken');

  // Repos
  await page.goto('http://localhost:3000/repos', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/repos.png', fullPage: false });
  console.log('Repos screenshot taken');

  // Settings
  await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/settings.png', fullPage: false });
  console.log('Settings screenshot taken');

  await browser.close();
  console.log('All screenshots taken!');
})();