import { useState } from 'preact/hooks';
import { useMutation } from '@tanstack/react-query';
import { RefreshCw, ExternalLink, Settings, AlertCircle, XCircle, HelpCircle } from 'lucide-preact';
import { useMlMeta, useMlQueue, useMlSettings } from '../lib/ml.api';
import { bulkEnqueueMl } from '../lib/ml';
import { queryClient } from '../lib/query/client';
import { pushToast } from '../store/app';
import { Badge, Button, Spinner } from '@bienenhaus/ui';
import { ML_SYNC_STATUS_LABEL, ML_SYNC_STATUS_TONE, ML_OPERATION_LABEL } from '../lib/ml';
import styles from './PropertyFormPage.module.css';

interface MLPanelProps {
    propertyId: string;
}

export function MLPanel({ propertyId }: MLPanelProps) {
    const [showDetails, setShowDetails] = useState(false);

    const { data: mlMetaResult, isPending: metaPending } = useMlMeta({ property_id: propertyId });
    const mlMeta = mlMetaResult?.data?.[0];

    const { data: mlQueueResult } = useMlQueue();
    const mlQueue = mlQueueResult?.data?.filter((q) => q.property_id === propertyId) ?? [];

    const { data: mlSettings } = useMlSettings();

    const enqueueMl = useMutation({
        mutationFn: async (operation: 'publish' | 'update' | 'delete') => {
            return bulkEnqueueMl([propertyId], operation);
        },
        onSuccess: (_, operation) => {
            pushToast({ type: 'success', title: `Encolado para ${ML_OPERATION_LABEL[operation]}` });
            void queryClient.invalidateQueries({ queryKey: ['ml-queue'] });
            void queryClient.invalidateQueries({ queryKey: ['ml-meta'] });
        },
        onError: (err: unknown) => {
            pushToast({ type: 'error', title: 'Error al encolar', description: String(err) });
        },
    });

    const getStatusBadge = (status: string | null) => {
        if (!status) return <span className={styles.muted}>— Sin sincronizar</span>;
        return (
            <Badge
                variant={ML_SYNC_STATUS_TONE[status as keyof typeof ML_SYNC_STATUS_TONE] as import('@bienenhaus/ui').BadgeVariant}
                size="sm"
            >
                {ML_SYNC_STATUS_LABEL[status as keyof typeof ML_SYNC_STATUS_LABEL] || status}
            </Badge>
        );
    };

    const handleEnqueue = (operation: 'publish' | 'update' | 'delete') => {
        enqueueMl.mutate(operation);
    };

    if (metaPending) {
        return <div className={styles.mlLoading}><Spinner size="md" /> Cargando estado ML…</div>;
    }

    const hasMeta = !!mlMeta;
    const metaStatus = mlMeta?.status ?? null;
    const queueItem = mlQueue[0];

    return (
        <div className={styles.mlPanel}>
            <div className={styles.mlHeader}>
                <div className={styles.mlStatusRow}>
                    <div className={styles.mlStatusMain}>
                        {getStatusBadge(metaStatus)}
                        {hasMeta && mlMeta?.ml_item_id && (
                            <a
                                href={mlMeta.permalink ?? `#`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.mlPermalink}
                                title="Ver en Mercado Libre"
                            >
                                <ExternalLink size={14} /> Ver en ML
                            </a>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        iconLeft={<Settings size={14} />}
                        onClick={() => setShowDetails(!showDetails)}
                    >
                        {showDetails ? 'Ocultar detalles' : 'Mostrar detalles'}
                    </Button>
                </div>

                {!hasMeta && (
                    <div className={styles.mlEmpty}>
                        <HelpCircle size={20} className={styles.mlEmptyIcon} />
                        <p>Esta propiedad no tiene sincronización con Mercado Libre.</p>
                        <div className={styles.mlEmptyActions}>
                            <Button
                                variant="primary"
                                iconLeft={<RefreshCw size={14} />}
                                onClick={() => handleEnqueue('publish')}
                            >
                                Publicar en ML
                            </Button>
                        </div>
                    </div>
                )}

                {hasMeta && (
                    <div className={styles.mlDetails}>
                        <dl className={styles.mlDetailsList}>
                            <div>
                                <dt>ID de publicación</dt>
                                <dd>{mlMeta?.ml_item_id ?? '—'}</dd>
                            </div>
                            <div>
                                <dt>Estado sincronización</dt>
                                <dd>{getStatusBadge(metaStatus)}</dd>
                            </div>
                            <div>
                                <dt>Precio en ML</dt>
                                <dd>{mlMeta?.price ? `$${mlMeta.price.toLocaleString('es-AR')}` : '—'}</dd>
                            </div>
                            <div>
                                <dt>Última sincronización</dt>
                                <dd>
                                    {mlMeta?.last_sync_at
                                        ? `${new Date(mlMeta.last_sync_at).toLocaleString('es-AR')} <Clock size={12} className={styles.inlineIcon} />`
                                        : '—'}
                                </dd>
                            </div>
                            <div>
                                <dt>Estado último sync</dt>
                                <dd>
                                    {mlMeta?.last_sync_status
                                        ? <Badge
                                              variant={ML_SYNC_STATUS_TONE[mlMeta.last_sync_status as keyof typeof ML_SYNC_STATUS_TONE] as import('@bienenhaus/ui').BadgeVariant}
                                              size="sm"
                                          >
                                              {ML_SYNC_STATUS_LABEL[mlMeta.last_sync_status as keyof typeof ML_SYNC_STATUS_LABEL] || mlMeta.last_sync_status}
                                          </Badge>
                                        : '—'}
                                </dd>
                            </div>
                        </dl>

                        {queueItem && (
                            <div className={styles.mlQueueInfo}>
                                <dt>En cola: {ML_OPERATION_LABEL[queueItem.operation]}</dt>
                                <dd>
                                    <Badge
                                        variant={ML_SYNC_STATUS_TONE[queueItem.status as keyof typeof ML_SYNC_STATUS_TONE] as import('@bienenhaus/ui').BadgeVariant}
                                        size="sm"
                                    >
                                        {ML_SYNC_STATUS_LABEL[queueItem.status as keyof typeof ML_SYNC_STATUS_LABEL] || queueItem.status}
                                    </Badge>
                                    {queueItem.attempts > 0 && <span className={styles.muted}> · Intento {queueItem.attempts}/{queueItem.max_attempts}</span>}
                                    {queueItem.last_error && (
                                        <div className={styles.mlError}>
                                            <AlertCircle size={12} />
                                            {queueItem.last_error}
                                        </div>
                                    )}
                                </dd>
                            </div>
                        )}

                        <div className={styles.mlActions}>
                            <Button
                                variant={metaStatus === 'synced' ? 'secondary' : 'primary'}
                                iconLeft={<RefreshCw size={14} />}
                                disabled={enqueueMl.isPending}
                                onClick={() => handleEnqueue('update')}
                            >
                                {enqueueMl.isPending ? <Spinner size="sm" /> : 'Actualizar en ML'}
                            </Button>
                            <Button
                                variant="danger"
                                iconLeft={<XCircle size={14} />}
                                disabled={enqueueMl.isPending}
                                onClick={() => handleEnqueue('delete')}
                            >
                                Eliminar de ML
                            </Button>
                        </div>
                    </div>
                )}

                {showDetails && (
                    <details className={styles.mlAdvanced}>
                        <summary>Configuración avanzada</summary>
                        <div className={styles.mlSettings}>
                            <div>
                                <label>Categoría por defecto</label>
                                <span className={styles.muted}>{mlSettings?.defaults?.category_id ?? 'No configurada'}</span>
                            </div>
                            <div>
                                <label>Tipo de publicación por defecto</label>
                                <span className={styles.muted}>{mlSettings?.defaults?.listing_type_id ?? 'No configurado'}</span>
                            </div>
                            <div>
                                <label>Condición por defecto</label>
                                <span className={styles.muted}>{mlSettings?.defaults?.condition ?? 'No configurada'}</span>
                            </div>
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
}