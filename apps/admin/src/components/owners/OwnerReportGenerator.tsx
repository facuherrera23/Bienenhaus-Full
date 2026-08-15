import { useState } from 'preact/hooks';
import { Calendar, Check, FileText, type LucideIcon, Plus, TrendingUp, X } from 'lucide-preact';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ReportFormValues, reportSchema, type ReportType } from '../../lib/owners/schemas';
import { Badge, type BadgeVariant } from '@bienenhaus/ui';
import {
    ACTION_PLAN_STATUS_TONE,
    type ActionPlanRow,
    type CommunicationRow,
    type PriceAnalysisRow,
    PRICE_STATUS_TONE,
    REPORT_TYPE_LABEL,
} from '../../types/owners';
import styles from '../../styles/OwnerReportGenerator.module.css';

interface OwnerReportGeneratorProps {
    propertyId: string;
    ownerId: string;
    onGenerate: (report: ReportFormValues) => Promise<void>;
    onCancel?: () => void;
    priceAnalysis?: PriceAnalysisRow | null;
    actionPlans?: ActionPlanRow[];
    communications?: CommunicationRow[];
    isLoading?: boolean;
}

const REPORT_TEMPLATES: Record<ReportType, { icon: LucideIcon; description: string; sections: string[] }> =
    {
        price_analysis: {
            icon: TrendingUp,
            description: 'Análisis comparativo de precio de mercado vs precio de publicación',
            sections: ['Gauge de precio', 'Comparables', 'Recomendación', 'Tendencia de mercado'],
        },
        visit_summary: {
            icon: Calendar,
            description: 'Resumen de visitas realizadas a la propiedad',
            sections: ['Visitas totales', 'Feedback', 'Próximas visitas', 'Estadísticas'],
        },
        market_update: {
            icon: TrendingUp,
            description: 'Actualización del mercado inmobiliario de la zona',
            sections: [
                'Tendencias de precio',
                'Nuevas publicaciones',
                'Ventas recientes',
                'Análisis de demanda',
            ],
        },
        weekly: {
            icon: Calendar,
            description: 'Reporte semanal de actividad de la propiedad',
            sections: ['Visitas', 'Leads', 'Comunicaciones', 'Acciones realizadas'],
        },
        monthly: {
            icon: Calendar,
            description: 'Reporte mensual consolidado',
            sections: ['Resumen ejecutivo', 'KPIs', 'Plan de acción', 'Próximos pasos'],
        },
        custom: {
            icon: FileText,
            description: 'Reporte personalizado con las secciones que elijas',
            sections: ['Secciones a definir'],
        },
    };

