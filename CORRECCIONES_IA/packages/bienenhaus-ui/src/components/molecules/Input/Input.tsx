import { type ComponentChild, type InputHTMLAttributes } from 'preact';
import { forwardRef } from 'preact/compat';
import styles from './Input.module.css';

/**
 * Input — generic text-field molecule.
 *
 * Supports the Bienenhaus form types: text, email, password, phone, money,
 * number and url. The `money` type renders a text input with
 * `inputMode="decimal"` and an optional visual `prefix` (e.g. "$"); it does
 * NOT perform any currency formatting — that is out of scope for this
 * component.
 *
 * Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 * Sizes: sm | md | lg (default md).
 *
 * Accessibility: `aria-label` falls back to `placeholder` when not provided.
 * The `error` flag sets `aria-invalid="true"` and swaps the border/background
 * to the danger tokens.
 *
 * Uses ONLY --bh-* design tokens.
 */
export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'phone'
  | 'money'
  | 'number'
  | 'url';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'size' | 'onChange' | 'value' | 'defaultValue'
  > {
  /** Field type. `money` renders a text input with `inputMode="decimal"`. */
  type?: InputType;
  /** Controlled value. */
  value?: string;
  /** Initial value for uncontrolled usage. */
  defaultValue?: string;
  /** Change handler — receives the new string value. */
  onChange?: (value: string) => void;
  /** Placeholder text. Also used as `aria-label` fallback. */
  placeholder?: string;
  /** Disables the input. */
  disabled?: boolean;
  /** Makes the input read-only. */
  readOnly?: boolean;
  /** Error flag — adds `aria-invalid` + danger border/background. */
  error?: boolean;
  /** Leading inline SVG / icon node rendered inside the input. */
  icon?: ComponentChild;
  /** Size variant. Default: 'md'. */
  size?: InputSize;
  /** Visual prefix for `money` type (e.g. "$"). Ignored for other types. */
  prefix?: string;
  /** Accessible label. Falls back to `placeholder` when omitted. */
  'aria-label'?: string;
}

const SIZE_CLASS: Record<InputSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

/**
 * Maps an `InputType` to the native `type` attribute. `phone` and `money`
 * are not native types — they render as `text` with an `inputMode` hint.
 */
function nativeType(type: InputType): string {
  switch (type) {
    case 'email':
    case 'password':
    case 'number':
    case 'url':
      return type;
    case 'phone':
    case 'money':
    case 'text':
    default:
      return 'text';
  }
}

/** `inputMode` hint for the non-native types. */
function inputModeFor(type: InputType): string | undefined {
  switch (type) {
    case 'phone':
      return 'tel';
    case 'money':
      return 'decimal';
    case 'number':
      return 'numeric';
    case 'url':
      return 'url';
    case 'email':
      return 'email';
    default:
      return undefined;
  }
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      value: controlledValue,
      defaultValue,
      onChange,
      placeholder,
      disabled = false,
      readOnly = false,
      error = false,
      icon,
      size = 'md',
      prefix,
      className,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined;
    const isMoney = type === 'money';
    const hasIcon = Boolean(icon);
    const hasPrefix = isMoney && Boolean(prefix);

    const handleInput = (event: Event) => {
      if (disabled || readOnly) return;
      const target = event.target as HTMLInputElement;
      onChange?.(target.value);
    };

    const wrapperClassNames = [
      styles.wrapper,
      SIZE_CLASS[size],
      error && styles.error,
      disabled && styles.disabled,
      readOnly && styles.readonly,
      hasIcon && styles.hasIcon,
      hasPrefix && styles.hasPrefix,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const resolvedAriaLabel = ariaLabel ?? placeholder;

    return (
      <div class={wrapperClassNames}>
        {hasIcon && (
          <span class={styles.iconSlot} aria-hidden="true">
            {icon}
          </span>
        )}

        {hasPrefix && (
          <span class={styles.prefix} aria-hidden="true">
            {prefix}
          </span>
        )}

        <input
          ref={ref}
          type={nativeType(type)}
          inputMode={inputModeFor(type)}
          class={styles.input}
          value={isControlled ? controlledValue : undefined}
          defaultValue={isControlled ? undefined : defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={error || undefined}
          aria-label={resolvedAriaLabel}
          onInput={handleInput}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
