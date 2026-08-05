import { MessageSquare, Phone, Mail, Calendar, FileText, Send, X } from 'lucide-preact';
import type { CommunicationRow, CommunicationType } from '../../types/owners';
import {
  COMMUNICATION_TYPE_LABEL,
  COMMUNICATION_STATUS_LABEL,
  COMMUNICATION_STATUS_TONE,
} from '../../types/owners';

interface CommunicationTimelineProps {
  communications: CommunicationRow[];
  onEdit?: (comm: CommunicationRow) => void;
  onDelete?: (commId: string) => void;
  onResend?: (commId: string) => void;
}

const TYPE_ICONS: Record<CommunicationType, any> = {
  whatsapp: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Calendar,
  report: FileText,
  note: FileText,
};

export function CommunicationTimeline({ communications, onEdit, onDelete, onResend }: CommunicationTimelineProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (communications.length === 0) {
    return (
      <div className="timeline-empty">
        <MessageSquare size={48} className="empty-icon" />
        <h3>Sin comunicaciones</h3>
        <p>No hay registros de comunicación con este propietario.</p>
      </div>
    );
  }

  return (
    <div className="communication-timeline">
      <ul className="timeline-list" role="list">
        {communications.map((comm, index) => {
          const Icon = TYPE_ICONS[comm.type];
          const isLast = index === communications.length - 1;

          return (
            <li key={comm.id} className="timeline-item" style={{ '--timeline-color': `var(--color-${COMMUNICATION_STATUS_TONE[comm.status]})` }}>
              <div className="timeline-marker">
                <div className={`timeline-dot status-${comm.status}`} />
                {(!isLast) && <div className="timeline-line" />}
              </div>

              <div className="timeline-content">
                <div className="timeline-header">
                  <div className="timeline-type">
                    <Icon size={16} />
                    <span>{COMMUNICATION_TYPE_LABEL[comm.type]}</span>
                  </div>
                  <div className="timeline-meta">
                    <span className={`badge badge--${COMMUNICATION_STATUS_TONE[comm.status]}`}>
                      {COMMUNICATION_STATUS_LABEL[comm.status]}
                    </span>
                    <time dateTime={comm.created_at}>{formatDate(comm.created_at)}</time>
                  </div>
                </div>

                {comm.subject && (
                  <h4 className="timeline-subject">{comm.subject}</h4>
                )}

                {comm.content && (
                  <p className="timeline-content-text">{comm.content}</p>
                )}

                {comm.property_title && (
                  <div className="timeline-property">
                    🏠 {comm.property_title}
                  </div>
                )}

                <div className="timeline-footer">
                  {comm.sent_by_name && (
                    <span className="sent-by">
                      <span className="sent-by-label">Enviado por:</span>
                      {comm.sent_by_name}
                    </span>
                  )}
                  {comm.type === 'whatsapp' && comm.status === 'sent' && (
                    <a
                      href={`https://wa.me/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resend-link"
                    >
                      <Send size={14} /> Reenviar por WhatsApp
                    </a>
                  )}
                  {comm.status === 'draft' && onResend && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => onResend(comm.id)}
                    >
                      <Send size={14} /> Enviar
                    </button>
                  )}
                  {comm.status === 'failed' && onResend && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm btn--danger"
                      onClick={() => onResend(comm.id)}
                    >
                      <X size={14} /> Reintentar
                    </button>
                  )}
                </div>

                {(onEdit || onDelete) && (
                  <div className="timeline-actions">
                    {onEdit && (
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => onEdit(comm)}
                        title="Editar"
                      >
                        <FileText size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        onClick={() => {
                          if (window.confirm('¿Eliminar esta comunicación?')) {
                            onDelete(comm.id);
                          }
                        }}
                        title="Eliminar"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}