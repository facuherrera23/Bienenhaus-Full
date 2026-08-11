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
                                const shift = entry as PerformanceLayoutShift;
                                if (!shift.hadRecentInput) {
                                    metrics['cls'] = (metrics['cls'] || 0) + shift.value;
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

            expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s
            expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
        });
    }
});
