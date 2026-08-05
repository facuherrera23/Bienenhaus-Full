const { chromium } = require('playwright');

async function runVisualAudit() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', function(msg) { console.log('CONSOLE:', msg.type(), msg.text()); });
  page.on('pageerror', function(err) { console.log('PAGE ERROR:', err.message); });

  await page.goto('http://localhost:4173/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(10000);

  // Wait for images to load
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = img.onerror = resolve; });
      })
    );
  });

  // Check team agent images
  const agentImages = await page.$$eval('img[src*="placeholder-agent"]', function(imgs) {
    return imgs.map(function(img) {
      return {
        src: img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight,
        displayed: img.getBoundingClientRect().width > 0,
        complete: img.complete
      };
    });
  });
  console.log('Agent images:', JSON.stringify(agentImages, null, 2));

  // Check team cards
  const teamCards = await page.$$eval('.team-card', function(cards) {
    return cards.map(function(c) {
      return {
        className: c.className,
        visible: c.getBoundingClientRect().height > 0,
        height: c.getBoundingClientRect().height
      };
    });
  });
  console.log('Team cards:', JSON.stringify(teamCards, null, 2));

  await browser.close();
}

runVisualAudit().catch(console.error);