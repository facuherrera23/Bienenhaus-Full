import { useMemo, useState } from 'preact/hooks';
import { Download, FileText, Filter, MessageSquare, Plus, Search, Trash2 } from 'lucide-preact';

import { useQueryClient } from '@tanstack/react-query';
import { useCreateReport, useDeleteReport, useReports, useSendReport } from '@lib/owners/api';
import { pushToast } from '@store/app';
import { OwnerReportGenerator, OwnerReportPreview } from '@components/owners';
import { ConfirmDialog } from '@components/ConfirmDialog';
import { type ReportFormValues, type ReportType } from '@lib/owners/schemas';

import { REPORT_TYPE_LABEL, type ReportRow } from '@/types/owners';

function formatDateShort(iso: string): string {
    return new Date(iso).toLocaleDateString('es-AR');
}

export function ReportsPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'drafts' | 'sent'>('all');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'todos' | ReportType>('todos');
    const [statusFilter, setStatusFilter] = useState<
        'todos' | 'draft' | 'sent' | 'delivered' | 'read' | 'failed'
    >('todos');
    const [showFilters, setShowFilters] = useState(false);
    const [showGenerator, setShowGenerator] = useState(false);
    const [previewReport, setPreviewReport] = useState<ReportRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ reportId: string; title: string } | null>(
        null,
    );
    const queryClient = useQueryClient();

    const { data, isLoading } = useReports({
        pageSize: 100,
        report_type: typeFilter === 'todos' ? undefined : typeFilter,
        status: statusFilter === 'todos' ? undefined : statusFilter,
    });

    const allReports = data?.data ?? [];

    const createReport = useCreateReport();
    const sendReport = useSendReport();
    const deleteReport = useDeleteReport();

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        let result = allReports.filter((r) => {
            const matchesSearch =
                q === '' ||
                r.title?.toLowerCase().includes(q) ||
                r.property_title?.toLowerCase().includes(q) ||
                r.owner_name?.toLowerCase().includes(q);
            return matchesSearch;
        });

        if (activeTab === 'drafts') {
            result = result.filter((r) => r.status === 'draft');
        } else if (activeTab === 'sent') {
            result = result.filter((r) => r.status !== 'draft');
        }

        return result;
    }, [allReports, search, activeTab]);

    const handleGenerateReport = async (reportData: ReportFormValues) => {
        try {
            await createReport.mutateAsync({
                ...reportData,
                title: reportData.title ?? '',
            });
            pushToast({
                type: 'success',
                title: 'Reporte generado',
                description: reportData.title ?? undefined,
            });
            queryClient.invalidateQueries({ queryKey: ['owner-reports'] });
            setShowGenerator(false);
        } catch {
            pushToast({ type: 'error', title: 'No se pudo generar el reporte' });
        }
    };

    const handleSend = async (report: ReportRow) => {
        try {
            await sendReport.mutateAsync(report.id);
            pushToast({
                type: 'success',
                title: 'Reporte enviado',
                description: report.title ?? undefined,
            });
            queryClient.invalidateQueries({ queryKey: ['owner-reports'] });
            setPreviewReport(null);
        } catch {
            pushToast({ type: 'error', title: 'No se pudo enviar' });
        }
    };

    const handleDelete = async (reportId: string, _title: string) => {
        try {
            await deleteReport.mutateAsync(reportId);
            pushToast({ type: 'success', title: 'Eliminado' });
            queryClient.invalidateQueries({ queryKey: ['owner-reports'] });
            setPreviewReport(null);
        } catch {
            pushToast({ type: 'error', title: 'No se pudo eliminar' });
        }
    };

    const handleDownload = (report: ReportRow) => {
        const blob = new Blob([JSON.stringify(report.content_json, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.title || 'reporte'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const tabs: { id: 'all' | 'drafts' | 'sent'; label: string; count: number }[] = [
        { id: 'all', label: 'Todos', count: allReports.length },
        {
            id: 'drafts',
            label: 'Borradores',
            count: allReports.filter((r) => r.status === 'draft').length,
        },
        {
            id: 'sent',
            label: 'Enviados',
            count: allReports.filter((r) => r.status !== 'draft').length,
        },
    ];

    return (
        <div className="page reports-page">
            <div className="page-head">
                <div>
                    <h2 className="page-title">Reportes</h2>
                    <p className="page-subtitle">
                        Generá y enviá reportes automáticos a propietarios.
                    </p>
                </div>
                <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setShowGenerator(true)}
                >
                    <Plus size={16} /> Generar reporte
                </button>
            </div>

            {showGenerator && (
                <OwnerReportGenerator
                    propertyId=""
                    ownerId=""
                    onGenerate={handleGenerateReport}
                    onCancel={() => setShowGenerator(false)}
                />
            )}

            {previewReport && (
                <OwnerReportPreview
                    report={previewReport}
                    onClose={() => setPreviewReport(null)}
                    onSendWhatsApp={() => handleSend(previewReport!)}
                    onSendEmail={() => handleSend(previewReport!)}
                    onDownload={() => handleDownload(previewReport!)}
                />
            )}

            <div className="tabs-bar" role="tablist">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={`tab${activeTab === tab.id ? ' active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label} <span className="tab-count">{tab.count}</span>
                    </button>
                ))}
            </div>

            <div className="toolbar">
                <div className="toolbar-search">
                    <Search size={15} />
                    <input
                        type="text"
                        placeholder="Buscar por título, propiedad, propietario..."
                        value={search}
                        onInput={(e) => setSearch((e.currentTarget as HTMLInputElement).value)}
                    />
                </div>
                <button
                    type="button"
                    className={`btn btn--ghost${showFilters ? ' active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter size={15} /> Filtros
                </button>
            </div>

            {showFilters && (
                <div className="filters-panel">
                    <div className="filter-row">
                        <div className="filter-group">
                            <label>Tipo</label>
                            <select
                                className="select"
                                value={typeFilter}
                                onChange={(e) =>
                                    setTypeFilter(
                                        (e.currentTarget as HTMLSelectElement).value as
                                            'todos' | ReportType,
                                    )
                                }
                            >
                                <option value="todos">Todos</option>
                                <option value="price_analysis">Análisis de precio</option>
                                <option value="visit_summary">Resumen de visitas</option>
                                <option value="market_update">Actualización de mercado</option>
                                <option value="weekly">Semanal</option>
                                <option value="monthly">Mensual</option>
                                <option value="custom">Personalizado</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Estado</label>
                            <select
                                className="select"
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(
                                        (e.currentTarget as HTMLSelectElement).value as
                                            | 'todos'
                                            | 'draft'
                                            | 'sent'
                                            | 'delivered'
                                            | 'read'
                                            | 'failed',
                                    )
                                }
                            >
                                <option value="todos">Todos</option>
                                <option value="draft">Borrador</option>
                                <option value="sent">Enviado</option>
                                <option value="delivered">Entregado</option>
                                <option value="read">Leído</option>
                                <option value="failed">Falló</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {isLoading && <div className="card placeholder-card">Cargando reportes…</div>}

            {!isLoading && filtered.length === 0 && (
                <div className="card placeholder-card">
                    <FileText size={48} className="placeholder-icon" />
                    <h3>Sin reportes</h3>
                    <p>
                        {search
                            ? 'No se encontraron coincidencias.'
                            : 'No se han generado reportes.'}
                    </p>
                    <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => setShowGenerator(true)}
                    >
                        <Plus size={16} /> Generar primer reporte
                    </button>
                </div>
            )}

            {!isLoading && filtered.length > 0 && (
                <div className="card table-card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Tipo</th>
                                <th>Propiedad</th>
                                <th>Propietario</th>
                                <th>Estado</th>
                                <th>Generado</th>
                                <th>Enviado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((report) => (
                                <tr key={report.id}>
                                    <td>
                                        <strong>{report.title || 'Sin título'}</strong>
                                    </td>
                                    <td>
                                        <span className="badge badge--neutral">
                                            {REPORT_TYPE_LABEL[report.report_type]}
                                        </span>
                                    </td>
                                    <td>{report.property_title ?? '—'}</td>
                                    <td>{report.owner_name ?? '—'}</td>
                                    <td>
                                        <span
                                            className={`badge badge--${report.status === 'draft' ? 'neutral' : report.status === 'sent' ? 'info' : report.status === 'delivered' ? 'info' : report.status === 'read' ? 'success' : 'danger'}`}
                                        >
                                            {report.status}
                                        </span>
                                    </td>
                                    <td>{formatDateShort(report.generated_at)}</td>
                                    <td>
                                        {report.sent_at ? formatDateShort(report.sent_at) : '—'}
                                    </td>
                                    <td>
                                        <div className="row-actions">
                                            <button
                                                className="icon-btn"
                                                title="Ver"
                                                onClick={() => setPreviewReport(report)}
                                            >
                                                <FileText size={14} />
                                            </button>
                                            {report.status === 'draft' && (
                                                <button
                                                    className="icon-btn"
                                                    title="Enviar por WhatsApp"
                                                    onClick={() => handleSend(report)}
                                                >
                                                    <MessageSquare size={14} />
                                                </button>
                                            )}
                                            <button
                                                className="icon-btn"
                                                title="Descargar JSON"
                                                onClick={() => handleDownload(report)}
                                            >
                                                <Download size={14} />
                                            </button>
                                            <button
                                                className="icon-btn icon-btn--danger"
                                                title="Eliminar"
                                                onClick={() =>
                                                    setDeleteTarget({
                                                        reportId: report.id,
                                                        title: report.title || 'Sin título',
                                                    })
                                                }
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Eliminar reporte"
                message={deleteTarget ? `¿Eliminar "${deleteTarget.title}"?` : ''}
                confirmLabel="Eliminar"
                danger
                onConfirm={() => {
                    if (!deleteTarget) return;
                    const { reportId, title } = deleteTarget;
                    setDeleteTarget(null);
                    void handleDelete(reportId, title);
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
