import type { Meta, StoryObj } from '@storybook/preact';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
    title: 'Molecules/Input',
    component: Input,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'Generic text-field molecule supporting text, email, password, phone, money, number and url types. Uses only --bh-* design tokens.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['text', 'email', 'password', 'phone', 'money', 'number', 'url'],
            description: 'Field type. `money` renders a text input with inputMode="decimal".',
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
            description: 'Size variant',
        },
        error: {
            control: 'boolean',
            description: 'Error state — adds aria-invalid + danger border',
        },
        disabled: {
            control: 'boolean',
            description: 'Disables the input',
        },
        readOnly: {
            control: 'boolean',
            description: 'Makes the input read-only',
        },
        prefix: {
            control: 'text',
            description: 'Visual prefix for money type (e.g. "$")',
        },
        icon: {
            control: false,
            description: 'Leading inline SVG / icon node',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Input>;

const Wrapper = (Story: () => preact.JSX.Element) => (
    <div style={{ width: '320px' }}>
        <Story />
    </div>
);

export const Text: Story = {
    args: {
        type: 'text',
        placeholder: 'Enter your name',
    },
    decorators: [(Story) => <Wrapper>{Story}</Wrapper>],
};

export const Email: Story = {
    args: {
        type: 'email',
        placeholder: 'you@example.com',
    },
    decorators: [(Story) => <Wrapper>{Story}</Wrapper>],
};

export const Password: Story = {
    args: {
        type: 'password',
        placeholder: '••••••••',
    },
    decorators: [(Story) => <Wrapper>{Story}</Wrapper>],
};

export const Number: Story = {
    args: {
        type: 'number',
        placeholder: '0',
    },
    decorators: [(Story) => <Wrapper>{Story}</Wrapper>],
};

export const Money: Story = {
    args: {
        type: 'money',
        prefix: '$',
        placeholder: '0.00',
    },
    decorators: [(Story) => <Wrapper>{Story}</Wrapper>],
};

export const WithIcon: Story = {
    args: {
        type: 'text',
        placeholder: 'Search...',
        icon: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
        ),
    },
    decorators: [(Story) => <Wrapper>{Story}</Wrapper>],
};

export const ErrorState: Story = {
    args: {
        type: 'email',
        placeholder: 'you@example.com',
        error: true,
        defaultValue: 'invalid-email',
    },
    decorators: [(Story) => <Wrapper>{Story}</Wrapper>],
};

export const Sizes: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '320px' }}>
            <Input size="sm" placeholder="Small" />
            <Input size="md" placeholder="Medium" />
            <Input size="lg" placeholder="Large" />
        </div>
    ),
};

export const Disabled: Story = {
    args: {
        type: 'text',
        placeholder: 'Disabled field',
        disabled: true,
        defaultValue: 'Cannot edit',
    },
    decorators: [(Story) => <Wrapper>{Story}</Wrapper>],
};
