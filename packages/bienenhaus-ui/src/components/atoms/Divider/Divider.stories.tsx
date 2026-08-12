import type { Meta, StoryObj } from '@storybook/preact';
import { Divider ,type 
  DividerOrientation,type 
  DividerThickness,type 
  DividerVariant,
} from './Divider';

const meta: Meta<typeof Divider> = {
  title: 'Atoms/Divider',
  component: Divider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Structural separator atom. Two orientations (horizontal, vertical), ' +
          'three thicknesses (thin 1px, medium 2px, thick 3px), three border ' +
          'styles (solid, dashed, dotted), and an optional centered text label ' +
          'that breaks the line in two segments.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Layout orientation of the divider',
    },
    thickness: {
      control: 'select',
      options: ['thin', 'medium', 'thick'],
      description: 'Line thickness (thin 1px, medium 2px, thick 3px)',
    },
    variant: {
      control: 'select',
      options: ['solid', 'dashed', 'dotted'],
      description: 'Border style of the line',
    },
    label: {
      control: 'text',
      description: 'Optional centered text label that breaks the line',
    },
  },
  args: {
    orientation: 'horizontal',
    thickness: 'thin',
    variant: 'solid',
  },
};

export default meta;
type Story = StoryObj<typeof Divider>;

/* ============================================================
   ORIENTATIONS
   ============================================================ */
export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  render: (args) => (
    <div style={{ padding: '24px 0' }}>
      <Divider {...args} />
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: 'vertical', thickness: 'medium' },
  render: (args) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--bh-space-4)',
        height: '120px',
      }}
    >
      <span style={{ color: 'var(--bh-text-secondary)' }}>Izquierda</span>
      <Divider {...args} />
      <span style={{ color: 'var(--bh-text-secondary)' }}>Derecha</span>
    </div>
  ),
};

/* ============================================================
   THICKNESSES (horizontal)
   ============================================================ */
export const Thin: Story = {
  args: { thickness: 'thin' },
  render: (args) => (
    <div style={{ padding: '16px 0' }}>
      <Divider {...args} />
    </div>
  ),
};

export const Medium: Story = {
  args: { thickness: 'medium' },
  render: (args) => (
    <div style={{ padding: '16px 0' }}>
      <Divider {...args} />
    </div>
  ),
};

export const Thick: Story = {
  args: { thickness: 'thick' },
  render: (args) => (
    <div style={{ padding: '16px 0' }}>
      <Divider {...args} />
    </div>
  ),
};

/* ============================================================
   VARIANTS (horizontal, medium)
   ============================================================ */
export const Solid: Story = {
  args: { variant: 'solid', thickness: 'medium' },
  render: (args) => (
    <div style={{ padding: '16px 0' }}>
      <Divider {...args} />
    </div>
  ),
};

export const Dashed: Story = {
  args: { variant: 'dashed', thickness: 'medium' },
  render: (args) => (
    <div style={{ padding: '16px 0' }}>
      <Divider {...args} />
    </div>
  ),
};

export const Dotted: Story = {
  args: { variant: 'dotted', thickness: 'medium' },
  render: (args) => (
    <div style={{ padding: '16px 0' }}>
      <Divider {...args} />
    </div>
  ),
};

/* ============================================================
   LABEL
   ============================================================ */
export const WithLabel: Story = {
  args: { label: 'Sección' },
  render: (args) => (
    <div style={{ padding: '24px 0' }}>
      <Divider {...args} />
    </div>
  ),
};

export const WithoutLabel: Story = {
  args: {},
  render: (args) => (
    <div style={{ padding: '24px 0' }}>
      <Divider {...args} />
    </div>
  ),
};

export const LabelWithVariant: Story = {
  args: { label: 'Continuar', variant: 'dashed', thickness: 'medium' },
  render: (args) => (
    <div style={{ padding: '24px 0' }}>
      <Divider {...args} />
    </div>
  ),
};

/* ============================================================
   COMBINATIONS
   ============================================================ */

