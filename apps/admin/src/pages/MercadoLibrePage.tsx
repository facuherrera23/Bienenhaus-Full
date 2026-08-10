import { useState } from 'preact/hooks';
import {
    BarChart2,
    CheckCircle2,
    Copy,
    Edit2,
    ExternalLink,
    Link2,
    Loader2,
    MessageSquare,
    Plus,
    Search,
    Send,
    ShoppingBag,
    Trash2,
    Unplug,
    X,
    Zap,
} from 'lucide-preact';
import {
    answerMlQuestion,
    buildAuthorizeUrl,
    createMlAutoReplyTemplate,
    deleteMlAutoReplyTemplate,
    disconnectMl,
    fetchMlAutoReplyTemplates,
    fetchMlCategories,
    fetchMlListingTypes,
    fetchMlMeta,
    fetchMlMetrics,
    fetchMlOverview,
    fetchMlQuestions,
    fetchMlQueue,
    fetchMlSettings,
    ML_OPERATION_LABEL,
    ML_REDIRECT_URI,
    ML_SYNC_STATUS_LABEL,
    ML_SYNC_STATUS_TONE,
    type MlAutoReplyTemplate,
    type MlCategory,
    type MlListingType,
    type MlQuestion,
    type MlQueueRow,
    type MlSyncStatus,
    setMlAppId,
    setMlDefaults,
    setMlEnabled,
    updateMlAutoReplyTemplate,
} from '../lib/ml';
import { queryClient } from '../lib/query/client';
import { useMutation, useQuery } from '../lib/query/hooks';
import { pushToast } from '../store/app';
import { ConfirmDialog } from '../components/ConfirmDialog';
import styles from './MercadoLibrePage.module.css';


const LISTING_TYPE_DESCRIPTIONS: Record<string, string> = {
    free: 'Gratuita: sin costo, menor visibilidad, ideal para probar',
    gold_special: 'Clasica: comision por venta, buena visibilidad',
    gold_pro: 'Premium: mayor exposicion, comision mas alta, mejor posicionamiento',
    gold_premium: 'Premium Plus: maxima visibilidad, comision mas alta',
};

function StatusBadge({ status }: { status: MlSyncStatus }) {
    return (
        <span className={`badge badge--${ML_SYNC_STATUS_TONE[status]}`}>
            {ML_SYNC_STATUS_LABEL[status]}
        </span>
    );
}

function formatDate(iso: string | null): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <div className={styles['stat-card']}>
            <strong>{value}</strong>
            <span>{label}</span>
        </div>
    );
}

