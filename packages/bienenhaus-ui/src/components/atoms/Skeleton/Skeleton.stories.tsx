import type { Meta, StoryObj } from '@storybook/preact';
import {
    Skeleton,
    type SkeletonSize,
    type SkeletonVariant,
} from './Skeleton';

const meta: Meta<typeof Skeleton> = {
    title: 'Atoms/Skeleton',
    component: Skeleton,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'Loading placeholder atom. Every important component (cards, ' +
                    'widgets, tables, forms, sidebars, dashboard) gets its own ' +
                    'Skeleton; never a Spinner as the primary loading experience ' +
                    '(spec §59/§71/§128/§296: Skeleton → Placeholder → Spinner). ' +
                    'Four variants (text, circular, rectangular, rounded) × three ' +
                    'sizes (sm–lg) × two animations (pulse, wave). Decorative by ' +
                    'default (`aria-hidden`); the loading container owns the live ' +
                    'region. Respects `prefers-reduced-motion`.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['text', 'circular', 'rectangular', 'rounded'],
            description: 'Shape: line, avatar, block, or card',
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Line height, avatar diameter, or block height',
        },
        animation: {
            control: 'select',
            options: ['pulse', 'wave', 'none'],
            description: 'Loading effect',
        },
        width: {
            control: 'text',
            description: 'Explicit width in px or CSS length',
        },
        height: {
            control: 'text',
            description: 'Explicit height in px or CSS length',
        },
    },
    args: {
        variant: 'text',
        size: 'md',
        animation: 'pulse',
    },
    // Dark surface so the raised placeholder tone is visible.
    decorators: [
        (Story) => (
            <div
                style={{
                    background: 'var(--bh-bg-primary)',
                    padding: 'var(--bh-space-6)',
                    borderRadius: 'var(--bh-radius-lg)',
                    minHeight: '120px',
                    width: '360px',
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
type Story = StoryObj<typeof Skeleton>;

/* ============================================================
   DEFAULT
   ============================================================ */
export const Default: Story = {};

/* ============================================================
   VARIANTS
   ============================================================ */
export const Text: Story = { args: { variant: 'text' } };
export const Circular: Story = { args: { variant: 'circular' } };
export const Rectangular: Story = { args: { variant: 'rectangular' } };
export const Rounded: Story = { args: { variant: 'rounded' } };

/** All variants side by side. */
export const AllVariants: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {(['text', 'circular', 'rectangular', 'rounded'] as SkeletonVariant[]).map((v) => (
                <Skeleton key={v} variant={v} />
            ))}
        </div>
    ),
};

/* ============================================================
   SIZES
   ============================================================ */
export const Small: Story = { args: { size: 'sm' } };
export const Medium: Story = { args: { size: 'md' } };
export const Large: Story = { args: { size: 'lg' } };

/** Text lines at every size. */
export const TextSizes: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            {(['sm', 'md', 'lg'] as SkeletonSize[]).map((s) => (
                <Skeleton key={s} size={s} />
            ))}
        </div>
    ),
};

/** Avatar circles at every size. */
export const AvatarSizes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {(['sm', 'md', 'lg'] as SkeletonSize[]).map((s) => (
                <Skeleton key={s} variant="circular" size={s} />
            ))}
        </div>
    ),
};

/* ============================================================
   ANIMATIONS
   ============================================================ */
export const Pulse: Story = { args: { animation: 'pulse' } };
export const Wave: Story = { args: { animation: 'wave' } };
export const None: Story = { args: { animation: 'none' } };

/* ============================================================
   COMPOSITIONS — real skeleton screens (§71)
   ============================================================ */
/** Card skeleton — title line, body lines, action button. */
export const CardSkeleton: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '280px' }}>
            <Skeleton width="60%" />
            <Skeleton width="100%" />
            <Skeleton width="90%" />
            <Skeleton width="40%" />
            <Skeleton variant="rounded" width={120} height={40} />
        </div>
    ),
};

/** Table row skeleton — avatar + three columns. */
export const TableRowSkeleton: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
            <Skeleton variant="circular" size="md" />
            <Skeleton width="30%" />
            <Skeleton width="20%" />
            <Skeleton width="25%" />
        </div>
    ),
};

/** Widget skeleton — KPI line + metric block. */
export const WidgetSkeleton: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '220px' }}>
            <Skeleton width="40%" size="sm" />
            <Skeleton height={32} />
            <Skeleton width="70%" size="sm" />
        </div>
    ),
};

/** Button skeleton — placeholder for action buttons (§71). */
export const ButtonSkeleton: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Skeleton variant="rounded" width={120} height={40} />
            <Skeleton variant="rounded" width={96} height={40} />
            <Skeleton variant="rounded" width={40} height={40} />
        </div>
    ),
};
