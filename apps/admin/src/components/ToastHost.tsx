import { AlertTriangle, Check, Info, type LucideIcon, X } from 'lucide-preact';
import { toasts } from '../store/app';
import type { ToastItem } from '../store/app';

const ICONS: Record<ToastItem['type'], LucideIcon> = {
    success: Check,
    error: X,
    info: Info,
    warning: AlertTriangle,
};

export function ToastHost() {
    return (
        <div className="toast-host" role="region" aria-label="Notificaciones">
            {toasts.value.map((t, index) => {
                const Icon = ICONS[t.type];
                return (
                    <div
                        className={`toast toast--${t.type}`}
                        key={t.id}
                        role="status"
                        style={{ '--toast-index': index } as preact.JSX.CSSProperties}
                    >
                        <span className="toast-icon" aria-hidden="true">
                            <Icon size={20} strokeWidth={2} />
                        </span>
                        <div className="toast-body">
                            <strong>{t.title}</strong>
                            {t.description && <span>{t.description}</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
