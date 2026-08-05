import { useState } from 'preact/hooks';
import { ArrowLeft, Edit, Trash2, Plus, Check, User, AlertCircle, X, RotateCcw } from 'lucide-preact';
import { Link, useLocation, useRoute } from 'wouter-preact';
import { useQueryClient } from '@tanstack/react-query';
import {
   useActionPlan,
   useActionPlanTasks,
   useCreateActionPlanTask,
   useUpdateActionPlanTask,
   useDeleteActionPlanTask,
   useUpdateActionPlan,
   useCompleteActionPlan,
   useSoftDeleteActionPlan,
   useRestoreActionPlan,
   usePermanentDeleteActionPlan,
   actionPlanSchema,
} from '@lib/owners/api';
import { actionPlanTaskSchema } from '@lib/owners/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ActionPlanStatus } from '@/types/owners';
import {
  ACTION_PLAN_STATUS_LABEL,
  ACTION_PLAN_STATUS_TONE,
  ACTION_PLAN_PRIORITY_LABEL,
  ACTION_PLAN_PRIORITY_TONE,
  ACTION_PLAN_CATEGORY_LABEL,
} from '@/types/owners';
import { pushToast } from '@/store/app';
import { ActionPlanCard, ActionPlanTaskList } from '@components/owners';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR');
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR');
}

