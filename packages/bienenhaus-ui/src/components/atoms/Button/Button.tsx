import { type ButtonHTMLAttributes } from 'preact';
import { forwardRef, type ReactNode } from 'preact/compat';
import styles from './Button.module.css';

export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'outline'
    | 'danger'
    | 'success'
    | 'warning'
    | 'link'
    | 'icon';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
    loading?: boolean;
    fullWidth?: boolean;
    rounded?: boolean;
    children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary: styles['btn--primary'],
    secondary: styles['btn--secondary'],
    ghost: styles['btn--ghost'],
    outline: styles['btn--outline'],
    danger: styles['btn--danger'],
    success: styles['btn--success'],
    warning: styles['btn--warning'],
    link: styles['btn--link'],
    icon: styles['btn--icon'],
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    xs: styles['btn--xs'],
    sm: styles['btn--sm'],
    md: '', // base
    lg: styles['btn--lg'],
    xl: styles['btn--xl'],
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            iconLeft,
            iconRight,
            loading = false,
            fullWidth = false,
            rounded = false,
            disabled,
            onClick,
            className = '',
            children,
            type = 'button',
            ...props
        },
        ref,
    ) => {
        const isDisabled = disabled || loading;
        const isIconOnly = variant === 'icon';

        const classNames = [
            styles.btn,
            VARIANT_CLASSES[variant],
            SIZE_CLASSES[size],
            fullWidth && styles['btn--block'],
            rounded && styles['btn--rounded'],
            isDisabled && styles['btn--disabled'],
            loading && styles['btn--loading'],
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
                {loading && (
                    <span className={styles.btn__spinner} aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="16" height="16">
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
                )}
                {!loading && isIconOnly && (
                    <span className={styles.btn__icon} aria-hidden="true">
                        {children}
                    </span>
                )}
                {!loading && !isIconOnly && (
                    <>
                        {iconLeft && (
                            <span className={`${styles.btn__icon} ${styles['btn__icon--left']}`} aria-hidden="true">
                                {iconLeft}
                            </span>
                        )}
                        <span className={styles.btn__text}>{children}</span>
                        {iconRight && (
                            <span className={`${styles.btn__icon} ${styles['btn__icon--right']}`} aria-hidden="true">
                                {iconRight}
                            </span>
                        )}
                    </>
                )}
            </button>
        );
    },
);

Button.displayName = 'Button';
