import { render } from 'preact';
import { App } from './App';
import { setPreviewPayload, type PreviewPayload } from './lib/content';
import { initSentry } from './lib/sentry';
import './index.css';

initSentry({
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || 'dev',
});

// Register Service Worker for PWA
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
            (registration) => {
                console.log('SW registered:', registration.scope);
            },
            (error) => {
                console.log('SW registration failed:', error);
            },
        );
    });
}

if (typeof window !== 'undefined') {
    window.addEventListener('message', (e: MessageEvent) => {
        const data = e.data as { type?: string; payload?: PreviewPayload } | null;
        if (data?.type === 'bh-site-preview') {
            setPreviewPayload(data.payload ?? null);
        }
    });
}

render(<App />, document.getElementById('app')!);