/** All thicknesses stacked, horizontal solid. */
export const AllThicknesses: Story = {
  render: () => {
    const thicknesses: DividerThickness[] = ['thin', 'medium', 'thick'];
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--bh-space-6)',
          padding: '24px 0',
        }}
      >
        {thicknesses.map((t) => (
          <div key={t}>
            <strong
              style={{
                display: 'block',
                marginBottom: 'var(--bh-space-2)',
                textTransform: 'capitalize',
                fontFamily: 'var(--bh-font-sans)',
                color: 'var(--bh-text-secondary)',
                fontSize: 'var(--bh-text-sm)',
              }}
            >
              {t}
            </strong>
            <Divider thickness={t} />
          </div>
        ))}
      </div>
    );
  },
};

/** All variants stacked, horizontal medium. */
export const AllVariants: Story = {
  render: () => {
    const variants: DividerVariant[] = ['solid', 'dashed', 'dotted'];
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--bh-space-6)',
          padding: '24px 0',
        }}
      >
        {variants.map((v) => (
          <div key={v}>
            <strong
              style={{
                display: 'block',
                marginBottom: 'var(--bh-space-2)',
                textTransform: 'capitalize',
                fontFamily: 'var(--bh-font-sans)',
                color: 'var(--bh-text-secondary)',
                fontSize: 'var(--bh-text-sm)',
              }}
            >
              {v}
            </strong>
            <Divider variant={v} thickness="medium" />
          </div>
        ))}
      </div>
    );
  },
};

/** All orientations shown in context. */
export const AllOrientations: Story = {
  render: () => (
    <div style={{ padding: '24px 0' }}>
      <strong
        style={{
          display: 'block',
          marginBottom: 'var(--bh-space-2)',
          fontFamily: 'var(--bh-font-sans)',
          color: 'var(--bh-text-secondary)',
          fontSize: 'var(--bh-text-sm)',
        }}
      >
        horizontal
      </strong>
      <Divider orientation="horizontal" thickness="medium" />
      <div style={{ height: 'var(--bh-space-8)' }} />
      <strong
        style={{
          display: 'block',
          marginBottom: 'var(--bh-space-2)',
          fontFamily: 'var(--bh-font-sans)',
          color: 'var(--bh-text-secondary)',
          fontSize: 'var(--bh-text-sm)',
        }}
      >
        vertical
      </strong>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--bh-space-4)',
          height: '120px',
        }}
      >
        <span style={{ color: 'var(--bh-text-secondary)' }}>A</span>
        <Divider orientation="vertical" thickness="medium" />
        <span style={{ color: 'var(--bh-text-secondary)' }}>B</span>
      </div>
    </div>
  ),
};

/** Full matrix: every orientation × every thickness × every variant. */
export const FullMatrix: Story = {
  render: () => {
    const orientations: DividerOrientation[] = ['horizontal', 'vertical'];
    const thicknesses: DividerThickness[] = ['thin', 'medium', 'thick'];
    const variants: DividerVariant[] = ['solid', 'dashed', 'dotted'];
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--bh-space-8)',
          padding: '24px 0',
        }}
      >
        {orientations.map((orientation) =>
          variants.map((variant) => (
            <div key={`${orientation}-${variant}`}>
              <strong
                style={{
                  display: 'block',
                  marginBottom: 'var(--bh-space-3)',
                  textTransform: 'capitalize',
                  fontFamily: 'var(--bh-font-sans)',
                  color: 'var(--bh-text-secondary)',
                  fontSize: 'var(--bh-text-sm)',
                }}
              >
                {orientation} · {variant}
              </strong>
              {orientation === 'horizontal' ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--bh-space-3)',
                  }}
                >
                  {thicknesses.map((t) => (
                    <Divider
                      key={t}
                      orientation={orientation}
                      thickness={t}
                      variant={variant}
                    />
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    gap: 'var(--bh-space-4)',
                    height: '120px',
                  }}
                >
                  {thicknesses.map((t) => (
                    <Divider
                      key={t}
                      orientation={orientation}
                      thickness={t}
                      variant={variant}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  },
};

/** Labels across variants and thicknesses. */
export const AllLabels: Story = {
  render: () => {
    const variants: DividerVariant[] = ['solid', 'dashed', 'dotted'];
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--bh-space-6)',
          padding: '24px 0',
        }}
      >
        {variants.map((v) => (
          <Divider key={v} label={v} variant={v} thickness="medium" />
        ))}
      </div>
    );
  },
};
