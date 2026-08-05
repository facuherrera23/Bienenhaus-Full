const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

async function runA11yAudit() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:4173');

  const results = await new AxeBuilder({ page }).analyze();

  console.log('Accessibility Violations:');
  results.violations.forEach(v => {
    console.log('- ' + v.id + ': ' + v.description);
    console.log('  Impact: ' + v.impact);
    console.log('  Nodes: ' + v.nodes.length);
  });

  console.log('\nPasses: ' + results.passes.length);
  console.log('Incomplete: ' + results.incomplete.length);

  await browser.close();
}

runA11yAudit().catch(console.error);