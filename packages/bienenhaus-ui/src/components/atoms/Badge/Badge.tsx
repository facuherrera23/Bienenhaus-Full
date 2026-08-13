import { type HTMLAttributes } from 'preact';
import { forwardRef, type ReactNode } from 'preact/compat';
import styles from './Badge.module.css';

/**
 * Badge — inline status pill atom.
 *
 * Non-interactive label used to surface status, counts, or categories.
 * Renders a `<span>`; for interactive badges wrap in a link/button or
 * use `Button`/`IconButton` instead.
 *
 * Variants: success | danger | warning | info | neutral | primary
 * Sizes:    sm | md
 * Dot:      optional colored leading dot (inherits text color)
 */
export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    /** Visual variant. Default: 'neutral'. */
    variant?: BadgeVariant;
    /** Size scale. Default: 'md'. */
    size?: BadgeSize;
    /** Shows a small colored dot before the text. Default: false. */
    dot?: boolean;
    /** Badge label/content. */
    children: ReactNode;
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
    success: styles.success,
    danger: styles.danger,
    warning: styles.warning,
    info: styles.info,
    neutral: styles.neutral,
    primary: styles.primary,
};

const SIZE_CLASS: Record<BadgeSize, string> = {
    sm: styles.sm,
    md: styles.md,
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ variant = 'neutral', size = 'md', dot = false, className, children, ...props }, ref) => {
        const classNames = [
            styles.badge,
            VARIANT_CLASS[variant],
            SIZE_CLASS[size],
            dot && styles.withDot,
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <span ref={ref} className={classNames} {...props}>
                {dot && <span className={styles.dot} aria-hidden="true" />}
                {children}
            </span>
        );
    },
);

Badge.displayName = 'Badge';
