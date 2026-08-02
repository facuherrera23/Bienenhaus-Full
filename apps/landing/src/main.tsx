import { render } from 'preact';
import { App } from './App';
import { setPreviewPayload, type PreviewPayload } from './lib/content';
import './index.css';

if (typeof window !== 'undefined') {
  window.addEventListener('message', (e: MessageEvent) => {
    const data = e.data as { type?: string; payload?: PreviewPayload } | null;
    if (data?.type === 'bh-site-preview') {
      setPreviewPayload(data.payload ?? null);
    }
  });
}

render(<App />, document.getElementById('app')!);
