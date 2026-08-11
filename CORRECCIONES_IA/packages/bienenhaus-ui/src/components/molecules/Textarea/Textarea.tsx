import { type TextareaHTMLAttributes } from 'preact';
import { forwardRef } from 'preact/compat';
import styles from './Textarea.module.css';

/**
 * Textarea — multi-line text input molecule.
 *
 * Sibling of the Input/SearchInput molecules: same transparent bg
 * (`--bh-bg-input`), border token, radius-md, focus ring accent, and padding
 * scale. Uses ONLY --bh-* design tokens.
 *
 * Features:
 *  - `rows` (default 4) — native rows attribute controlling visible height.
 *  - `resize` — 'none' | 'vertical' | 'both' (default 'vertical'), applied via
 *    the CSS `resize` property through a size class.
 *  - Character counter — when `maxLength` + `showCounter` are set, renders
 *    `{value.length}/{maxLength}` at the bottom-right; turns `--bh-danger`
 *    when the value reaches the limit.
 *  - Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 *  - `error?: boolean` — sets `aria-invalid` and an error border.
 *  - `size?: 'sm' | 'md' | 'lg'` (default 'md').
 *  - forwardRef to the underlying `<textarea>` element.
 *
 * Accessibility: `aria-label` falls back to `placeholder` when not provided.
 */
export type TextareaResize = 'none' | 'vertical' | 'both';
export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps
  extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'size' | 'onChange' | 'value' | 'defaultValue'
  > {
  /** Controlled value. When provided, the component is controlled. */
  value?: string;
  /** Change handler. Fires with the new string value on every keystroke. */
  onChange?: (value: string) => void;
  /** Initial value for uncontrolled usage. */
  defaultValue?: string;
  /** Placeholder text. Also used as `aria-label` fallback. */
  placeholder?: string;
  /** Visible rows. Default: 4. */
  rows?: number;
  /** Resize behaviour. Default: 'vertical'. */
  resize?: TextareaResize;
  /** Size variant. Default: 'md'. */
  size?: TextareaSize;
  /** Max character count. Enables the native maxLength + the counter logic. */
  maxLength?: number;
  /** Show the `{value.length}/{maxLength}` counter. Requires `maxLength`. */
  showCounter?: boolean;
  /** Disables the textarea. */
  disabled?: boolean;
  /** Read-only textarea. */
  readOnly?: boolean;
  /** Error state — sets `aria-invalid` and an error border. */
  error?: boolean;
  /** Accessible label. Falls back to `placeholder` when omitted. */
  'aria-label'?: string;
}

const SIZE_CLASS: Record<TextareaSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

const RESIZE_CLASS: Record<TextareaResize, string> = {
  none: styles.resizeNone,
  vertical: styles.resizeVertical,
  both: styles.resizeBoth,
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      value: controlledValue,
      onChange,
      defaultValue,
      placeholder,
      rows = 4,
      resize = 'vertical',
      size = 'md',
      maxLength,
      showCounter = false,
      disabled = false,
      readOnly = false,
      error = false,
      className,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined;

    // The counter reads the current value: controlled prop takes precedence,
    // otherwise we fall back to the uncontrolled defaultValue (initial render).
    const currentValue = isControlled ? controlledValue : defaultValue ?? '';
    const valueLength = currentValue.length;

    const showCounterRow =
      showCounter && typeof maxLength === 'number' && maxLength > 0;
    const atLimit =
      showCounterRow && valueLength >= (maxLength as number);

    const wrapperClassNames = [
      styles.wrapper,
      SIZE_CLASS[size],
      RESIZE_CLASS[resize],
      error && styles.error,
      disabled && styles.disabled,
      readOnly && styles.readonly,
      showCounterRow && styles.withCounter,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const counterClassNames = [styles.counter, atLimit && styles.counterDanger]
      .filter(Boolean)
      .join(' ');

    const handleChange = (event: Event) => {
      if (disabled || readOnly) return;
      const target = event.target as HTMLTextAreaElement;
      onChange?.(target.value);
    };

    const resolvedAriaLabel = ariaLabel ?? placeholder;

    return (
      <div class={wrapperClassNames}>
        <textarea
          ref={ref}
          class={styles.textarea}
          value={controlledValue}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={error || undefined}
          aria-label={resolvedAriaLabel}
          onInput={handleChange}
          {...props}
        />
        {showCounterRow && (
          <span class={counterClassNames} aria-hidden="true">
            {valueLength}/{maxLength}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
