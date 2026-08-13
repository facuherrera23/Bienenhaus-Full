import { useState } from 'preact/hooks';
import { Calendar, Check, FileText, Plus, TrendingUp, X } from 'lucide-preact';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ReportFormValues, reportSchema, type ReportType } from '../../lib/owners/schemas';
import {
    type ActionPlanRow,
    type CommunicationRow,
    type PriceAnalysisRow,
    REPORT_TYPE_LABEL,
} from '../../types/owners';

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

const REPORT_TEMPLATES: Record<ReportType, { icon: any; description: string; sections: string[] }> =
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
        <div className="report-step">
            <h3>Seleccionar tipo de reporte</h3>
            <div className="report-types-grid">
                {(Object.keys(REPORT_TEMPLATES) as ReportType[]).map((type) => {
                    const template = REPORT_TEMPLATES[type];
                    const Icon = template.icon;
                    return (
                        <button
                            key={type}
                            type="button"
                            className={`report-type-card${selectedType === type ? ' selected' : ''}`}
                            onClick={() => handleTypeSelect(type)}
                        >
                            <Icon size={28} />
                            <h4>{REPORT_TYPE_LABEL[type]}</h4>
                            <p>{template.description}</p>
                            <ul className="sections-preview">
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
            <div className="report-step">
                <div className="step-header">
                    <button type="button" className="icon-btn" onClick={handleBack}>
                        <X size={18} />
                    </button>
                    <Icon size={28} />
                    <h3>{REPORT_TYPE_LABEL[selectedType]}</h3>
                </div>

                <div className="form-field">
                    <label htmlFor="title">Título del reporte</label>
                    <input
                        id="title"
                        type="text"
                        {...methods.register('title')}
                        placeholder={`Ej: ${REPORT_TYPE_LABEL[selectedType]} - ${new Date().toLocaleDateString('es-AR')}`}
                    />
                </div>

                {selectedType === 'custom' && (
                    <div className="custom-sections">
                        <h4>Secciones personalizadas</h4>
                        <div className="section-inputs">
                            {customSections.map((section, i) => (
                                <div key={i} className="section-input-row">
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
                                        className="icon-btn icon-btn--danger"
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
                                className="btn btn--ghost btn--sm"
                                onClick={() => setCustomSections([...customSections, ''])}
                            >
                                <Plus size={14} /> Agregar sección
                            </button>
                        </div>

                        <div className="form-field">
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

                <div className="included-data">
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

                <div className="step-actions">
                    <button type="button" className="btn btn--ghost" onClick={handleBack}>
                        Volver
                    </button>
                    <button type="button" className="btn btn--primary" onClick={handlePreview}>
                        <Check size={14} /> Generar vista previa
                    </button>
                </div>
            </div>
        );
    };

    const renderStepPreview = () => (
        <div className="report-step report-preview">
            <div className="step-header">
                <button type="button" className="icon-btn" onClick={handleBack}>
                    <X size={18} />
                </button>
                <FileText size={28} />
                <h3>Vista previa del reporte</h3>
            </div>

            <div className="preview-content">
                <div className="preview-header">
                    <h2>{methods.getValues('title') || 'Reporte sin título'}</h2>
                    <div className="preview-meta">
                        <span>
                            Tipo:{' '}
                            {REPORT_TYPE_LABEL[methods.getValues('report_type') as ReportType]}
                        </span>
                        <span>Generado: {new Date().toLocaleString('es-AR')}</span>
                    </div>
                </div>

                <div className="preview-body">
                    {selectedType === 'price_analysis' && priceAnalysis && (
                        <div className="preview-section">
                            <h3>Análisis de Precio</h3>
                            <div className="price-summary">
                                <div className="price-row">
                                    <span>Precio publicación:</span>
                                    <strong>
                                        ${priceAnalysis.our_listing_price.toLocaleString('es-AR')}
                                    </strong>
                                </div>
                                <div className="price-row">
                                    <span>Precio mercado estimado:</span>
                                    <strong>
                                        $
                                        {priceAnalysis.estimated_market_price.toLocaleString(
                                            'es-AR',
                                        )}
                                    </strong>
                                </div>
                                <div className="price-row highlight">
                                    <span>Diferencia:</span>
                                    <strong className={`status-${priceAnalysis.price_status}`}>
                                        {priceAnalysis.price_difference_pct >= 0 ? '+' : ''}
                                        {priceAnalysis.price_difference_pct.toFixed(2)}%
                                    </strong>
                                </div>
                                <div className="price-row">
                                    <span>Estado:</span>
                                    <span className={`badge badge--${priceAnalysis.price_status}`}>
                                        {priceAnalysis.price_status}
                                    </span>
                                </div>
                                {priceAnalysis.recommendation && (
                                    <div className="recommendation">
                                        <strong>Recomendación:</strong>{' '}
                                        {priceAnalysis.recommendation}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {(selectedType === 'weekly' || selectedType === 'monthly') &&
                        actionPlans.length > 0 && (
                            <div className="preview-section">
                                <h3>Planes de Acción ({actionPlans.length})</h3>
                                <ul className="plans-preview">
                                    {actionPlans.map((p) => (
                                        <li key={p.id}>
                                            <span className="plan-title">{p.title}</span>
                                            <span className={`badge badge--${p.status}`}>
                                                {p.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                    {communications.length > 0 && (
                        <div className="preview-section">
                            <h3>Comunicaciones Recientes ({communications.length})</h3>
                            <ul className="communications-preview">
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
                        <div className="preview-section">
                            <h3>Contenido Personalizado</h3>
                            <div
                                className="custom-content-preview"
                                dangerouslySetInnerHTML={{ __html: customContent }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="step-actions">
                <button type="button" className="btn btn--ghost" onClick={handleBack}>
                    Editar
                </button>
                <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => handleSubmit()}
                    disabled={isLoading}
                >
                    {isLoading ? 'Generando...' : 'Generar reporte'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="owner-report-generator">
            {step === 'type' && renderStepType()}
            {step === 'configure' && renderStepConfigure()}
            {step === 'preview' && renderStepPreview()}

            <form onSubmit={handleSubmit} className="hidden-form">
                {methods.formState.errors.title && (
                    <span className="error">{methods.formState.errors.title.message}</span>
                )}
            </form>
        </div>
    );
}
