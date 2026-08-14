import { vi } from 'vitest';
import { cleanup } from '@testing-library/preact';
import type { ComponentChildren, ComponentType, JSX } from 'preact';

vi.stubEnv('VITE_SUPABASE_URL', 'dummy');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'dummy');

// Do NOT mock preact — mocking useState/useEffect/useMemo neutralizes all hooks,
// breaking component tests that rely on state/effects. testing-library/preact
// works with real preact. Only mock wouter (router) and lucide-preact (icons).

vi.mock('wouter', () => ({
    useLocation: () => ['/', vi.fn()],
    useRoute: () => [null, {}],
    Link: ({ children, href, ...props }: JSX.HTMLAttributes<HTMLAnchorElement>) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    Switch: ({ children }: { children?: ComponentChildren }) => <>{children}</>,
    Route: ({
        component: Component,
        ...props
    }: { component: ComponentType } & Record<string, unknown>) => <Component {...props} />,
}));

vi.mock('lucide-preact', () => ({
    // Export all lucide icons as simple components
    ...Object.fromEntries(
        [
            'Search',
            'Plus',
            'X',
            'Trash2',
            'Edit',
            'Eye',
            'Download',
            'Upload',
            'ChevronLeft',
            'ChevronRight',
            'ChevronDown',
            'Calendar',
            'Users',
            'MessageSquare',
            'Building2',
            'LayoutDashboard',
            'Mail',
            'ShoppingBag',
            'Globe',
            'Settings',
            'Shield',
            'UserRound',
            'UserCheck',
            'ClipboardList',
            'FileText',
            'Calculator',
            'Home',
            'MapPin',
            'Star',
            'Loader2',
            'CheckCircle',
            'Clock',
            'DollarSign',
            'File',
            'FileText',
            'Image',
            'Key',
            'TrendingUp',
            'Minus',
            'TrendingDown',
            'MoreHorizontal',
            'ArrowRight',
            'Filter',
            'Download',
            'Kanban',
            'List',
            'AlertTriangle',
            'UserPlus',
            'Copy',
            'Move',
            'QrCode',
            'WhatsAppIcon',
            'FacebookIcon',
            'InstagramIcon',
            'LinkedinIcon',
        ].map((name) => [
            name,
            ({ children, ...props }: JSX.SVGAttributes<SVGSVGElement>) => (
                <svg {...props} data-testid={name.toLowerCase()}>
                    {children}
                </svg>
            ),
        ]),
    ),
}));

// Re-exported so tests can do `(from as Mock).mockReturnValue(chain)` to
// control what supabase.from('table') returns. The createClient mock below
// references THIS from, keeping both in sync.
export const from = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    returns: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

export const getSession = vi.fn().mockResolvedValue({ data: { session: null }, error: null });
export const signInWithPassword = vi
    .fn()
    .mockResolvedValue({ data: { user: null, session: null }, error: null });

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from,
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        auth: {
            getSession,
            signInWithPassword,
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
            admin: {
                generateLink: vi.fn().mockResolvedValue({
                    data: { properties: { action_link: 'https://test.com' } },
                    error: null,
                }),
            },
        },
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ data: { path: 'test' }, error: null }),
                download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
                remove: vi.fn().mockResolvedValue({ error: null }),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test.com/img.jpg' } })),
                createSignedUrl: vi
                    .fn()
                    .mockResolvedValue({ data: { signedUrl: 'https://test.com/signed' } }),
            })),
        },
    })),
}));

afterEach(() => {
    cleanup();
});
