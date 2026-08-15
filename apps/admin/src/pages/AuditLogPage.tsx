import { useEffect, useState } from 'preact/hooks';
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Database,
    Download,
    Filter,
    RefreshCw,
    Search,
    User,
    X,
    XCircle,
} from 'lucide-preact';
import { type ExportColumn, useExport } from '../lib/api/hooks';
import { useAuthAccessToken } from '../lib/auth';
import { pushToast } from '../store/app';
import { supabaseUrl } from '../lib/supabase';
import { Badge, Button, IconButton, Spinner } from '@bienenhaus/ui';

interface AuditLogEntry {
    id: number;
    actor_id: string | null;
    actor_email: string | null;
    actor_role: string | null;
    actor_ip: string | null;
    actor_user_agent: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    entity_title: string | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    changed_fields: string[] | null;
    metadata: Record<string, unknown> | null;
    status: 'success' | 'failure' | 'partial';
    error_message: string | null;
    request_id: string;
    created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
    create: 'Crear',
    insert: 'Insertar',
    update: 'Actualizar',
    delete: 'Eliminar',
    publish: 'Publicar',
    unpublish: 'Despublicar',
    login: 'Login',
    logout: 'Logout',
    sync: 'Sincronizar',
    export: 'Exportar',
    import: 'Importar',
    connect: 'Conectar',
    disconnect: 'Desconectar',
    invite: 'Invitar',
    revoke: 'Revocar',
    soft_delete: 'Papelera',
    restore: 'Restaurar',
    archive: 'Archivar',
    ml_publish: 'Publicar ML',
    ml_update: 'Actualizar ML',
    ml_delete: 'Eliminar ML',
};

const ENTITY_LABELS: Record<string, string> = {
    properties: 'Propiedades',
    leads: 'Leads',
    agents: 'Agentes',
    visits: 'Visitas',
    admin_users: 'Usuarios Admin',
    ml_connection: 'Conexión ML',
    ml_item: 'Item ML',
    site_settings: 'Configuración Sitio',
    site_content: 'Contenido Sitio',
    newsletter_subscribers: 'Newsletter',
};

const STATUS_STYLE: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
    success: { icon: CheckCircle2, color: 'var(--bh-success)', label: 'Éxito' },
    failure: { icon: XCircle, color: 'var(--bh-danger)', label: 'Falló' },
    partial: { icon: AlertTriangle, color: 'var(--bh-warning)', label: 'Parcial' },
};

const ACTION_ICONS: Record<string, typeof User> = {
    create: Database,
    insert: Database,
    update: Database,
    delete: Database,
    login: User,
    logout: User,
    sync: RefreshCw,
    export: Download,
};

function getStatusIcon(status: string) {
    const style = STATUS_STYLE[status];
    return style ? <style.icon size={12} /> : null;
}

function getActionIcon(action: string) {
    const Icon = ACTION_ICONS[action];
    return Icon ? <Icon size={12} /> : <Database size={12} />;
}

function AuditLogRow({ log, onClick }: { log: AuditLogEntry; onClick: () => void }) {
    const actionColor = getActionColor(log.action);
    const actionIcon = getActionIcon(log.action);
    const statusStyle = STATUS_STYLE[log.status];
    const actionLabel = ACTION_LABELS[log.action] ?? log.action;
    const entityLabel = ENTITY_LABELS[log.entity_type] ?? log.entity_type;

    return (
        <tr key={log.id} onClick={onClick} style={{ cursor: 'pointer' }}>
            <td>
                <span className="audit-action-icon" style={{ background: actionColor }}>
                    {actionIcon}
                </span>
            </td>
            <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                {formatDate(log.created_at)}
            </td>
            <td>
                <span className="action-badge">{actionLabel}</span>
            </td>
            <td>
                <span className="entity-badge">{entityLabel}</span>
            </td>
            <td
                style={{
                    maxWidth: '250px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >
                {log.entity_title ?? (log.entity_id ? `#${log.entity_id.slice(0, 8)}` : '—')}
            </td>
            <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {log.actor_email ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} style={{ color: 'var(--bh-text-tertiary)' }} />
                            <span>{log.actor_email}</span>
                        </div>
                    ) : (
                        <span className="muted">Sistema</span>
                    )}
                    {log.actor_role && <span className="muted">({log.actor_role})</span>}
                </div>
            </td>
            <td>
                {statusStyle && (
                    <span
                        className="status-badge"
                        style={{ borderColor: statusStyle.color, color: statusStyle.color }}
                    >
                        <statusStyle.icon size={12} />
                        {statusStyle.label}
                    </span>
                )}
            </td>
            <td style={{ textAlign: 'right' }}>
                <Clock size={14} className="muted" title={log.created_at} />
            </td>
        </tr>
    );
}

