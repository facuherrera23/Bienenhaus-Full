import { useState } from 'preact/hooks';
import { ArrowLeft, FileText, Plus, X } from 'lucide-preact';
import { Link, useLocation, useRoute } from 'wouter-preact';
import { useQueryClient } from '@tanstack/react-query';
import { useActionPlans, useCreateActionPlan, usePropertyOwners } from '@lib/owners/api';
import { pushToast } from '@store/app';
import { ActionPlanCard } from '@components/owners';
import { type ActionPlanFormValues, actionPlanSchema } from '@lib/owners/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ACTION_PLAN_CATEGORY_LABEL,
    ACTION_PLAN_PRIORITY_LABEL,
    ACTION_PLAN_STATUS_LABEL,
    type ActionPlanCategory,
    type ActionPlanPriority,
    type ActionPlanStatus,
} from '@/types/owners';

export function ActionPlansPage() {
    const [, setLocation] = useLocation();
    const [, params] = useRoute('/propiedades/:id');
    const propertyId = params?.id;

    const [showNewPlan, setShowNewPlan] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'todos' | ActionPlanStatus>('todos');
    const [categoryFilter, setCategoryFilter] = useState<'todos' | ActionPlanCategory>('todos');
    const [priorityFilter, setPriorityFilter] = useState<'todos' | ActionPlanPriority>('todos');
    const queryClient = useQueryClient();

    const { data: propertyOwners } = usePropertyOwners(propertyId!);
    const primaryOwner = propertyOwners?.find((o) => o.is_primary_contact) ?? propertyOwners?.[0];

    const { data, isLoading, isError } = useActionPlans({
        property_id: propertyId,
        status: statusFilter === 'todos' ? undefined : statusFilter,
        category: categoryFilter === 'todos' ? undefined : categoryFilter,
        priority: priorityFilter === 'todos' ? undefined : priorityFilter,
        pageSize: 50,
    });

    const actionPlans = data?.data ?? [];

    const createActionPlan = useCreateActionPlan();

    const methods = useForm<ActionPlanFormValues>({
        resolver: zodResolver(actionPlanSchema),
        defaultValues: {
            property_id: propertyId!,
            owner_id: primaryOwner?.owner_id ?? null,
            title: '',
            description: '',
            category: 'other',
            priority: 'medium',
            due_date: null,
            assigned_to: null,
        },
    });

    const handleSubmit = async (data: ActionPlanFormValues) => {
        try {
            const payload = {
                property_id: data.property_id,
                owner_id: data.owner_id ?? null,
                title: data.title,
                description: data.description ?? '',
                category: data.category,
                priority: data.priority,
                due_date: data.due_date ?? null,
                assigned_to: data.assigned_to ?? null,
            };
            await createActionPlan.mutateAsync(payload);
            pushToast({ type: 'success', title: 'Plan creado', description: payload.title });
            queryClient.invalidateQueries({ queryKey: ['action-plans'] });
            setShowNewPlan(false);
            methods.reset({
                property_id: propertyId!,
                owner_id: primaryOwner?.owner_id ?? null,
                title: '',
                description: '',
                category: 'other',
                priority: 'medium',
                due_date: null,
                assigned_to: null,
            });
        } catch {
            pushToast({ type: 'error', title: 'No se pudo crear el plan' });
        }
    };

    const filteredPlans = actionPlans.filter((plan) => {
        if (statusFilter !== 'todos' && plan.status !== statusFilter) return false;
        if (categoryFilter !== 'todos' && plan.category !== categoryFilter) return false;
        if (priorityFilter !== 'todos' && plan.priority !== priorityFilter) return false;
        return true;
    });

    return (
        <div className="page action-plans-page">
            <div className="page-head">
                <Link href={`/propiedades/${propertyId}`} className="btn btn--ghost">
                    <ArrowLeft size={16} /> Volver a la propiedad
                </Link>
                <div>
                    <h2 className="page-title">Planes de Acción</h2>
                    <p className="page-subtitle">
                        Gestioná los planes de acción para esta propiedad.
                    </p>
                </div>
                <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setShowNewPlan(true)}
                >
                    <Plus size={16} /> Nuevo plan
                </button>
            </div>

            {showNewPlan && (
                <div className="card form-card">
                    <form onSubmit={methods.handleSubmit(handleSubmit)} className="plan-form">
                        <div className="form-header">
                            <h3>Nuevo plan de acción</h3>
                            <button
                                type="button"
                                className="icon-btn"
                                onClick={() => setShowNewPlan(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="form-grid">
                            <div className="field">
                                <label htmlFor="title">
                                    Título <span className="required">*</span>
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    placeholder="Ej: Ajustar precio de publicación"
                                    {...methods.register('title')}
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="category">Categoría</label>
                                <select id="category" {...methods.register('category')}>
                                    <option value="pricing">
                                        {ACTION_PLAN_CATEGORY_LABEL.pricing}
                                    </option>
                                    <option value="marketing">
                                        {ACTION_PLAN_CATEGORY_LABEL.marketing}
                                    </option>
                                    <option value="condition">
                                        {ACTION_PLAN_CATEGORY_LABEL.condition}
                                    </option>
                                    <option value="legal">
                                        {ACTION_PLAN_CATEGORY_LABEL.legal}
                                    </option>
                                    <option value="other">
                                        {ACTION_PLAN_CATEGORY_LABEL.other}
                                    </option>
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="priority">Prioridad</label>
                                <select id="priority" {...methods.register('priority')}>
                                    <option value="low">{ACTION_PLAN_PRIORITY_LABEL.low}</option>
                                    <option value="medium">
                                        {ACTION_PLAN_PRIORITY_LABEL.medium}
                                    </option>
                                    <option value="high">{ACTION_PLAN_PRIORITY_LABEL.high}</option>
                                    <option value="urgent">
                                        {ACTION_PLAN_PRIORITY_LABEL.urgent}
                                    </option>
                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="due_date">Fecha límite</label>
                                <input
                                    id="due_date"
                                    type="date"
                                    {...methods.register('due_date')}
                                />
                            </div>
                        </div>

                        <div className="field full-width">
                            <label htmlFor="description">Descripción</label>
                            <textarea
                                id="description"
                                rows={3}
                                placeholder="Detalles del plan..."
                                {...methods.register('description')}
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn--ghost"
                                onClick={() => setShowNewPlan(false)}
                            >
                                <X size={14} /> Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn btn--primary"
                                disabled={createActionPlan.isPending}
                            >
                                {createActionPlan.isPending ? 'Creando...' : 'Crear plan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="toolbar">
                <div className="toolbar-filters">
                    <select
                        className="select"
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                (e.currentTarget as HTMLSelectElement)
                                    .value as 'todos' | ActionPlanStatus,
                            )
                        }
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="pending">{ACTION_PLAN_STATUS_LABEL.pending}</option>
                        <option value="in_progress">{ACTION_PLAN_STATUS_LABEL.in_progress}</option>
                        <option value="completed">{ACTION_PLAN_STATUS_LABEL.completed}</option>
                        <option value="cancelled">{ACTION_PLAN_STATUS_LABEL.cancelled}</option>
                    </select>
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
                        <option value="todos">Todas las categorías</option>
                        <option value="pricing">{ACTION_PLAN_CATEGORY_LABEL.pricing}</option>
                        <option value="marketing">{ACTION_PLAN_CATEGORY_LABEL.marketing}</option>
                        <option value="condition">{ACTION_PLAN_CATEGORY_LABEL.condition}</option>
                        <option value="legal">{ACTION_PLAN_CATEGORY_LABEL.legal}</option>
                        <option value="other">{ACTION_PLAN_CATEGORY_LABEL.other}</option>
                    </select>
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
                        <option value="todos">Todas las prioridades</option>
                        <option value="low">{ACTION_PLAN_PRIORITY_LABEL.low}</option>
                        <option value="medium">{ACTION_PLAN_PRIORITY_LABEL.medium}</option>
                        <option value="high">{ACTION_PLAN_PRIORITY_LABEL.high}</option>
                        <option value="urgent">{ACTION_PLAN_PRIORITY_LABEL.urgent}</option>
                    </select>
                </div>
            </div>

            {isLoading && <div className="card placeholder-card">Cargando planes…</div>}
            {isError && <div className="card placeholder-card">Error al cargar los planes.</div>}

            {!isLoading && !isError && filteredPlans.length === 0 && (
                <div className="empty-state">
                    <FileText size={48} className="placeholder-icon" />
                    <h3>Sin planes de acción</h3>
                    <p>No hay planes que coincidan con los filtros.</p>
                    <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => setShowNewPlan(true)}
                    >
                        <Plus size={16} /> Crear primer plan
                    </button>
                </div>
            )}

            {!isLoading && !isError && filteredPlans.length > 0 && (
                <div className="plans-grid">
                    {filteredPlans.map((plan) => (
                        <ActionPlanCard
                            key={plan.id}
                            plan={plan}
                            tasks={[]}
                            onClick={() => setLocation(`/planes-accion/${plan.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
