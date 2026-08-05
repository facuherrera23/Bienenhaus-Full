const { chromium } = require('playwright');

async function runVisualAudit() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', function(msg) { console.log('CONSOLE:', msg.type(), msg.text()); });
  page.on('pageerror', function(err) { console.log('PAGE ERROR:', err.message); });

  await page.goto('http://localhost:4173/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'landing-full.png', fullPage: true });
  console.log('Screenshot saved: landing-full.png');

  const sections = await page.$$eval('section', function(els) {
    return els.map(function(s) {
      return {
        id: s.id,
        className: s.className,
        visible: s.getBoundingClientRect().height > 0,
        height: s.getBoundingClientRect().height
      };
    });
  });
  console.log('Sections:', JSON.stringify(sections, null, 2));

  const images = await page.$$eval('img', function(imgs) {
    return imgs.map(function(img) {
      return {
        src: img.src.substring(0, 80),
        alt: img.alt || 'MISSING',
        width: img.naturalWidth,
        height: img.naturalHeight,
        displayed: img.getBoundingClientRect().width > 0
      };
    });
  });
  console.log('Images:', JSON.stringify(images, null, 2));

  await browser.close();
}

runVisualAudit().catch(console.error);