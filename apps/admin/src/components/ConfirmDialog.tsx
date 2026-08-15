import { useEffect } from 'preact/hooks';
import { X } from 'lucide-preact';
import { Button, IconButton } from '@bienenhaus/ui';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    danger = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className="modal-backdrop" onClick={onCancel}>
            <div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
            >
                <div className="modal-head">
                    <h3 id="confirm-dialog-title">{title}</h3>
                    <IconButton
                        variant="ghost"
                        onClick={onCancel}
                        aria-label="Cerrar"
                    >
                        <X size={20} />
                    </IconButton>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                    <div className="modal-actions">
                        <Button type="button" variant="ghost" onClick={onCancel}>
                            {cancelLabel}
                        </Button>
                        <Button
                            type="button"
                            variant={danger ? 'danger' : 'primary'}
                            onClick={onConfirm}
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
