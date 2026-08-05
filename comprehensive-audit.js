const { chromium } = require('playwright');

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:4173');
  await page.waitForLoadState('networkidle');

  console.log('=== LANDING PAGE AUDIT REPORT ===\n');
  console.log('URL: http://localhost:4173');
  console.log('Timestamp: ' + new Date().toISOString() + '\n');

  // 1. Basic page info
  const title = await page.title();
  console.log('1. PAGE TITLE: ' + title);

  // 2. Check for basic HTML structure
  const htmlLang = await page.getAttribute('html', 'lang');
  console.log('\n2. HTML LANG: ' + (htmlLang || 'MISSING'));

  // 3. Check for viewport meta tag
  const viewport = await page.$eval('meta[name="viewport"]', el => el.getAttribute('content')).catch(() => null);
  console.log('3. VIEWPORT META: ' + (viewport || 'MISSING'));

  // 4. Check for meta description
  const metaDesc = await page.$eval('meta[name="description"]', el => el.getAttribute('content')).catch(() => null);
  console.log('4. META DESCRIPTION: ' + (metaDesc || 'MISSING'));

  // 5. Check for Open Graph tags
  const ogTitle = await page.$eval('meta[property="og:title"]', el => el.getAttribute('content')).catch(() => null);
  const ogDesc = await page.$eval('meta[property="og:description"]', el => el.getAttribute('content')).catch(() => null);
  const ogImage = await page.$eval('meta[property="og:image"]', el => el.getAttribute('content')).catch(() => null);
  console.log('\n5. OPEN GRAPH:');
  console.log('  og:title: ' + (ogTitle || 'MISSING'));
  console.log('  og:description: ' + (ogDesc || 'MISSING'));
  console.log('  og:image: ' + (ogImage || 'MISSING'));

  // 6. Check heading structure (h1, h2, h3 hierarchy)
  const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', els => 
    els.map(el => ({ tag: el.tagName.toLowerCase(), text: el.textContent.trim().substring(0, 80) }))
  );
  console.log('\n6. HEADING STRUCTURE:');
  headings.forEach(h => console.log('  ' + h.tag + ': ' + h.text));

  // 7. Check images for alt attributes
  const images = await page.$$eval('img', imgs => 
    imgs.map(img => ({
      src: img.src,
      alt: img.alt || 'MISSING',
      width: img.width,
      height: img.height
    }))
  );
  console.log('\n7. IMAGES (' + images.length + ' total):');
  images.forEach(img => {
    const altStatus = img.alt === 'MISSING' ? '❌' : '✓';
    console.log('  ' + altStatus + ' ' + img.src.substring(0, 60) + '... | alt: ' + img.alt.substring(0, 50));
  });

  // 8. Check links for accessible names
  const links = await page.$$eval('a', links => 
    links.map(a => ({
      href: a.href,
      text: a.textContent.trim().substring(0, 60),
      ariaLabel: a.getAttribute('aria-label') || 'NONE'
    }))
  );
  console.log('\n8. LINKS (' + links.length + ' total):');
  links.slice(0, 10).forEach(l => {
    const hasAccessibleName = l.text.trim() || l.ariaLabel !== 'NONE';
    console.log('  ' + (hasAccessibleName ? '✓' : '❌') + ' ' + l.text + ' | aria-label: ' + l.ariaLabel);
  });

  // 9. Check form inputs for labels
  const inputs = await page.$$eval('input, select, textarea', inputs => 
    inputs.map(input => ({
      type: input.type || input.tagName.toLowerCase(),
      id: input.id,
      name: input.name,
      placeholder: input.placeholder,
      ariaLabel: input.getAttribute('aria-label'),
      ariaLabelledBy: input.getAttribute('aria-labelledby'),
      labelText: input.labels ? Array.from(input.labels).map(l => l.textContent.trim()).join(', ') : 'NONE'
    }))
  );
  console.log('\n9. FORM INPUTS (' + inputs.length + ' total):');
  inputs.forEach(i => {
    const hasLabel = i.labelText !== 'NONE' || i.ariaLabel || i.ariaLabelledBy;
    console.log('  ' + (hasLabel ? '✓' : '❌') + ' ' + i.type + ' | id: ' + i.id + ' | label: ' + (i.labelText || i.ariaLabel || 'MISSING'));
  });

  // 10. Check for skip link
  const skipLink = await page.$('a[href^="#main"], a[href^="#content"], a.skip-link, .skip-link').catch(() => null);
  console.log('\n10. SKIP LINK: ' + (skipLink ? 'PRESENT' : 'MISSING'));

  // 11. Check color contrast (basic check - look for obvious low contrast)
  // This is a basic check - full contrast analysis requires more sophisticated tools
  console.log('\n11. COLOR CONTRAST: Manual review recommended (automated check limited)');

  // 12. Check for focus indicators
  const focusStyles = await page.evaluate(() => {
    const styleSheets = Array.from(document.styleSheets);
    let hasFocusVisible = false;
    let hasFocusOutline = false;
try {
          for (const sheet of styleSheets) {
            try {
              const rules = Array.from(sheet.cssRules || []);
              for (const rule of rules) {
                if (rule.selectorText && (rule.selectorText.includes(':focus') || rule.selectorText.includes(':focus-visible'))) {
                  if (rule.style.outline && rule.style.outline !== 'none') hasFocusOutline = true;
                  if (rule.selectorText.includes(':focus-visible')) hasFocusVisible = true;
                }
              }
            } catch (e) {
              // Cross-origin stylesheet access blocked
            }
          }
        } catch (e) {
          // Ignore errors
        }
    return { hasFocusVisible, hasFocusOutline };
  });
  console.log('\n12. FOCUS INDICATORS:');
  console.log('  :focus-visible used: ' + (focusStyles.hasFocusVisible ? 'YES' : 'NO'));
  console.log('  :focus outline present: ' + (focusStyles.hasFocusOutline ? 'YES' : 'NO'));

  // 13. Check for reduced motion support
  const reducedMotion = await page.evaluate(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  });
  console.log('\n13. REDUCED MOTION: Media query supported: YES, User prefers reduced: ' + reducedMotion);

  // 14. Check for landmark regions
  const landmarks = await page.$$eval('header, nav, main, aside, footer, section[aria-labelledby], section[aria-label], [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]', els =>
    els.map(el => ({
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute('role') || 'none',
      ariaLabel: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || 'none'
    }))
  );
  console.log('\n14. LANDMARK REGIONS (' + landmarks.length + ' total):');
  landmarks.forEach(l => console.log('  ' + l.tag + ' | role: ' + l.role + ' | label: ' + l.ariaLabel));

  // 15. Performance - check resource sizes
  const resources = await page.evaluate(() => {
    const entries = performance.getEntriesByType('resource');
    return entries.map(entry => ({
      name: entry.name.substring(0, 80),
      type: entry.initiatorType,
      size: entry.transferSize || entry.encodedBodySize || 0,
      duration: entry.duration
    }));
  });
  console.log('\n15. RESOURCE SUMMARY:');
  const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
  console.log('  Total resources: ' + resources.length);
  console.log('  Total transfer size: ' + (totalSize / 1024).toFixed(2) + ' KB');
  const largeResources = resources.filter(r => r.size > 100000).sort((a, b) => b.size - a.size);
  console.log('  Large resources (>100KB): ' + largeResources.length);
  largeResources.slice(0, 5).forEach(r => 
    console.log('    ' + (r.size / 1024).toFixed(1) + ' KB | ' + r.type + ' | ' + r.name)
  );

  // 16. Check for JavaScript errors
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.waitForTimeout(2000);
  console.log('\n16. JAVASCRIPT ERRORS: ' + (errors.length === 0 ? 'NONE' : errors.length));
  errors.forEach(e => console.log('  ❌ ' + e));

  console.log('\n=== AUDIT COMPLETE ===');
  await browser.close();
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});