import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'preact/compat';

// Create mock functions that can be controlled by tests
export const signInWithPassword = vi
    .fn()
    .mockResolvedValue({ data: { user: null, session: null }, error: null });
export const getSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
export const getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
export const signOut = vi.fn().mockResolvedValue({ error: null });
export const onAuthStateChange = vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
}));
export const from = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    returns: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
}));

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from,
        auth: {
            getUser,
            getSession,
            onAuthStateChange,
            signInWithPassword,
            signOut,
        },
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
                remove: vi.fn().mockResolvedValue({ error: null }),
                getPublicUrl: vi.fn(() => ({
                    data: { publicUrl: 'https://example.com/test.jpg' },
                })),
                list: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
        },
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
            unsubscribe: vi.fn(),
        })),
        removeChannel: vi.fn(),
    })),
}));

vi.mock('wouter-preact', () => ({
    useLocation: () => ['/', vi.fn()],
    useRoute: () => [null, {}],
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
    Switch: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Route: ({
        component: Component,
        ...props
    }: {
        component: React.ComponentType<any>;
        [key: string]: any;
    }) => <Component {...props} />,
}));

vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useQuery: vi.fn(() => ({
            data: undefined,
            isLoading: false,
            isError: false,
            isSuccess: false,
            error: null,
            refetch: vi.fn(),
        })),
        useMutation: vi.fn(() => ({
            mutate: vi.fn(),
            mutateAsync: vi.fn(),
            isLoading: false,
            isError: false,
            isSuccess: false,
            error: null,
        })),
        useQueryClient: vi.fn(() => ({
            invalidateQueries: vi.fn(),
            setQueryData: vi.fn(),
            getQueryData: vi.fn(),
        })),
    };
});

vi.mock('@preact/signals', () => {
    const makeSignal = (initial: unknown) => {
        let value = initial;
        return {
            get value() {
                return value;
            },
            set value(v: unknown) {
                value = v;
            },
        };
    };
    return {
        signal: makeSignal,
        computed: (fn: () => unknown) => makeSignal(fn()),
        effect: vi.fn(),
    };
});

vi.mock('lucide-preact', () => {
    const icons = [
        'Activity',
        'AlertCircle',
        'ArrowLeft',
        'ArrowUpRight',
        'BarChart2',
        'Building2',
        'Calendar',
        'Check',
        'CheckCircle',
        'ChevronDown',
        'Clock',
        'DollarSign',
        'Download',
        'Edit',
        'FileText',
        'Filter',
        'Globe',
        'Home',
        'LayoutDashboard',
        'Loader2',
        'Mail',
        'MapPin',
        'MessageSquare',
        'MoreVertical',
        'Phone',
        'Plus',
        'RotateCcw',
        'Save',
        'Search',
        'Send',
        'Settings',
        'Shield',
        'ShoppingBag',
        'Target',
        'TrendingDown',
        'TrendingUp',
        'Trash2',
        'User',
        'UserCheck',
        'UserPlus',
        'UserRound',
        'Users',
        'X',
        'XCircle',
        // FASE 3 (Shell/Sidebar/Topbar)
        'Menu',
        'LogOut',
        'Bell',
        'BellRing',
        'ChevronRight',
        'ChevronUp',
        'ChevronLeft',
        'ClipboardList',
        'HelpCircle',
        'Bookmark',
        'KeyRound',
        'UserCog',
        'Command',
        'Sparkles',
        'Wrench',
        'AlertTriangle',
        'CheckCircle2',
        'Info',
        'ExternalLink',
        'RefreshCw',
        'Inbox',
        'Archive',
        'Clock',
        'ListChecks',
        'LogIn',
        'Database',
        'Layers',
        'Package',
        'BarChart3',
        'PieChart',
        'LineChart',
        'Table2',
        'Eye',
        'EyeOff',
        'MoreHorizontal',
        'Copy',
        'Upload',
        'CalendarDays',
        'PanelLeft',
        'PanelLeftClose',
        'PanelLeftOpen',
        'MessageCircle',
        'PhoneCall',
        'Star',
        'ShieldCheck',
        'FilePlus',
        'FileEdit',
        'FolderOpen',
        'LayoutGrid',
        'SlidersHorizontal',
        'Settings2',
        'SearchX',
        'CircleHelp',
        'UserX',
        'Wallet',
        'Tag',
        'Store',
        'Webhook',
        'GitBranch',
        'Link2',
        'CreditCard',
        'Truck',
        'House',
        'DoorOpen',
        'BadgeCheck',
        'CircleAlert',
        // FASE 3 nav (Sidebar) + tema (Avatar dropdown) + notificaciones
        'Building2',
        'Calendar',
        'Sun',
        'Moon',
        'Monitor',
        'CheckCheck',
        'Calculator',
        // owners: MARKET_TREND_ICON (owners.ts)
        'Minus',
    ];
    const mockIcons: Record<string, unknown> = {};
    icons.forEach((name) => {
        mockIcons[name] = (props: Record<string, unknown>) => {
            const safeProps = props ?? {};
            return React.createElement('svg', { 'data-testid': `icon-${name}`, ...safeProps });
        };
    });
    return mockIcons;
});

global.React = React;

declare global {
    var React: typeof import('preact/compat');
}

global.React = React;
