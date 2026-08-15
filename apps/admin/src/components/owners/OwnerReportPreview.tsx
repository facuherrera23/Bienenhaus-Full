import { Download, FileText, Mail, MessageSquare, X } from 'lucide-preact';
import { REPORT_TYPE_LABEL, type ReportRow } from '../../types/owners';
import styles from './OwnerReportPreview.module.css';

interface OwnerReportPreviewProps {
    report: ReportRow;
    onClose: () => void;
    onSendWhatsApp?: () => void;
    onSendEmail?: () => void;
    onDownload?: () => void;
    onRegenerate?: () => void;
}

export function OwnerReportPreview({
    report,
    onClose,
    onSendWhatsApp,
    onSendEmail,
    onDownload,
    onRegenerate,
}: OwnerReportPreviewProps) {
    const content = report.content_json as Record<string, unknown>;
    const priceAnalysis = content.priceAnalysis as
        | {
              estimatedMarketPrice: number;
              ourListingPrice: number;
              differencePct: number;
              status: string;
              trend: string;
              comparables: Array<{ address: string; price: number; sqm?: number }>;
              recommendation?: string;
          }
        | undefined;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div
                className={styles.modal + ' ' + styles['modal--large'] + ' ' + styles['report-preview-modal']}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <div className={styles.headerLeft}>
                        <FileText size={24} />
                        <div>
                            <h2>{report.title || 'Reporte sin título'}</h2>
                            <span className={`${styles.badge} ${styles['badge--' + report.status]}`}>
                                {REPORT_TYPE_LABEL[report.report_type]}
                            </span>
                        </div>
                    </div>
                    <div className={styles.headerRight}>
                        <span className={styles.generatedAt}>
                            Generado: {formatDate(report.generated_at)}
                        </span>
                        <button type="button" className={styles.iconBtn} onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="modal-body">
                    <div className={styles.reportContent}>
                        {priceAnalysis && (
                            <section className={styles.reportSection}>
                                <h3>Análisis de Precio</h3>
                                <div className={styles.priceAnalysisGrid}>
                                    <div className={styles.priceMetric}>
                                        <span className={styles.metricLabel}>Precio de publicación</span>
                                        <span className={styles.metricValue}>
                                            ${priceAnalysis.ourListingPrice.toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                    <div className="price-metric">
                                        <span className="metric-label">
                                            Precio de mercado estimado
                                        </span>
                                        <span className="metric-value">
                                            $
                                            {priceAnalysis.estimatedMarketPrice.toLocaleString(
                                                'es-AR',
                                            )}
                                        </span>
                                    </div>
                                    <div className={`${styles.priceMetric} ${styles.highlight}`}>
                                        <span className={styles.metricLabel}>Diferencia</span>
                                        <span
                                            className={styles.metricValue + ' ' + styles['status-' + priceAnalysis.status]}
                                        >
                                            {priceAnalysis.differencePct >= 0 ? '+' : ''}
                                            {priceAnalysis.differencePct.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className={styles.priceMetric}>
                                        <span className={styles.metricLabel}>Estado del precio</span>
                                        <span className={`${styles.badge} ${styles['badge--' + priceAnalysis.status]}`}>
                                            {priceAnalysis.status}
                                        </span>
                                    </div>
                                    <div className={styles.priceMetric}>
                                        <span className={styles.metricLabel}>Tendencia del mercado</span>
                                        <span className={styles.metricValue}>{priceAnalysis.trend}</span>
                                    </div>
                                </div>

                                {priceAnalysis.comparables.length > 0 && (
                                    <div className="comparables-table">
                                        <h4>Propiedades Comparables</h4>
                                        <table className={`${styles.table} ${styles['table--compact']}`}>
                                            <thead>
                                                <tr>
                                                    <th>Dirección</th>
                                                    <th>Precio</th>
                                                    <th>m²</th>
                                                    <th>Precio/m²</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {priceAnalysis.comparables.map((comp, i) => (
                                                    <tr key={i}>
                                                        <td>{comp.address}</td>
                                                        <td>
                                                            ${comp.price.toLocaleString('es-AR')}
                                                        </td>
                                                        <td>{comp.sqm ?? '—'}</td>
                                                        <td>
                                                            {comp.sqm
                                                                ? `$${(comp.price / comp.sqm).toLocaleString('es-AR')}`
                                                                : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {priceAnalysis.recommendation && (
                                    <div className={styles.recommendationBox}>
                                        <h4>Recomendación</h4>
                                        <p>{priceAnalysis.recommendation}</p>
                                    </div>
                                )}
                            </section>
                        )}

                        {content.actionPlans && (
                            <section className={styles.reportSection}>
                                <h3>Planes de Acción</h3>
                                <ul className={styles.plansList}>
                                    {(
                                        content.actionPlans as Array<{
                                            title: string;
                                            status: string;
                                            priority: string;
                                            dueDate?: string;
                                        }>
                                    ).map((plan, i) => (
                                        <li key={i} className={styles.planItem}>
                                            <div className={styles.planInfo}>
                                                <strong>{plan.title}</strong>
                                                <span className={`${styles.badge} ${styles['badge--' + plan.status]}`}>
                                                    {plan.status}
                                                </span>
                                                <span
                                                    className={`${styles.priorityBadge} ${styles['priority-badge--' + plan.priority]}`}
                                                >
                                                    {plan.priority}
                                                </span>
                                            </div>
                                            {plan.dueDate && (
                                                <time className="plan-due">
                                                    Vence:{' '}
                                                    {new Date(plan.dueDate).toLocaleDateString(
                                                        'es-AR',
                                                    )}
                                                </time>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {content.communications && (
                            <section className="report-section">
                                <h3>Comunicaciones Recientes</h3>
                                <ul className="communications-list">
                                    {(
                                        content.communications as Array<{
                                            type: string;
                                            subject?: string;
                                            date: string;
                                            status: string;
                                        }>
                                    ).map((comm, i) => (
                                        <li key={i} className={styles.commItem}>
                                            <span className={styles.commType}>{comm.type}</span>
                                            <span className={styles.commSubject}>
                                                {comm.subject || 'Sin asunto'}
                                            </span>
                                            <time className={styles.commDate}>
                                                {new Date(comm.date).toLocaleDateString('es-AR')}
                                            </time>
                                            <span className={`${styles.badge} ${styles['badge--' + comm.status]}`}>
                                                {comm.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {content.customContent && (
<section className={styles.reportSection}>
                                    <h3>Contenido Personalizado</h3>
                                    <div
                                        className={styles.customContent}
                                        dangerouslySetInnerHTML={{
                                            __html: content.customContent as string,
                                        }}
                                    />
                            </section>
                        )}

                        {content.customSections &&
                            (content.customSections as string[]).length > 0 && (
                                <section className={styles.reportSection}>
                                    <h3>Secciones del Reporte</h3>
                                    <ul className={styles.sectionsList}>
                                        {(content.customSections as string[]).map((section, i) => (
                                            <li key={i}>{section}</li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                    </div>
                </div>

                <div className={styles['modal-footer']}>
                    <div className={styles.footerLeft}>
                        {onRegenerate && (
                            <button type="button" className={styles.btn + ' ' + styles['btn--ghost']} onClick={onRegenerate}>
                                <X size={14} /> Regenerar
                            </button>
                        )}
                    </div>
                    <div className="footer-right">
                        {onDownload && (
                            <button
                                type="button"
                                className={`${styles.btn} ${styles['btn--secondary']}`}
                                onClick={onDownload}
                            >
                                <Download size={14} /> Descargar JSON
                            </button>
                        )}
                        {onSendEmail && (
                            <button
                                type="button"
                                className={`${styles.btn} ${styles['btn--secondary']}`}
                                onClick={onSendEmail}
                            >
                                <Mail size={14} /> Enviar por email
                            </button>
                        )}
                        {onSendWhatsApp && (
                            <button
                                type="button"
                                className={`${styles.btn} ${styles['btn--primary']}`}
                                onClick={onSendWhatsApp}
                            >
                                <MessageSquare size={14} /> Enviar por WhatsApp
                            </button>
                        )}
                        <button type="button" className={`${styles.btn} ${styles['btn--ghost']}`} onClick={onClose}>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
