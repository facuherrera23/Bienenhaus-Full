const { chromium } = require('playwright');

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for console messages and errors
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:4173/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);
  
  const content = await page.content();
  console.log('Page length:', content.length);
  
  // Check for main content
  const mainContent = await page.$eval('main, #app, #root, .page', el => el.outerHTML.substring(0, 500)).catch(() => 'NOT FOUND');
  console.log('Main content:', mainContent);
  
  const hero = await page.$eval('.hero, [class*="hero"], section:first-of-type', el => el.outerHTML.substring(0, 500)).catch(() => 'NOT FOUND');
  console.log('Hero:', hero);
  
  const sections = await page.$$eval('section', els => els.map(s => ({ class: s.className, id: s.id, text: s.textContent.substring(0, 100) })));
  console.log('Sections:', JSON.stringify(sections, null, 2));
  
  await browser.close();
}

runAudit().catch(console.error);