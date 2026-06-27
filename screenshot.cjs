const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots/dashboard.png', fullPage: false });
  console.log('Dashboard screenshot taken');

  await page.goto('http://localhost:3000/reviews');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/reviews.png', fullPage: false });
  console.log('Reviews screenshot taken');

  await page.goto('http://localhost:3000/reviews/1');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/review-detail.png', fullPage: true });
  console.log('Review detail screenshot taken');

  await page.goto('http://localhost:3000/repos');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/repos.png', fullPage: false });
  console.log('Repos screenshot taken');

  await page.goto('http://localhost:3000/settings');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshots/settings.png', fullPage: false });
  console.log('Settings screenshot taken');

  await browser.close();
  console.log('All screenshots taken!');
})();
