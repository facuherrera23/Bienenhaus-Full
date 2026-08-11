import { useEffect, useMemo, useState } from 'preact/hooks';
import { Download, Search, Trash2 } from 'lucide-preact';
import { downloadCsv, toCsv, todayStamp } from '../lib/csv';
import {
    fetchSubscribers,
    NEWSLETTER_SOURCE_LABEL,
    type NewsletterSubscriber,
    softDeleteSubscriber,
} from '../lib/newsletter';
import { queryClient } from '../lib/query/client';
import { useQuery } from '../lib/query/hooks';
import { pushToast } from '../store/app';
import { ConfirmDialog } from '../components/ConfirmDialog';

export function NewsletterPage() {
    const [search, setSearch] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null);

    const { data, isPending, isError } = useQuery<NewsletterSubscriber[]>({
        queryKey: ['newsletter-subscribers'],
        queryFn: fetchSubscribers,
    });

    useEffect(() => {
        document.title = 'Newsletter · BIENENHAUS';
        return () => {
            document.title = 'BIENENHAUS — Panel de Administración';
        };
    }, []);

    const filtered = useMemo(() => {
        if (!data) return [];
        const q = search.trim().toLowerCase();
        return data.filter((s) => q === '' || s.email.toLowerCase().includes(q));
    }, [data, search]);

    const handleExport = () => {
        if (filtered.length === 0) return;
        downloadCsv(
            `newsletter-${todayStamp()}.csv`,
            toCsv(
                ['Email', 'Origen', 'Estado', 'Suscripto'],
                filtered.map((s) => [
                    s.email,
                    NEWSLETTER_SOURCE_LABEL[s.source] ?? s.source,
                    s.status,
                    new Date(s.created_at).toLocaleDateString('es-AR'),
                ]),
            ),
        );
    };

    const handleDelete = async (id: string, email: string) => {
        setDeleting(id);
        try {
            await softDeleteSubscriber(id);
            await queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
            pushToast({ type: 'success', title: 'Movido a papelera', description: email });
        } catch {
            pushToast({ type: 'error', title: 'No se pudo mover a papelera' });
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h2 className="page-title">Newsletter</h2>
                    <p className="page-subtitle">Suscripciones recibidas desde la landing.</p>
                </div>
                <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={handleExport}
                    disabled={filtered.length === 0}
                >
                    <Download size={15} /> Exportar CSV
                </button>
            </div>

            <div className="toolbar">
                <div className="toolbar-search">
                    <Search size={15} />
                    <input
                        type="text"
                        placeholder="Buscar por email…"
                        value={search}
                        onInput={(e) => setSearch((e.currentTarget as HTMLInputElement).value)}
                    />
                </div>
            </div>

            {isPending && <div className="card placeholder-card">Cargando suscriptores…</div>}
            {isError && (
                <div className="card placeholder-card">No se pudieron cargar los suscriptores.</div>
            )}

            {!isPending && !isError && (
                <div className="card table-card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Origen</th>
                                <th>Estado</th>
                                <th>Suscripto</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s) => (
                                <tr key={s.id}>
                                    <td>
                                        <div className="cell-property">
                                            <span className="cell-avatar" aria-hidden="true">
                                                {s.email[0]?.toUpperCase() ?? ''}
                                            </span>
                                            <strong>{s.email}</strong>
                                        </div>
                                    </td>
                                    <td className="cap">
                                        {NEWSLETTER_SOURCE_LABEL[s.source] ?? s.source}
                                    </td>
                                    <td>
                                        <span
                                            className={`badge badge--${s.status === 'active' ? 'success' : 'neutral'}`}
                                        >
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="muted">
                                        {new Date(s.created_at).toLocaleDateString('es-AR')}
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <button
                                                type="button"
                                                className="icon-btn icon-btn--danger"
                                                title={`Eliminar ${s.email}`}
                                                disabled={deleting === s.id}
                                                onClick={() =>
                                                    setDeleteTarget({ id: s.id, email: s.email })
                                                }
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="empty-cell">
                                        No hay suscripciones que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Mover a papelera"
                message={deleteTarget ? `¿Mover a papelera a ${deleteTarget.email}?` : ''}
                confirmLabel="Mover"
                danger
                onConfirm={() => {
                    if (deleteTarget) void handleDelete(deleteTarget.id, deleteTarget.email);
                    setDeleteTarget(null);
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