export function ActionPlanDetailPage() {
const [, setLocation] = useLocation();
   const [, params] = useRoute('/planes-accion/:id');
   const planId = params?.id ?? null;

  const [showNewTask, setShowNewTask] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const queryClient = useQueryClient();

  const { data: plan, isLoading: planLoading, isError: planError } = useActionPlan(planId);
  const { data: tasks } = useActionPlanTasks(planId);

  const updateActionPlan = useUpdateActionPlan();
  const completeActionPlan = useCompleteActionPlan();
  const softDeleteActionPlan = useSoftDeleteActionPlan();
  const restoreActionPlan = useRestoreActionPlan();
  const permanentDeleteActionPlan = usePermanentDeleteActionPlan();

const createTask = useCreateActionPlanTask();
   const updateTask = useUpdateActionPlanTask();
   const deleteTask = useDeleteActionPlanTask();

  const planMethods = useForm({
    resolver: zodResolver(actionPlanSchema.partial()),
    defaultValues: {
      title: '',
      description: '',
      category: 'other',
      priority: 'medium',
      due_date: null,
      assigned_to: null,
    },
  });

const taskMethods = useForm({
   resolver: zodResolver(actionPlanTaskSchema),
   defaultValues: {
     plan_id: planId!,
     title: '',
     description: '',
     due_date: null,
     assigned_to: null,
     status: 'pending',
   },
 });

  const handlePlanSubmit = async (data: any) => {
    try {
      await updateActionPlan.mutateAsync({ id: planId!, plan: data });
      pushToast({ type: 'success', title: 'Plan actualizado' });
      queryClient.invalidateQueries({ queryKey: ['action-plans'] });
      setEditingPlan(false);
    } catch {
      pushToast({ type: 'error', title: 'No se pudo actualizar' });
    }
  };

const handleTaskSubmit = async (data: any) => {
   try {
     await createTask.mutateAsync({
       ...data,
       description: data.description ?? '',
     });
     pushToast({ type: 'success', title: 'Tarea creada' });
     queryClient.invalidateQueries({ queryKey: ['action-plan-tasks', planId] });
     queryClient.invalidateQueries({ queryKey: ['action-plans'] });
     setShowNewTask(false);
     taskMethods.reset({
       plan_id: planId!,
       title: '',
       description: '',
       due_date: null,
       assigned_to: null,
       status: 'pending',
     });
   } catch {
     pushToast({ type: 'error', title: 'No se pudo crear la tarea' });
   }
 };

  const handleToggleTask = async (taskId: string, newStatus: ActionPlanStatus) => {
    try {
      await updateTask.mutateAsync({ id: taskId, task: { status: newStatus } });
      queryClient.invalidateQueries({ queryKey: ['action-plan-tasks', planId] });
      queryClient.invalidateQueries({ queryKey: ['action-plans'] });
    } catch {
      pushToast({ type: 'error', title: 'No se pudo actualizar' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    try {
      await deleteTask.mutateAsync(taskId);
      pushToast({ type: 'success', title: 'Tarea eliminada' });
      queryClient.invalidateQueries({ queryKey: ['action-plan-tasks', planId] });
      queryClient.invalidateQueries({ queryKey: ['action-plans'] });
    } catch {
      pushToast({ type: 'error', title: 'No se pudo eliminar' });
    }
  };

  const handleCompletePlan = async () => {
    if (!plan) return;
    if (!window.confirm('¿Marcar plan como completado?')) return;
    try {
      await completeActionPlan.mutateAsync(plan.id);
      pushToast({ type: 'success', title: 'Plan completado' });
      queryClient.invalidateQueries({ queryKey: ['action-plans'] });
    } catch {
      pushToast({ type: 'error', title: 'No se pudo completar' });
    }
  };

  const handleSoftDelete = async () => {
    if (!plan) return;
    if (!window.confirm(`¿Enviar a papelera el plan "${plan.title}"?`)) return;
    try {
      await softDeleteActionPlan.mutateAsync(plan.id);
      pushToast({ type: 'success', title: 'Enviado a papelera' });
      setLocation('/planes-accion');
    } catch {
      pushToast({ type: 'error', title: 'No se pudo eliminar' });
    }
  };

  const handleRestore = async () => {
    if (!plan) return;
    try {
      await restoreActionPlan.mutateAsync(plan.id);
      pushToast({ type: 'success', title: 'Restaurado' });
      queryClient.invalidateQueries({ queryKey: ['action-plans'] });
    } catch {
      pushToast({ type: 'error', title: 'No se pudo restaurar' });
    }
  };

  const handlePermanentDelete = async () => {
    if (!plan) return;
    if (!window.confirm('¿Eliminar permanentemente?')) return;
    try {
      await permanentDeleteActionPlan.mutateAsync(plan.id);
      pushToast({ type: 'success', title: 'Eliminado permanentemente' });
      setLocation('/planes-accion');
    } catch {
      pushToast({ type: 'error', title: 'No se pudo eliminar' });
    }
  };

  const handleCancelEdit = () => {
    if (plan) {
      planMethods.reset({
        title: plan.title,
        description: plan.description ?? '',
        category: plan.category,
        priority: plan.priority,
        due_date: plan.due_date,
        assigned_to: plan.assigned_to,
      });
    }
    setEditingPlan(false);
  };

  if (planLoading) {
    return (
      <div className="page">
        <div className="page-head">
          <Link href="/planes-accion" className="btn btn--ghost">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>
        <div className="card placeholder-card">Cargando plan…</div>
      </div>
    );
  }

  if (planError || !plan) {
    return (
      <div className="page">
        <div className="page-head">
          <Link href="/planes-accion" className="btn btn--ghost">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>
        <div className="card placeholder-card">Plan no encontrado</div>
      </div>
    );
  }

  const completedTasks = tasks?.filter((t) => t.status === 'completed').length ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isOverdue = plan.due_date && new Date(plan.due_date) < new Date() && plan.status !== 'completed';

  return (
    <div className="page action-plan-detail-page">
      <div className="page-head">
        <Link href="/planes-accion" className="btn btn--ghost">
          <ArrowLeft size={16} /> Volver
        </Link>
        <div>
          <h2 className="page-title">{plan.title}</h2>
          <p className="page-subtitle">
            <span className={`badge badge--${ACTION_PLAN_STATUS_TONE[plan.status]}`}>
              {ACTION_PLAN_STATUS_LABEL[plan.status]}
            </span>
            <span className={`badge badge--${ACTION_PLAN_PRIORITY_TONE[plan.priority]}`}>
              {ACTION_PLAN_PRIORITY_LABEL[plan.priority]}
            </span>
            <span className="badge badge--neutral">{ACTION_PLAN_CATEGORY_LABEL[plan.category]}</span>
          </p>
        </div>
        <div style="display:flex; gap:8px;">
          {plan.status !== 'completed' && plan.deleted_at === null && (
            <button
              type="button"
              className="btn btn--success"
              onClick={handleCompletePlan}
              disabled={completeActionPlan.isPending}
            >
              <Check size={16} /> Completar
            </button>
          )}
          {plan.deleted_at === null && !editingPlan && (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                planMethods.reset({
                  title: plan.title,
                  description: plan.description ?? '',
                  category: plan.category,
                  priority: plan.priority,
                  due_date: plan.due_date,
                  assigned_to: plan.assigned_to,
                });
                setEditingPlan(true);
              }}
            >
              <Edit size={16} /> Editar
            </button>
          )}
          {plan.deleted_at === null && (
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleSoftDelete}
              disabled={softDeleteActionPlan.isPending}
            >
              <Trash2 size={16} /> Papelera
            </button>
          )}
          {plan.deleted_at !== null && (
            <>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleRestore}
                disabled={restoreActionPlan.isPending}
              >
                <RotateCcw size={16} /> Restaurar
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={handlePermanentDelete}
                disabled={permanentDeleteActionPlan.isPending}
              >
                <Trash2 size={16} /> Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {editingPlan && (
        <div className="card form-card">
          <form onSubmit={planMethods.handleSubmit(handlePlanSubmit)} className="plan-form">
            <div className="form-header">
              <h3>Editar plan</h3>
              <button type="button" className="icon-btn" onClick={handleCancelEdit}>
                <X size={18} />
              </button>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="title">Título</label>
                <input id="title" type="text" {...planMethods.register('title')} />
              </div>
              <div className="field">
                <label htmlFor="category">Categoría</label>
                <select id="category" {...planMethods.register('category')}>
                  <option value="pricing">{ACTION_PLAN_CATEGORY_LABEL.pricing}</option>
                  <option value="marketing">{ACTION_PLAN_CATEGORY_LABEL.marketing}</option>
                  <option value="condition">{ACTION_PLAN_CATEGORY_LABEL.condition}</option>
                  <option value="legal">{ACTION_PLAN_CATEGORY_LABEL.legal}</option>
                  <option value="other">{ACTION_PLAN_CATEGORY_LABEL.other}</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="priority">Prioridad</label>
                <select id="priority" {...planMethods.register('priority')}>
                  <option value="low">{ACTION_PLAN_PRIORITY_LABEL.low}</option>
                  <option value="medium">{ACTION_PLAN_PRIORITY_LABEL.medium}</option>
                  <option value="high">{ACTION_PLAN_PRIORITY_LABEL.high}</option>
                  <option value="urgent">{ACTION_PLAN_PRIORITY_LABEL.urgent}</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="due_date">Fecha límite</label>
                <input id="due_date" type="date" {...planMethods.register('due_date')} />
              </div>
            </div>

            <div className="field full-width">
              <label htmlFor="description">Descripción</label>
              <textarea id="description" rows={3} {...planMethods.register('description')} />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={handleCancelEdit}>
                <X size={14} /> Cancelar
              </button>
              <button type="submit" className="btn btn--primary" disabled={updateActionPlan.isPending}>
                {updateActionPlan.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="plan-detail-grid">
        <div className="plan-main">
          <ActionPlanCard
            plan={plan}
            tasks={tasks ?? []}
          />

          <div className="detail-card">
            <h3>Información del plan</h3>
            <dl className="detail-list">
              {plan.description && (
                <>
                  <dt>Descripción</dt>
                  <dd>{plan.description}</dd>
                </>
              )}
              <dt>Creado</dt>
              <dd>{formatDateTime(plan.created_at)}</dd>
              <dt>Actualizado</dt>
              <dd>{formatDateTime(plan.updated_at)}</dd>
              {plan.created_by_name && (
                <>
                  <dt>Creado por</dt>
                  <dd>{plan.created_by_name}</dd>
                </>
              )}
              {plan.due_date && (
                <>
                  <dt className={isOverdue ? 'overdue-label' : ''}>Fecha límite</dt>
                  <dd className={isOverdue ? 'overdue-value' : ''}>
                    {formatDate(plan.due_date)}
                    {isOverdue && <AlertCircle size={14} className="overdue-icon" />}
                  </dd>
                </>
              )}
              {plan.assigned_to_name && (
                <>
                  <dt>Asignado a</dt>
                  <dd><User size={14} /> {plan.assigned_to_name}</dd>
                </>
              )}
              {plan.owner_name && (
                <>
                  <dt>Propietario</dt>
                  <dd>{plan.owner_name}</dd>
                </>
              )}
              {plan.property_title && (
                <>
                  <dt>Propiedad</dt>
                  <dd>
                    <Link href={`/propiedades/${plan.property_id}`}>
                      {plan.property_title}
                    </Link>
                  </dd>
                </>
              )}
            </dl>
          </div>
        </div>

        <div className="plan-sidebar">
          <div className="info-card progress-card">
            <h4>Progreso</h4>
            <div className="progress-ring" style={{ '--progress': progress }}>
              <span className="progress-text">{Math.round(progress)}%</span>
            </div>
            <p className="progress-detail">{completedTasks} de {totalTasks} tareas completadas</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          <div className="info-card">
            <h4>Tareas</h4>
            <div className="task-stats">
              <div className="stat">
                <span className="stat-value">{totalTasks}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat">
                <span className="stat-value success">{completedTasks}</span>
                <span className="stat-label">Completadas</span>
              </div>
              <div className="stat">
                <span className="stat-value warning">{tasks?.filter(t => t.status === 'in_progress').length ?? 0}</span>
                <span className="stat-label">En progreso</span>
              </div>
              <div className="stat">
                <span className="stat-value danger">{tasks?.filter(t => t.status === 'pending' && t.due_date && new Date(t.due_date) < new Date()).length ?? 0}</span>
                <span className="stat-label">Vencidas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tasks-section">
        <div className="section-header">
          <h3>Tareas del plan</h3>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => setShowNewTask(true)}
          >
            <Plus size={14} /> Nueva tarea
          </button>
        </div>

        {showNewTask && (
          <div className="card form-card task-form">
            <form onSubmit={taskMethods.handleSubmit(handleTaskSubmit)}>
              <div className="form-header">
                <h4>Nueva tarea</h4>
                <button type="button" className="icon-btn" onClick={() => setShowNewTask(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="task_title">Título <span className="required">*</span></label>
                  <input id="task_title" type="text" placeholder="Ej: Contactar propietario para revisar precio" {...taskMethods.register('title')} />
                </div>
                <div className="field">
                  <label htmlFor="task_due_date">Fecha límite</label>
                  <input id="task_due_date" type="date" {...taskMethods.register('due_date')} />
                </div>
              </div>

              <div className="field full-width">
                <label htmlFor="task_description">Descripción</label>
                <textarea id="task_description" rows={2} placeholder="Detalles..." {...taskMethods.register('description')} />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setShowNewTask(false)}>
                  <X size={14} /> Cancelar
                </button>
                <button type="submit" className="btn btn--primary" disabled={createTask.isPending}>
                  {createTask.isPending ? 'Creando...' : 'Crear tarea'}
                </button>
              </div>
            </form>
          </div>
        )}

        <ActionPlanTaskList
          tasks={tasks ?? []}
          onToggle={handleToggleTask}
          onDelete={handleDeleteTask}
        />
      </div>
    </div>
  );
}