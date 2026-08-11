import { type ComponentChild, type HTMLAttributes } from 'preact';
import { forwardRef } from 'preact/compat';
import { Spinner } from '../../atoms/Spinner/Spinner';

/**
 * Metric — compact KPI molecule for the Bienenhaus design system.
 *
 * The minimal inline variant of a stat: just label + value + optional delta.
 * It is **borderless** and **inline-flex** — the parent decides the card or
 * container chrome (StatCard is the full KPI card sibling; Metric is the
 * stripped-down inline variant for dense layouts, table cells, toolbars, etc.).
 *
 * Anatomy:
 *   - **Label**  — uppercase, muted, tracking-wide (text-xs)
 *   - **Value**   — bold, tabular-nums (font-variant-numeric: tabular-nums)
 *   - **Delta**   — inline right of value: ↑/↓ inline SVG + semantic color
 *                   (up → --bh-success, down → --bh-danger)
 *   - **Icon**    — optional 32-36px rounded tinted square using
 *                   color-mix(in srgb, var(--bh-accent) 14%, transparent)
 *   - **Loading** — replaces the value with the Spinner atom (size sm)
 *
 * Sizes: sm | md (default)
 */
export type MetricSize = 'sm' | 'md';

export interface MetricDelta {
  /** Human-readable delta, e.g. "+12%", "-3%". */
  value: string;
  /** Arrow direction. */
  direction: 'up' | 'down';
}

export interface MetricProps extends Omit<HTMLAttributes<HTMLDivElement>, 'label'> {
  /** KPI label (e.g. "Propiedades publicadas"). Rendered uppercase + muted. */
  label: string;
  /** Prominent metric value. */
  value: string | number;
  /** Delta vs previous period, rendered inline right of the value. */
  delta?: MetricDelta;
  /** Optional leading icon node. Rendered inside a tinted rounded square. */
  icon?: ComponentChild;
  /** Replaces the value with a Spinner atom (label + icon stay visible). */
  loading?: boolean;
  /** Density. Default: 'md'. */
  size?: MetricSize;
}

const SIZE_CLASS: Record<MetricSize, string> = {
  sm: 'metric--sm',
  md: 'metric--md',
};

/** Up-arrow inline SVG (stroke = currentColor). */
function DeltaArrowUp() {
  return (
    <svg
      class="metric__arrow"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

/** Down-arrow inline SVG (stroke = currentColor). */
function DeltaArrowDown() {
  return (
    <svg
      class="metric__arrow"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="5 12 12 19 19 12" />
    </svg>
  );
}

export const Metric = forwardRef<HTMLDivElement, MetricProps>(
  (
    {
      label,
      value,
      delta,
      icon,
      loading = false,
      size = 'md',
      className,
      ...props
    },
    ref,
  ) => {
    const classNames = ['metric', SIZE_CLASS[size], className]
      .filter(Boolean)
      .join(' ');

    const deltaClass = delta
      ? delta.direction === 'up'
        ? 'metric__delta metric__delta--up'
        : 'metric__delta metric__delta--down'
      : '';

    return (
      <div ref={ref} className={classNames} {...props}>
        {icon !== undefined && (
          <span class="metric__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <div class="metric__content">
          <span class="metric__label">{label}</span>
          <div class="metric__row">
            {loading ? (
              <Spinner size="sm" inline aria-label="Cargando…" />
            ) : (
              <span class="metric__value">{value}</span>
            )}
            {delta && !loading && (
              <span class={deltaClass}>
                {delta.direction === 'up' ? <DeltaArrowUp /> : <DeltaArrowDown />}
                <span class="metric__deltaValue">{delta.value}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

Metric.displayName = 'Metric';
