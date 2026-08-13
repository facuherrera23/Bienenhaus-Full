import { cloneElement, type ComponentChild, type JSX } from 'preact';
import { forwardRef } from 'preact/compat';
import { useEffect, useId, useRef, useState } from 'preact/hooks';
import styles from './Tooltip.module.css';

/**
 * Tooltip — accessible WAI-ARIA tooltip atom.
 *
 * Wraps a single trigger element and shows a floating `role="tooltip"` panel
 * on hover/focus. The trigger is cloned to receive `aria-describedby` and the
 * mouse/focus handlers; the tooltip element itself carries `role="tooltip"`,
 * an `id` (so `aria-describedby` resolves), and a `data-position` attribute
 * used by CSS for placement + arrow direction.
 *
 * Positioning is pure CSS (absolute on tooltip, relative on wrapper) using
 * `--bh-*` tokens for all spacing, color, radius, and shadow.
 *
 * Props:
 *   children    — single trigger element (cloned, must accept ref + handlers)
 *   content     — tooltip body (text or nodes)
 *   position    — 'top' | 'bottom' | 'left' | 'right' (default 'top')
 *   delay       — ms before show/hide (default 200)
 *   interactive — keep open while hovering the tooltip itself (default false)
 *   arrow       — render CSS arrow pointing at the trigger (default true)
 *   className   — merged onto the wrapper element
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
    /** Single trigger element. Cloned to attach aria + handlers. */
    children: ComponentChild;
    /** Tooltip body — text or any Preact node. */
    content: ComponentChild;
    /** Placement relative to the trigger. Default: 'top'. */
    position?: TooltipPosition;
    /** Show/hide delay in ms. Default: 200. */
    delay?: number;
    /** When true, hovering the tooltip content keeps it open. Default: false. */
    interactive?: boolean;
    /** Render the CSS arrow pointing at the trigger. Default: true. */
    arrow?: boolean;
    /** Extra class merged onto the wrapper. */
    className?: string;
}

const POSITION_CLASS: Record<TooltipPosition, string> = {
    top: styles.top,
    bottom: styles.bottom,
    left: styles.left,
    right: styles.right,
};

export const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(
    (
        {
            children,
            content,
            position = 'top',
            delay = 200,
            interactive = false,
            arrow = true,
            className,
        },
        ref,
    ) => {
        const generatedId = useId();
        const tooltipId = `tooltip-${generatedId}`;
        const [open, setOpen] = useState(false);
        const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
        const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

        // Cleanup any pending timers on unmount.
        useEffect(() => {
            return () => {
                if (showTimer.current) clearTimeout(showTimer.current);
                if (hideTimer.current) clearTimeout(hideTimer.current);
            };
        }, []);

        const clearShow = (): void => {
            if (showTimer.current) {
                clearTimeout(showTimer.current);
                showTimer.current = null;
            }
        };

        const clearHide = (): void => {
            if (hideTimer.current) {
                clearTimeout(hideTimer.current);
                hideTimer.current = null;
            }
        };

        const scheduleShow = (): void => {
            clearHide();
            if (delay <= 0) {
                setOpen(true);
                return;
            }
            showTimer.current = setTimeout(() => {
                setOpen(true);
                showTimer.current = null;
            }, delay);
        };

        const scheduleHide = (): void => {
            clearShow();
            if (delay <= 0) {
                setOpen(false);
                return;
            }
            hideTimer.current = setTimeout(() => {
                setOpen(false);
                hideTimer.current = null;
            }, delay);
        };

        // Handlers attached to the cloned trigger.
        const triggerHandlers: JSX.HTMLAttributes<HTMLElement> = {
            onMouseEnter: scheduleShow,
            onMouseLeave: scheduleHide,
            onFocus: scheduleShow,
            onBlur: scheduleHide,
        };

        // Handlers on the tooltip body — only active in interactive mode so the
        // panel stays mounted while the pointer is over its content.
        const tooltipHandlers: JSX.HTMLAttributes<HTMLElement> = interactive
            ? {
                  onMouseEnter: scheduleShow,
                  onMouseLeave: scheduleHide,
              }
            : {};

        // Clone the single child so we can wire aria-describedby + event handlers
        // without forcing consumers to forward props themselves.
        const trigger = cloneElement(children as JSX.Element, {
            'aria-describedby': open ? tooltipId : undefined,
            ...triggerHandlers,
        });

        const wrapperClass = [styles.wrapper, className].filter(Boolean).join(' ');

        const tooltipClass = [styles.tooltip, POSITION_CLASS[position], arrow && styles.withArrow]
            .filter(Boolean)
            .join(' ');

        return (
            <span ref={ref} className={wrapperClass}>
                {trigger}
                {open && (
                    <span
                        id={tooltipId}
                        role="tooltip"
                        data-position={position}
                        data-interactive={interactive ? 'true' : 'false'}
                        className={tooltipClass}
                        {...tooltipHandlers}
                    >
                        {content}
                    </span>
                )}
            </span>
        );
    },
);

Tooltip.displayName = 'Tooltip';
