import { useMemo, useState } from 'preact/hooks';
import { Check, FileText, Filter, Plus, RotateCcw, Search, Trash2, X } from 'lucide-preact';
import { Link, useLocation } from 'wouter-preact';
import { useQueryClient } from '@tanstack/react-query';
import {
    useActionPlans,
    useCompleteActionPlan,
    useDeletedActionPlans,
    usePermanentDeleteActionPlan,
    useRestoreActionPlan,
    useSoftDeleteActionPlan,
} from '@lib/owners/api';
import { pushToast } from '@store/app';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
    ACTION_PLAN_CATEGORY_LABEL,
    ACTION_PLAN_PRIORITY_LABEL,
    ACTION_PLAN_PRIORITY_TONE,
    ACTION_PLAN_STATUS_LABEL,
    ACTION_PLAN_STATUS_TONE,
    type ActionPlanCategory,
    type ActionPlanPriority,
    type ActionPlanStatus,
} from '@/types/owners';

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-AR');
}

export function ActionPlansDashboard() {
    const [, setLocation] = useLocation();
    const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'todos' | ActionPlanStatus>('todos');
    const [categoryFilter, setCategoryFilter] = useState<'todos' | ActionPlanCategory>('todos');
    const [priorityFilter, setPriorityFilter] = useState<'todos' | ActionPlanPriority>('todos');
    const [assignedFilter, setAssignedFilter] = useState<'todos' | 'mine' | 'unassigned'>('todos');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        message: string;
        confirmLabel?: string;
        danger?: boolean;
        onConfirm: () => void;
    } | null>(null);
    const queryClient = useQueryClient();

    const assignedToFilter =
        assignedFilter === 'todos'
            ? undefined
            : assignedFilter === 'mine'
              ? 'current_user'
              : assignedFilter === 'unassigned'
                ? 'null'
                : undefined;

    const { data: activeResult, isLoading: activeLoading } = useActionPlans({
        pageSize: 100,
        status: statusFilter === 'todos' ? undefined : statusFilter,
        category: categoryFilter === 'todos' ? undefined : categoryFilter,
        priority: priorityFilter === 'todos' ? undefined : priorityFilter,
        assigned_to: assignedToFilter,
    });

    const { data: deletedResult, isLoading: deletedLoading } = useDeletedActionPlans();

    const activePlans = activeResult?.data ?? [];
    const deletedPlans = deletedResult ?? [];

    const softDeleteActionPlan = useSoftDeleteActionPlan();
    const restoreActionPlan = useRestoreActionPlan();
    const permanentDeleteActionPlan = usePermanentDeleteActionPlan();
    const completeActionPlan = useCompleteActionPlan();

    const plans = activeTab === 'active' ? activePlans : deletedPlans;
    const loading = activeTab === 'active' ? activeLoading : deletedLoading;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return plans.filter((p) => {
            const matchesSearch =
                q === '' ||
                p.title.toLowerCase().includes(q) ||
                p.property_title?.toLowerCase().includes(q) ||
                p.owner_name?.toLowerCase().includes(q);
            return matchesSearch;
        });
    }, [plans, search]);

    const allSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));
    const someSelected = selectedIds.size > 0;

    const toggleAll = () => {
        if (allSelected) setSelectedIds(new Set());
        else setSelectedIds(new Set(filtered.map((p) => p.id)));
    };

    const toggleOne = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['action-plans'] });
        queryClient.invalidateQueries({ queryKey: ['action-plans', 'deleted'] });
    };

    const handleSoftDelete = async (id: string, title: string) => {
        try {
            await softDeleteActionPlan.mutateAsync(id);
            pushToast({ type: 'success', title: 'Enviado a papelera', description: title });
            invalidateAll();
        } catch {
            pushToast({ type: 'error', title: 'No se pudo eliminar' });
        }
    };

    const handleRestore = async (id: string, title: string) => {
        try {
            await restoreActionPlan.mutateAsync(id);
            pushToast({ type: 'success', title: 'Restaurado', description: title });
            invalidateAll();
        } catch {
            pushToast({ type: 'error', title: 'No se pudo restaurar' });
        }
    };

    const handlePermanentDelete = async (id: string, title: string) => {
        try {
            await permanentDeleteActionPlan.mutateAsync(id);
            pushToast({ type: 'success', title: 'Eliminado permanentemente', description: title });
            invalidateAll();
        } catch {
            pushToast({ type: 'error', title: 'No se pudo eliminar' });
        }
    };

    const handleComplete = async (id: string) => {
        try {
            await completeActionPlan.mutateAsync(id);
            pushToast({ type: 'success', title: 'Plan completado' });
            invalidateAll();
        } catch {
            pushToast({ type: 'error', title: 'No se pudo completar' });
        }
    };

    return (
        <div className="page action-plans-dashboard">
            <div className="page-head">
                <div>
                    <h2 className="page-title">Planes de Acción</h2>
                    <p className="page-subtitle">Vista global de todos los planes del equipo.</p>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <Link href="/planes-accion/nuevo" className="btn btn--primary">
                        <Plus size={16} /> Nuevo plan
                    </Link>
                </div>
            </div>

            <div className="tabs-bar" role="tablist">
                <button
                    role="tab"
                    aria-selected={activeTab === 'active'}
                    className={`tab${activeTab === 'active' ? ' active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    Activos <span className="tab-count">{activePlans.length}</span>
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'deleted'}
                    className={`tab${activeTab === 'deleted' ? ' active' : ''}`}
                    onClick={() => setActiveTab('deleted')}
                >
                    Papelera <span className="tab-count">{deletedPlans.length}</span>
                </button>
            </div>

            {someSelected && (
                <div className="bulk-bar">
                    <div className="bulk-info">
                        <span>
                            {selectedIds.size} seleccionada{selectedIds.size === 1 ? '' : 's'}
                        </span>
                        <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={clearSelection}
                        >
                            <X size={14} /> Limpiar
                        </button>
                    </div>
                    <div className="bulk-actions">
                        {activeTab === 'active' && (
                            <>
                                <button
                                    type="button"
                                    className="btn btn--success btn--sm"
                                    onClick={() => {
                                        selectedIds.forEach((id) => handleComplete(id));
                                        clearSelection();
                                    }}
                                >
                                    <Check size={14} /> Completar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn--danger btn--sm"
                                    onClick={() =>
                                        setConfirmAction({
                                            title: 'Enviar a papelera',
                                            message: `¿Enviar a papelera ${selectedIds.size} plan${selectedIds.size === 1 ? '' : 'es'}?`,
                                            confirmLabel: 'Enviar',
                                            danger: true,
                                            onConfirm: () => {
                                                selectedIds.forEach((id) => {
                                                    const plan = filtered.find((p) => p.id === id);
                                                    if (plan)
                                                        void handleSoftDelete(id, plan.title);
                                                });
                                                clearSelection();
                                            },
                                        })
                                    }
                                >
                                    <Trash2 size={14} /> A papelera
                                </button>
                            </>
                        )}
                        {activeTab === 'deleted' && (
                            <>
                                <button
                                    type="button"
                                    className="btn btn--secondary btn--sm"
                                    onClick={() => {
                                        selectedIds.forEach((id) => {
                                            const plan = filtered.find((p) => p.id === id);
                                            if (plan) handleRestore(id, plan.title);
                                        });
                                        clearSelection();
                                    }}
                                >
                                    <RotateCcw size={14} /> Restaurar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn--danger btn--sm"
                                    onClick={() =>
                                        setConfirmAction({
                                            title: 'Eliminar permanentemente',
                                            message: `¿Eliminar permanentemente ${selectedIds.size} plan${selectedIds.size === 1 ? '' : 'es'}?`,
                                            confirmLabel: 'Eliminar',
                                            danger: true,
                                            onConfirm: () => {
                                                selectedIds.forEach((id) => {
                                                    const plan = filtered.find((p) => p.id === id);
                                                    if (plan)
                                                        void handlePermanentDelete(id, plan.title);
                                                });
                                                clearSelection();
                                            },
                                        })
                                    }
                                >
                                    <Trash2 size={14} /> Eliminar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

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
                            <label>Estado</label>
                            <select
                                className="select"
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(
                                        (e.currentTarget as HTMLSelectElement).value as
                                            'todos' | ActionPlanStatus,
                                    )
                                }
                            >
                                <option value="todos">Todos</option>
                                <option value="pending">{ACTION_PLAN_STATUS_LABEL.pending}</option>
                                <option value="in_progress">
                                    {ACTION_PLAN_STATUS_LABEL.in_progress}
                                </option>
                                <option value="completed">
                                    {ACTION_PLAN_STATUS_LABEL.completed}
                                </option>
                                <option value="cancelled">
                                    {ACTION_PLAN_STATUS_LABEL.cancelled}
                                </option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Categoría</label>
                            <select
                                className="select"
                                value={categoryFilter}
                                onChange={(e) =>
                                    setCategoryFilter(
                                        (e.currentTarget as HTMLSelectElement)
                                            .value as 'todos' | ActionPlanCategory,
                                    )
                                }
                            >
                                <option value="todos">Todas</option>
                                <option value="pricing">
                                    {ACTION_PLAN_CATEGORY_LABEL.pricing}
                                </option>
                                <option value="marketing">
                                    {ACTION_PLAN_CATEGORY_LABEL.marketing}
                                </option>
                                <option value="condition">
                                    {ACTION_PLAN_CATEGORY_LABEL.condition}
                                </option>
                                <option value="legal">{ACTION_PLAN_CATEGORY_LABEL.legal}</option>
                                <option value="other">{ACTION_PLAN_CATEGORY_LABEL.other}</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Prioridad</label>
                            <select
                                className="select"
                                value={priorityFilter}
                                onChange={(e) =>
                                    setPriorityFilter(
                                        (e.currentTarget as HTMLSelectElement)
                                            .value as 'todos' | ActionPlanPriority,
                                    )
                                }
                            >
                                <option value="todos">Todas</option>
                                <option value="low">{ACTION_PLAN_PRIORITY_LABEL.low}</option>
                                <option value="medium">{ACTION_PLAN_PRIORITY_LABEL.medium}</option>
                                <option value="high">{ACTION_PLAN_PRIORITY_LABEL.high}</option>
                                <option value="urgent">{ACTION_PLAN_PRIORITY_LABEL.urgent}</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Asignado</label>
                            <select
                                className="select"
                                value={assignedFilter}
                                onChange={(e) =>
                                    setAssignedFilter(
                                        (e.currentTarget as HTMLSelectElement)
                                            .value as 'todos' | 'mine' | 'unassigned',
                                    )
                                }
                            >
                                <option value="todos">Todos</option>
                                <option value="mine">Míos</option>
                                <option value="unassigned">Sin asignar</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {loading && <div className="card placeholder-card">Cargando planes…</div>}

            {!loading && filtered.length === 0 && (
                <div className="card placeholder-card">
                    <FileText size={48} className="placeholder-icon" />
                    <h3>{activeTab === 'active' ? 'Sin planes de acción' : 'Papelera vacía'}</h3>
                    <p>
                        {activeTab === 'active'
                            ? 'No hay planes que coincidan con la búsqueda.'
                            : 'No hay planes eliminados.'}
                    </p>
                    {activeTab === 'active' && (
                        <Link href="/planes-accion/nuevo" className="btn btn--primary">
                            <Plus size={16} /> Crear primer plan
                        </Link>
                    )}
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div className="card table-card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style="width:44px;">
                                    <input
                                        type="checkbox"
                                        className="table-select-all"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        aria-label="Seleccionar todas"
                                    />
                                </th>
                                <th>Plan</th>
                                <th>Propiedad</th>
                                <th>Propietario</th>
                                <th>Estado</th>
                                <th>Prioridad</th>
                                <th>Categoría</th>
                                <th>Vence</th>
                                <th>Asignado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((plan) => {
                                const isSelected = selectedIds.has(plan.id);
                                const isOverdue =
                                    plan.due_date &&
                                    new Date(plan.due_date) < new Date() &&
                                    plan.status !== 'completed';
                                return (
                                    <tr
                                        key={plan.id}
                                        className={`row-click${isSelected ? ' selected' : ''}${plan.status === 'completed' ? ' completed' : ''}${isOverdue ? ' overdue' : ''}`}
                                        onClick={(e) => {
                                            if (
                                                (e.target as HTMLElement).closest(
                                                    'input,button,a,.icon-btn',
                                                )
                                            )
                                                return;
                                            setLocation(`/planes-accion/${plan.id}`);
                                        }}
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleOne(plan.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                aria-label={`Seleccionar ${plan.title}`}
                                            />
                                        </td>
                                        <td>
                                            <strong>{plan.title}</strong>
                                        </td>
                                        <td>{plan.property_title ?? '—'}</td>
                                        <td>{plan.owner_name ?? '—'}</td>
                                        <td>
                                            <span
                                                className={`badge badge--${ACTION_PLAN_STATUS_TONE[plan.status]}`}
                                            >
                                                {ACTION_PLAN_STATUS_LABEL[plan.status]}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`badge badge--${ACTION_PLAN_PRIORITY_TONE[plan.priority]}`}
                                            >
                                                {ACTION_PLAN_PRIORITY_LABEL[plan.priority]}
                                            </span>
                                        </td>
                                        <td>{ACTION_PLAN_CATEGORY_LABEL[plan.category]}</td>
                                        <td className={isOverdue ? 'overdue' : ''}>
                                            {formatDate(plan.due_date)}
                                        </td>
                                        <td>{plan.assigned_to_name ?? '—'}</td>
                                        <td>
                                            <div className="row-actions">
                                                {activeTab === 'active' &&
                                                    plan.status !== 'completed' && (
                                                        <button
                                                            className="icon-btn"
                                                            title="Completar"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleComplete(plan.id);
                                                            }}
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                    )}
                                                <button
                                                    className="icon-btn"
                                                    title={
                                                        activeTab === 'active'
                                                            ? 'A papelera'
                                                            : 'Restaurar'
                                                    }
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (activeTab === 'active')
                                                            setConfirmAction({
                                                                title: 'Enviar a papelera',
                                                                message: `¿Enviar a papelera "${plan.title}"?`,
                                                                confirmLabel: 'Enviar',
                                                                danger: true,
                                                                onConfirm: () =>
                                                                    void handleSoftDelete(
                                                                        plan.id,
                                                                        plan.title,
                                                                    ),
                                                            });
                                                        else
                                                            handleRestore(plan.id, plan.title);
                                                    }}
                                                >
                                                    {activeTab === 'active' ? (
                                                        <Trash2 size={14} />
                                                    ) : (
                                                        <RotateCcw size={14} />
                                                    )}
                                                </button>
                                                {activeTab === 'deleted' && (
                                                    <button
                                                        className="icon-btn icon-btn--danger"
                                                        title="Eliminar permanentemente"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmAction({
                                                                title: 'Eliminar permanentemente',
                                                                message: `¿Eliminar permanentemente "${plan.title}"?`,
                                                                confirmLabel: 'Eliminar',
                                                                danger: true,
                                                                onConfirm: () =>
                                                                    void handlePermanentDelete(
                                                                        plan.id,
                                                                        plan.title,
                                                                    ),
                                                            });
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                open={confirmAction !== null}
                title={confirmAction?.title ?? ''}
                message={confirmAction?.message ?? ''}
                confirmLabel={confirmAction?.confirmLabel}
                danger={confirmAction?.danger}
                onConfirm={() => {
                    confirmAction?.onConfirm();
                    setConfirmAction(null);
                }}
                onCancel={() => setConfirmAction(null)}
            />
        </div>
    );
}
