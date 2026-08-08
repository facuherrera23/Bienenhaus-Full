import { render, screen, fireEvent, act } from '@testing-library/preact';
import { vi } from 'vitest';
import { Tooltip } from './Tooltip';

/**
 * Tooltip atom tests.
 *
 * Covers: initial hidden state, hover/focus show, blur/leave hide, content
 * rendering, aria-describedby wiring, position classes, arrow rendering,
 * delay behavior, interactive mode, and custom className merging.
 *
 * Uses fake timers to deterministically exercise the `delay` prop.
 *
 * NOTE: children must be a raw element (e.g. <button>) so cloneElement can
 * attach the mouse/focus handlers directly to the DOM node. A function
 * component wrapper would swallow the cloned props.
 */

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the trigger element', () => {
    render(
      <Tooltip content="Helpful tip">
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    expect(screen.getByTestId('trigger')).toBeInTheDocument();
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('does not render the tooltip element initially', () => {
    render(
      <Tooltip content="Hidden tip">
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows the tooltip on mouse enter after the delay', () => {
    render(
      <Tooltip content="Hover tip" delay={200}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
    // Before the delay elapses, the tooltip is still hidden.
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hides the tooltip on mouse leave after the delay', () => {
    render(
      <Tooltip content="Hover tip" delay={200}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByTestId('trigger'));
    // Still visible until the hide delay elapses.
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows the tooltip on focus after the delay', () => {
    render(
      <Tooltip content="Focus tip" delay={100}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    // Preact/compat delegates onFocus via the bubbling focusin event.
    const trigger = screen.getByTestId('trigger');
    trigger.dispatchEvent(
      new FocusEvent('focusin', { bubbles: true, cancelable: true })
    );
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hides the tooltip on blur after the delay', () => {
    render(
      <Tooltip content="Focus tip" delay={100}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    const trigger = screen.getByTestId('trigger');
    trigger.dispatchEvent(
      new FocusEvent('focusin', { bubbles: true, cancelable: true })
    );
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    // Preact/compat delegates onBlur via the bubbling focusout event.
    trigger.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, cancelable: true })
    );
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders the tooltip content', () => {
    render(
      <Tooltip content="The actual content">
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText('The actual content')).toBeInTheDocument();
  });

  it('renders rich content nodes inside the tooltip', () => {
    render(
      <Tooltip
        content={
          <span data-testid="rich-content">
            <strong>Bold</strong> tip
          </span>
        }
      >
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByTestId('rich-content')).toBeInTheDocument();
    expect(screen.getByText('Bold')).toBeInTheDocument();
  });

  it('wires aria-describedby on the trigger to the tooltip id when open', () => {
    render(
      <Tooltip content="Aria tip">
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    const trigger = screen.getByTestId('trigger');
    // Before opening, no aria-describedby.
    expect(trigger).not.toHaveAttribute('aria-describedby');

    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const tooltip = screen.getByRole('tooltip');
    const tooltipId = tooltip.getAttribute('id');
    expect(tooltipId).toBeTruthy();
    expect(tooltipId).toMatch(/^tooltip-/);
    expect(trigger).toHaveAttribute('aria-describedby', tooltipId);
  });

  it('removes aria-describedby from the trigger when the tooltip closes', () => {
    render(
      <Tooltip content="Aria tip" delay={50}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    const trigger = screen.getByTestId('trigger');
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(trigger).toHaveAttribute('aria-describedby');

    fireEvent.mouseLeave(trigger);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('applies the data-position attribute matching the position prop', () => {
    render(
      <Tooltip content="Positioned" position="bottom">
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toHaveAttribute(
      'data-position',
      'bottom'
    );
  });

  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'applies a distinct class set for position=%s',
    (position) => {
      const { container } = render(
        <Tooltip content="P" position={position} delay={0}>
          <button type="button" data-testid="trigger">
            x
          </button>
        </Tooltip>
      );
      fireEvent.mouseEnter(screen.getByTestId('trigger'));
      act(() => {
        vi.advanceTimersByTime(0);
      });
      const tooltip = container.querySelector(
        '[role="tooltip"]'
      ) as HTMLElement;
      expect(tooltip).toBeInTheDocument();
      // CSS module classes are hashed; assert the element has at least the
      // base + position + arrow classes (3 hashed tokens).
      expect(tooltip.classList.length).toBeGreaterThanOrEqual(3);
    }
  );

  it('renders the arrow by default (withArrow class present)', () => {
    const { container } = render(
      <Tooltip content="Arrow tip" delay={0}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    const tooltip = container.querySelector(
      '[role="tooltip"]'
    ) as HTMLElement;
    // The arrow is drawn via ::before; the host carries the withArrow class.
    // CSS module class names are hashed, so assert the class count includes
    // the arrow toggle (base + position + withArrow = 3).
    expect(tooltip.classList.length).toBeGreaterThanOrEqual(3);
  });

  it('omits the arrow class when arrow={false}', () => {
    const { container } = render(
      <Tooltip content="No arrow" arrow={false} delay={0}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    const tooltip = container.querySelector(
      '[role="tooltip"]'
    ) as HTMLElement;
    // Without arrow: base + position = 2 hashed classes.
    expect(tooltip.classList.length).toBe(2);
  });

  it('respects a custom delay value', () => {
    render(
      <Tooltip content="Delayed" delay={500}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
    // 200ms (default) should NOT be enough.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    // 500ms total should show it.
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('shows immediately when delay is 0', () => {
    render(
      <Tooltip content="Instant" delay={0}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('keeps the tooltip open when hovering the tooltip body in interactive mode', () => {
    render(
      <Tooltip content="Interactive" interactive delay={100}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    const trigger = screen.getByTestId('trigger');
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();

    // Leave the trigger — normally this schedules a hide.
    fireEvent.mouseLeave(trigger);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // But entering the tooltip body cancels the hide.
    fireEvent.mouseEnter(tooltip);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('closes after leaving both trigger and tooltip in interactive mode', () => {
    render(
      <Tooltip content="Interactive" interactive delay={100}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    const trigger = screen.getByTestId('trigger');
    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    const tooltip = screen.getByRole('tooltip');

    fireEvent.mouseLeave(trigger);
    fireEvent.mouseEnter(tooltip);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    // Now leave the tooltip body — should hide after the delay.
    fireEvent.mouseLeave(tooltip);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('sets data-interactive="true" on the tooltip when interactive', () => {
    render(
      <Tooltip content="Interactive" interactive delay={0}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole('tooltip')).toHaveAttribute(
      'data-interactive',
      'true'
    );
  });

  it('sets data-interactive="false" on the tooltip when not interactive', () => {
    render(
      <Tooltip content="Non interactive" interactive={false} delay={0}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole('tooltip')).toHaveAttribute(
      'data-interactive',
      'false'
    );
  });

  it('merges a consumer className onto the wrapper', () => {
    const { container } = render(
      <Tooltip content="Custom" className="my-tooltip-wrapper">
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    expect(container.firstChild).toHaveClass('my-tooltip-wrapper');
  });

  it('defaults to position="top"', () => {
    render(
      <Tooltip content="Default pos" delay={0}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByRole('tooltip')).toHaveAttribute(
      'data-position',
      'top'
    );
  });

  it('defaults delay to 200ms', () => {
    render(
      <Tooltip content="Default delay">
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('renders the arrow by default (arrow prop defaults to true)', () => {
    const { container } = render(
      <Tooltip content="Arrow default" delay={0}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByTestId('trigger'));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    const tooltip = container.querySelector(
      '[role="tooltip"]'
    ) as HTMLElement;
    // base + position(top) + withArrow = 3 hashed classes.
    expect(tooltip.classList.length).toBe(3);
  });

  it('forwards the ref to the wrapper span element', () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(
      <Tooltip content="Ref" ref={ref}>
        <button type="button" data-testid="trigger">
          Hover me
        </button>
      </Tooltip>
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