export function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        search: '',
        action: '',
        entity_type: '',
        status: '',
        from_date: '',
        to_date: '',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
    const { exportToCSV } = useExport<AuditLogEntry>();
    const accessToken = useAuthAccessToken();

    const loadLogs = async () => {
        setLoading(true);
        try {
            if (!accessToken) throw new Error('No hay sesión activa');

            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(pageSize),
            });

            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.set(key, value);
            });

            const res = await fetch(`${supabaseUrl}/functions/v1/audit-log?${params.toString()}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!res.ok) throw new Error('Error cargando logs');

            const data = await res.json();
            setLogs(data.data ?? []);
            setTotal(data.total ?? 0);
        } catch (err) {
            pushToast({ type: 'error', title: 'Error', description: (err as Error).message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [page, filters]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            action: '',
            entity_type: '',
            status: '',
            from_date: '',
            to_date: '',
        });
        setPage(1);
    };

    const hasActiveFilters = Object.values(filters).some((v) => v !== '');

    const exportLogs = async () => {
        if (logs.length === 0) return;

        await exportToCSV({
            data: logs,
            columns: AUDIT_EXPORT_COLUMNS,
            filename: `audit-logs-${new Date().toISOString().split('T')[0]}`,
        });
        pushToast({
            type: 'success',
            title: 'Exportado',
            description: `${logs.length} logs exportados`,
        });
    };

    const openDetail = (log: AuditLogEntry) => setSelectedLog(log);
    const closeDetail = () => setSelectedLog(null);

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h2 className="page-title">Registro de Auditoría</h2>
                    <p className="page-subtitle">
                        Historial de acciones críticas para trazabilidad y cumplimiento.
                    </p>
                </div>
                <div className="page-head-actions">
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            <X size={14} /> Limpiar filtros
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={exportLogs}
                        disabled={logs.length === 0}
                    >
                        <Download size={14} /> Exportar CSV
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={loadLogs}
                        disabled={loading}
                    >
                        {loading ? <Spinner size="sm" inline /> : <RefreshCw size={14} />} Actualizar
                    </Button>
                </div>
            </div>

            {/* Filtros */}
            <div className={`audit-filters${showFilters ? ' open' : ''}`}>
                <button
                    className="audit-filters-toggle"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter size={16} /> Filtros{' '}
                    {hasActiveFilters && (
                        <Badge variant="info" size="sm">
                            {Object.values(filters).filter((v) => v).length}
                        </Badge>
                    )}
                </button>

                {showFilters && (
                    <div className="audit-filters-panel">
                        <div className="filter-row">
                            <div className="field">
                                <label>Buscar</label>
                                <div className="toolbar-search">
                                    <Search size={15} />
                                    <input
                                        type="text"
                                        placeholder="Título, email, request ID..."
                                        value={filters.search}
                                        onChange={(e) =>
                                            handleFilterChange('search', e.currentTarget.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="field">
                                <label>Acción</label>
                                <select
                                    className="select"
                                    value={filters.action}
                                    onChange={(e) =>
                                        handleFilterChange('action', e.currentTarget.value)
                                    }
                                >
                                    <option value="">Todas</option>
                                    {Object.entries(ACTION_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="field">
                                <label>Entidad</label>
                                <select
                                    className="select"
                                    value={filters.entity_type}
                                    onChange={(e) =>
                                        handleFilterChange('entity_type', e.currentTarget.value)
                                    }
                                >
                                    <option value="">Todas</option>
                                    {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="field">
                                <label>Estado</label>
                                <select
                                    className="select"
                                    value={filters.status}
                                    onChange={(e) =>
                                        handleFilterChange('status', e.currentTarget.value)
                                    }
                                >
                                    <option value="">Todos</option>
                                    <option value="success">Éxito</option>
                                    <option value="failure">Falló</option>
                                    <option value="partial">Parcial</option>
                                </select>
                            </div>
                        </div>

                        <div className="filter-row">
                            <div className="field">
                                <label>Desde</label>
                                <input
                                    type="date"
                                    className="select"
                                    value={filters.from_date}
                                    onChange={(e) =>
                                        handleFilterChange('from_date', e.currentTarget.value)
                                    }
                                />
                            </div>
                            <div className="field">
                                <label>Hasta</label>
                                <input
                                    type="date"
                                    className="select"
                                    value={filters.to_date}
                                    onChange={(e) =>
                                        handleFilterChange('to_date', e.currentTarget.value)
                                    }
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabla */}
            <section className="card table-card">
                <table className="table">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>Fecha</th>
                            <th>Acción</th>
                            <th>Entidad</th>
                            <th>Título</th>
                            <th>Actor</th>
                            <th>Estado</th>
                            <th style={{ width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="empty-cell">
                                    <Spinner size="md" inline color="inherit" /> Cargando...
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="empty-cell">
                                    No hay registros de auditoría.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <AuditLogRow log={log} onClick={() => openDetail(log)} />
                            ))
                        )}
                    </tbody>
                </table>

                {/* Paginación */}
                {total > pageSize && (
                    <div className="pagination">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <span className="pagination-info">
                            Página {page} de {Math.ceil(total / pageSize)} ({total} total)
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))
                            }
                            disabled={page >= Math.ceil(total / pageSize)}
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                )}
            </section>

            {/* Modal detalle */}
            {selectedLog && (
                <div className="modal-backdrop" onClick={closeDetail}>
                    <div className="modal-card modal--large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3>Detalle de Auditoría #{selectedLog.id}</h3>
                            <IconButton
                                variant="ghost"
                                aria-label="Cerrar detalle"
                                onClick={closeDetail}
                            >
                                <X size={20} />
                            </IconButton>
                        </div>
                        <div className="modal-body">
                            <div className="audit-detail-grid">
                                <div className="audit-detail-field">
                                    <label>Acción</label>
                                    <span>
                                        <strong>
                                            {ACTION_LABELS[selectedLog.action] ??
                                                selectedLog.action}
                                        </strong>
                                    </span>
                                </div>
                                <div className="audit-detail-field">
                                    <label>Entidad</label>
                                    <span>
                                        {ENTITY_LABELS[selectedLog.entity_type] ??
                                            selectedLog.entity_type}
                                    </span>
                                </div>
                                <div className="audit-detail-field">
                                    <label>Título</label>
                                    <span>{selectedLog.entity_title ?? '—'}</span>
                                </div>
                                <div className="audit-detail-field">
                                    <label>ID Entidad</label>
                                    <span className="font-mono">
                                        {selectedLog.entity_id ?? '—'}
                                    </span>
                                </div>
                                <div className="audit-detail-field">
                                    <label>Fecha</label>
                                    <span>
                                        {new Date(selectedLog.created_at).toLocaleString('es-AR')}
                                    </span>
                                </div>
                                <div className="audit-detail-field">
                                    <label>Estado</label>
                                    <span>
                                        {getStatusIcon(selectedLog.status)}
                                        {STATUS_STYLE[selectedLog.status]?.label}
                                    </span>
                                </div>
                                <div className="audit-detail-field audit-detail-wide">
                                    <label>Actor</label>
                                    <div>
                                        <div>
                                            <strong>Email:</strong>{' '}
                                            {selectedLog.actor_email ?? 'Sistema'}
                                        </div>
                                        <div>
                                            <strong>Rol:</strong> {selectedLog.actor_role ?? '—'}
                                        </div>
                                        <div>
                                            <strong>IP:</strong> {selectedLog.actor_ip ?? '—'}
                                        </div>
                                    </div>
                                </div>
                                <div className="audit-detail-field audit-detail-wide">
                                    <label>Request ID</label>
                                    <span className="font-mono">{selectedLog.request_id}</span>
                                </div>

                                {selectedLog.changed_fields &&
                                    selectedLog.changed_fields.length > 0 && (
                                        <div className="audit-detail-field audit-detail-wide">
                                            <label>Campos modificados</label>
                                            <div className="changed-fields">
                                                {selectedLog.changed_fields.map((f) => (
                                                    <span key={f} className="changed-field-tag">
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                {selectedLog.error_message && (
                                    <div className="audit-detail-field audit-detail-wide">
                                        <label>Error</label>
                                        <div className="error-message">
                                            <AlertCircle
                                                size={14}
                                                style={{ color: 'var(--bh-danger)' }}
                                            />
                                            {selectedLog.error_message}
                                        </div>
                                    </div>
                                )}

                                <div className="audit-detail-field audit-detail-wide">
                                    <label>Valores anteriores</label>
                                    <pre className="json-preview">
                                        {JSON.stringify(selectedLog.old_values, null, 2) || '—'}
                                    </pre>
                                </div>

                                <div className="audit-detail-field audit-detail-wide">
                                    <label>Valores nuevos</label>
                                    <pre className="json-preview">
                                        {JSON.stringify(selectedLog.new_values, null, 2) || '—'}
                                    </pre>
                                </div>

                                {selectedLog.metadata &&
                                    Object.keys(selectedLog.metadata).length > 0 && (
                                        <div className="audit-detail-field audit-detail-wide">
                                            <label>Metadatos</label>
                                            <pre className="json-preview">
                                                {JSON.stringify(selectedLog.metadata, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <Button variant="secondary" onClick={closeDetail}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const AUDIT_EXPORT_COLUMNS: ExportColumn<AuditLogEntry>[] = [
    { key: 'id', label: 'ID' },
    { key: 'created_at', label: 'Fecha', format: (v) => formatDate(v as string) },
    { key: 'action', label: 'Acción', format: (v) => ACTION_LABELS[v as string] ?? (v as string) },
    {
        key: 'entity_type',
        label: 'Entidad',
        format: (v) => ENTITY_LABELS[v as string] ?? (v as string),
    },
    { key: 'entity_id', label: 'ID Entidad' },
    { key: 'entity_title', label: 'Título' },
    { key: 'actor_email', label: 'Actor' },
    { key: 'actor_role', label: 'Rol' },
    { key: 'status', label: 'Estado' },
    { key: 'error_message', label: 'Error' },
    { key: 'request_id', label: 'Request ID' },
];

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'medium' });
}

function getActionColor(action: string): string {
    if (action.includes('delete') || action.includes('remove')) return 'var(--bh-danger-soft)';
    if (action.includes('create') || action.includes('insert')) return 'var(--bh-success-soft)';
    if (action.includes('update') || action.includes('edit')) return 'var(--bh-warning-soft)';
    if (action.includes('login') || action.includes('logout')) return 'var(--bh-info-soft)';
    if (action.includes('sync')) return 'var(--bh-accent-soft)';
    if (action.includes('export')) return 'var(--bh-accent-soft)';
    return 'var(--bh-bg-hover)';
}
