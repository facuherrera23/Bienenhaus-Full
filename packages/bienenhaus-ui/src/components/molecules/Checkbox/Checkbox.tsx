import { type ChangeEvent, forwardRef, type ReactNode } from 'preact/compat';
import { useCallback, useEffect, useId, useRef, useState } from 'preact/hooks';

export type CheckboxSize = 'sm' | 'md';

export interface CheckboxProps extends Omit<
    preact.JSX.HTMLAttributes<HTMLInputElement>,
    | 'type'
    | 'size'
    | 'onChange'
    | 'checked'
    | 'defaultChecked'
    | 'children'
    | 'role'
    | 'aria-checked'
    | 'indeterminate'
    | 'value'
> {
    /** Controlled checked state. When provided the checkbox is controlled. */
    checked?: boolean;
    /** Initial checked state for uncontrolled usage. */
    defaultChecked?: boolean;
    /** Fired with the new checked value. Not fired for indeterminate changes. */
    onChange?: (checked: boolean) => void;
    /** Visual indeterminate state — renders a dash. Sets `el.indeterminate` via ref effect. */
    indeterminate?: boolean;
    /** Optional visible label. When omitted, `aria-label` is required. */
    label?: ReactNode;
    /** Checkbox size — `md` (default) or `sm`. */
    size?: CheckboxSize;
    /** Disables interaction and dims the control. */
    disabled?: boolean;
    /** Form input name. */
    name?: string;
    /** Form input value. */
    value?: string | number;
    /** Explicit id for the input. Auto-generated when omitted. */
    id?: string;
    /** Required when no visible `label` is provided. Falls back to `label` text when omitted. */
    'aria-label'?: string;
    /** Extra class name applied to the root wrapper. */
    className?: string;
}

const SIZE_CLASS: Record<CheckboxSize, string> = {
    sm: 'checkbox--sm',
    md: 'checkbox--md',
};

/**
 * Checkbox — accessible checkbox built on a native `<input type="checkbox">`.
 *
 * - Controlled via `checked` + `onChange`, or uncontrolled via `defaultChecked`.
 * - `indeterminate` is a visual-only state (renders a dash); it is set on the
 *   native input via an effect (`el.indeterminate = true`) because the HTML
 *   attribute cannot express it.
 * - Clicking the associated `<label>` toggles the input (native `htmlFor`/`id`).
 * - Keyboard Space/Enter support comes free from the native checkbox.
 * - `aria-label` falls back to the `label` text when no explicit label is given
 *   but a visible label is present (the `<label>` association is the primary
 *   accessible name).
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    (
        {
            checked,
            defaultChecked = false,
            onChange,
            indeterminate = false,
            label,
            size = 'md',
            disabled = false,
            name,
            value,
            id,
            className = '',
            'aria-label': ariaLabel,
            ...props
        },
        ref,
    ) => {
        const generatedId = useId();
        const inputId = id ?? generatedId;
        const isControlled = checked !== undefined;
        const [internalChecked, setInternalChecked] = useState<boolean>(defaultChecked);
        const isChecked = isControlled ? (checked as boolean) : internalChecked;

        // Indeterminate can only be set imperatively on the native input element.
        // We keep an internal ref so the effect can run even when the consumer did
        // not pass a ref, and forward the node to the consumer's ref as well.
        const internalRef = useRef<HTMLInputElement | null>(null);
        const setRefs = useCallback(
            (node: HTMLInputElement | null) => {
                internalRef.current = node;
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref !== null && typeof ref === 'object') {
                    (ref as { current: HTMLInputElement | null }).current = node;
                }
            },
            [ref],
        );

        useEffect(() => {
            const node = internalRef.current;
            if (node) {
                node.indeterminate = indeterminate;
            }
        }, [indeterminate]);

        const handleChange = useCallback(
            (event: ChangeEvent<HTMLInputElement>) => {
                if (disabled) {
                    return;
                }
                const next = event.currentTarget.checked;
                if (!isControlled) {
                    setInternalChecked(next);
                }
                onChange?.(next);
            },
            [disabled, isControlled, onChange],
        );

        const wrapperClass = [
            'checkbox',
            SIZE_CLASS[size],
            disabled && 'checkbox--disabled',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div
                className={wrapperClass}
                data-checked={isChecked}
                data-indeterminate={indeterminate}
            >
                <input
                    ref={setRefs}
                    id={inputId}
                    type="checkbox"
                    name={name}
                    value={value}
                    className="checkbox__input"
                    checked={isChecked}
                    defaultChecked={isControlled ? undefined : defaultChecked}
                    disabled={disabled}
                    aria-checked={indeterminate ? 'mixed' : isChecked}
                    aria-disabled={disabled || undefined}
                    aria-label={label ? undefined : ariaLabel}
                    onChange={handleChange}
                    {...props}
                />
                <span className="checkbox__box" aria-hidden="true">
                    {indeterminate ? (
                        <svg
                            className="checkbox__icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <line
                                x1="5"
                                y1="12"
                                x2="19"
                                y2="12"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="checkbox__icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <polyline
                                points="5 12 10 17 19 7"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </span>
                {label !== undefined && (
                    <label htmlFor={inputId} className="checkbox__label">
                        {label}
                    </label>
                )}
            </div>
        );
    },
);

Checkbox.displayName = 'Checkbox';
