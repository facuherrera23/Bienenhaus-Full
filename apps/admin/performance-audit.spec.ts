import { expect, test } from '@playwright/test';

const BASE_URL = 'http://localhost:4187/admin';

const pages = [
    { name: 'Login', path: '/login' },
    { name: 'Dashboard', path: '/' },
    { name: 'Properties', path: '/propiedades' },
    { name: 'Property Form', path: '/propiedades/nueva' },
    { name: 'Leads', path: '/leads' },
];

test.describe('Performance Audit', () => {
    for (const pg of pages) {
        test(`${pg.name} - Performance Metrics`, async ({ page: pwPage }) => {
            await pwPage.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'networkidle' });

            // Measure Core Web Vitals
            const metrics = await pwPage.evaluate(() => {
                return new Promise<Record<string, number>>((resolve) => {
                    const metrics: Record<string, number> = {};
                    const observer = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        for (const entry of entries) {
                            if (entry.entryType === 'navigation') {
                                const nav = entry as PerformanceNavigationTiming;
                                metrics['dns'] = nav.domainLookupEnd - nav.domainLookupStart;
                                metrics['tcp'] = nav.connectEnd - nav.connectStart;
                                metrics['ttfb'] = nav.responseStart - nav.requestStart;
                                metrics['domContentLoaded'] =
                                    nav.domContentLoadedEventEnd - nav.fetchStart;
                                metrics['load'] = nav.loadEventEnd - nav.fetchStart;
                            }
                            if (entry.entryType === 'paint') {
                                if (entry.name === 'first-contentful-paint') {
                                    metrics['fcp'] = entry.startTime;
                                }
                                if (entry.name === 'first-paint') {
                                    metrics['fp'] = entry.startTime;
                                }
                            }
                            if (entry.entryType === 'largest-contentful-paint') {
                                metrics['lcp'] = entry.startTime;
                            }
                            if (entry.entryType === 'first-input') {
                                metrics['fid'] =
                                    (entry as PerformanceEventTiming).processingStart -
                                    entry.startTime;
                            }
                            if (entry.entryType === 'layout-shift') {
                                if (!(entry as any).hadRecentInput) {
                                    metrics['cls'] = (metrics['cls'] || 0) + (entry as any).value;
                                }
                            }
                        }
                        // Resolve after a short delay to collect all entries
                        setTimeout(() => resolve(metrics), 100);
                    });
                    observer.observe({ type: 'navigation', buffered: true });
                    observer.observe({ type: 'paint', buffered: true });
                    observer.observe({ type: 'largest-contentful-paint', buffered: true });
                    observer.observe({ type: 'first-input', buffered: true });
                    observer.observe({ type: 'layout-shift', buffered: true });
                });
            });

            // Measure bundle sizes
            const resources = await pwPage.evaluate(() => {
                const entries = performance.getEntriesByType('resource');
                return entries.map((r) => ({
                    name: r.name,
                    type: r.initiatorType,
                    size: (r as any).transferSize || 0,
                    duration: r.duration,
                }));
            });

            console.log(`\n=== ${pg.name} (${pg.path}) ===`);
            console.log('Core Web Vitals:', JSON.stringify(metrics, null, 2));

            const totalJS = resources
                .filter((r) => r.type === 'script')
                .reduce((sum, r) => sum + r.size, 0);
            const totalCSS = resources
                .filter((r) => r.type === 'style' || r.name.endsWith('.css'))
                .reduce((sum, r) => sum + r.size, 0);
            const totalSize = resources.reduce((sum, r) => sum + r.size, 0);

            console.log(
                `Bundle - JS: ${(totalJS / 1024).toFixed(1)}KB, CSS: ${(totalCSS / 1024).toFixed(1)}KB, Total: ${(totalSize / 1024).toFixed(1)}KB`,
            );

            // Check for large resources
            const largeResources = resources.filter((r) => r.size > 100000);
            if (largeResources.length > 0) {
                console.log('Large resources (>100KB):');
                for (const r of largeResources) {
                    console.log(`  ${r.name}: ${(r.size / 1024).toFixed(1)}KB (${r.type})`);
                }
            }

            // React hydration check
            const hydration = await pwPage.evaluate(() => {
                return {
                    hasReact: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
                    hydrationMarkers: document.querySelectorAll('[data-hydration]').length,
                };
            });
            console.log('React:', hydration);

            expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s
            expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
        });
    }
});
