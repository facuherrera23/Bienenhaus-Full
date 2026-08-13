import type { Meta, StoryObj } from '@storybook/preact';
import { IconButton, type IconButtonSize, type IconButtonVariant } from './IconButton';

/** A representative icon used across stories. */
const PlusIcon = () => (
    <svg
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const meta: Meta<typeof IconButton> = {
    title: 'Atoms/IconButton',
    component: IconButton,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'Square icon-only button atom. `aria-label` is required for accessibility. ' +
                    'Three variants (ghost, outline, solid) × three sizes (sm 32px, md 40px, lg 48px).',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['ghost', 'outline', 'solid'],
            description: 'Visual variant of the button',
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Square size in px (sm 32, md 40, lg 48)',
        },
        loading: {
            control: 'boolean',
            description: 'Shows a spinner and disables the button',
        },
        disabled: {
            control: 'boolean',
            description: 'Disables the button',
        },
        'aria-label': {
            control: 'text',
            description: 'Required accessible label (icon-only button)',
        },
        children: {
            control: false,
            description: 'The icon node (usually an SVG)',
        },
    },
    args: {
        'aria-label': 'Add',
        children: <PlusIcon />,
    },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Ghost: Story = {
    args: { variant: 'ghost', size: 'md' },
};

export const Outline: Story = {
    args: { variant: 'outline', size: 'md' },
};

export const Solid: Story = {
    args: { variant: 'solid', size: 'md' },
};

export const Small: Story = {
    args: { variant: 'ghost', size: 'sm' },
};

export const Medium: Story = {
    args: { variant: 'ghost', size: 'md' },
};

export const Large: Story = {
    args: { variant: 'ghost', size: 'lg' },
};

export const Loading: Story = {
    args: { loading: true },
};

export const Disabled: Story = {
    args: { disabled: true },
};

/** All variants in the default (md) size, side by side. */
export const AllVariants: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {(['ghost', 'outline', 'solid'] as IconButtonVariant[]).map((v) => (
                <IconButton key={v} variant={v} aria-label={v}>
                    <PlusIcon />
                </IconButton>
            ))}
        </div>
    ),
};

/** All sizes in the ghost variant, side by side. */
export const AllSizes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {(['sm', 'md', 'lg'] as IconButtonSize[]).map((s) => (
                <IconButton key={s} size={s} aria-label={`size ${s}`}>
                    <PlusIcon />
                </IconButton>
            ))}
        </div>
    ),
};

/** Full matrix: every variant × every size. */
export const AllVariantsAllSizes: Story = {
    render: () => {
        const variants: IconButtonVariant[] = ['ghost', 'outline', 'solid'];
        const sizes: IconButtonSize[] = ['sm', 'md', 'lg'];
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                }}
            >
                {variants.map((variant) => (
                    <div
                        key={variant}
                        style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                    >
                        <strong
                            style={{
                                minWidth: '72px',
                                textTransform: 'capitalize',
                                fontFamily: 'var(--bh-font-sans)',
                            }}
                        >
                            {variant}:
                        </strong>
                        {sizes.map((size) => (
                            <IconButton
                                key={size}
                                variant={variant}
                                size={size}
                                aria-label={`${variant} ${size}`}
                            >
                                <PlusIcon />
                            </IconButton>
                        ))}
                    </div>
                ))}
            </div>
        );
    },
};
