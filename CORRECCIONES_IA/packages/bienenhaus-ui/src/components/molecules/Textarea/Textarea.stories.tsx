import type { Meta, StoryObj } from '@storybook/preact';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Molecules/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-line text input with optional character counter, resize control, error state, and three sizes. Sibling of the Input/SearchInput molecules. Uses only --bh-* design tokens.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text (also used as aria-label fallback).',
    },
    rows: {
      control: 'number',
      description: 'Visible rows. Default 4.',
    },
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'both'],
      description: 'Resize behaviour. Default vertical.',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant. Default md.',
    },
    maxLength: {
      control: 'number',
      description: 'Max character count. Enables the native maxLength + counter logic.',
    },
    showCounter: {
      control: 'boolean',
      description: 'Show the {value.length}/{maxLength} counter. Requires maxLength.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the textarea.',
    },
    readOnly: {
      control: 'boolean',
      description: 'Read-only textarea.',
    },
    error: {
      control: 'boolean',
      description: 'Error state — sets aria-invalid and an error border.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: 'Describe la propiedad...',
  },
};

export const WithRows: Story = {
  args: {
    placeholder: 'Notas adicionales (8 filas)',
    rows: 8,
  },
};

export const WithCounter: Story = {
  args: {
    placeholder: 'Mensaje para el cliente (máx 200)',
    maxLength: 200,
    showCounter: true,
    defaultValue:
      'Hola, estoy interesado en la propiedad publicada en Palermo. ¿Podríamos coordinar una visita?',
  },
};

export const ErrorState: Story = {
  args: {
    placeholder: 'Campo requerido',
    error: true,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Campo deshabilitado',
    disabled: true,
    defaultValue: 'No editable',
  },
};

export const ReadOnly: Story = {
  args: {
    placeholder: 'Solo lectura',
    readOnly: true,
    defaultValue: 'Contenido bloqueado de edición.',
  },
};

export const CounterAtLimit: Story = {
  args: {
    placeholder: 'Máximo 20 caracteres',
    maxLength: 20,
    showCounter: true,
    defaultValue: '12345678901234567890',
  },
};

export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '360px',
      }}
    >
      <Textarea placeholder="Small" size="sm" />
      <Textarea placeholder="Medium" size="md" />
      <Textarea placeholder="Large" size="lg" />
    </div>
  ),
};

export const ResizeModes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '360px',
      }}
    >
      <Textarea placeholder="No resize" resize="none" />
      <Textarea placeholder="Vertical resize" resize="vertical" />
      <Textarea placeholder="Both resize" resize="both" />
    </div>
  ),
};
