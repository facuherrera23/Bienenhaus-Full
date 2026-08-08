import { type ComponentChild } from 'preact';
import { forwardRef, type KeyboardEvent as PreactKeyboardEvent } from 'preact/compat';
import { useCallback, useEffect, useId, useRef, useState } from 'preact/hooks';

/**
 * Select — searchable + multi-select dropdown molecule.
 *
 * A custom dropdown (NOT a native `<select>`) styled like the Input molecule.
 * Supports single and multiple selection, optional live search filtering, full
 * keyboard navigation, and click-outside-to-close. Multi-select renders the
 * selected values as removable chips inside the trigger (each with a × button
 * carrying `aria-label="Quitar {label}"`).
 *
 * Accessibility (WAI-ARIA combobox pattern):
 *   - Trigger button: `role="combobox"` + `aria-expanded` + `aria-haspopup="listbox"`
 *     + `aria-controls="listbox-{id}"` + `aria-activedescendant` for the highlighted option.
 *   - Listbox: `role="listbox"` + `id="listbox-{id}"` + `aria-multiselectable` (multi).
 *   - Options: `role="option"` + `aria-selected` + `aria-disabled`.
 *   - Error: `aria-invalid="true"` + `aria-describedby="error-{id}"` with the
 *     message rendered in an element with `role="alert"`.
 *
 * Keyboard: ArrowDown/ArrowUp opens + moves highlight, Home/End jump to
 * first/last, Enter/Space selects highlighted (single closes, multi toggles),
 * Escape closes + returns focus to the trigger, typeahead on non-searchable.
 *
 * Uses ONLY --bh-* design tokens. Plain string class names (Switch pattern).
 */
export type SelectSize = 'sm' | 'md' | 'lg';

/** Value type — `string` for single mode, `string[]` for multi mode. */
export type SelectValue = string | string[];

