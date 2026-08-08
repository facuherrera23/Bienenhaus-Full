import { type HTMLAttributes } from 'preact';
import { forwardRef, type ReactNode } from 'preact/compat';
import styles from './Chip.module.css';

/**
 * Chip — compact inline label atom.
 *
 * Non-interactive pill used to surface categories, filters, tags, or
 * selections. Renders a `<span>`; when `removable` is true an inner
 * `<button>` is rendered to dismiss the chip.
 *
 * Variants: default | outline
 * Icon:    optional leading icon node (14×14)
 * Close:   optional dismiss button (18×18) with `aria-label="Eliminar"`
 */
export type ChipVariant = 'default' | 'outline';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  /** Chip label text. */
  label: string;
  /** Visual variant. Default: 'default'. */
  variant?: ChipVariant;
  /** Optional leading icon node (rendered at 14×14). */
  icon?: ReactNode;
  /** Shows a dismiss button and calls `onClose` when clicked. */
  removable?: boolean;
  /** Called when the close button is clicked. */
  onClose?: () => void;
}

const VARIANT_CLASS: Record<ChipVariant, string> = {
  default: styles.default,
  outline: styles.outline,
};

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  (
    {
      label,
      variant = 'default',
      icon,
      removable = false,
      onClose,
      className,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.chip,
      VARIANT_CLASS[variant],
      removable && styles.removable,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={classNames} {...props}>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
        <span className={styles.label}>{label}</span>
        {removable && (
          <button
            type="button"
            className={styles.close}
            aria-label="Eliminar"
            onClick={onClose}
          >
            <svg
              viewBox="0 0 24 24"
              width="10"
              height="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Chip.displayName = 'Chip';
