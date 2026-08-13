import { type ComponentChild, type HTMLAttributes } from 'preact';
import { forwardRef } from 'preact/compat';

/**
 * EmptyState — friendly empty-state block for the Bienenhaus design system.
 *
 * Used inside lists, panels, tables and pages to communicate "there is nothing
 * here yet". Renders a centered flex column with an optional icon, a title,
 * an optional description and an optional action slot (usually a Button atom).
 *
 * Anatomy:
 *   .empty-state            — root wrapper (flex column, centered by default)
 *   .empty-state__icon      — decorative icon wrapper (aria-hidden)
 *   .empty-state__title     — primary heading (rendered as <p> for flexibility;
 *                             the parent decides the surrounding heading level)
 *   .empty-state__desc      — secondary description (max ~320px, centered)
 *   .empty-state__action    — slot for a parent-supplied action (Button, link…)
 *
 * The `action` prop is a slot: the parent passes whatever trigger it wants
 * (Button atom, anchor, custom node). EmptyState does NOT render a built-in
 * button — it only provides the layout slot below the description.
 *
 * Sizes:
 *   - `sm` — compact, for inline table/panel empties (smaller icon + title)
 *   - `md` — default, balanced (64px icon)
 *
 * Semantics:
 *   - The root carries `role="status"` so assistive tech announces the empty
 *     state when it appears dynamically.
 *   - The icon is decorative: the wrapper has `aria-hidden="true"`.
 *   - The title is a `<p>` (not a hardcoded `<h3>`) so each page can wrap the
 *     EmptyState in the heading level that fits its document outline.
 */
export type EmptyStateSize = 'sm' | 'md';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    /** Primary heading. Required — every empty state needs a clear label. */
    title: string;
    /** Optional supporting copy rendered under the title (max ~320px, centered). */
    description?: string;
    /** Optional decorative icon node rendered inside a muted circle. */
    icon?: ComponentChild;
    /** Optional action slot (Button atom, link, etc.) rendered below the description. */
    action?: ComponentChild;
    /** Density / scale. Default: `md`. */
    size?: EmptyStateSize;
    /** Center the block both axes. Default: `true`. Set `false` for left-aligned layouts. */
    centered?: boolean;
    /** Extra class name applied to the root wrapper. */
    className?: string;
}

const SIZE_CLASS: Record<EmptyStateSize, string> = {
    sm: 'empty-state--sm',
    md: 'empty-state--md',
};

/**
 * EmptyState — friendly empty-state block.
 *
 * - Flex column, centered both axes by default (`centered={false}` → left aligned).
 * - Icon in a 64px circle (`--bh-radius-full`) with `--bh-bg-secondary` bg and a
 *   `--bh-accent` tinted icon (color-mix 60% accent).
 * - Title: `--bh-text-lg` (sm → `--bh-text-sm`) weight semibold, `--bh-text-primary`.
 * - Description: `--bh-text-sm`, `--bh-text-secondary`, max-width 320px, centered.
 * - Action slot below with `--bh-space-4` margin-top.
 * - `role="status"` on the root so AT announces it when it appears.
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
    (
        {
            title,
            description,
            icon,
            action,
            size = 'md',
            centered = true,
            className = '',
            ...props
        },
        ref,
    ) => {
        const wrapperClass = [
            'empty-state',
            SIZE_CLASS[size],
            centered ? 'empty-state--centered' : 'empty-state--inline',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div ref={ref} className={wrapperClass} role="status" {...props}>
                {icon !== undefined && (
                    <span className="empty-state__icon" aria-hidden="true">
                        {icon}
                    </span>
                )}

                <p className="empty-state__title">{title}</p>

                {description !== undefined && <p className="empty-state__desc">{description}</p>}

                {action !== undefined && <div className="empty-state__action">{action}</div>}
            </div>
        );
    },
);

EmptyState.displayName = 'EmptyState';
