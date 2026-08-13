import { type ButtonHTMLAttributes } from 'preact';
import { forwardRef, type ReactNode } from 'preact/compat';

export type ButtonVariant =
    'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning' | 'link';

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
    primary: 'btn--primary',
    secondary: 'btn--secondary',
    ghost: 'btn--ghost',
    outline: 'btn--outline',
    danger: 'btn--danger',
    success: 'btn--success',
    warning: 'btn--warning',
    link: 'btn--link',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    xs: 'btn--xs',
    sm: 'btn--sm',
    md: '', // base
    lg: 'btn--lg',
    xl: 'btn--xl',
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

        const classNames = [
            'btn',
            VARIANT_CLASSES[variant],
            SIZE_CLASSES[size],
            fullWidth && 'btn--block',
            rounded && 'btn--rounded',
            isDisabled && 'btn--disabled',
            loading && 'btn--loading',
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
                    <span className="btn__spinner" aria-hidden="true">
                        <svg className="spin" viewBox="0 0 24 24" width="16" height="16">
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
                {!loading && iconLeft && (
                    <span className="btn__icon btn__icon--left" aria-hidden="true">
                        {iconLeft}
                    </span>
                )}
                <span className="btn__text">{children}</span>
                {!loading && iconRight && (
                    <span className="btn__icon btn__icon--right" aria-hidden="true">
                        {iconRight}
                    </span>
                )}
            </button>
        );
    },
);

Button.displayName = 'Button';
