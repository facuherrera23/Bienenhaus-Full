import { useEffect, useState } from 'preact/hooks';
import {
    BarChart2,
    CheckCircle2,
    Copy,
    Edit2,
    ExternalLink,
    Eye,
    EyeOff,
    Link2,
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
import { Badge, type BadgeVariant, Button, IconButton, Spinner } from '@bienenhaus/ui';
import {
    answerMlQuestion,
    buildAuthorizeUrl,
    createMlAutoReplyTemplate,
    deleteMlAutoReplyTemplate,
    deleteDeadLetter,
    disconnectMl,
    fetchMlAutoReplyTemplates,
    fetchMlCategories,
    fetchMlDeadLetter,
    fetchMlListingTypes,
    fetchMlMeta,
    fetchMlMetrics,
    fetchMlOrders,
    fetchMlOverview,
    fetchMlQuestions,
    fetchMlQueue,
    fetchMlQueueStats,
    fetchMlSettings,
    getMlWebhookStatus,
    ML_OPERATION_LABEL,
    ML_REDIRECT_URI,
    ML_SYNC_STATUS_LABEL,
    ML_SYNC_STATUS_TONE,
    registerMlWebhooks,
    retryDeadLetter,
    type MlAutoReplyTemplate,
    type MlCategory,
    type MlListingType,
    type MlOrder,
    type MlQuestion,
    type MlQueueRow,
    type MlSyncStatus,
    setMlAppId,
    setMlDefaults,
    setMlEnabled,
    startMlOAuth,
    testMlCredentials,
    updateMlAutoReplyTemplate,
} from '../lib/ml';
import { upsertSiteSettingWithVersion } from '../lib/site';
import { queryClient } from '../lib/query/client';
import { useMutation, useQuery } from '../lib/query/hooks';
import { pushToast } from '../store/app';
import { ConfirmDialog } from '../components/ConfirmDialog';
import styles from './MercadoLibrePage.module.css';

const LISTING_TYPE_DESCRIPTIONS: Record<string, string> = {
    free: 'Gratuita: sin costo, menor visibilidad, ideal para probar',
    silver: 'Básica: baja comisión, visibilidad media-baja',
    gold: 'Clásica: comisión por venta, buena visibilidad',
    gold_special: 'Clásica: comisión por venta, buena visibilidad',
    gold_pro: 'Premium: mayor exposición, comisión más alta, mejor posicionamiento',
    gold_premium: 'Premium Plus: máxima visibilidad, comisión más alta',
};

function StatusBadge({ status }: { status: MlSyncStatus }) {
    return (
        <Badge variant={ML_SYNC_STATUS_TONE[status] as BadgeVariant}>
            {ML_SYNC_STATUS_LABEL[status]}
        </Badge>
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
    const queueQ = useQuery<MlQueueRow[]>({ queryKey: ['ml-queue'], queryFn: fetchMlQueue });
    const queueStatsQ = useQuery({
        queryKey: ['ml-queue-stats'],
        queryFn: fetchMlQueueStats,
    });
    const deadLetterQ = useQuery({
        queryKey: ['ml-dead-letter'],
        queryFn: () => fetchMlDeadLetter({ pageSize: 100 }),
    });
    const metaQ = useQuery({ queryKey: ['ml-meta'], queryFn: fetchMlMeta });
    const ordersQ = useQuery<MlOrder[]>({ queryKey: ['ml-orders'], queryFn: fetchMlOrders });
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
    const [clientSecretDraft, setClientSecretDraft] = useState('');
    const [showClientSecret, setShowClientSecret] = useState(false);
    const [webhookSecretDraft, setWebhookSecretDraft] = useState('');
    const [showWebhookSecret, setShowWebhookSecret] = useState(false);
    const [defaultsDraft, setDefaultsDraft] = useState({
        category_id: '',
        listing_type_id: 'gold_pro',
        condition: 'used',
    });
    const [categorySearch, setCategorySearch] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    const [showMetrics, setShowMetrics] = useState(false);
    const [showQuestions, setShowQuestions] = useState(false);
    const [showAutoReply, setShowAutoReply] = useState(false);

    // Toast al completar OAuth de Mercado Libre (la edge function redirige a #/mercadolibre?ml=connected=1)
    useEffect(() => {
        const hash = window.location.hash;
        const queryIndex = hash.indexOf('?');
        if (queryIndex === -1) return;
        const params = new URLSearchParams(hash.slice(queryIndex + 1));
        if (params.get('ml') !== 'connected') return;
        pushToast({ type: 'success', title: 'Cuenta de Mercado Libre conectada' });
        history.replaceState(null, '', '#/mercadolibre');
    }, []);

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

    // Webhook status
    const [webhookStatus, setWebhookStatus] = useState<Record<string, boolean> | null>(null);
    const [checkingWebhook, setCheckingWebhook] = useState(false);
    const [registeringWebhook, setRegisteringWebhook] = useState(false);

    const refetchWebhookStatus = async () => {
        if (!connection?.user_id) return;
        setCheckingWebhook(true);
        try {
            const status = await getMlWebhookStatus();
            setWebhookStatus(status);
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'No se pudo obtener estado de webhooks',
                description: err instanceof Error ? err.message : 'Intenta de nuevo.',
            });
        } finally {
            setCheckingWebhook(false);
        }
    };

    useEffect(() => {
        if (connected && connection?.user_id) {
            refetchWebhookStatus();
        }
    }, [connected, connection?.user_id]);

    const handleRegisterWebhooks = async () => {
        if (!connection?.user_id) return;
        setRegisteringWebhook(true);
        try {
            const results = await registerMlWebhooks();
            const failed = results.filter((r) => !r.ok);
            if (failed.length > 0) {
                pushToast({
                    type: 'error',
                    title: 'Algunos webhooks fallaron',
                    description: failed.map((f) => `${f.topic}: ${f.error}`).join('; '),
                });
            } else {
                pushToast({ type: 'success', title: 'Webhooks registrados correctamente' });
            }
            await refetchWebhookStatus();
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error al registrar webhooks',
                description: err instanceof Error ? err.message : 'Intenta de nuevo.',
            });
        } finally {
            setRegisteringWebhook(false);
        }
    };

    const queueRows = queueQ.data ?? [];

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const settings = await fetchMlSettings();
                if (cancelled) return;
                setAppIdDraft(settings.app_id ?? '');
                setClientSecretDraft(settings.client_secret ?? '');
                setWebhookSecretDraft(settings.webhook_secret ?? '');
                if (settings.defaults) {
                    setDefaultsDraft({
                        category_id: settings.defaults.category_id ?? '',
                        listing_type_id: settings.defaults.listing_type_id ?? 'gold_pro',
                        condition: settings.defaults.condition ?? 'used',
                    });
                    if (settings.defaults.category_id) {
                        setCategorySearch(settings.defaults.category_id);
                    }
                }
            } catch {
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);
    const stats = {
        pending: queueStatsQ.data?.pending ?? 0,
        processing: queueStatsQ.data?.processing ?? 0,
        success: queueStatsQ.data?.success ?? 0,
        failed: queueStatsQ.data?.failed ?? 0,
        onMl: (metaQ.data ?? []).length,
    };

    const disconnectMutation = useMutation({
        mutationFn: disconnectMl,
        onSuccess: async () => {
            pushToast({ type: 'success', title: 'Cuenta desconectada' });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['ml-overview'] }),
                queryClient.invalidateQueries({ queryKey: ['ml-queue'] }),
                queryClient.invalidateQueries({ queryKey: ['ml-queue-stats'] }),
                queryClient.invalidateQueries({ queryKey: ['ml-meta'] }),
                queryClient.invalidateQueries({ queryKey: ['ml-metrics'] }),
                queryClient.invalidateQueries({ queryKey: ['ml-orders'] }),
                queryClient.invalidateQueries({ queryKey: ['ml-questions'] }),
                queryClient.invalidateQueries({ queryKey: ['ml-auto-reply'] }),
                queryClient.invalidateQueries({ queryKey: ['ml-dead-letter'] }),
            ]);
            setShowDisconnectConfirm(false);
        },
        onError: (err) => {
            pushToast({
                type: 'error',
                title: 'Error al desconectar',
                description: err instanceof Error ? err.message : 'Intenta de nuevo.',
            });
        },
    });

    const retryDeadLetterMutation = useMutation({
        mutationFn: retryDeadLetter,
        onSuccess: async () => {
            pushToast({ type: 'success', title: 'Trabajo reencolado' });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['ml-queue'] }),
                queryClient.invalidateQueries({ queryKey: ['ml-queue-stats'] }),
                queryClient.invalidateQueries({ queryKey: ['ml-dead-letter'] }),
            ]);
        },
        onError: (err) => {
            pushToast({
                type: 'error',
                title: 'Error al reintentar',
                description: err instanceof Error ? err.message : 'Intenta de nuevo.',
            });
        },
    });

    const deleteDeadLetterMutation = useMutation({
        mutationFn: deleteDeadLetter,
        onSuccess: async () => {
            pushToast({ type: 'success', title: 'Trabajo eliminado' });
            await queryClient.invalidateQueries({ queryKey: ['ml-dead-letter'] });
        },
        onError: (err) => {
            pushToast({
                type: 'error',
                title: 'Error al eliminar',
                description: err instanceof Error ? err.message : 'Intenta de nuevo.',
            });
        },
    });

    const toggleEnabled = async (checked: boolean) => {
        try {
            await setMlEnabled(checked);
            pushToast({
                type: 'success',
                title: checked ? 'Integración activada' : 'Integración desactivada',
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

    const saveConfig = async () => {
        const trimmedAppId = appIdDraft.trim();
        if (trimmedAppId && !/^\d{10,}$/.test(trimmedAppId)) {
            pushToast({
                type: 'warning',
                title: 'ID de aplicación inválido',
                description: 'El client_id debe ser un número de al menos 10 dígitos.',
            });
            return;
        }
        setSavingAppId(true);
        try {
            await setMlAppId(appIdDraft.trim());
            await upsertSiteSettingWithVersion(
                'ml_client_secret',
                { value: clientSecretDraft.trim() },
                { value_type: 'json', is_public: false, locale: 'es-AR' },
            );
            await upsertSiteSettingWithVersion(
                'ml_webhook_secret',
                { value: webhookSecretDraft.trim() },
                { value_type: 'json', is_public: false, locale: 'es-AR' },
            );
            await setMlDefaults(defaultsDraft);
            pushToast({ type: 'success', title: 'Configuración de ML guardada' });
            await queryClient.invalidateQueries({ queryKey: ['ml-overview'] });
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error al guardar configuración',
                description: err instanceof Error ? err.message : 'Intenta de nuevo.',
            });
            throw err;
        } finally {
            setSavingAppId(false);
        }
    };

    const [connecting, setConnecting] = useState(false);
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
    const [testingCredentials, setTestingCredentials] = useState(false);

    const connect = async () => {
        if (!appIdDraft.trim()) {
            pushToast({ type: 'warning', title: 'Falta el ID de aplicación' });
            return;
        }
        if (!clientSecretDraft.trim()) {
            pushToast({ type: 'warning', title: 'Falta el Client Secret' });
            return;
        }
        if (!webhookSecretDraft.trim()) {
            pushToast({ type: 'warning', title: 'Falta el Webhook Secret' });
            return;
        }
        setConnecting(true);
        try {
            await saveConfig();
            if (!mlEnabled) {
                await setMlEnabled(true);
                await queryClient.invalidateQueries({ queryKey: ['ml-overview'] });
            }
            const { state, code_challenge } = await startMlOAuth();
            window.open(
                buildAuthorizeUrl(appIdDraft.trim(), state, code_challenge),
                '_blank',
                'noopener',
            );
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'No se pudo iniciar la conexión',
                description: err instanceof Error ? err.message : 'Intenta de nuevo.',
            });
        } finally {
            setConnecting(false);
        }
    };

    const testCredentials = async () => {
        if (!appIdDraft.trim()) {
            pushToast({ type: 'warning', title: 'Ingresá el ID de aplicación primero' });
            return;
        }
        setTestingCredentials(true);
        try {
            const result = await testMlCredentials(appIdDraft.trim());
            pushToast({
                type: result.ok ? 'success' : 'error',
                title: result.ok ? 'Credenciales válidas' : 'Credenciales inválidas',
                description: result.message,
            });
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Error al probar credenciales',
                description: err instanceof Error ? err.message : 'Intenta de nuevo.',
            });
        } finally {
            setTestingCredentials(false);
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
                        <h3>Métricas de Mercado Libre</h3>
                        <p>Rendimiento de tus publicaciones en la plataforma.</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMetrics(false)}
                    >
                        <X size={16} /> Cerrar
                    </Button>
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
                        <p>No se pudieron cargar las métricas.</p>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => metricsQ.refetch()}
                        >
                            Reintentar
                        </Button>
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
                                        <th>Publicación</th>
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
                                                Sin métricas aún.
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
                            <Badge variant="info">
                                {questionsQ.data.filter((q) => q.status === 'unanswered').length}{' '}
                                sin responder
                            </Badge>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowQuestions(false)}
                        >
                            <X size={16} /> Cerrar
                        </Button>
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
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => questionsQ.refetch()}
                        >
                            Reintentar
                        </Button>
                    </div>
                )}
                {questionsQ.data && !questionsQ.isPending && !questionsQ.isError && (
                    <div className="card table-card">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Publicación</th>
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
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedQuestion(q);
                                                        setReplyText('');
                                                    }}
                                                >
                                                    <MessageSquare size={14} /> Responder
                                                </Button>
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
                                            No hay preguntas aún.
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
                        <h3>Respuestas automáticas</h3>
                        <p>Plantillas de respuesta automática para preguntas y eventos de ML.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Button
                            variant="secondary"
                            size="sm"
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
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAutoReply(false)}
                        >
                            <X size={16} /> Cerrar
                        </Button>
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
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => autoReplyQ.refetch()}
                        >
                            Reintentar
                        </Button>
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
                                            <Badge variant="info">{t.trigger}</Badge>
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
                                            <Badge variant={t.is_active ? 'success' : 'neutral'}>
                                                {t.is_active ? 'Activa' : 'Inactiva'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Button
                                                variant="ghost"
                                                size="sm"
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
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                style={{ color: 'var(--bh-danger)' }}
                                                onClick={() => setDeleteTemplateId(t.id)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
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
                    <IconButton
                        variant="ghost"
                        aria-label="Cerrar modal de respuesta"
                        onClick={() => setSelectedQuestion(null)}
                    >
                        <X size={20} />
                    </IconButton>
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
                    <Button variant="ghost" onClick={() => setSelectedQuestion(null)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleReply}
                        disabled={!replyText.trim() || replying}
                    >
                        {replying ? <Spinner size="sm" inline color="inherit" /> : <Send size={14} />}{' '}
                        Enviar respuesta
                    </Button>
                </div>
            </div>
        </div>
    ) : null;

    const templateModal = showAutoReplyModal ? (
        <div className="modal-backdrop" onClick={closeTemplateModal}>
            <div className="modal-card modal--medium" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                    <h3>{editingTemplate ? 'Editar plantilla' : 'Nueva plantilla'}</h3>
                    <IconButton
                        variant="ghost"
                        aria-label="Cerrar modal de plantilla"
                        onClick={closeTemplateModal}
                    >
                        <X size={20} />
                    </IconButton>
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
                    <Button variant="ghost" onClick={closeTemplateModal}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleTemplateSave}
                        disabled={savingTemplate}
                    >
                        {savingTemplate ? (
                            <Spinner size="sm" inline color="inherit" />
                        ) : (
                            <CheckCircle2 size={14} />
                        )}
                        {editingTemplate ? 'Guardar cambios' : 'Crear plantilla'}
                    </Button>
                </div>
            </div>
        </div>
    ) : null;

    // Webhook Status Card Component
    function WebhookStatusCard({ connectionUserId, onRefresh }: { connectionUserId: number; onRefresh: () => void }) {
        if (!connectionUserId || !webhookStatus) return null;

        const topics = ['questions', 'orders', 'items', 'payments', 'shipments'] as const;
        const allRegistered = topics.every((t) => webhookStatus[t] === true);

        return (
            <div className={styles['ml-webhook-status']}>
                <div className="webhook-status-header">
                    <h4>
                        <Link2 size={16} /> Webhook de notificaciones
                    </h4>
                    <Badge variant={allRegistered ? 'success' : 'warning'}>
                        {allRegistered ? 'Todos registrados' : 'Pendientes'}
                    </Badge>
                </div>
                <dl className="webhook-topics">
                    {topics.map((topic) => (
                        <div key={topic} className="webhook-topic-row">
                            <dt>{topic}</dt>
                            <dd>
                                {webhookStatus[topic] ? (
                                    <Badge variant="success" size="sm"><CheckCircle2 size={12} /> Registrado</Badge>
                                ) : (
                                    <Badge variant="danger" size="sm"><X size={12} /> No registrado</Badge>
                                )}
                            </dd>
                        </div>
                    ))}
                </dl>
                <div className="webhook-actions">
                    <Button
                        size="sm"
                        variant={checkingWebhook ? 'ghost' : 'secondary'}
                        onClick={onRefresh}
                        disabled={checkingWebhook || registeringWebhook}
                    >
                        {checkingWebhook ? (
                            <> <Spinner size="sm" inline /> <span>Verificando...</span> </>
                        ) : (
                            <span>Verificar estado</span>
                        )}
                    </Button>
                    <Button
                        size="sm"
                        variant={registeringWebhook ? 'ghost' : 'primary'}
                        onClick={handleRegisterWebhooks}
                        disabled={registeringWebhook || checkingWebhook}
                    >
                        {registeringWebhook ? (
                            <> <Spinner size="sm" inline /> <span>Registrando...</span> </>
                        ) : (
                            <span>Registrar webhooks</span>
                        )}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h2 className="page-title">Mercado Libre</h2>
                    <p className="page-subtitle">
                        Conecta la cuenta, sincroniza el catálogo y controla el estado de cada
                        publicación.
                    </p>
                </div>
            </div>

            {overviewQ.isPending && (
                <div className="ml-skeleton">
                    <div className="skeleton-row">
                        <div className="skeleton-stat"></div>
                        <div className="skeleton-stat"></div>
                        <div className="skeleton-stat"></div>
                        <div className="skeleton-stat"></div>
                    </div>
                    <div className="skeleton-table">
                        <div className="skeleton-row header"></div>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="skeleton-row"></div>
                        ))}
                    </div>
                </div>
            )}
            {overviewQ.isError && (
                <div className="card placeholder-card">No se pudo cargar la integración.</div>
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
                            <Button
                                size="sm"
                                variant={showMetrics ? 'primary' : 'ghost'}
                                onClick={() => setShowMetrics((v) => !v)}
                            >
                                <BarChart2 size={14} /> {showMetrics ? 'Ocultar' : 'Ver'} métricas
                            </Button>
                            <Button
                                size="sm"
                                variant={showQuestions ? 'primary' : 'ghost'}
                                onClick={() => setShowQuestions((v) => !v)}
                            >
                                <MessageSquare size={14} /> Preguntas{' '}
                                {questionsQ.data
                                    ? `(${questionsQ.data.filter((q) => q.status === 'unanswered').length})`
                                    : ''}
                            </Button>
                            <Button
                                size="sm"
                                variant={showAutoReply ? 'primary' : 'ghost'}
                                onClick={() => setShowAutoReply((v) => !v)}
                            >
                                <Zap size={14} /> Respuestas automaticas
                            </Button>
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
                                    <strong>Integración activa</strong>
                                    <span className="muted">
                                        Habilita la cola de sincronización y la auto-publicación.
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
                                        <span
                                            className={`cell-thumb ${styles['ml-avatar']}`}
                                            aria-hidden="true"
                                        >
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

                                    {/* Estado del Webhook */}
                                    {connection.user_id != null && (
                                        <WebhookStatusCard connectionUserId={connection.user_id} onRefresh={refetchWebhookStatus} />
                                    )}

                                    <div className={styles['ml-connection-actions']}>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => setShowDisconnectConfirm(true)}
                                            disabled={disconnectMutation.isPending}
                                        >
                                            <Unplug size={14} /> Desconectar cuenta
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles['ml-connect']}>
                                    <p>
                                        {mlEnabled
                                            ? 'No hay ninguna cuenta conectada. Conéctala para empezar a publicar.'
                                            : 'Activa la integración y luego conecta la cuenta de Mercado Libre.'}
                                    </p>
                                </div>
                            )}

                            {/* Configuración de la app (siempre visible, conectado o no) */}
                            <div className={styles['ml-defaults']}>
                                <h4>Configuración de la app</h4>
                                <label className="field">
                                    <span>ID de aplicación (client_id)</span>
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
                                    {appIdDraft.trim() ? (
                                        <Badge variant="success" >
                                            <CheckCircle2 size={12} /> Configurado
                                        </Badge>
                                    ) : (
                                        <Badge variant="warning">Falta configurar</Badge>
                                    )}
                                </label>
                                <label className="field">
                                    <span>Client Secret</span>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input
                                            type={showClientSecret ? 'text' : 'password'}
                                            placeholder="Ingresá el client_secret"
                                            value={clientSecretDraft}
                                            onInput={(e) =>
                                                setClientSecretDraft(
                                                    (e.currentTarget as HTMLInputElement).value,
                                                )
                                            }
                                            style={{ flex: 1 }}
                                        />
                                        <IconButton
                                            variant="ghost"
                                            onClick={() => setShowClientSecret(!showClientSecret)}
                                            aria-label={showClientSecret ? 'Ocultar secret' : 'Mostrar secret'}
                                        >
                                            {showClientSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </IconButton>
                                    </div>
                                    {clientSecretDraft.trim() ? (
                                        <Badge variant="success">
                                            <CheckCircle2 size={12} /> Configurado
                                        </Badge>
                                    ) : (
                                        <Badge variant="warning">Falta configurar</Badge>
                                    )}
                                    <p className="muted" style={{ marginTop: '4px', fontSize: '12px' }}>
                                        Se guarda encriptado (AES-256-GCM). Solo visible en esta vista.
                                    </p>
                                </label>
                                <label className="field">
                                    <span>Webhook Secret</span>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input
                                            type={showWebhookSecret ? 'text' : 'password'}
                                            placeholder="Ingresá el webhook secret (x-meli-signature)"
                                            value={webhookSecretDraft}
                                            onInput={(e) =>
                                                setWebhookSecretDraft(
                                                    (e.currentTarget as HTMLInputElement).value,
                                                )
                                            }
                                            style={{ flex: 1 }}
                                        />
                                        <IconButton
                                            variant="ghost"
                                            onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                                            aria-label={showWebhookSecret ? 'Ocultar secret' : 'Mostrar secret'}
                                        >
                                            {showWebhookSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </IconButton>
                                    </div>
                                    {webhookSecretDraft.trim() ? (
                                        <Badge variant="success">
                                            <CheckCircle2 size={12} /> Configurado
                                        </Badge>
                                    ) : (
                                        <Badge variant="warning">Falta configurar</Badge>
                                    )}
                                    <p className="muted" style={{ marginTop: '4px', fontSize: '12px' }}>
                                        Secret para validar la firma HMAC de los webhooks de Mercado Libre.
                                    </p>
                                </label>

                                <div className={styles['ml-redirect']}>
                                    <span className="muted">Redirect URI configurada:</span>
                                    <code>{ML_REDIRECT_URI}</code>
                                    <IconButton
                                        variant="ghost"
                                        aria-label="Copiar redirect URI"
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
                                    </IconButton>
                                </div>
                            </div>

                            {/* Configuración de publicaciones (siempre visible) */}
                            <div className={styles['ml-defaults']}>
                                <h4>Configuración de publicaciones</h4>
                                <div className={styles['defaults-grid']}>
                                    <label className="field">
                                        <span>Categoría (category_id)</span>
                                        <div
                                            className={styles['typeahead']}
                                            onMouseLeave={() =>
                                                setShowCategoryDropdown(false)
                                            }
                                        >
                                            <Search
                                                size={16}
                                                className={styles['typeahead-icon']}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Buscar categoría... (ej: MLA1459)"
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
                                                    const mlIdMatch = val.match(/^(MLA\d+)$/);
                                                    setDefaultsDraft({
                                                        ...defaultsDraft,
                                                        category_id: mlIdMatch ? mlIdMatch[1] : '',
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
                                                    <ul
                                                        className={
                                                            styles['typeahead-dropdown']
                                                        }
                                                    >
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
                                                        className={
                                                            styles['typeahead-clear']
                                                        }
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
                                        <span>Tipo de publicación (listing_type_id)</span>
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
                                            <option value="not_specified">No especificado</option>
                                        </select>
                                    </label>
                                </div>
                            </div>

                            {/* Botón unificado: Guardar + Conectar */}
                            <div className={styles['ml-connection-actions']}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={saveConfig}
                                    disabled={savingAppId}
                                >
                                    {savingAppId ? (
                                        <Spinner size="sm" inline color="inherit" />
                                    ) : (
                                        <CheckCircle2 size={14} />
                                    )}
                                    Guardar configuración
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={testCredentials}
                                    disabled={testingCredentials || !appIdDraft.trim()}
                                >
                                    {testingCredentials ? (
                                        <Spinner size="sm" inline color="inherit" />
                                    ) : (
                                        <Zap size={14} />
                                    )}
                                    Probar credenciales
                                </Button>
                                {!connected && (
                                    <Button
                                        onClick={connect}
                                        disabled={connecting || savingAppId}
                                    >
                                        {connecting ? (
                                            <Spinner size="sm" inline color="inherit" />
                                        ) : (
                                            <ShoppingBag size={16} />
                                        )}
                                        Conectar cuenta
                                    </Button>
                                )}
                            </div>
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
                                La sincronización corre en segundo plano automáticamente cada pocos
                                minutos.
                            </p>
                        </section>
                    </div>

                    <section className="card table-card">
                        <div className="site-section-head">
                            <div>
                                <h3>Cola de sincronización</h3>
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
                                <h3>Fallos definitivos</h3>
                                <p>
                                    Trabajos que agotaron los reintentos. Reencolá o eliminá
                                    manualmente.
                                </p>
                            </div>
                            {deadLetterQ.data && deadLetterQ.data.count > 0 && (
                                <Badge variant="warning">
                                    {deadLetterQ.data.count}{' '}
                                    {deadLetterQ.data.count === 1 ? 'fallo' : 'fallos'}
                                </Badge>
                            )}
                        </div>
                        {deadLetterQ.isPending && (
                            <div className="ml-skeleton">
                                <div className="skeleton-table">
                                    <div className="skeleton-row header"></div>
                                    {[...Array(2)].map((_, i) => (
                                        <div key={i} className="skeleton-row"></div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {deadLetterQ.isError && (
                            <div className="ml-error">
                                <p>No se pudieron cargar los fallos.</p>
                                <Button variant="secondary" size="sm" onClick={() => deadLetterQ.refetch()}>
                                    Reintentar
                                </Button>
                            </div>
                        )}
                        {deadLetterQ.data && !deadLetterQ.isPending && !deadLetterQ.isError && (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Propiedad</th>
                                        <th>Operación</th>
                                        <th>Intentos</th>
                                        <th>Error</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deadLetterQ.data.data.map((d) => (
                                        <tr key={d.id}>
                                            <td>
                                                <strong>{d.property_title ?? 'Propiedad eliminada'}</strong>
                                                {d.property_code !== null && (
                                                    <span className="muted">
                                                        {' '}
                                                        #{String(d.property_code).padStart(4, '0')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="cap">
                                                {ML_OPERATION_LABEL[
                                                    d.operation as keyof typeof ML_OPERATION_LABEL
                                                ] ?? d.operation}
                                            </td>
                                            <td className="num">
                                                {d.attempts}/{d.max_attempts}
                                            </td>
                                            <td
                                                className={`muted ${styles['cell-error']}`}
                                                title={d.last_error ?? undefined}
                                            >
                                                {d.last_error ?? '-'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        disabled={retryDeadLetterMutation.isPending}
                                                        onClick={() => retryDeadLetterMutation.mutate(d.id)}
                                                    >
                                                        Reintentar
                                                    </Button>
                                                    <IconButton
                                                        variant="ghost"
                                                        aria-label="Eliminar trabajo fallido"
                                                        disabled={deleteDeadLetterMutation.isPending}
                                                        onClick={() => deleteDeadLetterMutation.mutate(d.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </IconButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {deadLetterQ.data.data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="empty-cell">
                                                No hay fallos definitivos.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
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
                                    <th>Última sync</th>
                                    <th>Publicación</th>
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
                                                ? m.price.toLocaleString('es-AR', {
                                                      style: 'currency',
                                                      currency: 'ARS',
                                                  })
                                                : '-'}
                                        </td>
                                        <td className="muted">{formatDate(m.last_sync_at)}</td>
                                        <td>
                                            {m.permalink ? (
                                                <a
                                                    href={m.permalink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <Button variant="secondary" size="sm">
                                                        Ver publicación <ExternalLink size={12} />
                                                    </Button>
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
                                            Todavía no hay propiedades publicadas en Mercado Libre.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </section>

                    <section className="card table-card">
                        <div className="site-section-head">
                            <div>
                                <h3>Órdenes de compra</h3>
                                <p>Órdenes recibidas vía webhook de Mercado Libre.</p>
                            </div>
                            {ordersQ.data && ordersQ.data.length > 0 && (
                                <Badge variant="success">
                                    <ShoppingBag size={12} /> {ordersQ.data.length}
                                </Badge>
                            )}
                        </div>
                        {ordersQ.isPending && (
                            <div className="ml-skeleton">
                                <div className="skeleton-table">
                                    <div className="skeleton-row header"></div>
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="skeleton-row"></div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {ordersQ.isError && (
                            <div className="ml-error">
                                <p>No se pudieron cargar las órdenes.</p>
                                <Button variant="secondary" size="sm" onClick={() => ordersQ.refetch()}>
                                    Reintentar
                                </Button>
                            </div>
                        )}
                        {ordersQ.data && !ordersQ.isPending && !ordersQ.isError && (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Orden</th>
                                        <th>Comprador</th>
                                        <th>Estado</th>
                                        <th>Total</th>
                                        <th>Recibida</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ordersQ.data.map((o) => (
                                        <tr key={o.id}>
                                            <td className="num">{o.order_id}</td>
                                            <td>{o.buyer_nickname ?? '-'}</td>
                                            <td className="cap">{o.status}</td>
                                            <td className="num">
                                                {o.total_amount !== null
                                                    ? o.total_amount.toLocaleString('es-AR', {
                                                          style: 'currency',
                                                          currency: o.currency || 'ARS',
                                                      })
                                                    : '-'}
                                            </td>
                                            <td className="muted">{formatDate(o.received_at)}</td>
                                        </tr>
                                    ))}
                                    {ordersQ.data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="empty-cell">
                                                Todavía no hay órdenes de compra.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </section>
                </>
            )}

            {replyModal}
            {templateModal}

            <ConfirmDialog
                open={showDisconnectConfirm}
                title="Desconectar cuenta de Mercado Libre"
                message="Vas a desconectar la cuenta de Mercado Libre. Esto detiene la sincronización y las auto-respuestas. Las publicaciones existentes quedan activas en Mercado Libre pero no se actualizarán. ¿Continuar?"
                confirmLabel="Desconectar"
                danger
                onConfirm={() => disconnectMutation.mutate()}
                onCancel={() => setShowDisconnectConfirm(false)}
            />

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
