import type { Meta, StoryObj } from '@storybook/preact';
import { Avatar, type AvatarShape, type AvatarSize, type AvatarStatus } from './Avatar';

const meta: Meta<typeof Avatar> = {
    title: 'Atoms/Avatar',
    component: Avatar,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'User identity atom. Five sizes (xs–xl) × two shapes (circle, square) ' +
                    'with optional image, fallback initials, and a presence status dot ' +
                    '(online, offline, busy, away) at the bottom-right corner.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        src: {
            control: 'text',
            description: 'Image source URL',
        },
        alt: {
            control: 'text',
            description: 'Alt text for the image / fallback aria-label',
        },
        fallback: {
            control: 'text',
            description: 'Initials or short text shown when there is no image',
        },
        size: {
            control: 'select',
            options: ['xs', 'sm', 'md', 'lg', 'xl'],
            description: 'Diameter scale',
        },
        shape: {
            control: 'select',
            options: ['circle', 'square'],
            description: 'Corner shape',
        },
        status: {
            control: 'select',
            options: ['online', 'offline', 'busy', 'away'],
            description: 'Presence indicator dot (omit to hide)',
        },
    },
    args: {
        fallback: 'AB',
        size: 'md',
        shape: 'circle',
    },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

/* ============================================================
   FALLBACK (no image)
   ============================================================ */
export const Fallback: Story = {
    args: { fallback: 'AB', alt: 'Alice Brown' },
};

/* ============================================================
   WITH IMAGE
   ============================================================ */
export const WithImage: Story = {
    args: {
        src: 'https://i.pravatar.cc/120?img=12',
        alt: 'Alice Brown',
        fallback: 'AB',
    },
};

/* ============================================================
   SIZES
   ============================================================ */
export const ExtraSmall: Story = { args: { size: 'xs', fallback: 'XS' } };
export const Small: Story = { args: { size: 'sm', fallback: 'SM' } };
export const Medium: Story = { args: { size: 'md', fallback: 'MD' } };
export const Large: Story = { args: { size: 'lg', fallback: 'LG' } };
export const ExtraLarge: Story = { args: { size: 'xl', fallback: 'XL' } };

/** All sizes side by side (circle, fallback). */
export const AllSizes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {(['xs', 'sm', 'md', 'lg', 'xl'] as AvatarSize[]).map((s) => (
                <Avatar key={s} size={s} fallback={s.toUpperCase()} alt={s} />
            ))}
        </div>
    ),
};

/* ============================================================
   SHAPES
   ============================================================ */
export const Circle: Story = {
    args: { shape: 'circle', fallback: 'CI' },
};

export const Square: Story = {
    args: { shape: 'square', fallback: 'SQ' },
};

/** Both shapes side by side. */
export const AllShapes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {(['circle', 'square'] as AvatarShape[]).map((sh) => (
                <Avatar key={sh} shape={sh} size="lg" fallback={sh} alt={sh} />
            ))}
        </div>
    ),
};

/* ============================================================
   STATUS
   ============================================================ */
export const Online: Story = {
    args: { status: 'online', fallback: 'ON' },
};

export const Offline: Story = {
    args: { status: 'offline', fallback: 'OF' },
};

export const Busy: Story = {
    args: { status: 'busy', fallback: 'BS' },
};

export const Away: Story = {
    args: { status: 'away', fallback: 'AW' },
};

/** All statuses side by side. */
export const AllStatuses: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {(['online', 'offline', 'busy', 'away'] as AvatarStatus[]).map((st) => (
                <Avatar key={st} status={st} size="lg" fallback={st.slice(0, 2)} alt={st} />
            ))}
        </div>
    ),
};

/* ============================================================
   COMBINATIONS
   ============================================================ */
/** All sizes × both shapes, with fallback. */
export const AllSizesAllShapes: Story = {
    render: () => {
        const sizes: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
        const shapes: AvatarShape[] = ['circle', 'square'];
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {shapes.map((shape) => (
                    <div key={shape} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <strong
                            style={{
                                minWidth: '64px',
                                textTransform: 'capitalize',
                                fontFamily: 'var(--bh-font-sans)',
                                color: 'var(--bh-text-secondary)',
                            }}
                        >
                            {shape}:
                        </strong>
                        {sizes.map((size) => (
                            <Avatar
                                key={size}
                                size={size}
                                shape={shape}
                                fallback={size.toUpperCase()}
                                alt={size}
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    },
};

/** All sizes with images and online status. */
export const AllSizesWithImage: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {(['xs', 'sm', 'md', 'lg', 'xl'] as AvatarSize[]).map((s, i) => (
                <Avatar
                    key={s}
                    size={s}
                    src={`https://i.pravatar.cc/120?img=${i + 5}`}
                    alt={`User ${s}`}
                    fallback={s.toUpperCase()}
                    status="online"
                />
            ))}
        </div>
    ),
};

/** Full matrix: every size × every status (circle, fallback). */
export const AllSizesAllStatuses: Story = {
    render: () => {
        const sizes: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
        const statuses: AvatarStatus[] = ['online', 'offline', 'busy', 'away'];
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {statuses.map((status) => (
                    <div
                        key={status}
                        style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                    >
                        <strong
                            style={{
                                minWidth: '64px',
                                textTransform: 'capitalize',
                                fontFamily: 'var(--bh-font-sans)',
                                color: 'var(--bh-text-secondary)',
                            }}
                        >
                            {status}:
                        </strong>
                        {sizes.map((size) => (
                            <Avatar
                                key={size}
                                size={size}
                                status={status}
                                fallback={size.toUpperCase()}
                                alt={size}
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    },
};
