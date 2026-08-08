import { AlertCircle, Calendar, User } from 'lucide-preact';
import type { ActionPlanRow, ActionPlanStatus } from '../../types/owners';
import {
    ACTION_PLAN_CATEGORY_LABEL,
    ACTION_PLAN_PRIORITY_LABEL,
    ACTION_PLAN_PRIORITY_TONE,
    ACTION_PLAN_STATUS_LABEL,
    ACTION_PLAN_STATUS_TONE,
} from '../../types/owners';

interface ActionPlanCardProps {
    plan: ActionPlanRow;
    tasks: Array<{ id: string; title: string; status: ActionPlanStatus; due_date: string | null }>;
    onClick?: () => void;
    onToggleTask?: (taskId: string) => void;
}

export function ActionPlanCard({ plan, tasks, onClick, onToggleTask }: ActionPlanCardProps) {
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const isOverdue =
        plan.due_date && new Date(plan.due_date) < new Date() && plan.status !== 'completed';

    return (
        <article
            className={`action-plan-card${isOverdue ? ' overdue' : ''}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className="card-header">
                <div className="plan-title-row">
                    <h3 className="plan-title">{plan.title}</h3>
                    <span className={`badge badge--${ACTION_PLAN_STATUS_TONE[plan.status]}`}>
                        {ACTION_PLAN_STATUS_LABEL[plan.status]}
                    </span>
                </div>
                <div className="plan-meta">
                    <span className={`badge badge--${ACTION_PLAN_PRIORITY_TONE[plan.priority]}`}>
                        {ACTION_PLAN_PRIORITY_LABEL[plan.priority]}
                    </span>
                    <span className="category-badge">
                        {ACTION_PLAN_CATEGORY_LABEL[plan.category]}
                    </span>
                </div>
            </div>

            {plan.description && <p className="plan-description">{plan.description}</p>}

            <div className="plan-progress">
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
                <span className="progress-text">
                    {completedTasks} / {totalTasks} tareas
                </span>
            </div>

            {tasks.length > 0 && (
                <ul className="plan-tasks-preview">
                    {tasks.slice(0, 3).map((task) => (
                        <li
                            key={task.id}
                            className={`task-preview${task.status === 'completed' ? ' completed' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={task.status === 'completed'}
                                onChange={() => onToggleTask?.(task.id)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <span>{task.title}</span>
                        </li>
                    ))}
                    {tasks.length > 3 && (
                        <li className="task-preview more">+{tasks.length - 3} tareas más</li>
                    )}
                </ul>
            )}

            <div className="card-footer">
                <div className="plan-dates">
                    {plan.due_date && (
                        <span className={`due-date${isOverdue ? ' overdue' : ''}`}>
                            <Calendar size={13} />
                            {new Date(plan.due_date).toLocaleDateString('es-AR')}
                            {isOverdue && <AlertCircle size={13} className="overdue-icon" />}
                        </span>
                    )}
                    {plan.assigned_to_name && (
                        <span className="assignee">
                            <User size={13} />
                            {plan.assigned_to_name}
                        </span>
                    )}
                </div>

                {plan.property_title && (
                    <span className="property-ref">
                        <span>🏠</span> {plan.property_title}
                    </span>
                )}
            </div>
        </article>
    );
}
