import type { Meta, StoryObj } from '@storybook/preact';
import { Tooltip } from './Tooltip';
import type { TooltipPosition } from './Tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'Atoms/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible WAI-ARIA tooltip atom. Wraps a single trigger element and ' +
          'shows a `role="tooltip"` panel on hover/focus. Four placements ' +
          '(top, bottom, left, right), configurable show/hide delay, optional ' +
          'CSS arrow, and an interactive mode that keeps the panel open while ' +
          'the pointer is over the tooltip body. All visual properties use ' +
          '`--bh-*` design tokens.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Placement relative to the trigger',
    },
    delay: {
      control: 'number',
      description: 'Show/hide delay in ms (default 200)',
    },
    interactive: {
      control: 'boolean',
      description: 'Keep open while hovering the tooltip body',
    },
    arrow: {
      control: 'boolean',
      description: 'Render the CSS arrow pointing at the trigger',
    },
    content: {
      control: 'text',
      description: 'Tooltip body (text or nodes)',
    },
  },
  args: {
    content: 'This is a helpful tooltip.',
    position: 'top',
    delay: 200,
    interactive: false,
    arrow: true,
  },
  // Give stories room so absolutely-positioned tooltips aren't clipped.
  decorators: [
    (Story) => (
      <div
        style={{
          padding: '80px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

/* ============================================================
   BASIC
   ============================================================ */
export const Basic: Story = {
  args: {
    content: 'Hover for more info',
    children: <button type="button">Hover me</button>,
  },
};

/* ============================================================
   POSITIONS — all four placements
   ============================================================ */
export const Top: Story = {
  args: {
    position: 'top',
    content: 'Tooltip above the trigger',
    children: <button type="button">Top</button>,
  },
};

export const Bottom: Story = {
  args: {
    position: 'bottom',
    content: 'Tooltip below the trigger',
    children: <button type="button">Bottom</button>,
  },
};

export const Left: Story = {
  args: {
    position: 'left',
    content: 'Tooltip to the left',
    children: <button type="button">Left</button>,
  },
};

export const Right: Story = {
  args: {
    position: 'right',
    content: 'Tooltip to the right',
    children: <button type="button">Right</button>,
  },
};

/** All four positions side by side. */
export const AllPositions: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '48px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      {(['top', 'bottom', 'left', 'right'] as TooltipPosition[]).map((p) => (
        <Tooltip key={p} position={p} content={`Position: ${p}`}>
          <button type="button" style={{ textTransform: 'capitalize' }}>
            {p}
          </button>
        </Tooltip>
      ))}
    </div>
  ),
};

/* ============================================================
   ARROW
   ============================================================ */
export const WithArrow: Story = {
  args: {
    arrow: true,
    content: 'Arrow points at the trigger',
    children: <button type="button">With arrow</button>,
  },
};

export const WithoutArrow: Story = {
  args: {
    arrow: false,
    content: 'No arrow — just the panel',
    children: <button type="button">Without arrow</button>,
  },
};

/* ============================================================
   DELAY
   ============================================================ */
export const Delayed: Story = {
  args: {
    delay: 600,
    content: 'Appears after 600ms',
    children: <button type="button">Delayed (600ms)</button>,
  },
};

export const Instant: Story = {
  args: {
    delay: 0,
    content: 'Appears immediately',
    children: <button type="button">Instant (0ms)</button>,
  },
};

/* ============================================================
   INTERACTIVE
   ============================================================ */
export const Interactive: Story = {
  args: {
    interactive: true,
    content:
      'You can move the pointer into this tooltip and it will stay open. Useful for rich content or links.',
    children: <button type="button">Interactive</button>,
  },
};

export const NonInteractive: Story = {
  args: {
    interactive: false,
    content: 'Disappears as soon as the pointer leaves the trigger.',
    children: <button type="button">Non-interactive</button>,
  },
};

/* ============================================================
   RICH CONTENT
   ============================================================ */
export const RichContent: Story = {
  args: {
    content: (
      <span>
        <strong style={{ color: 'var(--bh-accent)' }}>Tip:</strong> tooltips can
        contain <em>formatted</em> content.
      </span>
    ),
    children: <button type="button">Rich content</button>,
  },
};

/* ============================================================
   TRIGGER VARIETY — works with any element that accepts handlers
   ============================================================ */
export const WithLink: Story = {
  args: {
    content: 'Tooltips work on links too',
    children: <a href="#">A link trigger</a>,
  },
};

export const WithSpan: Story = {
  args: {
    content: 'Even a span can be a trigger',
    children: <span tabIndex={0}>Focusable span</span>,
  },
};
