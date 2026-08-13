import * as Sentry from '@sentry/browser';

// ============================================================
// Types
// ============================================================

export interface SentryConfig {
    dsn: string;
    environment: string;
    release: string;
    tracesSampleRate?: number;
    replaysSessionSampleRate?: number;
    replaysOnErrorSampleRate?: number;
    enableTracing?: boolean;
    enableReplay?: boolean;
}

export interface UserContext {
    id: string;
    email?: string;
    role?: string;
    username?: string;
}

export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

// ============================================================
// Constants
// ============================================================

const DEFAULT_CONFIG: Partial<SentryConfig> = {
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enableTracing: true,
    enableReplay: true,
};

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
    'SpeechRecognition',
];

// ============================================================
// Main Initialization
// ============================================================

let isInitialized = false;

/**
 * Inicializa Sentry con la configuración proporcionada
 */
export function initSentry(config: SentryConfig): void {
    if (isInitialized) {
        console.warn('[Sentry] Ya fue inicializado previamente');
        return;
    }

    // Validar DSN
    if (!config.dsn || config.dsn === 'YOUR_SENTRY_DSN' || config.dsn === '') {
        if (import.meta.env.DEV) {
            console.warn('[Sentry] DSN no configurado, Sentry deshabilitado');
        }
        return;
    }

    try {
        const integrations = [];

        if (config.enableTracing !== false) {
            integrations.push(Sentry.browserTracingIntegration());
        }

        if (config.enableReplay !== false) {
            integrations.push(
                Sentry.replayIntegration({
                    maskAllText: true,
                    blockAllMedia: true,
                    maskAllInputs: true,
                }),
            );
        }

        Sentry.init({
            dsn: config.dsn,
            environment: config.environment,
            release: config.release,
            integrations,
            tracesSampleRate: config.tracesSampleRate ?? DEFAULT_CONFIG.tracesSampleRate,
            replaysSessionSampleRate:
                config.replaysSessionSampleRate ?? DEFAULT_CONFIG.replaysSessionSampleRate,
            replaysOnErrorSampleRate:
                config.replaysOnErrorSampleRate ?? DEFAULT_CONFIG.replaysOnErrorSampleRate,
            beforeSend: (event) => {
                // En desarrollo, loguear en consola
                if (import.meta.env.DEV) {
                    console.warn('[Sentry] Evento:', {
                        message: event.message,
                        exception: event.exception?.values?.[0]?.value,
                        level: event.level,
                    });
                }
                return event;
            },
            beforeBreadcrumb: (breadcrumb) => {
                // Limpiar URLs sensibles
                if (breadcrumb.data?.url) {
                    try {
                        const url = new URL(breadcrumb.data.url);
                        breadcrumb.data.url = `${url.origin}${url.pathname}`;
                    } catch {
                        // Ignorar
                    }
                }
                return breadcrumb;
            },
            ignoreErrors: IGNORED_ERRORS,
            denyUrls: [/localhost:\d+/i, /127\.0\.0\.1:\d+/i, /test/i, /chrome-extension/i],
            allowUrls: [/bienenhaus/i, /vercel\.app/i],
            enabled: import.meta.env.PROD,
            debug: import.meta.env.DEV,
        });

        isInitialized = true;

        if (import.meta.env.DEV) {
            console.warn('[Sentry] Inicializado:', {
                environment: config.environment,
                release: config.release,
            });
        }
    } catch (error) {
        console.error('[Sentry] Error al inicializar:', error);
    }
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Captura una excepción en Sentry
 */
export function captureException(
    error: unknown,
    context?: Record<string, unknown>,
    level: SeverityLevel = 'error',
): string {
    if (!isInitialized) {
        console.warn('[Sentry] No inicializado, error capturado localmente:', error);
        return 'not-initialized';
    }

    try {
        const eventId = Sentry.captureException(error, {
            level,
            extra: context,
        });
        return eventId;
    } catch (sentryError) {
        console.error('[Sentry] Error al capturar excepción:', sentryError);
        return 'error-capturing';
    }
}

/**
 * Captura un mensaje en Sentry
 */
export function captureMessage(
    message: string,
    level: SeverityLevel = 'info',
    context?: Record<string, unknown>,
): string {
    if (!isInitialized) {
        console.warn('[Sentry] No inicializado, mensaje capturado localmente:', message);
        return 'not-initialized';
    }

    try {
        const eventId = Sentry.captureMessage(message, {
            level,
            extra: context,
        });
        return eventId;
    } catch (sentryError) {
        console.error('[Sentry] Error al capturar mensaje:', sentryError);
        return 'error-capturing';
    }
}

/**
 * Establece el contexto del usuario
 */
export function setUserContext(user: UserContext | null): void {
    if (!isInitialized) {
        console.warn('[Sentry] No inicializado, usuario no establecido');
        return;
    }

    try {
        if (user) {
            Sentry.setUser({
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
            });
        } else {
            Sentry.setUser(null);
        }
    } catch (error) {
        console.error('[Sentry] Error al establecer usuario:', error);
    }
}

/**
 * Agrega un breadcrumb al contexto
 */
export function addBreadcrumb(
    breadcrumb: {
        message?: string;
        category?: string;
        level?: SeverityLevel;
        data?: Record<string, unknown>;
        type?: string;
    },
    _maxBreadcrumbs: number = 30,
): void {
    if (!isInitialized) {
        console.warn('[Sentry] No inicializado, breadcrumb no agregado');
        return;
    }

    try {
        Sentry.addBreadcrumb({
            message: breadcrumb.message,
            category: breadcrumb.category,
            level: breadcrumb.level ?? 'info',
            data: breadcrumb.data,
            type: breadcrumb.type ?? 'default',
        });
    } catch (error) {
        console.error('[Sentry] Error al agregar breadcrumb:', error);
    }
}

/**
 * Establece el contexto de la aplicación
 */
export function setAppContext(context: Record<string, unknown>): void {
    if (!isInitialized) {
        console.warn('[Sentry] No inicializado, contexto no establecido');
        return;
    }

    try {
        Sentry.setContext('app', context);
    } catch (error) {
        console.error('[Sentry] Error al establecer contexto:', error);
    }
}

/**
 * Establece tags para el evento actual
 */
export function setTags(tags: Record<string, string>): void {
    if (!isInitialized) {
        console.warn('[Sentry] No inicializado, tags no establecidos');
        return;
    }

    try {
        Sentry.setTags(tags);
    } catch (error) {
        console.error('[Sentry] Error al establecer tags:', error);
    }
}

/**
 * Establece una tag individual
 */
export function setTag(key: string, value: string): void {
    if (!isInitialized) {
        console.warn('[Sentry] No inicializado, tag no establecido');
        return;
    }

    try {
        Sentry.setTag(key, value);
    } catch (error) {
        console.error('[Sentry] Error al establecer tag:', error);
    }
}

/**
 * Establece el nivel de severidad para el próximo evento
 */
export function setSeverity(level: SeverityLevel): void {
    if (!isInitialized) {
        console.warn('[Sentry] No inicializado, severidad no establecida');
        return;
    }

    try {
        Sentry.setContext('severity', { level });
    } catch (error) {
        console.error('[Sentry] Error al establecer severidad:', error);
    }
}

// ============================================================
// Performance Monitoring
// ============================================================

/**
 * Inicia un span para medir rendimiento
 */
type SpanAttributes = NonNullable<Parameters<typeof Sentry.startSpan>[0]['attributes']>;

export function startSpan<T>(
    name: string,
    operation: () => T,
    attributes?: Record<string, unknown>,
): T {
    if (!isInitialized || import.meta.env.DEV) {
        // En desarrollo, solo ejecutar la operación
        return operation();
    }

    try {
        return Sentry.startSpan({ name, attributes: attributes as SpanAttributes }, () =>
            operation(),
        );
    } catch (error) {
        console.error('[Sentry] Error en startSpan:', error);
        return operation();
    }
}

/**
 * Inicia un span de forma asíncrona
 */
export async function startSpanAsync<T>(
    name: string,
    operation: () => Promise<T>,
    attributes?: Record<string, unknown>,
): Promise<T> {
    if (!isInitialized || import.meta.env.DEV) {
        return await operation();
    }

    try {
        return await Sentry.startSpan({ name, attributes: attributes as SpanAttributes }, () =>
            operation(),
        );
    } catch (error) {
        console.error('[Sentry] Error en startSpanAsync:', error);
        return await operation();
    }
}

/**
 * Mide el tiempo de ejecución de una función
 */
export async function measurePerformance<T>(
    name: string,
    operation: () => Promise<T>,
    attributes?: Record<string, unknown>,
): Promise<T> {
    return startSpanAsync(name, operation, attributes);
}

// ============================================================
// Error Boundary Helpers
// ============================================================

/**
 * Captura un error desde un ErrorBoundary
 */
export function captureBoundaryError(
    error: Error,
    componentStack: string,
    componentName?: string,
): void {
    const context = {
        component: componentName ?? 'Unknown',
        componentStack,
    };

    captureException(error, context, 'error');

    addBreadcrumb({
        category: 'react',
        message: `Error en ${componentName ?? 'Unknown'}`,
        level: 'error',
        data: context,
    });
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Verifica si Sentry está inicializado
 */
export function isSentryEnabled(): boolean {
    return isInitialized && import.meta.env.PROD;
}

/**
 * Obtiene la instancia de Sentry (para uso avanzado)
 */
export function getSentryInstance(): typeof Sentry | null {
    return isInitialized ? Sentry : null;
}

// ============================================================
// Export
// ============================================================

export { Sentry };
export type { Sentry as SentryType };
export default Sentry;
