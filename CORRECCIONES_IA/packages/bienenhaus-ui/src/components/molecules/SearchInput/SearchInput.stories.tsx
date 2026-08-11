import type { Meta, StoryObj } from '@storybook/preact';
import { SearchInput } from './SearchInput';

const meta: Meta<typeof SearchInput> = {
  title: 'Molecules/SearchInput',
  component: SearchInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Debounced search input with search icon, clear button, optional shortcut badge, and loading spinner. Uses only --bh-* design tokens.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text (also used as aria-label fallback).',
    },
    debounceMs: {
      control: 'number',
      description: 'Debounce delay in ms. Default 300.',
    },
    loading: {
      control: 'boolean',
      description: 'Shows a spinner and hides the clear button.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input and clear button.',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant. Default md.',
    },
    shortcut: {
      control: 'text',
      description: 'Shortcut hint badge (e.g. "/" or "Ctrl+K"). Hidden while focused.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

export const Default: Story = {
  args: {
    placeholder: 'Buscar propiedades...',
  },
};

export const WithShortcut: Story = {
  args: {
    placeholder: 'Buscar...',
    shortcut: '/',
  },
};

export const Loading: Story = {
  args: {
    placeholder: 'Buscar...',
    loading: true,
    value: 'palermo',
  },
};

export const WithValueAndClear: Story = {
  args: {
    placeholder: 'Buscar...',
    defaultValue: 'departamento',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Buscar...',
    disabled: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '320px' }}>
      <SearchInput placeholder="Small" size="sm" />
      <SearchInput placeholder="Medium" size="md" />
      <SearchInput placeholder="Large" size="lg" />
    </div>
  ),
};

export const WithShortcutCtrlK: Story = {
  args: {
    placeholder: 'Buscar propiedades...',
    shortcut: 'Ctrl+K',
  },
};
