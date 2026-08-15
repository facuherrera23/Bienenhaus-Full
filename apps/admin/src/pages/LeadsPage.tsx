import { useEffect, useMemo, useState } from 'preact/hooks';
import {
    AlertTriangle,
    ChevronDown,
    Download,
    Kanban,
    List,
    Plus,
    Search,
    Trash2,
    Upload,
    UserPlus,
    X,
} from 'lucide-preact';
import { Link, useLocation } from 'wouter-preact';
import { BadgeVariant, Button, Badge, IconButton, Spinner } from '@bienenhaus/ui';
import {
    type CsvLeadRow,
    LEAD_INTENT_LABEL,
    LEAD_SOURCE_LABEL,
    LEAD_STATUS_LABEL,
    LEAD_STATUS_TONE,
    type LeadIntent,
    type LeadRow,
    type LeadStatus,
    STATUS_ORDER,
    useAddLeadTag,
    useBulkAutoAssignLeads,
    useBulkRecalculateScores,
    useExportLeads,
    useImportLeads,
    useLeads,
    useParseLeadsCsv,
    useRemoveLeadTag,
    useSoftDeleteLead,
    useUpdateLeadStatus,
} from '../lib/leads.api';
import { queryClient } from '../lib/query/client';
import { pushToast } from '../store/app';
import { getListData } from '../lib/utils';
import styles from './LeadsPage.module.css';

