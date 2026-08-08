import type { Meta, StoryObj } from '@storybook/preact';
import { Chip } from './Chip';
import type { ChipVariant } from './Chip';

/** A representative leading icon used across stories. */
const HomeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
  </svg>
);

const meta: Meta<typeof Chip> = {
  title: 'Atoms/Chip',
  component: Chip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Compact inline label pill atom. Two variants (default, outline), ' +
          'optional leading icon (14×14), and optional dismiss button (18×18, ' +
          '`aria-label="Eliminar"`).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Chip label text',
    },
    variant: {
      control: 'select',
      options: ['default', 'outline'],
      description: 'Visual variant of the chip',
    },
    icon: {
      control: false,
      description: 'Optional leading icon node (rendered at 14×14)',
    },
    removable: {
      control: 'boolean',
      description: 'Shows a dismiss button and calls onClose when clicked',
    },
    onClose: {
      action: 'closed',
      description: 'Called when the close button is clicked',
    },
  },
  args: {
    label: 'Departamento',
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

/* ============================================================
   DEFAULT VARIANT
   ============================================================ */
export const Default: Story = {
  args: { variant: 'default', label: 'Publicado' },
};

export const DefaultWithIcon: Story = {
  args: { variant: 'default', label: 'Casa', icon: <HomeIcon /> },
};

export const DefaultRemovable: Story = {
  args: { variant: 'default', label: 'Filtro activo', removable: true },
};

export const DefaultWithIconRemovable: Story = {
  args: {
    variant: 'default',
    label: 'Casa',
    icon: <HomeIcon />,
    removable: true,
  },
};

/* ============================================================
   OUTLINE VARIANT
   ============================================================ */
export const Outline: Story = {
  args: { variant: 'outline', label: 'Pendiente' },
};

export const OutlineWithIcon: Story = {
  args: { variant: 'outline', label: 'Terreno', icon: <HomeIcon /> },
};

export const OutlineRemovable: Story = {
  args: { variant: 'outline', label: 'Tag', removable: true },
};

export const OutlineWithIconRemovable: Story = {
  args: {
    variant: 'outline',
    label: 'Terreno',
    icon: <HomeIcon />,
    removable: true,
  },
};

/* ============================================================
   COMBINATIONS
   ============================================================ */

/** All variants side by side, without icon or close. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {(['default', 'outline'] as ChipVariant[]).map((v) => (
        <Chip key={v} variant={v} label={v} />
      ))}
    </div>
  ),
};

/** All variants with a leading icon. */
export const AllVariantsWithIcon: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {(['default', 'outline'] as ChipVariant[]).map((v) => (
        <Chip key={v} variant={v} label={v} icon={<HomeIcon />} />
      ))}
    </div>
  ),
};

/** All variants with a dismiss button. */
export const AllVariantsRemovable: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {(['default', 'outline'] as ChipVariant[]).map((v) => (
        <Chip
          key={v}
          variant={v}
          label={v}
          removable
          onClose={() => {}}
        />
      ))}
    </div>
  ),
};

/** Full matrix: every variant × {plain, icon, removable, icon+removable}. */
export const FullMatrix: Story = {
  render: () => {
    const variants: ChipVariant[] = ['default', 'outline'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {variants.map((variant) => (
          <div
            key={variant}
            style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}
          >
            <strong
              style={{
                minWidth: '72px',
                textTransform: 'capitalize',
                fontFamily: 'var(--bh-font-sans)',
                color: 'var(--bh-text-secondary)',
              }}
            >
              {variant}:
            </strong>
            <Chip variant={variant} label="plain" />
            <Chip variant={variant} label="icon" icon={<HomeIcon />} />
            <Chip
              variant={variant}
              label="removable"
              removable
              onClose={() => {}}
            />
            <Chip
              variant={variant}
              label="both"
              icon={<HomeIcon />}
              removable
              onClose={() => {}}
            />
          </div>
        ))}
      </div>
    );
  },
};
