import '@testing-library/preact';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import type { ComponentChildren, ComponentType, JSX } from 'preact';

// Mock de @bienenhaus/ui
vi.mock('@bienenhaus/ui', () => ({
    Button: ({ children, ...props }: JSX.HTMLAttributes<HTMLButtonElement>) => (
        <button {...props}>{children}</button>
    ),
    Input: ({ ...props }: JSX.HTMLAttributes<HTMLInputElement>) => <input {...props} />,
    Select: ({ children, ...props }: JSX.HTMLAttributes<HTMLSelectElement>) => (
        <select {...props}>{children}</select>
    ),
    Card: ({ children, ...props }: JSX.HTMLAttributes<HTMLDivElement>) => (
        <div {...props}>{children}</div>
    ),
    Badge: ({ children, ...props }: JSX.HTMLAttributes<HTMLSpanElement>) => (
        <span {...props}>{children}</span>
    ),
    Modal: ({
        children,
        isOpen,
        onClose,
        ...props
    }: JSX.HTMLAttributes<HTMLDivElement> & { isOpen?: boolean; onClose?: () => void }) =>
        isOpen ? (
            <div {...props} role="dialog">
                {children}
                <button onClick={onClose}>Cerrar</button>
            </div>
        ) : null,
    Toast: ({ children, ...props }: JSX.HTMLAttributes<HTMLDivElement>) => (
        <div {...props}>{children}</div>
    ),
    ToastProvider: ({ children }: { children?: ComponentChildren }) => <>{children}</>,
    useToast: () => ({ push: vi.fn() }),
}));

// Mock de supabase
vi.mock('./src/lib/supabase', () => {
    const signInWithPassword = vi
        .fn()
        .mockResolvedValue({ data: { user: null, session: null }, error: null });
    const getSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
    const getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
    const signOut = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
    }));

    return {
        supabase: {
            from,
            auth: {
                getSession,
                getUser,
                signInWithPassword,
                signOut,
            },
            storage: {
                from: vi.fn(() => ({
                    upload: vi.fn().mockResolvedValue({ data: null, error: null }),
                    download: vi.fn().mockResolvedValue({ data: null, error: null }),
                    remove: vi.fn().mockResolvedValue({ data: null, error: null }),
                    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
                })),
            },
            rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        },
        supabaseUrl: 'http://localhost:54321',
        // Exponer mocks para que los tests puedan sobrescribirlos
        __mocks: {
            signInWithPassword,
            getSession,
            getUser,
            signOut,
            from,
        },
    };
});

// Mock de wouter-preact
vi.mock('wouter-preact', () => ({
    useLocation: () => ['/', vi.fn()],
    useRoutes: <T,>(routes: T) => routes,
    Link: ({ children, href, ...props }: JSX.HTMLAttributes<HTMLAnchorElement>) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    Switch: ({ children }: { children?: ComponentChildren }) => <>{children}</>,
    Route: ({
        component: Component,
        ...props
    }: { component: ComponentType } & Record<string, unknown>) => (
        <Component {...props} />
    ),
}));

// Mock de lucide-preact
vi.mock('lucide-preact', () => {
    const icons = [
        'Mail',
        'Lock',
        'Eye',
        'EyeOff',
        'Loader2',
        'AlertCircle',
        'CheckCircle2',
        'ChevronLeft',
        'ChevronRight',
        'Plus',
        'Search',
        'X',
        'Menu',
        'LogOut',
        'User',
        'Settings',
        'Home',
        'ShoppingBag',
        'MessageSquare',
        'Users',
        'Calendar',
        'FileText',
        'Trash2',
        'Edit2',
        'Save',
        'Download',
        'Upload',
        'RefreshCw',
        'ExternalLink',
        'Copy',
        'Link2',
        'Unplug',
        'Check',
        'CheckCheck',
        'Reply',
        'RotateCcw',
        'Volume2',
        'Smile',
        'Paperclip',
        'Image',
        'Send',
        'MoreHorizontal',
        'Home',
        'UserPlus',
        'CheckCircle2',
        'Copy',
        'ExternalLink',
        'Link2',
        'Loader2',
        'RefreshCw',
        'ShoppingBag',
        'Unplug',
    ];
    const mocked: Record<string, (props: JSX.SVGAttributes<SVGSVGElement>) => JSX.Element> = {};
    icons.forEach((name) => {
        mocked[name] = ({ ...props }: JSX.SVGAttributes<SVGSVGElement>) => (
            <svg {...props} data-testid={`icon-${name.toLowerCase()}`} />
        );
    });
    return mocked;
});

// Mock de @preact/signals
vi.mock('@preact/signals', () => ({
    signal: <T,>(initial: T) => {
        let value = initial;
        return {
            get value() {
                return value;
            },
            set value(v: T) {
                value = v;
            },
            subscribe: vi.fn(),
            peek: () => value,
        };
    },
    computed: <T,>(fn: () => T) => ({ value: fn(), subscribe: vi.fn() }),
    effect: vi.fn(),
}));

// Mock de @tanstack/query-core
vi.mock('@tanstack/query-core', () => ({
    QueryClient: vi.fn(() => ({
        getQueryData: vi.fn(),
        setQueryData: vi.fn(),
        invalidateQueries: vi.fn().mockResolvedValue(undefined),
        removeQueries: vi.fn(),
        clear: vi.fn(),
    })),
    QueryClientProvider: ({ children }: { children?: ComponentChildren }) => <>{children}</>,
    useQuery: vi.fn((opts: Record<string, unknown>) => ({
        data: undefined,
        isPending: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        ...opts,
    })),
    useMutation: vi.fn((opts: Record<string, unknown>) => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        ...opts,
    })),
}));

// Mock de store/app (toasts)
vi.mock('../store/app', () => ({
    pushToast: vi.fn(),
    useToastStore: () => ({ toasts: [], push: vi.fn(), remove: vi.fn() }),
}));

// Mock de crypto para UUIDs
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
        getRandomValues: <T extends ArrayBufferView,>(arr: T): T => {
            const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
            for (let i = 0; i < bytes.length; i++) {
                bytes[i] = Math.floor(Math.random() * 256);
            }
            return arr;
        },
    },
});

// Mock de navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: vi.fn().mockResolvedValue(undefined),
    },
});

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock de ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock de IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Suppress console.error in tests unless explicitly testing errors
const originalError = console.error;
beforeAll(() => {
    console.error = (...args: unknown[]) => {
        const first = typeof args[0] === 'string' ? args[0] : '';
        if (first.includes('Warning: ReactDOM.render is no longer supported')) return;
        if (first.includes('act(...)')) return;
        originalError.call(console, ...args);
    };
});
afterAll(() => {
    console.error = originalError;
});
