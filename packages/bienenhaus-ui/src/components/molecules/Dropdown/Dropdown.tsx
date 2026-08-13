import { type ComponentChild } from 'preact';
import { forwardRef, type KeyboardEvent as PreactKeyboardEvent } from 'preact/compat';
import { useCallback, useEffect, useId, useRef, useState } from 'preact/hooks';

export type DropdownAlign = 'start' | 'end';

export interface DropdownItem {
    /** Stable id (used as key + data-id). */
    id: string;
    /** Visible label text. */
    label: string;
    /** Optional leading icon (inline SVG or any ComponentChild). */
    icon?: ComponentChild;
    /** Renders the item in a destructive (danger) tone. */
    danger?: boolean;
    /** Disables selection and keyboard navigation for this item. */
    disabled?: boolean;
    /** When true, this entry renders a separator instead of an item. */
    divider?: boolean;
    /** Fired when the item is activated (click or Enter/Space). Closes the menu. */
    onSelect?: () => void;
}

export interface DropdownProps {
    /** The trigger node (wrapped in a button with aria-haspopup="menu"). */
    trigger: ComponentChild;
    /** List of items shown in the menu. Ignored when `children` is provided. */
    items?: DropdownItem[];
    /** Alternative to `items`: render arbitrary JSX directly inside the menu. */
    children?: ComponentChild;
    /** Menu alignment relative to the trigger. Default: 'start'. */
    align?: DropdownAlign;
    /** Accessible label for the menu panel (`role="menu"`). */
    label?: string;
    /** Controlled open state. When provided the dropdown is controlled. */
    open?: boolean;
    /** Initial open state for uncontrolled usage. Default: false. */
    defaultOpen?: boolean;
    /** Fired with the next open state (controlled + uncontrolled). */
    onOpenChange?: (open: boolean) => void;
    /** Extra class name applied to the root wrapper. */
    className?: string;
    /** Explicit id for the root element. Auto-generated when omitted. */
    id?: string;
}

/** Only selectable items: not a divider and not disabled. */
function isSelectable(item: DropdownItem): boolean {
    return !item.divider && !item.disabled;
}

/**
 * Dropdown — accessible floating menu molecule.
 *
 * Anatomy (plain string class names — project standard, see Switch/Tabs):
 *   .bh-dropdown-root  — root wrapper (position: relative)
 *   .trigger           — the toggle button wrapping the trigger node
 *   .triggerLabel      — the trigger's text node
 *   .chevron           — inline SVG chevron that rotates when open
 *   .menu              — absolutely-positioned floating panel (role="menu")
 *   .item              — a single menu item (role="menuitem")
 *   .itemIcon          — optional leading icon slot inside an item
 *   .itemLabel         — the item's text label
 *   .itemDanger        — modifier for destructive items
 *   .itemDisabled      — modifier for disabled items
 *   .itemActive        — modifier for the keyboard-active item (roving tabindex)
 *   .separator         — a divider entry (role="separator")
 *   .customContent     — wrapper for the `children` escape hatch
 *   .alignStart / .alignEnd — alignment modifiers on the root
 *   .open              — open state modifier on the root
 *
 * Behaviour:
 *   - Click trigger toggles; click outside closes; Escape closes; Tab closes.
 *   - ArrowDown / ArrowUp move focus between non-disabled items (roving tabindex).
 *   - Home / End jump to the first / last selectable item.
 *   - Enter / Space activate the focused item (fires its onSelect + closes).
 *   - Controlled via `open` + `onOpenChange`; uncontrolled via `defaultOpen`.
 *   - `align` controls which edge of the trigger the menu flushes to:
 *     'start' (default) = left edge, 'end' = right edge.
 *   - Items may be supplied via the `items` prop OR as `children` (children
 *     render verbatim inside the menu when the consumer needs full control).
 */
