import { type ChangeEvent, forwardRef } from 'preact/compat';
import { useCallback, useId, useState } from 'preact/hooks';

export type RadioGroupLayout = 'stacked' | 'inline';
export type RadioGroupSize = 'sm' | 'md';

export interface RadioOption {
    /** Value emitted to `onChange` when this option is selected. */
    value: string;
    /** Visible label rendered next to the radio circle. */
    label: string;
    /** Disables just this option (dims + blocks interaction). */
    disabled?: boolean;
    /** Optional muted helper text rendered under the option label. */
    hint?: string;
}

export interface RadioGroupProps extends Omit<
    preact.JSX.HTMLAttributes<HTMLFieldSetElement>,
    'onChange' | 'value' | 'defaultValue' | 'disabled' | 'role' | 'aria-label' | 'children'
> {
    /** Available options. Each renders a native radio input + custom circle. */
    options: RadioOption[];
    /** Controlled selected value. When provided the group is controlled. */
    value?: string;
    /** Initial selected value for uncontrolled usage. */
    defaultValue?: string;
    /** Fired with the selected option's value. */
    onChange?: (value: string) => void;
    /** Group name for the native radio inputs. Auto-generated via `useId` when omitted. */
    name?: string;
    /** Visible legend rendered inside the `<fieldset>`. Falls back to `aria-label` when omitted. */
    legend?: string;
    /** Layout direction of the options. `stacked` (default) or `inline`. */
    layout?: RadioGroupLayout;
    /** Disables the entire group (dims + blocks all interaction). */
    disabled?: boolean;
    /** Size of the radio circle + label. `md` (default) or `sm`. */
    size?: RadioGroupSize;
    /** Accessible label for the radiogroup when no `legend` is provided. */
    'aria-label'?: string;
    /** Extra class name applied to the root fieldset. */
    className?: string;
}

const LAYOUT_CLASS: Record<RadioGroupLayout, string> = {
    stacked: 'radioGroup--stacked',
    inline: 'radioGroup--inline',
};

const SIZE_CLASS: Record<RadioGroupSize, string> = {
    sm: 'radioGroup--sm',
    md: 'radioGroup--md',
};

/**
 * RadioGroup — accessible single-choice list built on native `<input type="radio">`.
 *
 * - Renders a `<fieldset role="radiogroup">` with an optional `<legend>`.
 * - Controlled via `value` + `onChange`, or uncontrolled via `defaultValue`.
 * - Each option pairs a visually-hidden native radio (keyboard + form submission)
 *   with a custom circle indicator. Clicking the `<label>` toggles the input.
 * - `aria-label` is required when no `legend` is supplied.
 */
export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(
    (
        {
            options,
            value,
            defaultValue,
            onChange,
            name,
            legend,
            layout = 'stacked',
            disabled = false,
            size = 'md',
            className = '',
            'aria-label': ariaLabel,
            ...props
        },
        ref,
    ) => {
        const generatedName = useId();
        const groupName = name ?? generatedName;
        const isControlled = value !== undefined;
        const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
        const selectedValue = isControlled ? (value as string) : internalValue;

        const handleChange = useCallback(
            (event: ChangeEvent<HTMLInputElement>) => {
                if (disabled || event.currentTarget.disabled) {
                    return;
                }
                const next = event.currentTarget.value;
                if (!isControlled) {
                    setInternalValue(next);
                }
                onChange?.(next);
            },
            [disabled, isControlled, onChange],
        );

        const rootClass = [
            'radioGroup',
            LAYOUT_CLASS[layout],
            SIZE_CLASS[size],
            disabled && 'radioGroup--disabled',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        const groupAriaLabel = legend ? undefined : ariaLabel;

        return (
            <fieldset
                ref={ref}
                role="radiogroup"
                className={rootClass}
                disabled={disabled}
                aria-label={groupAriaLabel}
                {...props}
            >
                {legend !== undefined && <legend className="radioGroup__legend">{legend}</legend>}
                <div className="radioGroup__options">
                    {options.map((option) => {
                        const optionId = `${groupName}-${option.value}`;
                        const isOptionDisabled = disabled || option.disabled === true;
                        const isChecked = selectedValue === option.value;
                        const optionClass = [
                            'radioGroup__option',
                            isOptionDisabled && 'radioGroup__option--disabled',
                            isChecked && 'radioGroup__option--checked',
                        ]
                            .filter(Boolean)
                            .join(' ');

                        return (
                            <div
                                key={option.value}
                                className={optionClass}
                                data-checked={isChecked}
                            >
                                <input
                                    id={optionId}
                                    type="radio"
                                    name={groupName}
                                    value={option.value}
                                    className="radioGroup__input"
                                    checked={isChecked}
                                    defaultChecked={isControlled ? undefined : isChecked}
                                    disabled={isOptionDisabled}
                                    aria-checked={isChecked}
                                    onChange={handleChange}
                                />
                                <label htmlFor={optionId} className="radioGroup__label">
                                    <span className="radioGroup__circle" aria-hidden="true">
                                        <span className="radioGroup__dot" />
                                    </span>
                                    <span className="radioGroup__text">
                                        <span className="radioGroup__labelText">
                                            {option.label}
                                        </span>
                                        {option.hint !== undefined && (
                                            <span className="radioGroup__hint">{option.hint}</span>
                                        )}
                                    </span>
                                </label>
                            </div>
                        );
                    })}
                </div>
            </fieldset>
        );
    },
);

RadioGroup.displayName = 'RadioGroup';