export function LeadsPage() {
    const [, setLocation] = useLocation();
    const [view, setView] = useState<'table' | 'kanban'>('table');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'todos' | LeadStatus>('todos');
    const [intentFilter, setIntentFilter] = useState<'todos' | LeadIntent>('todos');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkBusy, setBulkBusy] = useState(false);
    const [bulkOp, setBulkOp] = useState<'assign' | 'trash' | 'recalc' | 'tags' | null>(null);
    const [showImport, setShowImport] = useState(false);
    const [, setImportFile] = useState<File | null>(null);
    const [importPreview, setImportPreview] = useState<{
        valid: CsvLeadRow[];
        errors: { row: number; message: string }[];
    } | null>(null);
    const [importing, setImporting] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [showTagInput, setShowTagInput] = useState<string | null>(null);

    const { data, isPending, isError } = useLeads({
        search,
        status: statusFilter === 'todos' ? undefined : statusFilter,
        intent: intentFilter === 'todos' ? undefined : intentFilter,
    });
    const leads = getListData<LeadRow>(data);

    const bulkAutoAssignLeads = useBulkAutoAssignLeads();
    const bulkRecalculateScores = useBulkRecalculateScores();
    const addLeadTag = useAddLeadTag();
    const removeLeadTag = useRemoveLeadTag();
    const importLeads = useImportLeads();
    const parseLeadsCsv = useParseLeadsCsv();
    const exportLeads = useExportLeads();
    const softDeleteLead = useSoftDeleteLead();
    const updateLeadStatus = useUpdateLeadStatus();

    useEffect(() => {
        document.title = 'Leads · BIENENHAUS';
        return () => {
            document.title = 'BIENENHAUS — Panel de Administración';
        };
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return leads.filter((l: LeadRow) => {
            const matchesSearch =
                q === '' ||
                `${l.name} ${l.last_name}`.toLowerCase().includes(q) ||
                l.email.toLowerCase().includes(q) ||
                (l.phone ?? '').toLowerCase().includes(q);
            const matchesStatus = statusFilter === 'todos' || l.status === statusFilter;
            const matchesIntent = intentFilter === 'todos' || l.intent === intentFilter;
            return matchesSearch && matchesStatus && matchesIntent;
        });
    }, [leads, search, statusFilter, intentFilter]);

    const allSelected =
        filtered.length > 0 && filtered.every((l: LeadRow) => selectedIds.has(l.id));
    const someSelected = selectedIds.size > 0;

    const toggleAll = () => {
        if (allSelected) setSelectedIds(new Set());
        else setSelectedIds(new Set(filtered.map((l: LeadRow) => l.id)));
    };

    const toggleOne = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const runBulkAutoAssign = async () => {
        setBulkBusy(true);
        try {
            const res = await bulkAutoAssignLeads.mutateAsync(Array.from(selectedIds));
            clearSelection();
            pushToast({
                type: 'success',
                title: 'Auto-asignación completada',
                description: `${res.assigned} lead${res.assigned === 1 ? '' : 's'} asignado${res.assigned === 1 ? '' : 's'}${res.skipped ? `, ${res.skipped} sin agente` : ''}`,
            });
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        } catch {
            pushToast({ type: 'error', title: 'No se pudo auto-asignar' });
        } finally {
            setBulkBusy(false);
        }
    };

    const runBulkTrash = async () => {
        setBulkBusy(true);
        try {
            for (const id of selectedIds) await softDeleteLead.mutateAsync(id);
            clearSelection();
            pushToast({
                type: 'success',
                title: 'Leads movidos a papelera',
                description: `${selectedIds.size} lead${selectedIds.size === 1 ? '' : 's'}`,
            });
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        } catch {
            pushToast({ type: 'error', title: 'No se pudo mover a papelera' });
        } finally {
            setBulkBusy(false);
        }
    };

    const runBulkRecalc = () => {
        bulkRecalculateScores.mutate(Array.from(selectedIds));
        clearSelection();
    };

    const handleTagAction = async (leadId: string, tag: string, action: 'add' | 'remove') => {
        try {
            if (action === 'add') await addLeadTag.mutateAsync({ leadId, tag });
            else await removeLeadTag.mutateAsync({ leadId, tag });
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            pushToast({
                type: 'success',
                title: action === 'add' ? 'Tag agregado' : 'Tag removido',
            });
        } catch {
            pushToast({ type: 'error', title: 'Error actualizando tag' });
        }
    };

    const handleImportFile = (e: Event) => {
        const file = (e.currentTarget as HTMLInputElement).files?.[0];
        if (!file) return;
        setImportFile(file);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const result = await parseLeadsCsv.mutateAsync(e.target?.result as string);
            setImportPreview(result);
            setShowImport(true);
        };
        reader.readAsText(file);
    };

    const confirmImport = async () => {
        if (!importPreview || importing) return;
        setImporting(true);
        try {
            const res = await importLeads.mutateAsync(importPreview.valid);
            pushToast({
                type: 'success',
                title: 'Importación completada',
                description: `${res.created} leads creados${res.errors.length ? `, ${res.errors.length} errores` : ''}`,
            });
            setShowImport(false);
            setImportPreview(null);
            setImportFile(null);
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        } catch {
            pushToast({ type: 'error', title: 'Error importando' });
        } finally {
            setImporting(false);
        }
    };

    const handleExport = () => {
        if (filtered.length === 0) return;
        exportLeads.exportToCSV(`leads-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleStatusChange = async (lead: LeadRow, status: LeadStatus) => {
        try {
            await updateLeadStatus.mutateAsync({ id: lead.id, status });
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            pushToast({
                type: 'success',
                title: 'Estado actualizado',
                description: `${lead.name} → ${LEAD_STATUS_LABEL[status]}`,
            });
        } catch {
            pushToast({ type: 'error', title: 'No se pudo actualizar' });
        }
    };

    const getKanbanColumns = () =>
        STATUS_ORDER.map((status: LeadStatus) => ({
            status,
            leads: filtered.filter((l: LeadRow) => l.status === status),
        }));

    const getScoreColor = (score: number) =>
        score >= 70 ? 'success' : score >= 40 ? 'warning' : 'danger';

    const labelMap = LEAD_INTENT_LABEL as Record<string, string>;
    const sourceMap = LEAD_SOURCE_LABEL as Record<string, string>;
    const statusMap = LEAD_STATUS_LABEL as Record<string, string>;

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h2 className="page-title">Leads</h2>
                    <p className="page-subtitle">Pipeline comercial y gestión de contactos.</p>
                </div>
                <div
                    className="page-head-actions"
                    style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}
                >
                    <div
                        className="view-toggle"
                        style={{
                            display: 'flex',
                            border: '1px solid var(--bh-border)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                        }}
                    >
                        <Button
                            variant={view === 'table' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('table')}
                        >
                            <List size={15} />
                        </Button>
                        <Button
                            variant={view === 'kanban' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('kanban')}
                        >
                            <Kanban size={15} />
                        </Button>
                    </div>
                    <Link href="/leads/nueva">
                        <Button variant="primary" size="md" iconLeft={<Plus size={16} />}>
                            Nuevo lead
                        </Button>
                    </Link>
                    <Button
                        variant="secondary"
                        size="md"
                        iconLeft={<Download size={15} />}
                        onClick={handleExport}
                        disabled={filtered.length === 0}
                    >
                        Exportar CSV
                    </Button>
                    <label style={{ cursor: 'pointer' }}>
                        <Button variant="secondary" size="md" iconLeft={<Upload size={15} />}>
                            Importar CSV
                        </Button>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleImportFile}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
            </div>

{someSelected && (
                <div className="bulk-bar">
                    <div className="bulk-info">
                        <span>
                            {selectedIds.size} seleccionado{selectedIds.size === 1 ? '' : 's'}
                        </span>
                        <Button variant="ghost" size="sm" onClick={clearSelection}>
                            Limpiar
                        </Button>
                    </div>
                    <div className="bulk-actions">
                        <div className="dropdown-wrapper">
                            <button
                                className={`dropdown-trigger${bulkOp ? ' open' : ''}`}
                                onClick={() => setBulkOp(bulkOp ? null : 'assign')}
                            >
                                <UserPlus size={15} /> Acciones <ChevronDown size={12} />
                            </button>
                            {bulkOp && (
                                <ul className="dropdown-menu open" role="menu">
                                    <li role="menuitem" onClick={() => setBulkOp('assign')}>
                                        <UserPlus size={14} /> Auto-asignar
                                    </li>
                                    <li role="menuitem" onClick={() => setBulkOp('trash')}>
                                        <Trash2 size={14} /> Papelera
                                    </li>
                                    <li role="menuitem" onClick={() => setBulkOp('recalc')}>
                                        📊 Recalcular score
                                    </li>
                                    <li role="menuitem" onClick={() => setBulkOp('tags')}>
                                        🏷️ Gestionar tags
                                    </li>
                                </ul>
                            )}
                        </div>
                        {bulkOp && (
                            <div className={styles['bulk-confirm']}>
                                <span>
                                    {bulkOp === 'assign'
                                        ? 'Auto-asignar'
                                        : bulkOp === 'trash'
                                        ? 'Mover a papelera'
                                        : bulkOp === 'recalc'
                                        ? 'Recalcular score'
                                        : 'Gestionar tags'}{' '}
                                    {selectedIds.size} lead{selectedIds.size === 1 ? '' : 's'}?
                                </span>
                                <Button variant="secondary" size="sm" onClick={() => setBulkOp(null)}>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={
                                        bulkOp === 'assign'
                                            ? runBulkAutoAssign
                                            : bulkOp === 'trash'
                                            ? runBulkTrash
                                            : bulkOp === 'recalc'
                                            ? runBulkRecalc
                                            : undefined
                                    }
                                    disabled={bulkBusy || bulkOp === 'tags'}
                                >
                                    {bulkBusy ? (
                                        <Spinner size="sm" inline color="inherit" />
                                    ) : (
                                        'Confirmar'
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="toolbar">
                <div className="toolbar-search">
                    <Search size={15} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o teléfono…"
                        value={search}
                        onInput={(e) => setSearch((e.currentTarget as HTMLInputElement).value)}
                    />
                </div>
                <select
                    className="select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.currentTarget.value as 'todos' | LeadStatus)}
                >
                    <option value="todos">Todos los estados</option>
                    {(Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map((s: LeadStatus) => (
                        <option key={s} value={s}>
                            {LEAD_STATUS_LABEL[s]}
                        </option>
                    ))}
                </select>
                <select
                    className="select"
                    value={intentFilter}
                    onChange={(e) => setIntentFilter(e.currentTarget.value as 'todos' | LeadIntent)}
                >
                    <option value="todos">Toda intención</option>
                    {(Object.keys(LEAD_INTENT_LABEL) as LeadIntent[]).map((i: LeadIntent) => (
                        <option key={i} value={i}>
                            {LEAD_INTENT_LABEL[i]}
                        </option>
                    ))}
                </select>
            </div>

            {isPending && (
                <div className="card placeholder-card">
                    <Spinner size="md" inline color="inherit" /> Cargando leads…
                </div>
            )}
            {isError && (
                <div className="card placeholder-card">No se pudieron cargar los leads.</div>
            )}

            {!isPending && !isError && view === 'table' && (
                <div className="card table-card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '44px' }}>
                                    <input
                                        type="checkbox"
                                        className="table-select-all"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        aria-label="Seleccionar todos"
                                    />
                                </th>
                                <th>Contacto</th>
                                <th>Intención</th>
                                <th>Teléfono</th>
                                <th>Origen</th>
                                <th>Estado</th>
                                <th>Score</th>
                                <th>Tags</th>
                                <th>Asignado</th>
                                <th>Recibido</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((l: LeadRow) => {
                                const isSelected = selectedIds.has(l.id);
                                return (
                                    <tr
                                        key={l.id}
                                        className={`row-click${isSelected ? ' selected' : ''}`}
                                        onClick={(e) => {
                                            if (
                                                (e.target as HTMLElement).closest(
                                                    'input,button,a,select,.tag',
                                                )
                                            )
                                                return;
                                            setLocation(`/leads/${l.id}`);
                                        }}
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleOne(l.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                aria-label={`Seleccionar ${l.name}`}
                                            />
                                        </td>
                                        <td>
                                            <div className="cell-property">
                                                <span className="cell-avatar">
                                                    {(l.name[0] ?? '').toUpperCase()}
                                                </span>
                                                <div>
                                                    <strong>
                                                        {l.name} {l.last_name}
                                                    </strong>
                                                    <span className="muted">{l.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{LEAD_INTENT_LABEL[l.intent]}</td>
                                        <td className="muted">{l.phone ?? '—'}</td>
                                        <td className="cap">{LEAD_SOURCE_LABEL[l.source]}</td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <select
                                                className={`select select--sm ${styles['tone-' + LEAD_STATUS_TONE[l.status]]}`}
                                                value={l.status}
                                                onChange={(e) =>
                                                    handleStatusChange(
                                                        l,
                                                        e.currentTarget.value as LeadStatus,
                                                    )
                                                }
                                            >
                                                {(
                                                    Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]
                                                ).map((s: LeadStatus) => (
                                                    <option key={s} value={s}>
                                                        {LEAD_STATUS_LABEL[s]}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <Badge variant={getScoreColor(l.score ?? 0)} size="sm">
                                                {l.score ?? 0}
                                            </Badge>
                                        </td>
                                        <td
                                            style={{
                                                maxWidth: '150px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {(l.tags ?? []).slice(0, 3).map((t: string) => (
                                                <Badge key={t} variant="neutral" size="sm" style={{ marginRight: '4px', fontSize: '11px' }}>
                                                    {t}
                                                </Badge>
                                            ))}
                                            {(l.tags ?? []).length > 3 && (
                                                <Badge variant="neutral" size="sm" style={{ fontSize: '11px' }}>
                                                    +{(l.tags ?? []).length - 3}
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="muted">{l.agent ?? '—'}</td>
                                        <td className="muted">
                                            {new Date(l.created_at).toLocaleDateString('es-AR')}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="empty-cell">
                                        No hay leads que coincidan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {!isPending && !isError && view === 'kanban' && (
                <div className={styles['kanban-board']}>
                    {getKanbanColumns().map((col: { status: LeadStatus; leads: LeadRow[] }) => (
                        <div key={col.status} className={styles['kanban-column']}>
                            <div
                                className={`${styles['kanban-column-header']} ${styles['tone-' + LEAD_STATUS_TONE[col.status]]}`}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 12px',
                                    borderRadius: '8px 8px 0 0',
                                    minWidth: '280px',
                                }}
                            >
                                <span>{LEAD_STATUS_LABEL[col.status]}</span>
                                <Badge variant={LEAD_STATUS_TONE[col.status] as BadgeVariant} size="sm" className={styles['kanban-count']}>
                                    {col.leads.length}
                                </Badge>
                            </div>
                            <div
                                className={styles['kanban-column-body']}
                                style={{
                                    minHeight: '400px',
                                    minWidth: '280px',
                                    padding: '8px',
                                    background: 'var(--bh-bg-hover)',
                                    borderRadius: '0 0 8px 8px',
                                }}
                            >
                                {col.leads.length === 0 && (
                                    <div
                                        className={styles['kanban-empty']}
                                        style={{
                                            textAlign: 'center',
                                            color: 'var(--bh-text-tertiary)',
                                            padding: '24px',
                                        }}
                                    >
                                        Sin leads
                                    </div>
                                )}
                                {col.leads.map((l: LeadRow) => (
                                    <div
                                        key={l.id}
                                        className={styles['kanban-card']}
                                        style={{
                                            background: 'var(--bh-bg-card)',
                                            border: '1px solid var(--bh-border)',
                                            borderRadius: '8px',
                                            padding: '12px',
                                            marginBottom: '8px',
                                            boxShadow: 'var(--bh-shadow-sm)',
                                            cursor: 'pointer',
                                        }}
                                        onClick={(e) => {
                                            if (
                                                (e.target as HTMLElement).closest(
                                                    'button,.tag,.tag-input',
                                                )
                                            )
                                                return;
                                            setLocation(`/leads/${l.id}`);
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: '8px',
                                            }}
                                        >
                                            <Badge variant={LEAD_STATUS_TONE[l.status] as BadgeVariant} size="sm">
                                                {LEAD_STATUS_LABEL[l.status]}
                                            </Badge>
                                            <Badge variant={getScoreColor(l.score ?? 0)} size="sm">
                                                {l.score ?? 0}
                                            </Badge>
                                        </div>
                                        <strong style={{ display: 'block', marginBottom: '4px' }}>
                                            {l.name} {l.last_name}
                                        </strong>
                                        <span
                                            className="muted"
                                            style={{
                                                fontSize: '12px',
                                                display: 'block',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            {l.email}
                                        </span>
                                        {l.phone && (
                                            <span
                                                className="muted"
                                                style={{
                                                    fontSize: '12px',
                                                    display: 'block',
                                                    marginBottom: '4px',
                                                }}
                                            >
                                                📞 {l.phone}
                                            </span>
                                        )}
                                        {l.tags && l.tags.length > 0 && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '4px',
                                                    marginTop: '8px',
                                                }}
                                            >
                                                {l.tags.map((t: string) => (
                                                    <Badge
                                                        key={t}
                                                        variant="neutral"
                                                        size="sm"
                                                        style={{ fontSize: '10px', cursor: 'pointer' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowTagInput(l.id);
                                                            setTagInput(t);
                                                        }}
                                                    >
                                                        {t} <X size={10} />
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        {(l.score ?? 0) < 30 && (
                                            <div
                                                style={{
                                                    marginTop: '8px',
                                                    padding: '6px',
                                                    background: 'var(--bh-danger-soft)',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    color: 'var(--bh-danger)',
                                                }}
                                            >
                                                <AlertTriangle size={12} /> Score bajo: priorizar
                                                contacto
                                            </div>
                                        )}
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: '4px',
                                                marginTop: '8px',
                                            }}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                style={{ flex: 1 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusChange(
                                                        l,
                                                        STATUS_ORDER[
                                                            Math.min(
                                                                STATUS_ORDER.indexOf(l.status) + 1,
                                                                STATUS_ORDER.length - 1,
                                                            )
                                                        ],
                                                    );
                                                }}
                                            >
                                                <ChevronDown size={12} /> Avanzar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showImport && (
                <div
                    className="modal-backdrop"
                    onClick={() => {
                        setShowImport(false);
                        setImportPreview(null);
                    }}
                >
                    <div className="modal-card modal--large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3>Importar Leads desde CSV</h3>
<IconButton
                                variant="ghost"
                                size="sm"
                                aria-label="Cerrar"
                                onClick={() => {
                                    setShowImport(false);
                                    setImportPreview(null);
                                }}
                            >
                                <X size={20} />
                            </IconButton>
                        </div>
                        <div className="modal-body">
                            {importPreview ? (
                                <>
                                    <div
                                        className={styles['import-summary']}
                                        style={{
                                            display: 'flex',
                                            gap: '16px',
                                            marginBottom: '16px',
                                            padding: '12px',
                                            background: 'var(--bh-bg-hover)',
                                            borderRadius: '8px',
                                        }}
                                    >
                                        <div className="stat">
                                            <strong>{importPreview.valid.length}</strong>
                                            <span>Válidos</span>
                                        </div>
                                        <div className="stat" style={{ color: 'var(--bh-danger)' }}>
                                            <strong>{importPreview.errors.length}</strong>
                                            <span>Errores</span>
                                        </div>
                                    </div>
                                    {importPreview.errors.length > 0 && (
                                        <details style={{ marginBottom: '16px' }}>
                                            <summary
                                                style={{
                                                    cursor: 'pointer',
                                                    color: 'var(--bh-danger)',
                                                }}
                                            >
                                                Ver errores ({importPreview.errors.length})
                                            </summary>
                                            <ul
                                                style={{
                                                    maxHeight: '200px',
                                                    overflow: 'auto',
                                                    marginTop: '8px',
                                                    fontSize: '12px',
                                                    color: 'var(--bh-danger)',
                                                }}
                                            >
                                                {importPreview.errors
                                                    .slice(0, 20)
                                                    .map(
                                                        (
                                                            err: { row: number; message: string },
                                                            i: number,
                                                        ) => (
                                                            <li key={i}>
                                                                Fila {err.row}: {err.message}
                                                            </li>
                                                        ),
                                                    )}
                                            </ul>
                                        </details>
                                    )}
                                    <div
                                        style={{
                                            maxHeight: '300px',
                                            overflow: 'auto',
                                            marginBottom: '16px',
                                            fontSize: '12px',
                                        }}
                                    >
                                        <table className="table" style={{ fontSize: '11px' }}>
                                            <thead>
                                                <tr>
                                                    <th>Nombre</th>
                                                    <th>Apellido</th>
                                                    <th>Email</th>
                                                    <th>Intención</th>
                                                    <th>Origen</th>
                                                    <th>Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importPreview.valid
                                                    .slice(0, 20)
                                                    .map((row: CsvLeadRow, i: number) => (
                                                        <tr key={i}>
                                                            <td>{row.name}</td>
                                                            <td>{row.last_name}</td>
                                                            <td>{row.email}</td>
                                                            <td>{labelMap[row.intent]}</td>
                                                            <td>{sourceMap[row.source]}</td>
                                                            <td>
                                                                {statusMap[row.status || 'nuevo']}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                        {importPreview.valid.length > 20 && (
                                            <p className="muted" style={{ marginTop: '8px' }}>
                                                ... y {importPreview.valid.length - 20} más
                                            </p>
                                        )}
                                    </div>
<div
                                    className="modal-actions"
                                    style={{
                                        marginTop: '16px',
                                        display: 'flex',
                                        gap: '8px',
                                        justifyContent: 'flex-end',
                                    }}
                                >
                                <Button variant="secondary" onClick={() => {
                                    setImportPreview(null);
                                    setImportFile(null);
                                }}>
                                    Volver
                                </Button>
                                <Button variant="primary" onClick={confirmImport} disabled={importing}>
                                    {importing ? (
                                        <Spinner size="sm" inline color="inherit" />
                                    ) : (
                                        'Importar'
                                    )}
                                </Button>
                                </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '32px' }}>
                                    <Upload
                                        size={48}
                                        style={{
                                            color: 'var(--bh-text-tertiary)',
                                            marginBottom: '16px',
                                        }}
                                    />
                                    <p>Arrastra un archivo CSV o haz clic para seleccionar</p>
                                    <p
                                        className="muted"
                                        style={{ fontSize: '12px', marginTop: '8px' }}
                                    >
                                        Columnas requeridas: name, last_name, email, intent, source
                                        <br />
                                        Opcionales: phone, city, status, message
                                    </p>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleImportFile}
                                        style={{ display: 'none' }}
                                        id="csv-import"
                                    />
                                    <Button variant="primary" style={{ marginTop: '16px' }} onClick={() =>
    document.getElementById('csv-import')?.click()
}>
    <Upload size={15} /> Seleccionar archivo
</Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showTagInput && (
                <div
                    className={styles['tag-popover']}
                    style={{
                        position: 'fixed',
                        zIndex: 1000,
                        background: 'var(--bh-bg-card)',
                        border: '1px solid var(--bh-border)',
                        borderRadius: '8px',
                        padding: '8px',
                        boxShadow: 'var(--bh-shadow-lg)',
                    }}
                >
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.currentTarget.value)}
                        placeholder="Nuevo tag..."
                        style={{ width: '200px', marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <Button variant="primary" size="sm" onClick={() => {
                            if (showTagInput && tagInput) {
                                handleTagAction(showTagInput, tagInput, 'add');
                                setShowTagInput(null);
                                setTagInput('');
                            }
                        }}>
                            <Plus size={12} /> Agregar
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => {
                            if (showTagInput) {
                                handleTagAction(showTagInput, tagInput, 'remove');
                                setShowTagInput(null);
                                setTagInput('');
                            }
                        }}>
                            <Trash2 size={12} /> Quitar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