export interface SelectOption {
  /** Stable value emitted to `onChange`. */
  value: string;
  /** Human-readable label shown in the dropdown + trigger. */
  label: string;
  /** Optional leading icon node rendered before the label (option + trigger). */
  icon?: ComponentChild;
  /** Disables this option (not selectable, dimmed). */
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<preact.JSX.HTMLAttributes<HTMLDivElement>, 'onChange' | 'size'> {
  /** Available options. */
  options: SelectOption[];
  /** Controlled value — `string` for single, `string[]` when `multiple`. */
  value?: SelectValue;
  /** Initial value for uncontrolled usage. */
  defaultValue?: SelectValue;
  /** Fired with the new value (`string` single, `string[]` multi). */
  onChange?: (value: SelectValue) => void;
  /** Enables multiple selection. Emits `string[]`. */
  multiple?: boolean;
  /** Enables the live search input inside the dropdown panel. */
  searchable?: boolean;
  /** Placeholder shown in the trigger when nothing is selected. */
  placeholder?: string;
  /** Optional visible label rendered above the trigger. */
  label?: string;
  /** Error message — adds `aria-invalid` + danger border + `role="alert"` message. */
  error?: string;
  /** Disables the whole control. */
  disabled?: boolean;
  /** Marks the field as required (adds `aria-required` on the trigger). */
  required?: boolean;
  /** Form input name (rendered as a hidden input value carrier). */
  name?: string;
  /** Explicit id for the trigger. Auto-generated when omitted. */
  id?: string;
  /** Size variant. Default: 'md'. */
  size?: SelectSize;
  /** Accessible label. Falls back to `placeholder` when omitted. */
  'aria-label'?: string;
}

const SIZE_CLASS: Record<SelectSize, string> = {
  sm: 'select--sm',
  md: 'select--md',
  lg: 'select--lg',
};

/** Chevron-down inline SVG — rotates 180deg when open. */
const ChevronIcon = () => (
  <svg
    class="select__chevron"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/** Check icon shown on selected options. */
const CheckIcon = () => (
  <svg
    class="select__check"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/** Normalize the value prop into an array of selected values. */
function toArrayValue(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** Find the label for a given value. */
function findLabel(options: SelectOption[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value: controlledValue,
      defaultValue,
      onChange,
      multiple = false,
      searchable = false,
      placeholder,
      label,
      error,
      disabled = false,
      required = false,
      name,
      id,
      size = 'md',
      className = '',
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const triggerId = id ?? `select-trigger-${generatedId}`;
    const listboxId = `listbox-${triggerId}`;
    const errorId = `error-${triggerId}`;

    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<string[]>(
      toArrayValue(isControlled ? controlledValue : defaultValue),
    );
    const selectedValues = isControlled ? toArrayValue(controlledValue) : internalValue;

    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const searchRef = useRef<HTMLInputElement | null>(null);
    const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

    const filteredOptions = searchable && search.length > 0
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options;

    const hasError = Boolean(error);

    useEffect(() => {
      if (activeIndex >= filteredOptions.length) {
        setActiveIndex(filteredOptions.length > 0 ? filteredOptions.length - 1 : 0);
      }
    }, [filteredOptions.length, activeIndex]);

    useEffect(() => {
      if (isOpen && searchable && searchRef.current) {
        searchRef.current.focus();
      }
    }, [isOpen, searchable]);

    useEffect(() => {
      if (!isOpen) return;
      const handlePointerDown = (event: MouseEvent) => {
        const container = containerRef.current;
        if (container && !container.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handlePointerDown);
      return () => {
        document.removeEventListener('mousedown', handlePointerDown);
      };
    }, [isOpen]);

    useEffect(() => {
      if (!isOpen) return;
      const el = optionRefs.current[activeIndex];
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest' });
      }
    }, [activeIndex, isOpen]);

    const open = useCallback(() => {
      if (disabled) return;
      setIsOpen(true);
      setActiveIndex(() => {
        const firstSelectable = filteredOptions.findIndex((o) => !o.disabled);
        return firstSelectable >= 0 ? firstSelectable : 0;
      });
    }, [disabled, filteredOptions]);

    const close = useCallback(() => {
      setIsOpen(false);
      setSearch('');
    }, []);

    const toggle = useCallback(() => {
      if (isOpen) {
        close();
      } else {
        open();
      }
    }, [isOpen, open, close]);

    const selectValue = useCallback(
      (optionValue: string) => {
        let next: string[];
        if (multiple) {
          if (selectedValues.includes(optionValue)) {
            next = selectedValues.filter((v) => v !== optionValue);
          } else {
            next = [...selectedValues, optionValue];
          }
        } else {
          next = [optionValue];
        }
        if (!isControlled) {
          setInternalValue(next);
        }
        const emitted: SelectValue = multiple ? next : (next[0] ?? '');
        onChange?.(emitted);
        if (!multiple) {
          close();
        }
      },
      [multiple, selectedValues, isControlled, onChange, close],
    );

    const removeValue = useCallback(
      (optionValue: string) => {
        const next = selectedValues.filter((v) => v !== optionValue);
        if (!isControlled) {
          setInternalValue(next);
        }
        onChange?.(multiple ? next : (next[0] ?? ''));
      },
      [selectedValues, isControlled, multiple, onChange],
    );

    const handleTriggerKeyDown = useCallback(
      (event: PreactKeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return;
        switch (event.key) {
          case 'ArrowDown':
          case 'Enter':
          case ' ':
            event.preventDefault();
            if (!isOpen) open();
            break;
          case 'ArrowUp':
            event.preventDefault();
            if (!isOpen) open();
            break;
          case 'Escape':
            if (isOpen) {
              event.preventDefault();
              close();
            }
            break;
          case 'Home':
            if (isOpen && filteredOptions.length > 0) {
              event.preventDefault();
              setActiveIndex(0);
            }
            break;
          case 'End':
            if (isOpen && filteredOptions.length > 0) {
              event.preventDefault();
              setActiveIndex(filteredOptions.length - 1);
            }
            break;
        }
      },
      [disabled, isOpen, open, close, filteredOptions.length],
    );

    const handleOptionKeyDown = useCallback(
      (event: PreactKeyboardEvent<HTMLLIElement>, option: SelectOption) => {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setActiveIndex((prev) => {
              let next = prev + 1;
              while (next < filteredOptions.length && filteredOptions[next].disabled) next++;
              return next < filteredOptions.length ? next : prev;
            });
            break;
          case 'ArrowUp':
            event.preventDefault();
            setActiveIndex((prev) => {
              let next = prev - 1;
              while (next >= 0 && filteredOptions[next].disabled) next--;
              return next >= 0 ? next : prev;
            });
            break;
          case 'Enter':
          case ' ':
            event.preventDefault();
            if (!option.disabled) selectValue(option.value);
            break;
          case 'Escape':
            event.preventDefault();
            close();
            triggerRef.current?.focus();
            break;
          case 'Home':
            event.preventDefault();
            setActiveIndex(0);
            break;
          case 'End':
            event.preventDefault();
            setActiveIndex(filteredOptions.length - 1);
            break;
        }
      },
      [filteredOptions, selectValue, close],
    );

    const handleSearchInput = useCallback((event: Event) => {
      const target = event.target as HTMLInputElement;
      setSearch(target.value);
      setActiveIndex(0);
    }, []);

    const handleSearchKeyDown = useCallback(
      (event: PreactKeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setActiveIndex((prev) => {
              let next = prev + 1;
              while (next < filteredOptions.length && filteredOptions[next].disabled) next++;
              return next < filteredOptions.length ? next : prev;
            });
            optionRefs.current[activeIndex]?.focus();
            break;
          case 'Escape':
            event.preventDefault();
            close();
            triggerRef.current?.focus();
            break;
        }
      },
      [filteredOptions, activeIndex, close],
    );

    const resolvedAriaLabel = ariaLabel ?? placeholder;

    const wrapperClass = [
      'select',
      SIZE_CLASS[size],
      isOpen && 'select--open',
      hasError && 'select--error',
      disabled && 'select--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const triggerClass = [
      'select__trigger',
      hasError && 'select__trigger--error',
      disabled && 'select__trigger--disabled',
    ]
      .filter(Boolean)
      .join(' ');

    const triggerText = multiple
      ? selectedValues.length === 0
        ? placeholder ?? ''
        : ''
      : selectedValues.length > 0
        ? findLabel(options, selectedValues[0])
        : placeholder ?? '';

    const activeOption = filteredOptions[activeIndex];
    const activeOptionId = activeOption ? `option-${triggerId}-${activeIndex}` : undefined;

    return (
      <div ref={ref} className={wrapperClass} {...props}>
        {label !== undefined && (
          <label className="select__label" htmlFor={triggerId}>
            {label}
            {required && <span className="select__required" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="select__container" ref={containerRef}>
          <button
            ref={triggerRef}
            id={triggerId}
            type="button"
            role="combobox"
            className={triggerClass}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-activedescendant={isOpen ? activeOptionId : undefined}
            aria-invalid={hasError || undefined}
            aria-required={required || undefined}
            aria-describedby={hasError ? errorId : undefined}
            aria-label={resolvedAriaLabel}
            aria-labelledby={label !== undefined ? triggerId : undefined}
            onClick={toggle}
            onKeyDown={handleTriggerKeyDown}
          >
            <span className="select__value">
              {multiple ? (
                selectedValues.length === 0 ? (
                  <span className="select__placeholder">{placeholder}</span>
                ) : (
                  <span className="select__chips">
                    {selectedValues.map((val) => {
                      const chipLabel = findLabel(options, val);
                      return (
                        <span key={val} className="select__chip">
                          <span className="select__chipLabel">{chipLabel}</span>
                          <button
                            type="button"
                            className="select__chipClose"
                            aria-label={`Quitar ${chipLabel}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeValue(val);
                            }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="10"
                              height="10"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              aria-hidden="true"
                            >
                              <line x1="6" y1="6" x2="18" y2="18" />
                              <line x1="18" y1="6" x2="6" y2="18" />
                            </svg>
                          </button>
                        </span>
                      );
                    })}
                  </span>
                )
              ) : selectedValues.length > 0 ? (
                <>
                  {(() => {
                    const selectedOption = options.find((o) => o.value === selectedValues[0]);
                    return selectedOption?.icon !== undefined ? (
                      <span className="select__selectedIcon" aria-hidden="true">
                        {selectedOption.icon}
                      </span>
                    ) : null;
                  })()}
                  <span className="select__selectedText">{triggerText}</span>
                </>
              ) : (
                <span className="select__placeholder">{placeholder}</span>
              )}
            </span>
            <ChevronIcon />
          </button>

          {isOpen && (
            <div className="select__panel" role="presentation">
              {searchable && (
                <div className="select__search">
                  <svg
                    class="select__searchIcon"
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
                  <input
                    ref={searchRef}
                    type="text"
                    className="select__searchInput"
                    placeholder="Buscar..."
                    aria-label="Buscar opciones"
                    value={search}
                    onInput={handleSearchInput}
                    onKeyDown={handleSearchKeyDown}
                  />
                </div>
              )}
              <ul
                id={listboxId}
                className="select__listbox"
                role="listbox"
                aria-multiselectable={multiple || undefined}
              >
                {filteredOptions.length === 0 ? (
                  <li className="select__empty" role="presentation">
                    Sin resultados
                  </li>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = selectedValues.includes(option.value);
                    const isActive = index === activeIndex;
                    const optionClass = [
                      'select__option',
                      isActive && 'select__option--active',
                      isSelected && 'select__option--selected',
                      option.disabled && 'select__option--disabled',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <li
                        key={option.value}
                        id={`option-${triggerId}-${index}`}
                        ref={(el) => {
                          optionRefs.current[index] = el;
                        }}
                        className={optionClass}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled || undefined}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => {
                          if (!option.disabled) selectValue(option.value);
                        }}
                        onKeyDown={(e) => handleOptionKeyDown(e, option)}
                      >
                        {option.icon !== undefined && (
                          <span className="select__optionIcon" aria-hidden="true">
                            {option.icon}
                          </span>
                        )}
                        <span className="select__optionLabel">{option.label}</span>
                        {isSelected && <CheckIcon />}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}
        </div>

        {hasError && (
          <span id={errorId} className="select__errorMessage" role="alert">
            {error}
          </span>
        )}

        {name !== undefined && (
          <input
            type="hidden"
            name={name}
            value={multiple ? selectedValues.join(',') : selectedValues[0] ?? ''}
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
