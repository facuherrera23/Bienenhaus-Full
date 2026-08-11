import type { SeverityLevel } from '@sentry/browser';

export interface SentryConfig {
    dsn: string;
    environment: string;
    release: string;
}

const IGNORED_ERRORS = [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'NetworkError',
    'Failed to fetch',
    'AbortError',
    'CanceledError',
    'Loading chunk failed',
    'ChunkLoadError',
    'Script error.',
    'The user aborted a request',
    'Request aborted',
    'Permission denied',
];

type SentryModule = typeof import('@sentry/browser');
let sentry: SentryModule | null = null;

let isInitialized = false;

/**
 * Inicializa Sentry de forma lazy: el SDK solo se descarga y activa
 * cuando VITE_SENTRY_DSN está definida, sin penalizar el bundle inicial.
 */
export async function initSentry(config: SentryConfig): Promise<void> {
    if (isInitialized || !config.dsn) return;

    try {
        sentry = await import('@sentry/browser');
        sentry.init({
            dsn: config.dsn,
            environment: config.environment,
            release: config.release,
            integrations: [sentry.browserTracingIntegration()],
            tracesSampleRate: 0.1,
            ignoreErrors: IGNORED_ERRORS,
            denyUrls: [/localhost:\d+/i, /127\.0\.0\.1:\d+/i, /test/i, /chrome-extension/i],
            allowUrls: [/bienenhaus/i],
            enabled: import.meta.env.PROD,
        });
        isInitialized = true;
    } catch {
        sentry = null;
    }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
    if (!sentry) return;
    sentry.captureException(error, { extra: context });
}

export function captureMessage(
    message: string,
    level: SeverityLevel = 'info',
    context?: Record<string, unknown>,
): void {
    if (!sentry) return;
    sentry.captureMessage(message, { level, extra: context });
}
