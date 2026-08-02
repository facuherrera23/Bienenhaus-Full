import { toasts } from '../store/app';

const ICONS: Record<string, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
  warning: '!',
};

export function ToastHost() {
  return (
    <div className="toast-host" role="region" aria-label="Notificaciones">
      {toasts.value.map((t) => (
        <div className={`toast toast--${t.type}`} key={t.id} role="status">
          <span className="toast-icon" aria-hidden="true">
            {ICONS[t.type]}
          </span>
          <div className="toast-body">
            <strong>{t.title}</strong>
            {t.description && <span>{t.description}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