export function MercadoLibrePage() {
    const overviewQ = useQuery({ queryKey: ['ml-overview'], queryFn: fetchMlOverview });
    const settingsQ = useQuery({ queryKey: ['ml-settings'], queryFn: fetchMlSettings });
    const queueQ = useQuery<MlQueueRow[]>({ queryKey: ['ml-queue'], queryFn: fetchMlQueue });
    const metaQ = useQuery({ queryKey: ['ml-meta'], queryFn: fetchMlMeta });
    const metricsQ = useQuery({ queryKey: ['ml-metrics'], queryFn: fetchMlMetrics });
    const categoriesQ = useQuery({ queryKey: ['ml-categories'], queryFn: fetchMlCategories });
    const listingTypesQ = useQuery({
        queryKey: ['ml-listing-types'],
        queryFn: fetchMlListingTypes,
    });
    const questionsQ = useQuery({ queryKey: ['ml-questions'], queryFn: fetchMlQuestions });
    const autoReplyQ = useQuery({
        queryKey: ['ml-auto-reply'],
        queryFn: fetchMlAutoReplyTemplates,
    });

    const [appIdDraft, setAppIdDraft] = useState('');
    const [savingAppId, setSavingAppId] = useState(false);
    const [defaultsDraft, setDefaultsDraft] = useState({
        category_id: '',
        listing_type_id: 'gold_pro',
        condition: 'used',
    });
    const [savingDefaults, setSavingDefaults] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    const [showMetrics, setShowMetrics] = useState(false);
    const [showQuestions, setShowQuestions] = useState(false);
    const [showAutoReply, setShowAutoReply] = useState(false);

    const [selectedQuestion, setSelectedQuestion] = useState<MlQuestion | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replying, setReplying] = useState(false);

    type TemplateTrigger =
        'new_question' | 'new_order' | 'order_paid' | 'order_shipped' | 'order_delivered';
    const [showAutoReplyModal, setShowAutoReplyModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<MlAutoReplyTemplate | null>(null);
    const [deleteTemplateId, setDeleteTemplateId] = useState<number | null>(null);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [templateForm, setTemplateForm] = useState<{
        name: string;
        trigger: TemplateTrigger;
        message: string;
        is_active: boolean;
    }>({ name: '', trigger: 'new_question', message: '', is_active: true });

    const overview = overviewQ.data;
    const connected = !!overview?.connection;
    const connection = overview?.connection ?? null;
    const mlEnabled = !!overview?.ml_enabled;

    const queueRows = queueQ.data ?? [];
    const stats = {
        pending: queueRows.filter((q) => q.status === 'pending').length,
        processing: queueRows.filter((q) => q.status === 'processing').length,
        success: queueRows.filter((q) => q.status === 'success').length,
        failed: queueRows.filter((q) => q.status === 'failed').length,
        onMl: (metaQ.data ?? []).length,
    };

    const disconnectMutation = useMutation({
        mutationFn: disconnectMl,
        onSuccess: async () => {
            pushToast({ type: 'success', title: 'Cuenta desconectada' });
            await queryClient.invalidateQueries({ queryKey: ['ml-overview'] });
        },
        onError: (err) => {
            pushToast({
                type: 'error',
                title: 'Error al desconectar',
                description: err instanceof Error ? err.message : 'Intenta de nuevo.',
            });
        },
    });

    const toggleEnabled = async (checked: boolean) => {
        try {
            await setMlEnabled(checked);
            pushToast({
                type: 'success',
                title: checked ? 'Integracion activada' : 'Integracion desactivada',
            });
            await queryClient.invalidateQueries({ queryKey: ['ml-overview'] });
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error al cambiar estado',
                description: err instanceof Error ? err.message : 'Intenta de nuevo.',
            });
        }
    };

    const connect = () => {
        if (!appIdDraft.trim()) {
            pushToast({ type: 'warning', title: 'Falta el ID de aplicacion' });
            return;
        }
        window.open(buildAuthorizeUrl(appIdDraft.trim()), '_blank', 'noopener');
    };

    const saveAppId = async () => {
        setSavingAppId(true);
        try {
            await setMlAppId(appIdDraft.trim());
            pushToast({ type: 'success', title: 'ID de aplicacion guardado' });
            await queryClient.invalidateQueries({ queryKey: ['ml-settings'] });
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error al guardar ID',
                description: err instanceof Error ? err.message : 'Intenta de nuevo.',
            });
        } finally {
            setSavingAppId(false);
        }
    };

    const saveDefaults = async () => {
        setSavingDefaults(true);
        try {
            await setMlDefaults(defaultsDraft);
            pushToast({ type: 'success', title: 'Configuracion guardada' });
            await queryClient.invalidateQueries({ queryKey: ['ml-settings'] });
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error al guardar configuracion',
                description: err instanceof Error ? err.message : 'Intenta de nuevo.',
            });
        } finally {
            setSavingDefaults(false);
        }
    };

    const handleReply = async () => {
        if (!selectedQuestion || !replyText.trim()) return;
        setReplying(true);
        try {
            await answerMlQuestion(selectedQuestion.question_id, replyText.trim());
            pushToast({ type: 'success', title: 'Respuesta enviada' });
            setSelectedQuestion(null);
            setReplyText('');
            await queryClient.invalidateQueries({ queryKey: ['ml-questions'] });
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'No se pudo responder',
                description: err instanceof Error ? err.message : 'Intenta de nuevo.',
            });
        } finally {
            setReplying(false);
        }
    };

    const handleTemplateSave = async () => {
        if (!templateForm.name.trim() || !templateForm.message.trim()) {
            pushToast({
                type: 'warning',
                title: 'Faltan datos',
                description: 'Completa nombre y mensaje.',
            });
            return;
        }
        setSavingTemplate(true);
        try {
            if (editingTemplate) {
                await updateMlAutoReplyTemplate(editingTemplate.id, templateForm);
            } else {
                await createMlAutoReplyTemplate(templateForm);
            }
            pushToast({
                type: 'success',
                title: editingTemplate ? 'Plantilla actualizada' : 'Plantilla creada',
            });
            setShowAutoReplyModal(false);
            setEditingTemplate(null);
            await queryClient.invalidateQueries({ queryKey: ['ml-auto-reply'] });
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error al guardar plantilla',
                description: err instanceof Error ? err.message : 'Intenta de nuevo.',
            });
        } finally {
            setSavingTemplate(false);
        }
    };

    const closeTemplateModal = () => {
        setShowAutoReplyModal(false);
        setEditingTemplate(null);
    };

    const metricsSection =
        showMetrics && connected ? (
            <section className="card">
                <div className="site-section-head">
                    <div>
                        <h3>Metricas de Mercado Libre</h3>
                        <p>Rendimiento de tus publicaciones en la plataforma.</p>
                    </div>
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => setShowMetrics(false)}
                    >
                        <X size={16} /> Cerrar
                    </button>
                </div>
                {metricsQ.isPending && (
                    <div className="ml-skeleton">
                        <div className="skeleton-row">
                            <div className="skeleton-stat"></div>
                            <div className="skeleton-stat"></div>
                            <div className="skeleton-stat"></div>
                            <div className="skeleton-stat"></div>
                            <div className="skeleton-stat"></div>
                            <div className="skeleton-stat"></div>
                        </div>
                        <div className="skeleton-table">
                            <div className="skeleton-row header"></div>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="skeleton-row"></div>
                            ))}
                        </div>
                    </div>
                )}
                {metricsQ.isError && (
                    <div className="ml-error">
                        <p>No se pudieron cargar las metricas.</p>
                        <button
                            className="btn btn--secondary btn--sm"
                            onClick={() => metricsQ.refetch()}
                        >
                            Reintentar
                        </button>
                    </div>
                )}
                {metricsQ.data && !metricsQ.isPending && !metricsQ.isError && (
                    <>
                        <div className={styles['ml-stats']} style={{ marginBottom: '24px' }}>
                            <StatCard label="Visitas totales" value={metricsQ.data.total_visits} />
                            <StatCard label="Preguntas" value={metricsQ.data.total_questions} />
                            <StatCard
                                label="Sin responder"
                                value={metricsQ.data.unanswered_questions}
                            />
                            <StatCard label="Ventas" value={metricsQ.data.total_sales} />
                            <StatCard label="Ingresos (ARS)" value={metricsQ.data.total_revenue} />
                            <StatCard
                                label="Conversion (%)"
                                value={metricsQ.data.conversion_rate}
                            />
                        </div>
                        <div className="card table-card">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Publicacion</th>
                                        <th>Visitas</th>
                                        <th>Preguntas</th>
                                        <th>Vendidas</th>
                                        <th>Disponibles</th>
                                        <th>Precio</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metricsQ.data.items.map((item) => (
                                        <tr key={item.item_id}>
                                            <td>
                                                <strong>{item.title}</strong>
                                            </td>
                                            <td className="num">{item.visits}</td>
                                            <td className="num">{item.questions}</td>
                                            <td className="num">{item.sold_quantity}</td>
                                            <td className="num">{item.available_quantity}</td>
                                            <td className="num">{`${item.currency_id} ${item.price.toLocaleString('es-AR')}`}</td>
                                            <td className="cap">{item.status}</td>
                                        </tr>
                                    ))}
                                    {metricsQ.data.items.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="empty-cell">
                                                Sin metricas aun.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </section>
        ) : null;

    const questionsSection =
        showQuestions && connected ? (
            <section className="card">
                <div className="site-section-head">
                    <div>
                        <h3>Preguntas de Mercado Libre</h3>
                        <p>
                            Preguntas de compradores en tus publicaciones. Responde para convertir
                            leads.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {questionsQ.data && (
                            <span className="badge badge--info">
                                {questionsQ.data.filter((q) => q.status === 'unanswered').length}{' '}
                                sin responder
                            </span>
                        )}
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => setShowQuestions(false)}
                        >
                            <X size={16} /> Cerrar
                        </button>
                    </div>
                </div>
                {questionsQ.isPending && (
                    <div className="ml-skeleton">
                        <div className="skeleton-table">
                            <div className="skeleton-row header"></div>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="skeleton-row"></div>
                            ))}
                        </div>
                    </div>
                )}
                {questionsQ.isError && (
                    <div className="ml-error">
                        <p>No se pudieron cargar las preguntas.</p>
                        <button
                            className="btn btn--secondary btn--sm"
                            onClick={() => questionsQ.refetch()}
                        >
                            Reintentar
                        </button>
                    </div>
                )}
                {questionsQ.data && !questionsQ.isPending && !questionsQ.isError && (
                    <div className="card table-card">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Publicacion</th>
                                    <th>Pregunta</th>
                                    <th>Comprador</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {questionsQ.data.map((q) => (
                                    <tr key={q.id}>
                                        <td>
                                            <strong>Item #{q.ml_item_id}</strong>
                                        </td>
                                        <td
                                            style={{
                                                maxWidth: '300px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {q.question_text ?? '-'}
                                        </td>
                                        <td>
                                            {q.from_user_nickname ?? '-'}
                                            {q.from_user_id && (
                                                <span className="muted"> (#{q.from_user_id})</span>
                                            )}
                                        </td>
                                        <td className="muted">{formatDate(q.date_created)}</td>
                                        <td>
                                            <StatusBadge
                                                status={
                                                    q.status === 'unanswered'
                                                        ? 'pending'
                                                        : q.status === 'answered'
                                                          ? 'success'
                                                          : 'cancelled'
                                                }
                                            />
                                        </td>
                                        <td>
                                            {q.status === 'unanswered' && (
                                                <button
                                                    className="btn btn--sm btn--primary"
                                                    onClick={() => {
                                                        setSelectedQuestion(q);
                                                        setReplyText('');
                                                    }}
                                                >
                                                    <MessageSquare size={14} /> Responder
                                                </button>
                                            )}
                                            {q.status === 'answered' && (
                                                <span className="muted">Respondida</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {questionsQ.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="empty-cell">
                                            No hay preguntas aun.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        ) : null;

    const autoReplySection =
        showAutoReply && connected ? (
            <section className="card">
                <div className="site-section-head">
                    <div>
                        <h3>Respuestas automaticas</h3>
                        <p>Plantillas de respuesta automatica para preguntas y eventos de ML.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            className="btn btn--secondary btn--sm"
                            onClick={() => {
                                setEditingTemplate(null);
                                setTemplateForm({
                                    name: '',
                                    trigger: 'new_question',
                                    message: '',
                                    is_active: true,
                                });
                                setShowAutoReplyModal(true);
                            }}
                        >
                            <Plus size={14} /> Nueva plantilla
                        </button>
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => setShowAutoReply(false)}
                        >
                            <X size={16} /> Cerrar
                        </button>
                    </div>
                </div>
                {autoReplyQ.isPending && (
                    <div className="ml-skeleton">
                        <div className="skeleton-table">
                            <div className="skeleton-row header"></div>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="skeleton-row"></div>
                            ))}
                        </div>
                    </div>
                )}
                {autoReplyQ.isError && (
                    <div className="ml-error">
                        <p>No se pudieron cargar las plantillas.</p>
                        <button
                            className="btn btn--secondary btn--sm"
                            onClick={() => autoReplyQ.refetch()}
                        >
                            Reintentar
                        </button>
                    </div>
                )}
                {autoReplyQ.data && !autoReplyQ.isPending && !autoReplyQ.isError && (
                    <div className="card table-card">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Disparador</th>
                                    <th>Mensaje</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {autoReplyQ.data.map((t) => (
                                    <tr key={t.id}>
                                        <td>
                                            <strong>{t.name}</strong>
                                        </td>
                                        <td>
                                            <span className="badge badge--info">{t.trigger}</span>
                                        </td>
                                        <td
                                            style={{
                                                maxWidth: '300px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {t.message}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge badge--${t.is_active ? 'success' : 'neutral'}`}
                                            >
                                                {t.is_active ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn--ghost btn--sm"
                                                onClick={() => {
                                                    setEditingTemplate(t);
                                                    setTemplateForm({
                                                        name: t.name,
                                                        trigger: t.trigger,
                                                        message: t.message,
                                                        is_active: t.is_active,
                                                    });
                                                    setShowAutoReplyModal(true);
                                                }}
                                            >
                                                <Edit2 size={14} /> Editar
                                            </button>
                                            <button
                                                className="btn btn--ghost btn--sm"
                                                style={{ color: 'var(--bh-danger)' }}
                                                onClick={() => setDeleteTemplateId(t.id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {autoReplyQ.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="empty-cell">
                                            No hay plantillas aun.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        ) : null;

    const replyModal = selectedQuestion ? (
        <div className="modal-backdrop" onClick={() => setSelectedQuestion(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                    <h3>Responder pregunta</h3>
                    <button className="icon-btn" onClick={() => setSelectedQuestion(null)}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <p className="muted" style={{ marginBottom: '8px' }}>
                        {selectedQuestion.from_user_nickname ?? 'Comprador'} preguntaba:
                    </p>
                    <blockquote
                        style={{
                            margin: '0 0 16px',
                            padding: '12px',
                            background: 'var(--bh-surface-2)',
                            borderRadius: '8px',
                        }}
                    >
                        {selectedQuestion.question_text ?? '-'}
                    </blockquote>
                    <label className="field">
                        <span>Tu respuesta</span>
                        <textarea
                            className="textarea"
                            rows={4}
                            value={replyText}
                            onInput={(e) =>
                                setReplyText((e.currentTarget as HTMLTextAreaElement).value)
                            }
                            placeholder="Escribe la respuesta que recibira el comprador..."
                        />
                    </label>
                </div>
                <div className="modal-actions">
                    <button className="btn btn--ghost" onClick={() => setSelectedQuestion(null)}>
                        Cancelar
                    </button>
                    <button
                        className="btn btn--primary"
                        onClick={handleReply}
                        disabled={!replyText.trim() || replying}
                    >
                        {replying ? <Loader2 size={14} className="spin" /> : <Send size={14} />}{' '}
                        Enviar respuesta
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    const templateModal = showAutoReplyModal ? (
        <div className="modal-backdrop" onClick={closeTemplateModal}>
            <div className="modal-card modal--medium" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                    <h3>{editingTemplate ? 'Editar plantilla' : 'Nueva plantilla'}</h3>
                    <button className="icon-btn" onClick={closeTemplateModal}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <label className="field">
                            <span>Nombre</span>
                            <input
                                type="text"
                                className="input"
                                value={templateForm.name}
                                onInput={(e) =>
                                    setTemplateForm({
                                        ...templateForm,
                                        name: (e.currentTarget as HTMLInputElement).value,
                                    })
                                }
                                placeholder="Ej: Respuesta a pregunta de stock"
                            />
                        </label>
                        <label className="field">
                            <span>Disparador</span>
                            <select
                                className="select"
                                value={templateForm.trigger}
                                onChange={(e) =>
                                    setTemplateForm({
                                        ...templateForm,
                                        trigger: e.currentTarget
                                            .value as typeof templateForm.trigger,
                                    })
                                }
                            >
                                <option value="new_question">Nueva pregunta</option>
                                <option value="new_order">Nuevo pedido</option>
                                <option value="order_paid">Pedido pagado</option>
                                <option value="order_shipped">Pedido enviado</option>
                                <option value="order_delivered">Pedido entregado</option>
                            </select>
                        </label>
                        <label className="field">
                            <span>Mensaje</span>
                            <textarea
                                className="textarea"
                                rows={4}
                                value={templateForm.message}
                                onInput={(e) =>
                                    setTemplateForm({
                                        ...templateForm,
                                        message: (e.currentTarget as HTMLTextAreaElement).value,
                                    })
                                }
                                placeholder="Mensaje que se envia automaticamente..."
                            />
                        </label>
                        <label className="switch-row">
                            <div>
                                <strong>Activa</strong>
                                <span className="muted">
                                    La plantilla se usa para respuestas automaticas.
                                </span>
                            </div>
                            <input
                                type="checkbox"
                                className="switch"
                                checked={templateForm.is_active}
                                onChange={(e) =>
                                    setTemplateForm({
                                        ...templateForm,
                                        is_active: (e.currentTarget as HTMLInputElement).checked,
                                    })
                                }
                            />
                        </label>
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="btn btn--ghost" onClick={closeTemplateModal}>
                        Cancelar
                    </button>
                    <button
                        className="btn btn--primary"
                        onClick={handleTemplateSave}
                        disabled={savingTemplate}
                    >
                        {savingTemplate ? (
                            <Loader2 size={14} className="spin" />
                        ) : (
                            <CheckCircle2 size={14} />
                        )}
                        {editingTemplate ? 'Guardar cambios' : 'Crear plantilla'}
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h2 className="page-title">Mercado Libre</h2>
                    <p className="page-subtitle">
                        Conecta la cuenta, sincroniza el catalogo y controla el estado de cada
                        publicacion.
                    </p>
                </div>
            </div>

            {overviewQ.isPending && (
                <div className="card placeholder-card">Cargando integracion...</div>
            )}
            {overviewQ.isError && (
                <div className="card placeholder-card">No se pudo cargar la integracion.</div>
            )}

            {!overviewQ.isPending && !overviewQ.isError && (
                <>
                    {connected && (
                        <div
                            className="ml-section-toggles"
                            style={{
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'wrap',
                                marginBottom: '16px',
                            }}
                        >
                            <button
                                className={`btn btn--sm ${showMetrics ? 'btn--primary' : 'btn--ghost'}`}
                                onClick={() => setShowMetrics((v) => !v)}
                            >
                                <BarChart2 size={14} /> {showMetrics ? 'Ocultar' : 'Ver'} metricas
                            </button>
                            <button
                                className={`btn btn--sm ${showQuestions ? 'btn--primary' : 'btn--ghost'}`}
                                onClick={() => setShowQuestions((v) => !v)}
                            >
                                <MessageSquare size={14} /> Preguntas{' '}
                                {questionsQ.data
                                    ? `(${questionsQ.data.filter((q) => q.status === 'unanswered').length})`
                                    : ''}
                            </button>
                            <button
                                className={`btn btn--sm ${showAutoReply ? 'btn--primary' : 'btn--ghost'}`}
                                onClick={() => setShowAutoReply((v) => !v)}
                            >
                                <Zap size={14} /> Respuestas automaticas
                            </button>
                        </div>
                    )}

                    {metricsSection}
                    {questionsSection}
                    {autoReplySection}

                    <div className={styles['ml-grid']}>
                        <section className="card">
                            <div className="site-section-head">
                                <div>
                                    <h3>Conexion de la cuenta</h3>
                                    <p>
                                        El secret de los tokens nunca se guarda en la base: se cifra
                                        con AES-256-GCM.
                                    </p>
                                </div>
                            </div>

                            <div className="switch-row">
                                <div>
                                    <strong>Integracion activa</strong>
                                    <span className="muted">
                                        Habilita la cola de sincronizacion y la auto-publicacion.
                                    </span>
                                </div>
                                <input
                                    type="checkbox"
                                    className="switch"
                                    checked={mlEnabled}
                                    onChange={(e) =>
                                        toggleEnabled((e.currentTarget as HTMLInputElement).checked)
                                    }
                                />
                            </div>

                            {connection ? (
                                <div className={styles['ml-connection']}>
                                    <div className={styles['ml-connection-identity']}>
                                        <span className={`cell-thumb ${styles['ml-avatar']}`} aria-hidden="true">
                                            {connection.nickname?.slice(0, 2).toUpperCase() ?? 'ML'}
                                        </span>
                                        <div>
                                            <strong>
                                                {connection.nickname ?? 'Cuenta Mercado Libre'}
                                            </strong>
                                            <span className="muted">
                                                {connection.email ?? connection.site_id}
                                            </span>
                                        </div>
                                    </div>
                                    <dl className={styles['ml-details']}>
                                        <div>
                                            <dt>Site</dt>
                                            <dd>{connection.site_id}</dd>
                                        </div>
                                        <div>
                                            <dt>User ID</dt>
                                            <dd>{connection.user_id ?? '-'}</dd>
                                        </div>
                                        <div>
                                            <dt>Token expira</dt>
                                            <dd>{formatDate(connection.token_expires_at)}</dd>
                                        </div>
                                        <div>
                                            <dt>Conectada</dt>
                                            <dd>{formatDate(connection.created_at)}</dd>
                                        </div>
                                    </dl>

                                    <div className={styles['ml-defaults']}>
                                        <h4>Configuracion de publicaciones</h4>
                                        <div className={styles['defaults-grid']}>
                                            <label className="field">
                                                <span>Categoria (category_id)</span>
                                                <div
                                                    className={styles['typeahead']}
                                                    onMouseLeave={() =>
                                                        setShowCategoryDropdown(false)
                                                    }
                                                >
                                                    <Search size={16} className={styles['typeahead-icon']} />
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar categoria... (ej: MLA1459)"
                                                        value={
                                                            categorySearch ||
                                                            defaultsDraft.category_id
                                                        }
                                                        onInput={(e) => {
                                                            const val = (
                                                                e.currentTarget as HTMLInputElement
                                                            ).value;
                                                            setCategorySearch(val);
                                                            setShowCategoryDropdown(true);
                                                            setDefaultsDraft({
                                                                ...defaultsDraft,
                                                                category_id: val,
                                                            });
                                                        }}
                                                        onFocus={() =>
                                                            setShowCategoryDropdown(true)
                                                        }
                                                        onBlur={() =>
                                                            setTimeout(
                                                                () =>
                                                                    setShowCategoryDropdown(false),
                                                                150,
                                                            )
                                                        }
                                                    />
                                                    {showCategoryDropdown &&
                                                        categorySearch &&
                                                        categoriesQ.data && (
                                                            <ul className={styles['typeahead-dropdown']}>
                                                                {categoriesQ.data
                                                                    .filter(
                                                                        (c: MlCategory) =>
                                                                            c.name
                                                                                .toLowerCase()
                                                                                .includes(
                                                                                    categorySearch.toLowerCase(),
                                                                                ) ||
                                                                            c.id
                                                                                .toLowerCase()
                                                                                .includes(
                                                                                    categorySearch.toLowerCase(),
                                                                                ),
                                                                    )
                                                                    .slice(0, 10)
                                                                    .map((c: MlCategory) => (
                                                                        <li
                                                                            key={c.id}
                                                                            onClick={() => {
                                                                                setDefaultsDraft({
                                                                                    ...defaultsDraft,
                                                                                    category_id:
                                                                                        c.id,
                                                                                });
                                                                                setCategorySearch(
                                                                                    `${c.id} - ${c.name}`,
                                                                                );
                                                                                setShowCategoryDropdown(
                                                                                    false,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <strong>{c.id}</strong>{' '}
                                                                            {c.name}
                                                                        </li>
                                                                    ))}
                                                                {categoriesQ.data.filter(
                                                                    (c: MlCategory) =>
                                                                        c.name
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                categorySearch.toLowerCase(),
                                                                            ) ||
                                                                        c.id
                                                                            .toLowerCase()
                                                                            .includes(
                                                                                categorySearch.toLowerCase(),
                                                                            ),
                                                                ).length === 0 && (
                                                                    <li className="muted">
                                                                        Sin coincidencias
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        )}
                                                    {categorySearch &&
                                                        defaultsDraft.category_id && (
                                                            <button
                                                                type="button"
                                                                className={styles['typeahead-clear']}
                                                                onClick={() => {
                                                                    setDefaultsDraft({
                                                                        ...defaultsDraft,
                                                                        category_id: '',
                                                                    });
                                                                    setCategorySearch('');
                                                                }}
                                                                title="Limpiar"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                </div>
                                            </label>
                                            <label className="field">
                                                <span>Tipo de publicacion (listing_type_id)</span>
                                                <div className={styles['select-with-desc']}>
                                                    <select
                                                        className="select"
                                                        value={defaultsDraft.listing_type_id}
                                                        onChange={(e) =>
                                                            setDefaultsDraft({
                                                                ...defaultsDraft,
                                                                listing_type_id: (
                                                                    e.currentTarget as HTMLSelectElement
                                                                ).value,
                                                            })
                                                        }
                                                    >
                                                        {(
                                                            listingTypesQ.data ?? [
                                                                { id: 'free', name: 'Gratuita' },
                                                                {
                                                                    id: 'gold_special',
                                                                    name: 'Clasica',
                                                                },
                                                                { id: 'gold_pro', name: 'Premium' },
                                                                {
                                                                    id: 'gold_premium',
                                                                    name: 'Premium Plus',
                                                                },
                                                            ]
                                                        ).map(
                                                            (
                                                                lt:
                                                                    | MlListingType
                                                                    | { id: string; name: string },
                                                            ) => (
                                                                <option key={lt.id} value={lt.id}>
                                                                    {lt.name} ({lt.id})
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    <p className={styles['select-desc']}>
                                                        {
                                                            LISTING_TYPE_DESCRIPTIONS[
                                                                defaultsDraft.listing_type_id
                                                            ]
                                                        }
                                                    </p>
                                                </div>
                                            </label>
                                            <label className="field">
                                                <span>Condicion</span>
                                                <select
                                                    className="select"
                                                    value={defaultsDraft.condition}
                                                    onChange={(e) =>
                                                        setDefaultsDraft({
                                                            ...defaultsDraft,
                                                            condition: (
                                                                e.currentTarget as HTMLSelectElement
                                                            ).value,
                                                        })
                                                    }
                                                >
                                                    <option value="new">Nuevo</option>
                                                    <option value="used">Usado</option>
                                                </select>
                                            </label>
                                        </div>
                                        <div className={styles['ml-connection-actions']}>
                                            {JSON.stringify(defaultsDraft) !==
                                                JSON.stringify(settingsQ.data?.defaults ?? {}) && (
                                                <button
                                                    className="btn btn--secondary btn--sm"
                                                    onClick={saveDefaults}
                                                    disabled={savingDefaults}
                                                >
                                                    {savingDefaults ? (
                                                        <Loader2 size={14} className="spin" />
                                                    ) : (
                                                        <CheckCircle2 size={14} />
                                                    )}
                                                    Guardar configuracion
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles['ml-connection-actions']}>
                                        <button
                                            className="btn btn--danger btn--sm"
                                            onClick={() => disconnectMutation.mutate()}
                                            disabled={disconnectMutation.isPending}
                                        >
                                            <Unplug size={14} /> Desconectar cuenta
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles['ml-connect']}>
                                    <p>
                                        {mlEnabled
                                            ? 'No hay ninguna cuenta conectada. Conectala para empezar a publicar.'
                                            : 'Activa la integracion y luego conecta la cuenta de Mercado Libre.'}
                                    </p>

                                    <label className="field">
                                        <span>ID de aplicacion (client_id)</span>
                                        <div className="toolbar-search">
                                            <Link2 size={15} />
                                            <input
                                                type="text"
                                                placeholder="Ej: 1234567890123456"
                                                value={appIdDraft}
                                                onInput={(e) =>
                                                    setAppIdDraft(
                                                        (e.currentTarget as HTMLInputElement).value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </label>

                                    <div className={styles['ml-redirect']}>
                                        <span className="muted">Redirect URI configurada:</span>
                                        <code>{ML_REDIRECT_URI}</code>
                                        <button
                                            type="button"
                                            className="icon-btn"
                                            title="Copiar redirect URI"
                                            onClick={() => {
                                                void navigator.clipboard.writeText(ML_REDIRECT_URI);
                                                pushToast({
                                                    type: 'info',
                                                    title: 'Redirect URI copiada',
                                                });
                                            }}
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>

                                    <div className={styles['ml-connection-actions']}>
                                        {appIdDraft.trim() !== (settingsQ.data?.app_id ?? '') && (
                                            <button
                                                className="btn btn--secondary btn--sm"
                                                onClick={saveAppId}
                                                disabled={savingAppId}
                                            >
                                                {savingAppId ? (
                                                    <Loader2 size={14} className="spin" />
                                                ) : (
                                                    <CheckCircle2 size={14} />
                                                )}
                                                Guardar ID
                                            </button>
                                        )}
                                        <button className="btn btn--primary" onClick={connect}>
                                            <ShoppingBag size={16} /> Conectar cuenta
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section className="card">
                            <div className="site-section-head">
                                <div>
                                    <h3>Resumen</h3>
                                    <p>Estado de la cola y publicaciones activas.</p>
                                </div>
                            </div>
                            <div className={styles['ml-stats']}>
                                <StatCard label="Pendientes" value={stats.pending} />
                                <StatCard label="Procesando" value={stats.processing} />
                                <StatCard label="Exitosos" value={stats.success} />
                                <StatCard label="Fallidos" value={stats.failed} />
                                <StatCard label="En Mercado Libre" value={stats.onMl} />
                            </div>
                            <p className={`muted ${styles['ml-note']}`}>
                                La sincronizacion corre en segundo plano automaticamente cada pocos
                                minutos.
                            </p>
                        </section>
                    </div>

                    <section className="card table-card">
                        <div className="site-section-head">
                            <div>
                                <h3>Cola de sincronizacion</h3>
                                <p>Ultimos trabajos encolados (publicar, actualizar o eliminar).</p>
                            </div>
                        </div>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Propiedad</th>
                                    <th>Operacion</th>
                                    <th>Estado</th>
                                    <th>Intentos</th>
                                    <th>Item ML</th>
                                    <th>Creada</th>
                                    <th>Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                {queueRows.map((q) => (
                                    <tr key={q.id}>
                                        <td>
                                            <strong>
                                                {q.property_title ?? 'Propiedad eliminada'}
                                            </strong>
                                            {q.property_code !== null && (
                                                <span className="muted">
                                                    {' '}
                                                    #{String(q.property_code).padStart(4, '0')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="cap">{ML_OPERATION_LABEL[q.operation]}</td>
                                        <td>
                                            <StatusBadge status={q.status} />
                                        </td>
                                        <td className="num">
                                            {q.attempts}/{q.max_attempts}
                                        </td>
                                        <td className="num">{q.ml_item_id ?? '-'}</td>
                                        <td className="muted">{formatDate(q.created_at)}</td>
                                        <td
                                            className={`muted ${styles['cell-error']}`}
                                            title={q.last_error ?? undefined}
                                        >
                                            {q.last_error ?? '-'}
                                        </td>
                                    </tr>
                                ))}
                                {queueRows.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="empty-cell">
                                            No hay trabajos en la cola.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    <section className="card table-card">
                        <div className="site-section-head">
                            <div>
                                <h3>Estado en Mercado Libre</h3>
                                <p>Propiedades publicadas y su estado en la plataforma.</p>
                            </div>
                        </div>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Propiedad</th>
                                    <th>Item ML</th>
                                    <th>Estado ML</th>
                                    <th>Precio</th>
                                    <th>Ultima sync</th>
                                    <th>Publicacion</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(metaQ.data ?? []).map((m) => (
                                    <tr key={m.property_id}>
                                        <td>
                                            <strong>{m.property_title ?? '-'}</strong>
                                            {m.property_code !== null && (
                                                <span className="muted">
                                                    {' '}
                                                    #{String(m.property_code).padStart(4, '0')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="num">{m.ml_item_id ?? '-'}</td>
                                        <td className="cap">{m.status ?? '-'}</td>
                                        <td className="num">
                                            {m.price !== null
                                                ? `USD ${m.price.toLocaleString('es-AR')}`
                                                : '-'}
                                        </td>
                                        <td className="muted">{formatDate(m.last_sync_at)}</td>
                                        <td>
                                            {m.permalink ? (
                                                <a
                                                    href={m.permalink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn btn--sm btn--secondary"
                                                >
                                                    Ver publicacion <ExternalLink size={12} />
                                                </a>
                                            ) : (
                                                <span className="muted">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(metaQ.data ?? []).length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="empty-cell">
                                            Todavia no hay propiedades publicadas en Mercado Libre.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>
                </>
            )}

            {replyModal}
            {templateModal}

            <ConfirmDialog
                open={deleteTemplateId !== null}
                title="Eliminar plantilla"
                message="¿Eliminar plantilla?"
                confirmLabel="Eliminar"
                danger
                onConfirm={() => {
                    if (deleteTemplateId) {
                        void deleteMlAutoReplyTemplate(deleteTemplateId).then(() =>
                            queryClient.invalidateQueries({ queryKey: ['ml-auto-reply'] }),
                        );
                    }
                    setDeleteTemplateId(null);
                }}
                onCancel={() => setDeleteTemplateId(null)}
            />
        </div>
    );
}