export function OwnerReportGenerator({
    propertyId,
    ownerId,
    onGenerate,
    priceAnalysis,
    actionPlans = [],
    communications = [],
    isLoading,
}: OwnerReportGeneratorProps) {
    const [step, setStep] = useState<'type' | 'configure' | 'preview'>('type');
    const [selectedType, setSelectedType] = useState<ReportType>('price_analysis');
    const [customSections, setCustomSections] = useState<string[]>([]);
    const [customContent, setCustomContent] = useState('');

    const methods = useForm<ReportFormValues>({
        resolver: zodResolver(reportSchema),
        defaultValues: {
            property_id: propertyId,
            owner_id: ownerId,
            report_type: 'price_analysis',
            title: '',
            content_json: {},
        },
    });

    const handleTypeSelect = (type: ReportType) => {
        setSelectedType(type);
        methods.setValue('report_type', type);
        setStep('configure');
    };

    const handleBack = () => {
        setStep(step === 'preview' ? 'configure' : 'type');
    };

    const handleGenerate = async (data: ReportFormValues) => {
        await onGenerate(data);
    };

    const buildContentJson = (): Record<string, unknown> => {
        const base = {
            propertyId,
            ownerId,
            generatedAt: new Date().toISOString(),
            type: selectedType,
            sections: REPORT_TEMPLATES[selectedType].sections,
        };

        if (selectedType === 'price_analysis' && priceAnalysis) {
            return {
                ...base,
                priceAnalysis: {
                    estimatedMarketPrice: priceAnalysis.estimated_market_price,
                    ourListingPrice: priceAnalysis.our_listing_price,
                    differencePct: priceAnalysis.price_difference_pct,
                    status: priceAnalysis.price_status,
                    trend: priceAnalysis.market_trend,
                    comparables: priceAnalysis.comparable_properties,
                    recommendation: priceAnalysis.recommendation,
                },
            };
        }

        if (selectedType === 'visit_summary') {
            return {
                ...base,
                visits: {
                    total: 0, // Would come from visits API
                    upcoming: 0,
                    feedback: [],
                },
            };
        }

        if (selectedType === 'market_update') {
            return {
                ...base,
                market: {
                    trend: 'stable',
                    avgPricePerSqm: 0,
                    newListings: 0,
                    recentSales: 0,
                },
            };
        }

        if (selectedType === 'weekly' || selectedType === 'monthly') {
            return {
                ...base,
                period: selectedType,
                actionPlans: actionPlans.map((p) => ({
                    title: p.title,
                    status: p.status,
                    priority: p.priority,
                    dueDate: p.due_date,
                })),
                communications: communications.slice(0, 10).map((c) => ({
                    type: c.type,
                    subject: c.subject,
                    date: c.created_at,
                    status: c.status,
                })),
            };
        }

        if (selectedType === 'custom') {
            return {
                ...base,
                customSections,
                customContent,
            };
        }

        return base;
    };

    const handlePreview = () => {
        const contentJson = buildContentJson();
        methods.setValue('content_json', contentJson);
        if (!methods.getValues('title')) {
            methods.setValue(
                'title',
                `${REPORT_TYPE_LABEL[selectedType]} - ${new Date().toLocaleDateString('es-AR')}`,
            );
        }
        setStep('preview');
    };

    const handleSubmit = methods.handleSubmit(async (data) => {
        await handleGenerate(data);
    });

    const renderStepType = () => (
        <div className={styles.reportStep}>
            <h3>Seleccionar tipo de reporte</h3>
            <div className={styles.reportTypesGrid}>
                {(Object.keys(REPORT_TEMPLATES) as ReportType[]).map((type) => {
                    const template = REPORT_TEMPLATES[type];
                    const Icon = template.icon;
                    return (
                        <button
                            key={type}
                            type="button"
                            className={styles.reportTypeCard + (selectedType === type ? ' ' + styles.selected : '')}
                            onClick={() => handleTypeSelect(type)}
                        >
                            <Icon size={28} />
                            <h4>{REPORT_TYPE_LABEL[type]}</h4>
                            <p>{template.description}</p>
                            <ul className={styles.sectionsPreview}>
                                {template.sections.map((s) => (
                                    <li key={s}>{s}</li>
                                ))}
                            </ul>
                        </button>
                    );
                })}
            </div>
        </div>
    );

const renderStepConfigure = () => {
        const template = REPORT_TEMPLATES[selectedType];
        const Icon = template.icon;

        return (
            <div className={styles.reportStep}>
                <div className={styles.stepHeader}>
                    <button type="button" className={styles.iconBtn} onClick={handleBack}>
                        <X size={18} />
                    </button>
                    <Icon size={28} />
                    <h3>{REPORT_TYPE_LABEL[selectedType]}</h3>
                </div>

                <div className={styles.formField}>
                    <label htmlFor="title">Título del reporte</label>
                    <input
                        id="title"
                        type="text"
                        {...methods.register('title')}
                        placeholder={`Ej: ${REPORT_TYPE_LABEL[selectedType]} - ${new Date().toLocaleDateString('es-AR')}`}
                    />
                </div>

                {selectedType === 'custom' && (
                    <div className={styles.customSections}>
                        <h4>Secciones personalizadas</h4>
                        <div className={styles.sectionInputs}>
                            {customSections.map((section, i) => (
                                <div key={i} className={styles.sectionInputRow}>
                                    <input
                                        type="text"
                                        value={section}
                                        onInput={(e) => {
                                            const updated = [...customSections];
                                            updated[i] = (
                                                e.currentTarget as HTMLInputElement
                                            ).value;
                                            setCustomSections(updated);
                                        }}
                                        placeholder={`Sección ${i + 1}`}
                                    />
                                    <button
                                        type="button"
                                        className={styles.iconBtnDanger}
                                        onClick={() => {
                                            setCustomSections(
                                                customSections.filter((_, idx) => idx !== i),
                                            );
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className={styles.btnBtnGhostBtnSm}
                                onClick={() => setCustomSections([...customSections, ''])}
                            >
                                <Plus size={14} /> Agregar sección
                            </button>
                        </div>

                        <div className={styles.formField}>
                            <label htmlFor="custom_content">Contenido adicional (Markdown)</label>
                            <textarea
                                id="custom_content"
                                rows={6}
                                value={customContent}
                                onInput={(e) =>
                                    setCustomContent((e.currentTarget as HTMLTextAreaElement).value)
                                }
                                placeholder="Contenido libre para el reporte..."
                            />
                        </div>
                    </div>
                )}

                <div className={styles.includedData}>
                    <h4>Datos que se incluirán automáticamente:</h4>
                    <ul>
                        {template.sections.map((s) => (
                            <li key={s}>{s}</li>
                        ))}
                        {priceAnalysis && <li>Análisis de precio actual</li>}
                        {actionPlans.length > 0 && <li>{actionPlans.length} plan(es) de acción</li>}
                        {communications.length > 0 && (
                            <li>{communications.length} comunicación(es) reciente(s)</li>
                        )}
                    </ul>
                </div>

                <div className={styles.stepActions}>
                    <button type="button" className={styles.btnBtnGhost} onClick={handleBack}>
                        Volver
                    </button>
                    <button type="button" className={styles.btnBtnPrimary} onClick={handlePreview}>
                        <Check size={14} /> Generar vista previa
                    </button>
                </div>
            </div>
        );
    };

const renderStepPreview = () => {
        return (
            <div className={styles.reportStepReportPreview}>
                <div className={styles.stepHeader}>
                    <button type="button" className={styles.iconBtn} onClick={handleBack}>
                        <X size={18} />
                    </button>
                    <FileText size={28} />
                    <h3>Vista previa del reporte</h3>
                </div>

                <div className={styles.previewContent}>
                    <div className={styles.previewHeader}>
                        <h2>{methods.getValues('title') || 'Reporte sin título'}</h2>
                        <div className={styles.previewMeta}>
                            <span>
                                Tipo:{' '}
                                {REPORT_TYPE_LABEL[methods.getValues('report_type') as ReportType]}
                            </span>
                            <span>Generado: {new Date().toLocaleString('es-AR')}</span>
                        </div>
                    </div>

                    <div className={styles.previewBody}>
                        {selectedType === 'price_analysis' && priceAnalysis && (
                            <div className={styles.previewSection}>
                                <h3>Análisis de Precio</h3>
                                <div className={styles.priceSummary}>
                                    <div className={styles.priceRow}>
                                        <span>Precio publicación:</span>
                                        <strong>
                                            ${priceAnalysis.our_listing_price.toLocaleString('es-AR')}
                                        </strong>
                                    </div>
                                    <div className={styles.priceRow}>
                                        <span>Precio mercado estimado:</span>
                                        <strong>
                                            $
                                            {priceAnalysis.estimated_market_price.toLocaleString(
                                                'es-AR',
                                            )}
                                        </strong>
                                    </div>
                                    <div className={`${styles.priceRow} ${styles.highlight}`}>
                                        <span>Diferencia:</span>
                                        <strong className={`status-${priceAnalysis.price_status}`}>
                                            {priceAnalysis.price_difference_pct >= 0 ? '+' : ''}
                                            {priceAnalysis.price_difference_pct.toFixed(2)}%
                                        </strong>
                                    </div>
                                    <div className={styles.priceRow}>
                                        <span>Estado:</span>
                                        <Badge variant={PRICE_STATUS_TONE[priceAnalysis.price_status] as BadgeVariant}>
                                            {priceAnalysis.price_status}
                                        </Badge>
                                    </div>
                                    {priceAnalysis.recommendation && (
                                        <div className={styles.recommendation}>
                                            <strong>Recomendación:</strong>{' '}
                                            {priceAnalysis.recommendation}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {(selectedType === 'weekly' || selectedType === 'monthly') &&
                            actionPlans.length > 0 && (
                            <div className={styles.previewSection}>
                                <h3>Planes de Acción ({actionPlans.length})</h3>
                                <ul className={styles.plansPreview}>
                                    {actionPlans.map((p) => (
                                        <li key={p.id}>
                                            <span className={styles.planTitle}>{p.title}</span>
                                            <Badge variant={ACTION_PLAN_STATUS_TONE[p.status] as BadgeVariant}>
                                                {p.status}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {communications.length > 0 && (
                            <div className={styles.previewSection}>
                                <h3>Comunicaciones Recientes ({communications.length})</h3>
                                <ul className={styles.communicationsPreview}>
                                    {communications.slice(0, 5).map((c) => (
                                        <li key={c.id}>
                                            <span>
                                                {c.type}: {c.subject || 'Sin asunto'}
                                            </span>
                                            <time>
                                                {new Date(c.created_at).toLocaleDateString('es-AR')}
                                            </time>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {selectedType === 'custom' && customContent && (
                            <div className={styles.previewSection}>
                                <h3>Contenido Personalizado</h3>
                                <div
                                    className={styles.customContentPreview}
                                    dangerouslySetInnerHTML={{ __html: customContent }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.stepActions}>
                    <button type="button" className={styles.btnBtnGhost} onClick={handleBack}>
                        Editar
                    </button>
                    <button
                        type="button"
                        className={styles.btnBtnPrimary}
                        onClick={() => handleSubmit()}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Generando...' : 'Generar reporte'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.ownerReportGenerator}>
            {step === 'type' && renderStepType()}
            {step === 'configure' && renderStepConfigure()}
            {step === 'preview' && renderStepPreview()}

            <form onSubmit={handleSubmit} className={styles.hiddenForm}>
                {methods.formState.errors.title && (
                    <span className={styles.error}>{methods.formState.errors.title.message}</span>
                )}
            </form>
        </div>
    );
}
