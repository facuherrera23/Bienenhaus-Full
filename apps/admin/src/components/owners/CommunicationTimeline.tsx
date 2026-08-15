import { useState } from 'preact/hooks';
import { Calendar, FileText, Mail, MessageSquare, Phone, Send, X } from 'lucide-preact';
import {
    COMMUNICATION_STATUS_LABEL,
    COMMUNICATION_STATUS_TONE,
    COMMUNICATION_TYPE_LABEL,
    type CommunicationRow,
    type CommunicationType,
} from '../../types/owners';
import { ConfirmDialog } from '../ConfirmDialog';
import { Badge, type BadgeVariant, Button, IconButton } from '@bienenhaus/ui';

interface CommunicationTimelineProps {
    communications: CommunicationRow[];
    onEdit?: (comm: CommunicationRow) => void;
    onDelete?: (commId: string) => void;
    onResend?: (commId: string) => void;
}

const TYPE_ICONS: Record<CommunicationType, typeof MessageSquare> = {
    whatsapp: MessageSquare,
    call: Phone,
    email: Mail,
    meeting: Calendar,
    report: FileText,
    note: FileText,
};

export function CommunicationTimeline({
    communications,
    onEdit,
    onDelete,
    onResend,
}: CommunicationTimelineProps) {
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
                        <li
                            key={comm.id}
                            className="timeline-item"
                            style={{
                                '--timeline-color': `var(--color-${COMMUNICATION_STATUS_TONE[comm.status]})`,
                            }}
                        >
                            <div className="timeline-marker">
                                <div className={`timeline-dot status-${comm.status}`} />
                                {!isLast && <div className="timeline-line" />}
                            </div>

                            <div className="timeline-content">
                                <div className="timeline-header">
                                    <div className="timeline-type">
                                        <Icon size={16} />
                                        <span>{COMMUNICATION_TYPE_LABEL[comm.type]}</span>
                                    </div>
                                    <div className="timeline-meta">
                                        <Badge
                                            variant={
                                                COMMUNICATION_STATUS_TONE[comm.status] as BadgeVariant
                                            }
                                        >
                                            {COMMUNICATION_STATUS_LABEL[comm.status]}
                                        </Badge>
                                        <time dateTime={comm.created_at}>
                                            {formatDate(comm.created_at)}
                                        </time>
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
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onResend(comm.id)}
                                        >
                                            <Send size={14} /> Enviar
                                        </Button>
                                    )}
                                    {comm.status === 'failed' && onResend && (
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            onClick={() => onResend(comm.id)}
                                        >
                                            <X size={14} /> Reintentar
                                        </Button>
                                    )}
                                </div>

                                {(onEdit || onDelete) && (
                                    <div className="timeline-actions">
                                        {onEdit && (
                                            <IconButton
                                                type="button"
                                                variant="ghost"
                                                onClick={() => onEdit(comm)}
                                                title="Editar"
                                                aria-label="Editar"
                                            >
                                                <FileText size={14} />
                                            </IconButton>
                                        )}
                                        {onDelete && (
                                            <IconButton
                                                type="button"
                                                variant="danger"
                                                onClick={() => setConfirmDeleteId(comm.id)}
                                                title="Eliminar"
                                                aria-label="Eliminar"
                                            >
                                                <X size={14} />
                                            </IconButton>
                                        )}
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            <ConfirmDialog
                open={confirmDeleteId !== null}
                title="Eliminar comunicación"
                message="¿Eliminar esta comunicación?"
                confirmLabel="Eliminar"
                danger
                onConfirm={() => {
                    if (confirmDeleteId && onDelete) onDelete(confirmDeleteId);
                    setConfirmDeleteId(null);
                }}
                onCancel={() => setConfirmDeleteId(null)}
            />
        </div>
    );
}
