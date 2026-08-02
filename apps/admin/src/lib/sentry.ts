import * as Sentry from '@sentry/browser';

interface SentryConfig {
  dsn: string;
  environment: string;
  release: string;
}

export function initSentry(config: SentryConfig): void {
  if (!config.dsn || config.dsn === 'YOUR_SENTRY_DSN') {
    if (import.meta.env.DEV) {
      console.warn('[Sentry] DSN no configurado, Sentry deshabilitado');
    }
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      if (import.meta.env.DEV) {
        console.log('[Sentry] Enviando evento:', event.exception?.values?.[0]?.value || event.message);
      }
      return event;
    },
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'NetworkError',
      'Failed to fetch',
    ],
  });

  if (import.meta.env.DEV) {
    console.log('[Sentry] Inicializado:', config.environment, config.release);
  }
}

export function captureException(error: unknown, context?: Record<string, any>): string {
  return Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): string {
  return Sentry.captureMessage(message, level);
}

export function setUserContext(user: { id: string; email?: string; role?: string } | null): void {
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email, role: user.role });
  } else {
    Sentry.setUser(null);
  }
}

export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

export { Sentry };