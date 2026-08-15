import { Calendar, Check, Clock, MoreVertical, User } from 'lucide-preact';
import { useState } from 'preact/hooks';
import {
    ACTION_PLAN_STATUS_LABEL,
    ACTION_PLAN_STATUS_TONE,
    type ActionPlanStatus,
    type ActionPlanTaskRow,
} from '../../types/owners';
import { ConfirmDialog } from '../ConfirmDialog';
import { IconButton } from '@bienenhaus/ui';

interface ActionPlanTaskListProps {
    tasks: ActionPlanTaskRow[];
    onToggle: (taskId: string, newStatus: ActionPlanStatus) => void;
    onEdit?: (task: ActionPlanTaskRow) => void;
    onDelete?: (taskId: string) => void;
    canEdit?: boolean;
}

export function ActionPlanTaskList({
    tasks,
    onToggle,
    onEdit,
    onDelete,
    canEdit = true,
}: ActionPlanTaskListProps) {
    const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

    const getStatusOptions = (currentStatus: ActionPlanStatus): ActionPlanStatus[] => {
        switch (currentStatus) {
            case 'pending':
                return ['in_progress', 'completed', 'cancelled'];
            case 'in_progress':
                return ['completed', 'pending', 'cancelled'];
            case 'completed':
                return ['pending', 'in_progress'];
            case 'cancelled':
                return ['pending'];
            default:
                return [];
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('es-AR');
    };

    const isOverdue = (task: ActionPlanTaskRow) => {
        if (!task.due_date || task.status === 'completed') return false;
        return new Date(task.due_date) < new Date();
    };

    return (
        <div className="action-plan-task-list">
            {tasks.length === 0 && (
                <div className="empty-tasks">
                    <p>No hay tareas en este plan.</p>
                </div>
            )}

            <ul className="task-list" role="list">
                {tasks.map((task) => (
                    <li
                        key={task.id}
                        className={`task-item${task.status === 'completed' ? ' completed' : ''}${isOverdue(task) ? ' overdue' : ''}`}
                    >
                        <div className="task-main">
                            <label className="task-checkbox">
                                <select
                                    value={task.status}
                                    onChange={(e) =>
                                        onToggle(
                                            task.id,
                                            (e.target as HTMLSelectElement)
                                                .value as ActionPlanStatus,
                                        )
                                    }
                                    className={`status-select status-select--${ACTION_PLAN_STATUS_TONE[task.status]}`}
                                    aria-label={`Estado de la tarea: ${ACTION_PLAN_STATUS_LABEL[task.status]}`}
                                >
                                    {getStatusOptions(task.status).map((status) => (
                                        <option key={status} value={status}>
                                            {ACTION_PLAN_STATUS_LABEL[status]}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <div className="task-content">
                                <h4 className="task-title">{task.title}</h4>
                                {task.description && (
                                    <p className="task-description">{task.description}</p>
                                )}
                            </div>
                        </div>

                        <div className="task-meta">
                            {task.due_date && (
                                <span
                                    className={`task-due-date${isOverdue(task) ? ' overdue' : ''}`}
                                >
                                    <Calendar size={12} />
                                    {formatDate(task.due_date)}
                                    {isOverdue(task) && (
                                        <Clock size={12} className="overdue-icon" />
                                    )}
                                </span>
                            )}
                            {task.assigned_to_name && (
                                <span className="task-assignee">
                                    <User size={12} />
                                    {task.assigned_to_name}
                                </span>
                            )}
                            {task.completed_at && (
                                <span className="task-completed">
                                    <Check size={12} />
                                    Completada {formatDate(task.completed_at)}
                                </span>
                            )}
                        </div>

                        {canEdit && (
                            <div className="task-actions">
                                <IconButton
                                    type="button"
                                    variant="ghost"
                                    onClick={() => onEdit?.(task)}
                                    title="Editar tarea"
                                    aria-label="Editar tarea"
                                >
                                    <MoreVertical size={14} />
                                </IconButton>
                                {onDelete && (
                                    <IconButton
                                        type="button"
                                        variant="danger"
                                        onClick={() => setDeleteTaskId(task.id)}
                                        title="Eliminar tarea"
                                        aria-label="Eliminar tarea"
                                    >
                                        <MoreVertical size={14} />
                                    </IconButton>
                                )}
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            <ConfirmDialog
                open={deleteTaskId !== null}
                title="Eliminar tarea"
                message="¿Eliminar esta tarea?"
                confirmLabel="Eliminar"
                danger
                onConfirm={() => {
                    if (deleteTaskId) onDelete?.(deleteTaskId);
                    setDeleteTaskId(null);
                }}
                onCancel={() => setDeleteTaskId(null)}
            />
        </div>
    );
}
