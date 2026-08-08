import { type ChangeEvent, forwardRef, type ReactNode } from 'preact/compat';
import { useCallback, useId, useState } from 'preact/hooks';

export type SwitchSize = 'sm' | 'md';

export interface SwitchProps
  extends Omit<
    preact.JSX.HTMLAttributes<HTMLInputElement>,
    | 'type'
    | 'size'
    | 'onChange'
    | 'checked'
    | 'defaultChecked'
    | 'children'
    | 'role'
    | 'aria-checked'
  > {
  /** Controlled checked state. When provided the switch is controlled. */
  checked?: boolean;
  /** Initial checked state for uncontrolled usage. */
  defaultChecked?: boolean;
  /** Fired with the new checked value. */
  onChange?: (checked: boolean) => void;
  /** Optional visible label. When omitted, `aria-label` is required. */
  label?: ReactNode;
  /** Switch size — `md` (default) or `sm`. */
  size?: SwitchSize;
  /** Disables interaction and dims the control. */
  disabled?: boolean;
  /** Form input name. */
  name?: string;
  /** Explicit id for the input. Auto-generated when omitted. */
  id?: string;
  /** Required when no visible `label` is provided. */
  'aria-label'?: string;
  /** Optional description rendered next to the label. */
  description?: ReactNode;
  /** Extra class name applied to the root wrapper. */
  className?: string;
}

const SIZE_CLASS: Record<SwitchSize, string> = {
  sm: 'switch--sm',
  md: 'switch--md',
};

/**
 * Switch — accessible toggle built on a native `<input type="checkbox" role="switch">`.
 *
 * - Controlled via `checked` + `onChange`, or uncontrolled via `defaultChecked`.
 * - Clicking the associated `<label>` toggles the input (native `htmlFor`/`id`).
 * - Keyboard Space/Enter support comes free from the native checkbox.
 * - `aria-label` is required when no visible `label` is supplied.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      checked,
      defaultChecked = false,
      onChange,
      label,
      description,
      size = 'md',
      disabled = false,
      name,
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

    const wrapperClass = ['switch', SIZE_CLASS[size], disabled && 'switch--disabled', className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClass} data-checked={isChecked}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          role="switch"
          name={name}
          className="switch__input"
          checked={isChecked}
          defaultChecked={isControlled ? undefined : defaultChecked}
          disabled={disabled}
          aria-checked={isChecked}
          aria-disabled={disabled || undefined}
          aria-label={label ? undefined : ariaLabel}
          onChange={handleChange}
          {...props}
        />
        <span className="switch__track" aria-hidden="true">
          <span className="switch__thumb" />
        </span>
        {label !== undefined && (
          <label htmlFor={inputId} className="switch__label">
            <span className="switch__labelText">{label}</span>
            {description !== undefined && (
              <span className="switch__description">{description}</span>
            )}
          </label>
        )}
      </div>
    );
  },
);

Switch.displayName = 'Switch';
