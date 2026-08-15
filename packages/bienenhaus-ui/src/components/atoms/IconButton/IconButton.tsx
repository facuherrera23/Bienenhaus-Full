import { type ButtonHTMLAttributes } from 'preact';
import { forwardRef, type ReactNode } from 'preact/compat';
import styles from './IconButton.module.css';

/**
 * IconButton — square icon-only button atom.
 *
 * Accessibility: `aria-label` is REQUIRED (icon-only buttons must label
 * themselves for screen readers). Enforced at the type level.
 *
 * Variants: ghost | outline | solid | danger
 * Sizes:    sm (32px) | md (40px) | lg (48px)
 */
export type IconButtonVariant = 'ghost' | 'outline' | 'solid' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
    /** Visual style. Default: 'ghost'. */
    variant?: IconButtonVariant;
    /** Square size in px. Default: 'md' (40px). */
    size?: IconButtonSize;
    /** Native button type. Default: 'button' (prevents accidental form submits). */
    type?: 'button' | 'submit' | 'reset';
    /** The icon node (usually an SVG). Hidden from AT when loading. */
    children: ReactNode;
    /** REQUIRED accessible label — the button has no visible text. */
    'aria-label': string;
    /** Disables interaction. */
    disabled?: boolean;
    /** Shows a spinner and disables interaction. */
    loading?: boolean;
}

const VARIANT_CLASS: Record<IconButtonVariant, string> = {
    ghost: styles.ghost,
    outline: styles.outline,
    solid: styles.solid,
    danger: styles.danger,
};

const SIZE_CLASS: Record<IconButtonSize, string> = {
    sm: styles.sm,
    md: styles.md,
    lg: styles.lg,
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    (
        {
            variant = 'ghost',
            size = 'md',
            loading = false,
            disabled,
            onClick,
            className,
            children,
            type = 'button',
            ...props
        },
        ref,
    ) => {
        const isDisabled = disabled || loading;

        const classNames = [
            styles.btn,
            VARIANT_CLASS[variant],
            SIZE_CLASS[size],
            loading && styles.loading,
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <button
                ref={ref}
                type={type}
                className={classNames}
                disabled={isDisabled}
                aria-busy={loading}
                aria-disabled={isDisabled}
                {...props}
                {...(isDisabled ? {} : { onClick })}
            >
                {loading ? (
                    <span className={styles.spinner} aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="1em" height="1em">
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray="31.4 31.4"
                                strokeLinecap="round"
                            />
                        </svg>
                    </span>
                ) : (
                    <span className={styles.icon} aria-hidden="true">
                        {children}
                    </span>
                )}
            </button>
        );
    },
);

IconButton.displayName = 'IconButton';
