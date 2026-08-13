import { type HTMLAttributes } from 'preact';
import { forwardRef } from 'preact/compat';
import { IconButton } from '../../atoms/IconButton';
import styles from './Pagination.module.css';

/**
 * Pagination — page navigation molecule.
 *
 * Renders a `<nav aria-label="Paginación">` containing:
 *   - Prev/next `IconButton` atoms (chevron-left / chevron-right inline SVGs),
 *     disabled on the first/last page respectively.
 *   - A windowed list of page-number buttons with `aria-current="page"` on the
 *     active page. Gaps are collapsed into a single non-interactive ellipsis
 *     span ("…") per side. Never more than 7 slots.
 *   - Optional page-size selector (native `<select>`) rendered only when BOTH
 *     `pageSize` and `onPageSizeChange` are provided.
 *   - Optional total-items count text ("X elementos") rendered muted when
 *     `totalItems` is provided.
 *
 * Windowing logic: `getPageItems(page, totalPages)` returns an array of
 * `(number | 'ellipsis')` with `siblingCount = 1` — always shows the first
 * and last page, the current page ±1, and a single ellipsis on each side when
 * a gap exists. The result never exceeds 7 slots.
 */
export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
    /** Current page number (1-based). */
    page: number;
    /** Total number of pages. */
    totalPages: number;
    /** Called with the new page number when a page button or prev/next is clicked. */
    onPageChange: (page: number) => void;
    /** Available page-size options. Renders the `<select>` only when `pageSize` + `onPageSizeChange` are also given. */
    pageSizeOptions?: number[];
    /** Currently selected page size. Renders the `<select>` only when `pageSizeOptions` + `onPageSizeChange` are also given. */
    pageSize?: number;
    /** Called with the new page size when the selector changes. */
    onPageSizeChange?: (pageSize: number) => void;
    /** Total item count. When provided, renders a muted "X elementos" text. */
    totalItems?: number;
    /** Accessible label for the `<nav>`. Default: "Paginación". */
    'aria-label'?: string;
}

/** Slot is either a concrete page number or an ellipsis placeholder. */
export type PageItem = number | 'ellipsis';

/** Sibling count on each side of the current page. */
const SIBLING_COUNT = 1;
/** First + last + current + (sibling * 2) + (ellipsis * 2) = 7 max slots. */
const MAX_SLOTS = 7;

/**
 * Compute the windowed page items for a given position.
 *
 * Rules (siblingCount = 1, max 7 slots):
 *   - Always include the first page (1) and the last page (totalPages).
 *   - Always include the current page and its `siblingCount` neighbours.
 *   - When an ellipsis is omitted on one side (boundary merges with the
 *     sibling window), the window expands on the opposite side so the slot
 *     budget is still used — e.g. page 1 of 12 yields `[1, 2, 3, …, 12]`,
 *     not `[1, 2, …, 12]`.
 *   - Insert a single `'ellipsis'` slot on each side where a gap of more than
 *     one page exists between the boundary and the (possibly expanded) window.
 *   - Never return more than 7 slots.
 *
 * Special cases:
 *   - `totalPages <= MAX_SLOTS`: return every page, no ellipsis.
 *   - Current near the start: left boundary merges with siblings (no left
 *     ellipsis); right ellipsis present and the window extends right by one.
 *   - Current near the end: mirror of the start case.
 */
export function getPageItems(page: number, totalPages: number): PageItem[] {
    // Defensive: clamp inputs to a sane range.
    const safeTotal = Math.max(1, Math.floor(totalPages));
    const safePage = Math.min(Math.max(1, Math.floor(page)), safeTotal);

    // Small total: show everything, no ellipsis needed.
    if (safeTotal <= MAX_SLOTS) {
        return Array.from({ length: safeTotal }, (_, i) => i + 1);
    }

    const first = 1;
    const last = safeTotal;

    // Base sibling window: current ± SIBLING_COUNT, clamped to [first, last].
    const leftSibling = Math.max(safePage - SIBLING_COUNT, first);
    const rightSibling = Math.min(safePage + SIBLING_COUNT, last);

    // Show left ellipsis when there's a gap of more than one page between the
    // first page and the left edge of the sibling window.
    const showLeftEllipsis = leftSibling - first > 1;
    // Mirror for the right side.
    const showRightEllipsis = last - rightSibling > 1;

    // The window must never include the boundary pages (first/last are added
    // separately), so clamp to the interior range [first+1, last-1].
    let windowStart = Math.max(leftSibling, first + 1);
    let windowEnd = Math.min(rightSibling, last - 1);

    // When the current page sits at a boundary, one sibling is missing and the
    // window shrinks below 2*SIBLING_COUNT elements. Extend the opposite side by
    // one to keep the slot budget balanced (e.g. page 1 → [2,3], not just [2]).
    const windowSize = Math.max(0, windowEnd - windowStart + 1);
    if (!showLeftEllipsis && showRightEllipsis && windowSize < 2 * SIBLING_COUNT) {
        windowEnd = Math.min(windowEnd + 1, last - 1);
    } else if (showLeftEllipsis && !showRightEllipsis && windowSize < 2 * SIBLING_COUNT) {
        windowStart = Math.max(windowStart - 1, first + 1);
    }

    const items: PageItem[] = [first];

    if (showLeftEllipsis) {
        items.push('ellipsis');
    }

    for (let p = windowStart; p <= windowEnd; p += 1) {
        items.push(p);
    }

    if (showRightEllipsis) {
        items.push('ellipsis');
    }

    items.push(last);
    return items;
}