export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
    (
        {
            trigger,
            items,
            children,
            align = 'start',
            label,
            open: controlledOpen,
            defaultOpen = false,
            onOpenChange,
            className = '',
            id,
        },
        ref,
    ) => {
        const generatedId = useId();
        const rootId = id ?? generatedId;
        const menuId = `dropdown-menu-${rootId}`;

        const isControlled = controlledOpen !== undefined;
        const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen);
        const isOpen = isControlled ? (controlledOpen as boolean) : internalOpen;

        const rootRef = useRef<HTMLDivElement | null>(null);
        const triggerRef = useRef<HTMLButtonElement | null>(null);
        const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());
        /** Index of the currently-focused (roving tabindex) item. -1 = none. */
        const [activeIndex, setActiveIndex] = useState<number>(-1);

        /** The resolved item list (empty when children is provided). */
        const resolvedItems: DropdownItem[] = children !== undefined ? [] : (items ?? []);

        /** Set the open state via the right channel (controlled vs uncontrolled). */
        const setOpen = useCallback(
            (next: boolean) => {
                if (!isControlled) {
                    setInternalOpen(next);
                }
                onOpenChange?.(next);
            },
            [isControlled, onOpenChange],
        );

        /** Indices of selectable items (skips dividers + disabled). */
        const selectableIndices: number[] = [];
        for (let i = 0; i < resolvedItems.length; i += 1) {
            if (isSelectable(resolvedItems[i])) selectableIndices.push(i);
        }

        /** Move focus to the item at a given index and update roving tabindex. */
        const focusItem = useCallback((index: number) => {
            setActiveIndex(index);
            const el = itemRefs.current.get(index);
            if (el) {
                el.focus();
            }
        }, []);

        /** Move the active item by a delta, wrapping within selectable indices. */
        const moveActive = useCallback(
            (delta: number) => {
                if (selectableIndices.length === 0) return;
                const currentPos = activeIndex === -1 ? -1 : selectableIndices.indexOf(activeIndex);
                let nextPos = currentPos + delta;
                if (nextPos < 0) nextPos = selectableIndices.length - 1;
                if (nextPos > selectableIndices.length - 1) nextPos = 0;
                focusItem(selectableIndices[nextPos]);
            },
            [activeIndex, selectableIndices, focusItem],
        );

        /** Jump to the first / last selectable item. */
        const jumpTo = useCallback(
            (edge: 'first' | 'last') => {
                if (selectableIndices.length === 0) return;
                const idx =
                    edge === 'first'
                        ? selectableIndices[0]
                        : selectableIndices[selectableIndices.length - 1];
                focusItem(idx);
            },
            [selectableIndices, focusItem],
        );

        /** Activate the item at a given index (fire onSelect + close). */
        const activateIndex = useCallback(
            (index: number) => {
                const item = resolvedItems[index];
                if (!item || !isSelectable(item)) return;
                item.onSelect?.();
                setOpen(false);
            },
            [resolvedItems, setOpen],
        );

        /** Open the menu (focus is seeded by the open-effect below). */
        const openMenu = useCallback(() => {
            setOpen(true);
        }, [setOpen]);

        /** Close the menu and return focus to the trigger. */
        const closeMenu = useCallback(() => {
            setOpen(false);
            setActiveIndex(-1);
            triggerRef.current?.focus();
        }, [setOpen]);

        // ----- Click outside + Escape (document listeners, stable across renders) -----
        useEffect(() => {
            if (!isOpen) return;
            const handlePointerDown = (event: MouseEvent) => {
                const target = event.target as Node | null;
                if (target && rootRef.current && !rootRef.current.contains(target)) {
                    setOpen(false);
                }
            };
            const handleKey = (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                    setOpen(false);
                    triggerRef.current?.focus();
                }
            };
            document.addEventListener('mousedown', handlePointerDown);
            document.addEventListener('keydown', handleKey);
            return () => {
                document.removeEventListener('mousedown', handlePointerDown);
                document.removeEventListener('keydown', handleKey);
            };
        }, [isOpen, setOpen]);

        // ----- Seed focus on the first selectable item when the menu opens -----
        useEffect(() => {
            if (!isOpen) return;
            if (selectableIndices.length > 0) {
                focusItem(selectableIndices[0]);
            }
            // Only run on open transitions; item list changes are handled by nav.
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isOpen]);

        // ----- Trigger click -----
        const handleTriggerClick = useCallback(() => {
            if (isOpen) {
                setOpen(false);
            } else {
                openMenu();
            }
        }, [isOpen, openMenu, setOpen]);

        // ----- Menu keyboard navigation (roving tabindex: focus lives on items) -----
        const handleMenuKeyDown = useCallback(
            (event: PreactKeyboardEvent<HTMLUListElement>) => {
                switch (event.key) {
                    case 'ArrowDown':
                        event.preventDefault();
                        moveActive(1);
                        break;
                    case 'ArrowUp':
                        event.preventDefault();
                        moveActive(-1);
                        break;
                    case 'Home':
                        event.preventDefault();
                        jumpTo('first');
                        break;
                    case 'End':
                        event.preventDefault();
                        jumpTo('last');
                        break;
                    case 'Enter':
                    case ' ':
                        event.preventDefault();
                        if (activeIndex !== -1) {
                            activateIndex(activeIndex);
                        } else if (selectableIndices.length > 0) {
                            activateIndex(selectableIndices[0]);
                        }
                        break;
                    case 'Escape':
                        event.preventDefault();
                        closeMenu();
                        break;
                    case 'Tab':
                        // Tab closes the menu (focus naturally moves on).
                        setOpen(false);
                        break;
                }
            },
            [activeIndex, activateIndex, closeMenu, jumpTo, moveActive, selectableIndices, setOpen],
        );

        // ----- Item click -----
        const handleItemClick = useCallback(
            (index: number) => {
                activateIndex(index);
            },
            [activateIndex],
        );

        // ----- Item keydown (Enter/Space on a focused item also activates) -----
        const handleItemKeyDown = useCallback(
            (event: PreactKeyboardEvent<HTMLLIElement>, index: number) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    activateIndex(index);
                }
            },
            [activateIndex],
        );

        // Plain string class names — project standard (see Switch/Tabs molecules).
        // The CSS module file (Dropdown.module.css) targets these same plain names.
        const rootClass = [
            'bh-dropdown-root',
            align === 'end' ? 'alignEnd' : 'alignStart',
            isOpen && 'open',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div ref={ref} id={rootId} className={rootClass} data-open={isOpen}>
                <div ref={rootRef} className="inner">
                    <button
                        ref={triggerRef}
                        type="button"
                        className="trigger"
                        aria-haspopup="menu"
                        aria-expanded={isOpen}
                        aria-controls={isOpen ? menuId : undefined}
                        onClick={handleTriggerClick}
                    >
                        <span className="triggerLabel">{trigger}</span>
                        <svg
                            className="chevron"
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {isOpen && (
                        <ul
                            id={menuId}
                            role="menu"
                            aria-label={label}
                            className="menu"
                            tabIndex={-1}
                            onKeyDown={handleMenuKeyDown}
                        >
                            {children !== undefined ? (
                                <li className="customContent" role="none">
                                    {children}
                                </li>
                            ) : (
                                resolvedItems.map((item, index) => {
                                    if (item.divider) {
                                        return (
                                            <li
                                                key={item.id}
                                                role="separator"
                                                className="separator"
                                            />
                                        );
                                    }
                                    const itemClass = [
                                        'item',
                                        item.danger && 'itemDanger',
                                        item.disabled && 'itemDisabled',
                                        index === activeIndex && 'itemActive',
                                    ]
                                        .filter(Boolean)
                                        .join(' ');
                                    return (
                                        <li
                                            key={item.id}
                                            ref={(el) => {
                                                if (el) {
                                                    itemRefs.current.set(index, el);
                                                } else {
                                                    itemRefs.current.delete(index);
                                                }
                                            }}
                                            role="menuitem"
                                            className={itemClass}
                                            tabIndex={
                                                item.disabled ? -1 : index === activeIndex ? 0 : -1
                                            }
                                            aria-disabled={item.disabled || undefined}
                                            data-id={item.id}
                                            onClick={() => handleItemClick(index)}
                                            onKeyDown={(e) => handleItemKeyDown(e, index)}
                                        >
                                            {item.icon !== undefined && (
                                                <span className="itemIcon" aria-hidden="true">
                                                    {item.icon}
                                                </span>
                                            )}
                                            <span className="itemLabel">{item.label}</span>
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    )}
                </div>
            </div>
        );
    },
);

Dropdown.displayName = 'Dropdown';
