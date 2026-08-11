import type { Meta, StoryObj } from '@storybook/preact';
import { Badge } from './Badge';
import type { BadgeSize, BadgeVariant } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Inline status pill atom. Six variants (success, danger, warning, info, neutral, primary) ' +
          '× two sizes (sm, md). Optional leading dot inherits the variant text color.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'danger', 'warning', 'info', 'neutral', 'primary'],
      description: 'Visual variant of the badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Size scale (sm compact, md default)',
    },
    dot: {
      control: 'boolean',
      description: 'Shows a small colored dot before the text',
    },
    children: {
      control: 'text',
      description: 'Badge label',
    },
  },
  args: {
    children: 'Publicado',
    variant: 'primary',
    size: 'md',
    dot: false,
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

/* ============================================================
   SINGLE VARIANTS (md, no dot)
   ============================================================ */
export const Success: Story = {
  args: { variant: 'success', children: 'Activo' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: 'Eliminado' },
};

export const Warning: Story = {
  args: { variant: 'warning', children: 'Pendiente' },
};

export const Info: Story = {
  args: { variant: 'info', children: 'Info' },
};

export const Neutral: Story = {
  args: { variant: 'neutral', children: 'Borrador' },
};

export const Primary: Story = {
  args: { variant: 'primary', children: 'Destacado' },
};

/* ============================================================
   SIZES
   ============================================================ */
export const Small: Story = {
  args: { size: 'sm', children: 'Compacto' },
};

export const Medium: Story = {
  args: { size: 'md', children: 'Estándar' },
};

/* ============================================================
   DOT
   ============================================================ */
export const WithDot: Story = {
  args: { variant: 'success', dot: true, children: 'En vivo' },
};

export const WithoutDot: Story = {
  args: { variant: 'success', dot: false, children: 'En vivo' },
};

/* ============================================================
   COMBINATIONS
   ============================================================ */
/** All variants in the default (md) size, side by side. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      {(
        ['success', 'danger', 'warning', 'info', 'neutral', 'primary'] as BadgeVariant[]
      ).map((v) => (
        <Badge key={v} variant={v}>
          {v}
        </Badge>
      ))}
    </div>
  ),
};

/** All sizes in the primary variant, side by side. */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {(['sm', 'md'] as BadgeSize[]).map((s) => (
        <Badge key={s} size={s}>
          {s}
        </Badge>
      ))}
    </div>
  ),
};

/** All variants with a leading dot. */
export const AllVariantsWithDot: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      {(
        ['success', 'danger', 'warning', 'info', 'neutral', 'primary'] as BadgeVariant[]
      ).map((v) => (
        <Badge key={v} variant={v} dot>
          {v}
        </Badge>
      ))}
    </div>
  ),
};

/** Full matrix: every variant × every size, without dot. */
export const AllVariantsAllSizes: Story = {
  render: () => {
    const variants: BadgeVariant[] = [
      'success',
      'danger',
      'warning',
      'info',
      'neutral',
      'primary',
    ];
    const sizes: BadgeSize[] = ['sm', 'md'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {variants.map((variant) => (
          <div
            key={variant}
            style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
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
            {sizes.map((size) => (
              <Badge key={size} variant={variant} size={size}>
                {variant}
              </Badge>
            ))}
          </div>
        ))}
      </div>
    );
  },
};

/** Full matrix with dots: every variant × every size, with dot. */
export const AllVariantsAllSizesWithDot: Story = {
  render: () => {
    const variants: BadgeVariant[] = [
      'success',
      'danger',
      'warning',
      'info',
      'neutral',
      'primary',
    ];
    const sizes: BadgeSize[] = ['sm', 'md'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {variants.map((variant) => (
          <div
            key={variant}
            style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
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
            {sizes.map((size) => (
              <Badge key={size} variant={variant} size={size} dot>
                {variant}
              </Badge>
            ))}
          </div>
        ))}
      </div>
    );
  },
};