/** Chevron-left inline SVG — matches the icon approach of existing atoms. */
const ChevronLeft = () => (
    <svg
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

/** Chevron-right inline SVG — matches the icon approach of existing atoms. */
const ChevronRight = () => (
    <svg
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

export const Pagination = forwardRef<HTMLElement, PaginationProps>(
    (
        {
            page,
            totalPages,
            onPageChange,
            pageSizeOptions,
            pageSize,
            onPageSizeChange,
            totalItems,
            className,
            'aria-label': ariaLabel = 'Paginación',
            ...props
        },
        ref,
    ) => {
        const classNames = [styles.nav, className].filter(Boolean).join(' ');
        const items = getPageItems(page, totalPages);
        const safeTotal = Math.max(1, Math.floor(totalPages));
        const safePage = Math.min(Math.max(1, Math.floor(page)), safeTotal);

        const showPageSizeSelector =
            pageSizeOptions !== undefined &&
            pageSizeOptions.length > 0 &&
            pageSize !== undefined &&
            onPageSizeChange !== undefined;

        const showTotalItems = totalItems !== undefined;

        const handlePageClick = (p: number) => () => {
            if (p !== safePage) {
                onPageChange(p);
            }
        };

        const handlePrev = () => {
            if (safePage > 1) {
                onPageChange(safePage - 1);
            }
        };

        const handleNext = () => {
            if (safePage < safeTotal) {
                onPageChange(safePage + 1);
            }
        };

        const handlePageSizeChange = (event: Event) => {
            const target = event.target as HTMLSelectElement;
            const value = Number(target.value);
            if (Number.isFinite(value) && onPageSizeChange !== undefined) {
                onPageSizeChange(value);
            }
        };

        return (
            <nav ref={ref} aria-label={ariaLabel} className={classNames} {...props}>
                <IconButton
                    type="button"
                    variant="outline"
                    size="md"
                    aria-label="Página anterior"
                    disabled={safePage <= 1}
                    onClick={handlePrev}
                >
                    <ChevronLeft />
                </IconButton>

                <ul className={styles.list}>
                    {items.map((item, index) => {
                        if (item === 'ellipsis') {
                            return (
                                <li
                                    className={styles.item}
                                    key={`ellipsis-${index}`}
                                    aria-hidden="true"
                                >
                                    <span className={styles.ellipsis}>…</span>
                                </li>
                            );
                        }
                        const isActive = item === safePage;
                        return (
                            <li className={styles.item} key={`page-${item}`}>
                                <button
                                    type="button"
                                    className={
                                        isActive
                                            ? `${styles.pageBtn} ${styles.pageBtnActive}`
                                            : styles.pageBtn
                                    }
                                    aria-current={isActive ? 'page' : undefined}
                                    aria-label={`Página ${item}`}
                                    onClick={handlePageClick(item)}
                                >
                                    {item}
                                </button>
                            </li>
                        );
                    })}
                </ul>

                <IconButton
                    type="button"
                    variant="outline"
                    size="md"
                    aria-label="Página siguiente"
                    disabled={safePage >= safeTotal}
                    onClick={handleNext}
                >
                    <ChevronRight />
                </IconButton>

                {showPageSizeSelector && pageSizeOptions !== undefined && pageSize !== undefined ? (
                    <label className={styles.pageSize}>
                        <span className={styles.pageSizeLabel}>Filas por página</span>
                        <select
                            className={styles.pageSizeSelect}
                            value={String(pageSize)}
                            onChange={handlePageSizeChange}
                            aria-label="Cantidad de filas por página"
                        >
                            {pageSizeOptions.map((opt) => (
                                <option key={opt} value={String(opt)}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </label>
                ) : null}

                {showTotalItems ? (
                    <span className={styles.totalItems}>{totalItems} elementos</span>
                ) : null}
            </nav>
        );
    },
);

Pagination.displayName = 'Pagination';
