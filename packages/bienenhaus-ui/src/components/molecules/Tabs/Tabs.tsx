import { type ComponentChild } from 'preact';
import { forwardRef, type KeyboardEvent } from 'preact/compat';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

export type TabsVariant = 'underline' | 'pills';

export interface TabItem {
    /** Stable unique id for the tab. Used to wire aria-controls / aria-labelledby. */
    id: string;
    /** Visible label text. */
    label: string;
    /** Optional leading icon (svg / component). */
    icon?: ComponentChild;
    /** When true the tab is not focusable, not clickable, and visually muted. */
    disabled?: boolean;
    /** Panel content rendered for the active tab. Inactive panels stay mounted but hidden. */
    content: ComponentChild;
}

export interface TabsProps {
    /** Ordered list of tabs. */
    tabs: TabItem[];
    /** Controlled active tab id. When provided the component is controlled. */
    activeId?: string;
    /** Initial active tab id for uncontrolled usage. Defaults to the first non-disabled tab. */
    defaultActiveId?: string;
    /** Fired with the new active tab id. */
    onChange?: (id: string) => void;
    /** Visual style — `underline` (default) or `pills`. */
    variant?: TabsVariant;
    /** Extra class name applied to the root wrapper. */
    className?: string;
}

const VARIANT_CLASS: Record<TabsVariant, string> = {
    underline: 'tabs--underline',
    pills: 'tabs--pills',
};

/**
 * Tabs — accessible tablist built following WAI-ARIA Authoring Practices.
 *
 * - Controlled via `activeId` + `onChange`, or uncontrolled via `defaultActiveId`.
 * - Roving tabindex: only the active (or first focusable) tab has tabindex 0,
 *   the rest have tabindex -1. Disabled tabs have tabindex -1 and are skipped.
 * - Keyboard: ArrowLeft/Right move focus + activate the next non-disabled tab,
 *   Home/End jump to first/last focusable tab, Enter/Space activate the focused tab.
 * - Inactive panels are kept mounted but carry the `hidden` attribute so their
 *   internal state (scroll position, form inputs, video) is preserved.
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
    ({ tabs, activeId, defaultActiveId, onChange, variant = 'underline', className = '' }, ref) => {
        const tablistRef = useRef<HTMLDivElement>(null);

        const isControlled = activeId !== undefined;
        const firstEnabledId = tabs.find((t) => !t.disabled)?.id ?? tabs[0]?.id ?? '';
        const [internalActive, setInternalActive] = useState<string>(
            defaultActiveId ?? firstEnabledId,
        );
        const currentId = isControlled ? (activeId as string) : internalActive;

        // Keep internal state in sync when a controlled parent changes activeId.
        useEffect(() => {
            if (isControlled) {
                setInternalActive(activeId as string);
            }
        }, [activeId, isControlled]);

        const activate = useCallback(
            (id: string) => {
                if (!isControlled) {
                    setInternalActive(id);
                }
                onChange?.(id);
            },
            [isControlled, onChange],
        );

        const enabledIds = tabs.filter((t) => !t.disabled).map((t) => t.id);

        const focusTab = useCallback((id: string) => {
            const el = tablistRef.current?.querySelector<HTMLElement>(
                `[data-tab-id="${CSS.escape(id)}"]`,
            );
            el?.focus();
        }, []);

        const moveTo = useCallback(
            (delta: number) => {
                const idx = enabledIds.indexOf(currentId);
                if (idx === -1) return;
                const count = enabledIds.length;
                if (count === 0) return;
                // wrap around
                const next = (idx + delta + count) % count;
                const nextId = enabledIds[next];
                activate(nextId);
                focusTab(nextId);
            },
            [enabledIds, currentId, activate, focusTab],
        );

        const moveToEdge = useCallback(
            (edge: 'first' | 'last') => {
                if (enabledIds.length === 0) return;
                const targetId =
                    edge === 'first' ? enabledIds[0] : enabledIds[enabledIds.length - 1];
                activate(targetId);
                focusTab(targetId);
            },
            [enabledIds, activate, focusTab],
        );

        const handleKeyDown = useCallback(
            (event: KeyboardEvent<HTMLDivElement>) => {
                switch (event.key) {
                    case 'ArrowRight':
                        event.preventDefault();
                        moveTo(1);
                        break;
                    case 'ArrowLeft':
                        event.preventDefault();
                        moveTo(-1);
                        break;
                    case 'Home':
                        event.preventDefault();
                        moveToEdge('first');
                        break;
                    case 'End':
                        event.preventDefault();
                        moveToEdge('last');
                        break;
                    case 'Enter':
                    case ' ':
                    case 'Spacebar': {
                        event.preventDefault();
                        const target = event.target as HTMLElement;
                        const id = target.getAttribute('data-tab-id');
                        if (id) activate(id);
                        break;
                    }
                    default:
                        break;
                }
            },
            [moveTo, moveToEdge, activate],
        );

        const rootClass = ['tabs', VARIANT_CLASS[variant], className].filter(Boolean).join(' ');

        return (
            <div ref={ref} className={rootClass} data-active={currentId}>
                <div
                    ref={tablistRef}
                    className="tabs__list"
                    role="tablist"
                    aria-orientation="horizontal"
                    onKeyDown={handleKeyDown}
                >
                    {tabs.map((tab) => {
                        const isActive = tab.id === currentId;
                        const isDisabled = tab.disabled === true;
                        const tabClass = [
                            'tabs__tab',
                            isActive && 'tabs__tab--active',
                            isDisabled && 'tabs__tab--disabled',
                        ]
                            .filter(Boolean)
                            .join(' ');

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                id={`tab-${tab.id}`}
                                data-tab-id={tab.id}
                                className={tabClass}
                                aria-selected={isActive}
                                aria-controls={`panel-${tab.id}`}
                                aria-disabled={isDisabled || undefined}
                                tabIndex={isDisabled ? -1 : isActive ? 0 : -1}
                                disabled={isDisabled}
                                onClick={() => {
                                    if (isDisabled) return;
                                    activate(tab.id);
                                }}
                            >
                                {tab.icon !== undefined && (
                                    <span className="tabs__icon" aria-hidden="true">
                                        {tab.icon}
                                    </span>
                                )}
                                <span className="tabs__label">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="tabs__panels">
                    {tabs.map((tab) => {
                        const isActive = tab.id === currentId;
                        return (
                            <div
                                key={tab.id}
                                id={`panel-${tab.id}`}
                                className="tabs__panel"
                                role="tabpanel"
                                aria-labelledby={`tab-${tab.id}`}
                                hidden={!isActive}
                                tabIndex={0}
                            >
                                {tab.content}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    },
);

Tabs.displayName = 'Tabs';
