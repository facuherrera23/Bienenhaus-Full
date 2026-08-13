/**
 * Metric stories — Storybook CSF3 format.
 *
 * Stories are authored with a lightweight local meta shape so the file
 * type-checks without `@storybook/preact` installed. When Storybook is wired
 * into the workspace, replace `LocalMeta`/`LocalStory` with the canonical
 * `Meta`/`StoryObj` from `@storybook/preact` — the story bodies stay identical.
 */
import { Metric, type MetricSize } from './Metric';

interface LocalStoryArgs {
    label?: string;
    value?: string | number;
    delta?: { value: string; direction: 'up' | 'down' };
    loading?: boolean;
    size?: MetricSize;
    icon?: preact.ComponentChild;
}

interface LocalStory {
    args?: LocalStoryArgs;
    render?: (args: LocalStoryArgs) => preact.JSX.Element;
    decorators?: Array<(Story: () => preact.JSX.Element) => preact.JSX.Element>;
}

interface LocalMeta {
    title: string;
    component: typeof Metric;
    parameters?: Record<string, unknown>;
    tags?: string[];
    argTypes?: Record<string, { control?: string; description?: string; options?: string[] }>;
}

const HomeIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M3 9.5L12 3l9 6.5" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
    </svg>
);

const UsersIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const TrendingUpIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

const meta: LocalMeta = {
    title: 'Molecules/Metric',
    component: Metric,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'Compact inline KPI molecule. Surfaces a single metric (label + ' +
                    'value + optional delta) with NO card chrome — the parent decides ' +
                    'the container. The stripped-down sibling of StatCard. When ' +
                    '`loading` is true the value is replaced by the Spinner atom.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        label: { control: 'text', description: 'KPI label (uppercase, muted)' },
        value: { control: 'text', description: 'Prominent metric value' },
        loading: {
            control: 'boolean',
            description: 'Replaces value with a Spinner atom',
        },
        size: {
            control: 'select',
            options: ['sm', 'md'],
            description: 'Density (default md)',
        },
        delta: { control: false, description: 'Inline delta vs previous period' },
        icon: { control: false, description: 'Leading icon node' },
    },
    args: {
        label: 'Propiedades publicadas',
        value: 128,
        size: 'md',
        loading: false,
    },
    // Dark surface so the tokens render correctly.
    decorators: [
        (Story) => (
            <div
                style={{
                    background: 'var(--bh-bg-primary)',
                    padding: 'var(--bh-space-6)',
                    borderRadius: 'var(--bh-radius-lg)',
                    minHeight: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Story />
            </div>
        ),
    ],
};

export default meta;

/* ============================================================
   DEFAULT — label + value only (no chrome)
   ============================================================ */
export const Default: LocalStory = {
    args: {
        label: 'Propiedades publicadas',
        value: 128,
    },
    render: (args) => <Metric {...args} />,
};

/* ============================================================
   POSITIVE — green delta + up arrow
   ============================================================ */
export const Positive: LocalStory = {
    args: {
        label: 'Leads este mes',
        value: 342,
        delta: { value: '+12%', direction: 'up' },
    },
    render: (args) => <Metric {...args} />,
};

/* ============================================================
   NEGATIVE — red delta + down arrow
   ============================================================ */
export const Negative: LocalStory = {
    args: {
        label: 'Tasa de conversión',
        value: '3.2%',
        delta: { value: '-3%', direction: 'down' },
    },
    render: (args) => <Metric {...args} />,
};

/* ============================================================
   LOADING — value replaced by Spinner atom
   ============================================================ */
export const Loading: LocalStory = {
    args: {
        label: 'Propiedades publicadas',
        value: 128,
        loading: true,
    },
    render: (args) => <Metric {...args} />,
};

/* ============================================================
   WITH ICON — leading icon in a tinted rounded square
   ============================================================ */
export const WithIcon: LocalStory = {
    args: {
        label: 'Propiedades publicadas',
        value: 128,
        icon: <HomeIcon />,
        delta: { value: '+12%', direction: 'up' },
    },
    render: (args) => <Metric {...args} />,
};

/* ============================================================
   SMALL — denser variant
   ============================================================ */
export const Small: LocalStory = {
    args: {
        label: 'Leads',
        value: 42,
        size: 'sm',
        delta: { value: '+5%', direction: 'up' },
    },
    render: (args) => <Metric {...args} />,
};

/* ============================================================
   INLINE GRID — multiple metrics side by side (parent provides chrome)
   ============================================================ */
export const InlineGrid: LocalStory = {
    render: () => (
        <div
            style={{
                display: 'flex',
                gap: 'var(--bh-space-8)',
                alignItems: 'center',
                flexWrap: 'wrap',
            }}
        >
            <Metric label="Propiedades" value={128} icon={<HomeIcon />} />
            <Metric
                label="Leads"
                value={342}
                icon={<UsersIcon />}
                delta={{ value: '+12%', direction: 'up' }}
            />
            <Metric
                label="Conversión"
                value="3.2%"
                icon={<TrendingUpIcon />}
                delta={{ value: '-0.4%', direction: 'down' }}
            />
        </div>
    ),
};

/* ============================================================
   ALL SIZES — sm vs md comparison
   ============================================================ */
export const AllSizes: LocalStory = {
    render: () => (
        <div
            style={{
                display: 'flex',
                gap: 'var(--bh-space-6)',
                alignItems: 'center',
            }}
        >
            {(['sm', 'md'] as MetricSize[]).map((s) => (
                <Metric
                    key={s}
                    label={`Size ${s}`}
                    value={s === 'sm' ? 42 : 128}
                    icon={<HomeIcon />}
                    delta={{ value: '+5%', direction: 'up' }}
                    size={s}
                />
            ))}
        </div>
    ),
};
