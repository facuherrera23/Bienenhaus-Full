import { type HTMLAttributes } from 'preact';
import { forwardRef, type ReactNode } from 'preact/compat';
import styles from './Breadcrumb.module.css';

/**
 * Breadcrumb — hierarchical trail molecule.
 *
 * Renders a `<nav aria-label="breadcrumb">` with `<ol>`/`<li>` semantics.
 * The LAST item is the current page (non-link, `aria-current="page"`).
 * Intermediate items with `href` render as links; without `href` as plain text.
 *
 * Never shows more than `maxItems` (default 4) visible levels. When items
 * exceed the limit, the middle items collapse into a clickable ellipsis button
 * (`title="Mostrar anteriores"`). The first and last items are always visible.
 *
 * Labels longer than ~28 chars are truncated with CSS ellipsis and a `title`
 * attribute carrying the full text.
 */
export interface BreadcrumbItem {
    /** Visible label for the crumb. Truncated with ellipsis if > ~28 chars. */
    label: string;
    /** Optional href. When present (and not the last item) renders as a link. */
    href?: string;
}

export interface BreadcrumbProps extends Omit<HTMLAttributes<HTMLElement>, 'items'> {
    /** Ordered list of breadcrumb items, root → current page. */
    items: BreadcrumbItem[];
    /** Max visible levels before collapsing the middle into an ellipsis. Default: 4. */
    maxItems?: number;
    /** Click handler for the ellipsis button (collapsed middle). */
    onExpand?: () => void;
}

/** Threshold (in characters) above which a label is truncated with ellipsis. */
const LABEL_MAX_CHARS = 28;

/**
 * Chevron-right separator — inline SVG matching the icon approach used by
 * existing atoms (inline SVG, currentColor, no external dependency).
 */
const ChevronRight = () => (
    <svg
        class={styles.separator}
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <polyline points="9 6 15 12 9 18" />
    </svg>
);

/**
 * Compute the visible items, inserting an ellipsis placeholder in the middle
 * when the total count exceeds `maxItems`. The first and last items are always
 * kept; the collapse happens between them. The returned array's final element
 * is always the original last item (the current page).
 */
function collapseItems<T>(items: readonly T[], maxItems: number): readonly (T | null)[] {
    if (items.length <= maxItems) {
        return items;
    }
    // Always keep the first item and the last (current page). Fill the rest of
    // the budget with the most recent items before the current page.
    const visibleTail = maxItems - 1; // last item + (maxItems - 2) items before it
    const head = items[0];
    const tail = items.slice(items.length - visibleTail + 1);
    return [head, null, ...tail];
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
    ({ items, maxItems = 4, onExpand, className, ...props }, ref) => {
        const classNames = [styles.nav, className].filter(Boolean).join(' ');
        const rendered = collapseItems(items, maxItems);
        const lastRenderedIndex = rendered.length - 1;

        return (
            <nav ref={ref} aria-label="breadcrumb" className={classNames} {...props}>
                <ol className={styles.list}>
                    {rendered.map((item, index) => {
                        // Ellipsis slot — clickable button placeholder for collapsed middle.
                        if (item === null) {
                            return (
                                <li className={styles.item} key={`ellipsis-${index}`}>
                                    <button
                                        type="button"
                                        className={styles.ellipsis}
                                        title="Mostrar anteriores"
                                        aria-label="Mostrar anteriores"
                                        onClick={onExpand}
                                    >
                                        …
                                    </button>
                                    <ChevronRight />
                                </li>
                            );
                        }

                        // The last rendered slot is always the current page: collapseItems
                        // preserves the original last item at the end of the returned array.
                        const isCurrent = index === lastRenderedIndex;
                        const truncated = item.label.length > LABEL_MAX_CHARS;
                        const titleAttr = truncated ? item.label : undefined;

                        let content: ReactNode;
                        if (isCurrent) {
                            // Current page — non-link, strong text, aria-current.
                            // Attributes live on the text-bearing span so DOM queries resolve here, not a wrapper.
                            content = (
                                <span
                                    className={`${styles.current} ${styles.label}`}
                                    aria-current="page"
                                    title={titleAttr}
                                >
                                    {item.label}
                                </span>
                            );
                        } else if (item.href !== undefined) {
                            // Intermediate link.
                            content = (
                                <a
                                    href={item.href}
                                    className={`${styles.link} ${styles.label}`}
                                    title={titleAttr}
                                >
                                    {item.label}
                                </a>
                            );
                        } else {
                            // Intermediate plain text (non-clickable).
                            content = (
                                <span
                                    className={`${styles.text} ${styles.label}`}
                                    title={titleAttr}
                                >
                                    {item.label}
                                </span>
                            );
                        }

                        return (
                            <li className={styles.item} key={`${item.label}-${index}`}>
                                {content}
                                {!isCurrent && <ChevronRight />}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        );
    },
);

Breadcrumb.displayName = 'Breadcrumb';
