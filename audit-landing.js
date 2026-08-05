const { chromium } = require('playwright');
const lighthouse = require('lighthouse');

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:4173');

  const cdp = await browser.newBrowserCDPSession();
  await cdp.send('Network.enable');

  const wsEndpoint = browser._connection._transport._wsUrl;
  const port = wsEndpoint.split(':')[2].split('/')[0];

  const result = await lighthouse('http://localhost:4173', {
    port: parseInt(port),
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
  });

  const categories = result.lhr.categories;
  for (const [key, cat] of Object.entries(categories)) {
    console.log(key + ': ' + Math.round(cat.score * 100));
  }

  await browser.close();
}

runAudit().catch(console.error);