import { type HTMLAttributes } from 'preact';
import { forwardRef, type ReactNode } from 'preact/compat';

/**
 * ToastHost — fixed-position toast notification stack atom.
 *
 * Renders a list of toast notifications in the bottom-right corner. The parent
 * owns the toast array and dismissal lifecycle (timeouts, removal) — this atom
 * is purely presentational. Use `pushToast` to generate IDs and build items.
 *
 * Variants: success | error | info | warning
 * Icons:   inline SVG (20×20, stroke=currentColor, stroke-width=2)
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

export interface ToastHostProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Toast items to render. Parent owns the array + dismissal. */
  toasts: ToastItem[];
  /** Called when a toast should be dismissed (click on the toast). */
  onDismiss?: (id: number) => void;
}

/* ============================================================
   ID GENERATOR — parent manages the array + timeout
   ============================================================ */
let toastSeq = 0;

/**
 * Builds a `ToastItem` with a generated unique id.
 *
 * The parent is responsible for pushing the result into its toast array and
 * scheduling removal (e.g. `setTimeout(() => remove(id), 4500)`).
 */
export function pushToast(item: Omit<ToastItem, 'id'>): ToastItem {
  const id = ++toastSeq;
  return { id, ...item };
}

/* ============================================================
   ICONS — inline SVG, 20×20, stroke=currentColor, stroke-width=2
   ============================================================ */
function ToastIcon({ type }: { type: ToastType }): ReactNode {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round' as const,
    'stroke-linejoin': 'round' as const,
    'aria-hidden': true,
  };

  switch (type) {
    case 'success':
      return (
        <svg {...common}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'error':
      return (
        <svg {...common}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12.01" y1="8" x2="12.01" y2="8" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...common}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 2.83h20.94a2 2 0 0 0 1.71-2.83L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
  }
}

/* ============================================================
   COMPONENT
   ============================================================ */
export const ToastHost = forwardRef<HTMLDivElement, ToastHostProps>(
  (
    {
      toasts,
      onDismiss,
      className = '',
      ...props
    },
    ref
  ) => {
    const hostClass = ['toast-host', className].filter(Boolean).join(' ');

    return (
      <div
        ref={ref}
        className={hostClass}
        role="region"
        aria-label="Notificaciones"
        {...props}
      >
        {toasts.map((t, index) => {
          const toastClass = ['toast', `toast--${t.type}`].filter(Boolean).join(' ');
          return (
            <div
              key={t.id}
              className={toastClass}
              role="status"
              style={{ '--toast-index': index } as preact.JSX.CSSProperties}
              onClick={onDismiss ? () => onDismiss(t.id) : undefined}
            >
              <span className="toast-icon" aria-hidden="true">
                <ToastIcon type={t.type} />
              </span>
              <div className="toast-body">
                <strong className="toast-title">{t.title}</strong>
                {t.description && <span className="toast-desc">{t.description}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

ToastHost.displayName = 'ToastHost';
