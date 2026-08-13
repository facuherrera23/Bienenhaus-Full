import { type HTMLAttributes } from 'preact';
import { forwardRef } from 'preact/compat';
import styles from './Divider.module.css';

/**
 * Divider — structural separator atom.
 *
 * Non-visual line used to separate content sections, either horizontally
 * (full width, fixed thickness) or vertically (full height, fixed thickness).
 * Supports three border styles (solid, dashed, dotted) and an optional
 * centered text label that breaks the line into two segments.
 *
 * Orientation: horizontal | vertical
 * Thickness:   thin (1px) | medium (2px) | thick (3px)
 * Variant:     solid | dashed | dotted
 * Label:       optional centered text (horizontal only renders the label)
 *
 * Renders a `<div>`; the label, when present, is wrapped in a `<span>`.
 */
export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerThickness = 'thin' | 'medium' | 'thick';
export type DividerVariant = 'solid' | 'dashed' | 'dotted';

export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
    /** Layout orientation. Default: 'horizontal'. */
    orientation?: DividerOrientation;
    /** Line thickness. Default: 'thin'. */
    thickness?: DividerThickness;
    /** Border style. Default: 'solid'. */
    variant?: DividerVariant;
    /** Optional centered text label that breaks the line in two. */
    label?: string;
}

const ORIENTATION_CLASS: Record<DividerOrientation, string> = {
    horizontal: styles.horizontal,
    vertical: styles.vertical,
};

const THICKNESS_CLASS: Record<DividerThickness, string> = {
    thin: styles.thin,
    medium: styles.medium,
    thick: styles.thick,
};

const VARIANT_CLASS: Record<DividerVariant, string> = {
    solid: styles.solid,
    dashed: styles.dashed,
    dotted: styles.dotted,
};

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
    (
        {
            orientation = 'horizontal',
            thickness = 'thin',
            variant = 'solid',
            label,
            className,
            ...props
        },
        ref,
    ) => {
        const hasLabel = Boolean(label);

        const classNames = [
            styles.divider,
            ORIENTATION_CLASS[orientation],
            THICKNESS_CLASS[thickness],
            VARIANT_CLASS[variant],
            hasLabel && styles.withLabel,
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div
                ref={ref}
                className={classNames}
                role="separator"
                aria-orientation={orientation as 'horizontal' | 'vertical'}
                {...props}
            >
                {hasLabel && (
                    <>
                        <span className={styles.line} aria-hidden="true" />
                        <span className={styles.label}>{label}</span>
                        <span className={styles.line} aria-hidden="true" />
                    </>
                )}
            </div>
        );
    },
);

Divider.displayName = 'Divider';
