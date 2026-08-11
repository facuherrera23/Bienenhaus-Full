import { type HTMLAttributes } from 'preact';
import { forwardRef } from 'preact/compat';
import styles from './Spinner.module.css';

/**
 * Spinner — loading indicator atom.
 *
 * Renders an SVG ring with a rotating arc on a static track. Used inline
 * inside buttons/inputs or as a standalone block loader.
 *
 * Sizes:      sm 16px | md 24px | lg 32px | xl 48px
 * Color:      primary (accent) | white (text-primary) | inherit (currentColor)
 * Display:    flex (block) by default; `inline` → inline-flex
 * Thickness:  stroke-width in px; defaults per size (2/3/4/5)
 *
 * Accessibility: `role="status"` + `aria-label="Cargando..."`. The SVG is
 * hidden from AT (`aria-hidden`) since the host label already describes it.
 */
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'primary' | 'white' | 'inherit';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /** Diameter scale. Default: 'md' (24px). */
  size?: SpinnerSize;
  /** display: inline-flex vs flex. Default: false (block flex). */
  inline?: boolean;
  /** Stroke color source. Default: 'primary' (accent). */
  color?: SpinnerColor;
  /** Stroke width in px. Overrides the size default when provided. */
  thickness?: number;
}

const SIZE_CLASS: Record<SpinnerSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  xl: styles.xl,
};

const COLOR_CLASS: Record<SpinnerColor, string> = {
  primary: styles.primary,
  white: styles.white,
  inherit: styles.inherit,
};

/** Default stroke-width per size (px). */
const DEFAULT_THICKNESS: Record<SpinnerSize, number> = {
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
};

/** SVG viewBox is 0 0 24 24 → radius 10 → circumference ≈ 62.83. */
const RADIUS = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  (
    {
      size = 'md',
      inline = false,
      color = 'primary',
      thickness,
      className,
      role = 'status',
      'aria-label': ariaLabel = 'Cargando...',
      ...props
    },
    ref
  ) => {
    const strokeWidth = thickness ?? DEFAULT_THICKNESS[size];

    const classNames = [
      styles.spinner,
      SIZE_CLASS[size],
      COLOR_CLASS[color],
      inline && styles.inline,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        ref={ref}
        className={classNames}
        role={role}
        aria-label={ariaLabel}
        {...props}
      >
        <svg
          className={styles.svg}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          {/* Static track ring */}
          <circle
            className={styles.track}
            cx="12"
            cy="12"
            r={RADIUS}
            fill="none"
            strokeWidth={strokeWidth}
          />
          {/* Rotating arc — 25% of circumference visible */}
          <circle
            className={styles.arc}
            cx="12"
            cy="12"
            r={RADIUS}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE * 0.25} ${CIRCUMFERENCE * 0.75}`}
          />
        </svg>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';
