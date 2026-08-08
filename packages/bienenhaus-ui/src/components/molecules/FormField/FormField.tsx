import { type ComponentChildren } from 'preact';
import { useId } from 'preact/hooks';
import styles from './FormField.module.css';

export interface FormFieldProps {
  /** Visible label text rendered above the control. */
  label?: string;
  /** Explicit `htmlFor` for the `<label>`. When omitted, the label is not associated to a control. */
  htmlFor?: string;
  /** Helper text rendered under the control. Ignored visually when `error` is set. */
  hint?: string;
  /** Error text rendered under the control. Takes precedence over `hint`. */
  error?: string;
  /** Marks the field as required — renders `*` on the label and sets `aria-required` context. */
  required?: boolean;
  /** The form control(s) to wrap. */
  children: ComponentChildren;
  /** Extra class name applied to the root wrapper. */
  className?: string;
  /** Explicit id for the field group. Auto-generated via `useId` when omitted. */
  id?: string;
}

/**
 * FormField — layout molecule that wraps any form control with a label,
 * helper hint, and error message, wiring accessibility attributes for
 * screen-reader users.
 *
 * - **Label**: rendered as a `<label>` with `htmlFor` when provided.
 * - **Hint**: muted helper text under the control (`--bh-text-tertiary`).
 * - **Error**: red text under the control with `role="alert"`; takes
 *   precedence over `hint` when both are supplied.
 * - **Required**: renders a `*` marker on the label and exposes
 *   `aria-required="true"` on the wrapper.
 * - The wrapper carries `aria-describedby` pointing at the hint/error id
 *   so the consumer control can reference it, and a stable `id` so the
 *   control can be labelled via `aria-labelledby` when desired.
 *
 * The consumer is responsible for setting `aria-invalid` on the control
 * itself — FormField only renders the error text and wires the ids.
 */
export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  children,
  className = '',
  id,
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const descriptionId = `${fieldId}-description`;

  const rootClass = [styles.field, className].filter(Boolean).join(' ');

  // Error takes visual precedence over hint.
  const description = error ?? hint;
  const isError = Boolean(error);

  return (
    <div
      className={rootClass}
      id={fieldId}
      aria-required={required || undefined}
      aria-describedby={description ? descriptionId : undefined}
    >
      {label !== undefined && (
        <label className={styles.label} htmlFor={htmlFor}>
          <span className={styles.labelText}>
            {label}
          </span>
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {description !== undefined && (
        <p
          id={descriptionId}
          className={isError ? styles.error : styles.hint}
          role={isError ? 'alert' : undefined}
        >
          {description}
        </p>
      )}
    </div>
  );
}
