import type { Meta, StoryObj } from '@storybook/preact';
import { Spinner } from './Spinner';
import type { SpinnerSize, SpinnerColor } from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Atoms/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Loading indicator atom. Four sizes (sm–xl) × three color ' +
          'sources (primary, white, inherit) with an SVG ring on a static ' +
          'track. Block (`flex`) by default; `inline` switches to ' +
          '`inline-flex`. Respects `prefers-reduced-motion`.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Diameter scale',
    },
    color: {
      control: 'select',
      options: ['primary', 'white', 'inherit'],
      description: 'Stroke color source for the arc',
    },
    inline: {
      control: 'boolean',
      description: 'display: inline-flex vs flex',
    },
    thickness: {
      control: 'number',
      description: 'Stroke width in px (overrides size default)',
    },
  },
  args: {
    size: 'md',
    color: 'primary',
    inline: false,
  },
  // Dark surface so the white/primary variants are visible.
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
type Story = StoryObj<typeof Spinner>;

/* ============================================================
   DEFAULT
   ============================================================ */
export const Default: Story = {};

/* ============================================================
   SIZES
   ============================================================ */
export const Small: Story = { args: { size: 'sm' } };
export const Medium: Story = { args: { size: 'md' } };
export const Large: Story = { args: { size: 'lg' } };
export const ExtraLarge: Story = { args: { size: 'xl' } };

/** All sizes side by side. */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      {(['sm', 'md', 'lg', 'xl'] as SpinnerSize[]).map((s) => (
        <Spinner key={s} size={s} aria-label={`Cargando (${s})`} />
      ))}
    </div>
  ),
};

/* ============================================================
   COLORS
   ============================================================ */
export const Primary: Story = { args: { color: 'primary' } };
export const White: Story = { args: { color: 'white' } };
export const Inherit: Story = {
  args: { color: 'inherit' },
  render: (args) => (
    <span
      style={{
        color: 'var(--bh-accent)',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <Spinner {...args} />
    </span>
  ),
};

/** All colors side by side. */
export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Spinner color="primary" size="lg" />
      <Spinner color="white" size="lg" />
      <span
        style={{
          color: 'var(--bh-accent)',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <Spinner color="inherit" size="lg" />
      </span>
    </div>
  ),
};

/* ============================================================
   DISPLAY — inline vs block
   ============================================================ */
export const Block: Story = {
  args: { inline: false },
  render: () => (
    <div>
      <p style={{ color: 'var(--bh-text-secondary)', marginBottom: '8px' }}>
        Block spinner (flex):
      </p>
      <Spinner />
    </div>
  ),
};

export const Inline: Story = {
  args: { inline: true },
  render: () => (
    <p style={{ color: 'var(--bh-text-primary)', lineHeight: 1.8 }}>
      Loading your content
      <Spinner inline size="sm" style={{ marginLeft: '8px' }} />
    </p>
  ),
};

/* ============================================================
   THICKNESS
   ============================================================ */
export const CustomThickness: Story = {
  args: { size: 'xl', thickness: 6 },
};

/** Same size, varying thickness. */
export const ThicknessScale: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      {[1, 2, 3, 5, 8].map((t) => (
        <Spinner key={t} size="lg" thickness={t} aria-label={`thickness ${t}`} />
      ))}
    </div>
  ),
};

/* ============================================================
   COMBINATIONS
   ============================================================ */
/** All sizes × all colors matrix. */
export const AllSizesAllColors: Story = {
  render: () => {
    const sizes: SpinnerSize[] = ['sm', 'md', 'lg', 'xl'];
    const colors: SpinnerColor[] = ['primary', 'white', 'inherit'];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {colors.map((color) => (
          <div
            key={color}
            style={{ display: 'flex', gap: '16px', alignItems: 'center' }}
          >
            <strong
              style={{
                minWidth: '72px',
                textTransform: 'capitalize',
                fontFamily: 'var(--bh-font-sans)',
                color: 'var(--bh-text-secondary)',
              }}
            >
              {color}:
            </strong>
            {sizes.map((size) => (
              <span
                key={size}
                style={
                  color === 'inherit'
                    ? { color: 'var(--bh-accent)', display: 'inline-flex' }
                    : undefined
                }
              >
                <Spinner size={size} color={color} aria-label={`${size} ${color}`} />
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  },
};

/** Inline spinners embedded in text at every size. */
export const InlineInText: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {(['sm', 'md', 'lg', 'xl'] as SpinnerSize[]).map((s) => (
        <p
          key={s}
          style={{ color: 'var(--bh-text-primary)', lineHeight: 1.8 }}
        >
          Fetching data
          <Spinner inline size={s} style={{ marginLeft: '8px' }} />
        </p>
      ))}
    </div>
  ),
};
