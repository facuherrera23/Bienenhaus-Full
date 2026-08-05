const { chromium } = require('playwright');

async function runVisualAudit() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', function(msg) { console.log('CONSOLE:', msg.type(), msg.text()); });
  page.on('pageerror', function(err) { console.log('PAGE ERROR:', err.message); });

  await page.goto('http://localhost:4173/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // Check sections with aria-labels
  const sections = await page.$$eval('section', function(sections) {
    return sections.map(function(s) {
      return {
        id: s.id,
        className: s.className,
        ariaLabel: s.getAttribute('aria-label') || 'NONE',
        role: s.getAttribute('role') || 'none'
      };
    });
  });
  console.log('Sections:', JSON.stringify(sections, null, 2));

  await browser.close();
}

runVisualAudit().catch(console.error);