import type { JSX } from 'preact';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: JSX.Element;
    fullWidth?: boolean;
    disabled?: boolean;
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    fullWidth = false,
    disabled,
    children,
    className,
    ...rest
}: ButtonProps) {
    const classes = [
        styles.btn,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            type="button"
            className={classes}
            disabled={disabled || loading}
            aria-busy={loading}
            {...rest}
        >
            {loading && <span className={styles.spinner} aria-hidden="true" />}
            {!loading && icon && (
                <span className={styles.icon} aria-hidden="true">
                    {icon}
                </span>
            )}
            {children}
        </button>
    );
}
