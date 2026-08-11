import { type InputHTMLAttributes } from 'preact';
import { forwardRef } from 'preact/compat';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import styles from './SearchInput.module.css';

/**
 * SearchInput — debounced search input molecule.
 *
 * Composition of atoms (icon + input + clear button + spinner) into a single
 * search field with built-in debounce. Uses ONLY --bh-* design tokens.
 *
 * Features:
 *  - Debounced `onChange` (default 300ms). Typing is NEVER blocked: the input
 *    value updates immediately; `onChange` fires after the debounce window
 *    elapses with no new keystrokes. The timer is cancelled on new input and
 *    cleaned up on unmount — no stale updates.
 *  - Clear button: visible only when there is a value; clears the field and
 *    refocuses the input.
 *  - Shortcut hint: optional badge (e.g. "/" or "Ctrl+K"); hidden while the
 *    input is focused.
 *  - Loading state: spinner replaces the clear button while pending.
 *  - Search icon on the left (inline SVG — no external icon dependency).
 *
 * Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 * Sizes: sm | md | lg (default md).
 *
 * Accessibility: `aria-label` falls back to `placeholder` when not provided.
 */
export type SearchInputSize = 'sm' | 'md' | 'lg';

export interface SearchInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'size' | 'onChange' | 'value' | 'defaultValue'
  > {
  /** Controlled value. When provided, the component is controlled. */
  value?: string;
  /** Debounced change handler. Fires `debounceMs` after the last keystroke. */
  onChange?: (value: string) => void;
  /** Initial value for uncontrolled usage. */
  defaultValue?: string;
  /** Placeholder text. Also used as `aria-label` fallback. */
  placeholder?: string;
  /** Debounce delay in ms. Default: 300. Set 0 for immediate dispatch. */
  debounceMs?: number;
  /** Shows a spinner on the right and hides the clear button. */
  loading?: boolean;
  /** Disables the input and clear button. */
  disabled?: boolean;
  /** Size variant. Default: 'md'. */
  size?: SearchInputSize;
  /** Shortcut hint badge (e.g. "/" or "Ctrl+K"). Hidden while focused. */
  shortcut?: string;
  /** Accessible label. Falls back to `placeholder` when omitted. */
  'aria-label'?: string;
}

const SIZE_CLASS: Record<SearchInputSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

/** Inline search (magnifier) icon — matches atom inline-SVG convention. */
const SearchIcon = () => (
  <svg
    class={styles.searchIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

/** Inline clear (X) icon for the clear button. */
const ClearIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/** Inline spinner — matches the atom spinner SVG (rotating arc). */
const LoadingSpinner = () => (
  <svg
    class={styles.spinnerSvg}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="3"
      fill="none"
      stroke-dasharray="31.4 31.4"
      stroke-linecap="round"
    />
  </svg>
);

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value: controlledValue,
      onChange,
      defaultValue = '',
      placeholder,
      debounceMs = 300,
      loading = false,
      disabled = false,
      size = 'md',
      shortcut,
      className,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined;

    // Internal value drives the visible input at all times so typing is never
    // blocked while a debounce timer is pending.
    const [internalValue, setInternalValue] = useState(
      isControlled ? controlledValue : defaultValue
    );
    const [isFocused, setIsFocused] = useState(false);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync internal value when the controlled prop changes externally.
    useEffect(() => {
      if (isControlled) {
        setInternalValue(controlledValue);
      }
    }, [isControlled, controlledValue]);

    // Cleanup any pending debounce timer on unmount.
    useEffect(() => {
      return () => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, []);

    const scheduleChange = useCallback(
      (next: string) => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (debounceMs <= 0) {
          onChange?.(next);
          return;
        }
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          onChange?.(next);
        }, debounceMs);
      },
      [debounceMs, onChange]
    );

    const handleInput = useCallback(
      (event: Event) => {
        if (disabled) return;
        const target = event.target as HTMLInputElement;
        const next = target.value;
        setInternalValue(next);
        scheduleChange(next);
      },
      [disabled, scheduleChange]
    );

    const handleClear = useCallback(() => {
      setInternalValue('');
      // Cancel any pending debounced update and fire immediately.
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      onChange?.('');
      // Refocus the input after clearing.
      inputRef.current?.focus();
    }, [onChange]);

    const handleFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
    }, []);

    // Merge forwarded ref with internal ref (clear button needs to refocus).
    const setInputRef = useCallback(
      (el: HTMLInputElement | null) => {
        inputRef.current = el;
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref !== null && ref !== undefined) {
          (ref as { current: HTMLInputElement | null }).current = el;
        }
      },
      [ref]
    );

    const currentValue = isControlled ? controlledValue : internalValue;
    const hasValue = currentValue.length > 0;
    const showClear = hasValue && !loading && !disabled;
    const showShortcut = Boolean(shortcut) && !isFocused && !hasValue;

    const classNames = [
      styles.wrapper,
      SIZE_CLASS[size],
      isFocused && styles.focused,
      disabled && styles.disabled,
      loading && styles.loading,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const resolvedAriaLabel = ariaLabel ?? placeholder;

    return (
      <div class={classNames}>
        <span class={styles.iconSlot} aria-hidden="true">
          <SearchIcon />
        </span>

        <input
          ref={setInputRef}
          type="text"
          class={styles.input}
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={resolvedAriaLabel}
          aria-busy={loading}
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {showShortcut && (
          <span class={styles.shortcut} aria-hidden="true">
            {shortcut}
          </span>
        )}

        {loading && (
          <span class={styles.spinnerSlot} aria-hidden="true">
            <LoadingSpinner />
          </span>
        )}

        {showClear && (
          <button
            type="button"
            class={styles.clearBtn}
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
            tabIndex={0}
          >
            <ClearIcon />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
