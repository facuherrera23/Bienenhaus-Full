import { useState } from 'preact/hooks';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    Download,
    Edit,
    FileText,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Plus,
    Trash2,
    UserCheck,
} from 'lucide-preact';
import { Link, useLocation, useRoute } from 'wouter-preact';
import { useQueryClient } from '@tanstack/react-query';
import { Badge, Button, IconButton, type BadgeVariant } from '@bienenhaus/ui';
import {
    ownersKeys,
    sendReport,
    updateOwner,
    useActionPlans,
    useCommunications,
    useCreateReport,
    useOwner,
    usePriceAnalysis,
    usePropertyOwners,
    useReports,
    useSendCommunication,
    useSoftDeleteOwner,
} from '@lib/owners/api';
import { pushToast } from '@store/app';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
    ActionPlanCard,
    CommunicationTimeline,
    OwnerForm,
    OwnerReportGenerator,
    OwnerReportPreview,
    PriceAnalysisGauge,
    PropertyOwnerManager,
} from '@components/owners';
import type {
    CommunicationRow,
    OwnerFormValues,
    ReportFormValues,
    ReportRow,
} from '@lib/owners/schemas';
import {
    COMMUNICATION_STATUS_LABEL,
    COMMUNICATION_STATUS_TONE,
    OWNER_PREFERRED_CONTACT_LABEL,
    OWNER_TYPE_LABEL,
    REPORT_TYPE_LABEL,
} from '@/types/owners';

export function OwnerDetailPage() {
    const [, setLocation] = useLocation();
    const [, params] = useRoute('/propietarios/:id');
    const ownerId = params?.id;

    const [activeTab, setActiveTab] = useState<
        'profile' | 'properties' | 'analysis' | 'plans' | 'communications' | 'reports'
    >('profile');
    const [showReportPreview, setShowReportPreview] = useState<ReportRow | null>(null);
    const [showReportGenerator, setShowReportGenerator] = useState(false);
    const [editing, setEditing] = useState(false);
    const [confirmSoftDelete, setConfirmSoftDelete] = useState(false);
    const [deleteCommId, setDeleteCommId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: owner, isLoading, isError, error } = useOwner(ownerId ?? null);
    const softDeleteOwner = useSoftDeleteOwner();
    const sendCommunication = useSendCommunication();
    const createReport = useCreateReport();

    const { data: propertyOwners } = usePropertyOwners(ownerId ?? null);
    const primaryPropertyId = propertyOwners?.[0]?.property_id ?? '';
    const { data: priceAnalysis } = usePriceAnalysis(primaryPropertyId || null);
    const { data: actionPlansResult } = useActionPlans({ owner_id: ownerId, pageSize: 20 });
    const { data: communicationsResult } = useCommunications({ owner_id: ownerId, pageSize: 50 });
    const { data: reportsResult } = useReports({ owner_id: ownerId, pageSize: 20 });

    const actionPlans = actionPlansResult?.data ?? [];
    const communications = communicationsResult?.data ?? [];
    const reports = reportsResult?.data ?? [];

    const handleSoftDelete = async () => {
        if (!ownerId || !owner) return;
        try {
            await softDeleteOwner.mutateAsync(ownerId);
            pushToast({
                type: 'success',
                title: 'Enviado a papelera',
                description: owner.full_name,
            });
            setLocation('/propietarios');
        } catch {
            pushToast({ type: 'error', title: 'No se pudo eliminar' });
        }
    };

    const handleSaveOwner = async (data: OwnerFormValues) => {
        if (!ownerId) return;
        try {
            await updateOwner(ownerId, data);
            pushToast({
                type: 'success',
                title: 'Propietario actualizado',
                description: data.full_name,
            });
            queryClient.invalidateQueries({ queryKey: ownersKeys.detail(ownerId) });
            queryClient.invalidateQueries({ queryKey: ownersKeys.lists() });
            setEditing(false);
        } catch {
            pushToast({ type: 'error', title: 'No se pudo actualizar' });
        }
    };

    const handleCancelEdit = () => {
        setEditing(false);
    };

    const handleGenerateReport = async (reportData: ReportFormValues) => {
        try {
            await createReport.mutateAsync(reportData);
            pushToast({
                type: 'success',
                title: 'Reporte generado',
                description: reportData.title ?? undefined,
            });
            queryClient.invalidateQueries({ queryKey: ['owner-reports'] });
            setShowReportGenerator(false);
        } catch {
            pushToast({ type: 'error', title: 'No se pudo generar el reporte' });
        }
    };

    const handleSendReport = async (report: ReportRow) => {
        try {
            await sendReport(report.id as string);
            pushToast({
                type: 'success',
                title: 'Reporte enviado',
                description: report.title ?? undefined,
            });
            queryClient.invalidateQueries({ queryKey: ['owner-reports'] });
            setShowReportPreview(null);
        } catch {
            pushToast({ type: 'error', title: 'No se pudo enviar' });
        }
    };

    const handleSendCommunication = async (comm: CommunicationRow) => {
        try {
            await sendCommunication.mutateAsync(comm.id);
            pushToast({ type: 'success', title: 'Comunicación enviada' });
            queryClient.invalidateQueries({ queryKey: ['owner-communications'] });
        } catch {
            pushToast({ type: 'error', title: 'No se pudo enviar' });
        }
    };

    if (isLoading) {
        return (
            <div className="page">
                <div className="page-head">
                    <Link href="/propietarios">
                        <Button variant="ghost">
                            <ArrowLeft size={16} /> Volver
                        </Button>
                    </Link>
                </div>
                <div className="card placeholder-card">Cargando propietario…</div>
            </div>
        );
    }

    if (isError || !owner) {
        return (
            <div className="page">
                <div className="page-head">
                    <Link href="/propietarios">
                        <Button variant="ghost">
                            <ArrowLeft size={16} /> Volver
                        </Button>
                    </Link>
                </div>
                <div className="card placeholder-card">
                    Propietario no encontrado: {error?.message}
                </div>
            </div>
        );
    }

    const tabs: {
        id: 'profile' | 'properties' | 'analysis' | 'plans' | 'communications' | 'reports';
        label: string;
        icon: typeof UserCheck;
        count: number | null;
    }[] = [
        { id: 'profile', label: 'Perfil', icon: UserCheck, count: null },
        { id: 'properties', label: 'Propiedades', icon: Building2, count: owner.property_count },
        { id: 'analysis', label: 'Análisis', icon: AlertCircle, count: priceAnalysis ? 1 : 0 },
        { id: 'plans', label: 'Planes', icon: FileText, count: actionPlans.length },
        {
            id: 'communications',
            label: 'Comunicaciones',
            icon: MessageSquare,
            count: communications.length,
        },
        { id: 'reports', label: 'Reportes', icon: FileText, count: reports.length },
    ];

    return (
        <div className="page owner-detail-page">
            <div className="page-head">
                <Link href="/propietarios">
                    <Button variant="ghost">
                        <ArrowLeft size={16} /> Volver
                    </Button>
                </Link>
                <div>
                    <h2 className="page-title">{owner.full_name}</h2>
                    <p className="page-subtitle">
                        <Badge
                            variant={owner.owner_type === 'persona_juridica' ? 'info' : 'neutral'}
                        >
                            {OWNER_TYPE_LABEL[owner.owner_type]}
                        </Badge>
                        {owner.company_name && (
                            <span className="muted"> · {owner.company_name}</span>
                        )}
                        · {owner.property_count} propiedad{owner.property_count !== 1 ? 'es' : ''}
                    </p>
                </div>
                <div style="display:flex; gap:8px;">
                    {!editing && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setEditing(true)}
                        >
                            <Edit size={16} /> Editar
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="danger"
                        onClick={() => setConfirmSoftDelete(true)}
                    >
                        <Trash2 size={16} /> Papelera
                    </Button>
                </div>
            </div>

            {editing && (
                <div className="card form-card">
                    <OwnerForm
                        initialData={{
                            full_name: owner.full_name,
                            email: owner.email ?? '',
                            phone: owner.phone ?? '',
                            dni_cuit: owner.dni_cuit ?? '',
                            address: owner.address ?? '',
                            owner_type: owner.owner_type,
                            company_name: owner.company_name ?? '',
                            notes: owner.notes ?? '',
                            preferred_contact: owner.preferred_contact,
                        }}
                        onSubmit={handleSaveOwner}
                        onCancel={handleCancelEdit}
                        submitLabel="Guardar cambios"
                    />
                </div>
            )}

            <div className="owner-tabs" role="tablist">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={`owner-tab${activeTab === tab.id ? ' active' : ''}${tab.count === 0 ? ' empty' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={16} />
                        <span>{tab.label}</span>
                        {tab.count !== null && tab.count !== undefined && (
                            <span className="tab-count">{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'profile' && (
                <div className="tab-content">
                    <div className="profile-grid">
                        <div className="profile-main">
                            <div className="profile-header">
                                <div className="profile-avatar-large" aria-hidden="true">
                                    {owner.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3>{owner.full_name}</h3>
                                    <Badge
                                        variant={
                                            owner.owner_type === 'persona_juridica'
                                                ? 'info'
                                                : 'neutral'
                                        }
                                    >
                                        {OWNER_TYPE_LABEL[owner.owner_type]}
                                    </Badge>
                                </div>
                            </div>

                            <div className="profile-fields">
                                {owner.email && (
                                    <div className="profile-field">
                                        <Mail size={16} />
                                        <div>
                                            <span className="field-label">Email</span>
                                            <a href={`mailto:${owner.email}`}>{owner.email}</a>
                                        </div>
                                    </div>
                                )}
                                {owner.phone && (
                                    <div className="profile-field">
                                        <Phone size={16} />
                                        <div>
                                            <span className="field-label">Teléfono</span>
                                            <a href={`tel:${owner.phone}`}>{owner.phone}</a>
                                        </div>
                                    </div>
                                )}
                                {owner.dni_cuit && (
                                    <div className="profile-field">
                                        <UserCheck size={16} />
                                        <div>
                                            <span className="field-label">DNI / CUIT</span>
                                            <span>{owner.dni_cuit}</span>
                                        </div>
                                    </div>
                                )}
                                {owner.address && (
                                    <div className="profile-field">
                                        <MapPin size={16} />
                                        <div>
                                            <span className="field-label">Dirección</span>
                                            <span>{owner.address}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="profile-field">
                                    <span className="contact-icon">
                                        {owner.preferred_contact === 'whatsapp' && (
                                            <MessageSquare size={16} />
                                        )}
                                        {owner.preferred_contact === 'email' && <Mail size={16} />}
                                        {owner.preferred_contact === 'call' && <Phone size={16} />}
                                    </span>
                                    <div>
                                        <span className="field-label">Contacto preferido</span>
                                        <span>
                                            {OWNER_PREFERRED_CONTACT_LABEL[owner.preferred_contact]}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {owner.notes && (
                                <div className="profile-notes">
                                    <h4>Notas</h4>
                                    <p>{owner.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="profile-sidebar">
                            <div className="info-card">
                                <h4>Información del sistema</h4>
                                <dl>
                                    <dt>Creado</dt>
                                    <dd>{new Date(owner.created_at).toLocaleString('es-AR')}</dd>
                                    <dt>Actualizado</dt>
                                    <dd>{new Date(owner.updated_at).toLocaleString('es-AR')}</dd>
                                    <dt>Creado por</dt>
                                    <dd>{owner.created_by ?? 'Sistema'}</dd>
                                </dl>
                            </div>

                            <div className="info-card actions-card">
                                <h4>Acciones rápidas</h4>
                                <div className="quick-actions">
                                    {propertyOwners &&
                                        propertyOwners.length > 0 &&
                                        propertyOwners.map((po) => (
                                            <Link
                                                key={po.id}
                                                href={`/propiedades/${po.property_id}`}
                                                className="quick-action"
                                            >
                                                <Building2 size={16} />
                                                <span>Ver propiedad: {po.property_title}</span>
                                            </Link>
                                        ))}
                                    <Link
                                        href={`/propiedades/${propertyOwners?.[0]?.property_id}/analisis`}
                                        className="quick-action"
                                    >
                                        <AlertCircle size={16} />
                                        <span>Análisis de precio</span>
                                    </Link>
                                    <Link
                                        href={`/propiedades/${propertyOwners?.[0]?.property_id}/planes`}
                                        className="quick-action"
                                    >
                                        <FileText size={16} />
                                        <span>Planes de acción</span>
                                    </Link>
                                    <button
                                        type="button"
                                        className="quick-action"
                                        onClick={() => setShowReportGenerator(true)}
                                    >
                                        <FileText size={16} />
                                        <span>Generar reporte</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="quick-action"
                                        onClick={() => setActiveTab('communications')}
                                    >
                                        <MessageSquare size={16} />
                                        <span>Nueva comunicación</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'properties' && (
                <div className="tab-content">
                    <PropertyOwnerManager propertyId={propertyOwners?.[0]?.property_id ?? ''} />
                </div>
            )}

            {activeTab === 'analysis' && (
                <div className="tab-content">
                    {priceAnalysis ? (
                        <div className="analysis-content">
                            <PriceAnalysisGauge analysis={priceAnalysis} size={300} />
                            <div className="analysis-details">
                                <div className="detail-card">
                                    <h4>Detalles del análisis</h4>
                                    <dl>
                                        <dt>Fecha de análisis</dt>
                                        <dd>
                                            {new Date(
                                                priceAnalysis.analysis_date,
                                            ).toLocaleDateString('es-AR')}
                                        </dd>
                                        <dt>Válido hasta</dt>
                                        <dd>
                                            {priceAnalysis.valid_until
                                                ? new Date(
                                                      priceAnalysis.valid_until,
                                                  ).toLocaleDateString('es-AR')
                                                : 'Indefinido'}
                                        </dd>
                                        <dt>Analizado por</dt>
                                        <dd>{priceAnalysis.analyzed_by_name ?? 'Desconocido'}</dd>
                                        <dt>Tendencia de mercado</dt>
                                        <dd>{priceAnalysis.market_trend}</dd>
                                    </dl>
                                </div>
                                {priceAnalysis.comparable_properties.length > 0 && (
                                    <div className="detail-card">
                                        <h4>
                                            Propiedades Comparables (
                                            {priceAnalysis.comparable_properties.length})
                                        </h4>
                                        <table className="table table--compact">
                                            <thead>
                                                <tr>
                                                    <th>Dirección</th>
                                                    <th>Precio</th>
                                                    <th>m²</th>
                                                    <th>Precio/m²</th>
                                                    <th>Fuente</th>
                                                    <th>Fecha</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {priceAnalysis.comparable_properties.map(
                                                    (comp, i) => (
                                                        <tr key={i}>
                                                            <td>{comp.address}</td>
                                                            <td>
                                                                $
                                                                {comp.price.toLocaleString('es-AR')}
                                                            </td>
                                                            <td>{comp.sqm ?? '—'}</td>
                                                            <td>
                                                                {comp.sqm
                                                                    ? `$${(comp.price / comp.sqm).toLocaleString('es-AR')}`
                                                                    : '—'}
                                                            </td>
                                                            <td>{comp.source ?? '—'}</td>
                                                            <td>
                                                                {new Date(
                                                                    comp.date,
                                                                ).toLocaleDateString('es-AR')}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {priceAnalysis.recommendation && (
                                    <div className="detail-card recommendation">
                                        <h4>Recomendación</h4>
                                        <p>{priceAnalysis.recommendation}</p>
                                    </div>
                                )}
                                {priceAnalysis.notes && (
                                    <div className="detail-card">
                                        <h4>Notas</h4>
                                        <p>{priceAnalysis.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <AlertCircle size={48} className="placeholder-icon" />
                            <h3>Sin análisis de precio</h3>
                            <p>Esta propiedad no tiene un análisis de precio registrado.</p>
                            {propertyOwners && propertyOwners.length > 0 && (
                                <Link
                                    href={`/propiedades/${propertyOwners[0].property_id}/analisis`}
                                >
                                    <Button variant="primary">
                                        <Plus size={16} /> Crear análisis
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'plans' && (
                <div className="tab-content">
                    <div className="tab-header">
                        <h3>Planes de acción</h3>
                        {propertyOwners && propertyOwners.length > 0 && (
                            <Link
                                href={`/propiedades/${propertyOwners[0].property_id}/planes/nuevo`}
                            >
                                <Button variant="primary">
                                    <Plus size={16} /> Nuevo plan
                                </Button>
                            </Link>
                        )}
                    </div>
                    {actionPlans.length === 0 ? (
                        <div className="empty-state">
                            <FileText size={48} className="placeholder-icon" />
                            <h3>Sin planes de acción</h3>
                            <p>No hay planes de acción para este propietario.</p>
                        </div>
                    ) : (
                        <div className="plans-grid">
                            {actionPlans.map((plan) => (
                                <ActionPlanCard
                                    key={plan.id}
                                    plan={plan}
                                    tasks={[]} // Would need to fetch tasks separately
                                    onClick={() => setLocation(`/planes-accion/${plan.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'communications' && (
                <div className="tab-content">
                    <CommunicationTimeline
                        communications={communications}
                        onEdit={() => {
                            // TODO: Implement edit communication modal
                        }}
                        onDelete={(commId) => setDeleteCommId(commId)}
                        onResend={(commId) =>
                            handleSendCommunication(communications.find((c) => c.id === commId)!)
                        }
                    />
                    <div className="tab-footer">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => setActiveTab('communications')}
                        >
                            <Plus size={16} /> Nueva comunicación
                        </Button>
                    </div>
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="tab-content">
                    <div className="tab-header">
                        <h3>Reportes generados</h3>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => setShowReportGenerator(true)}
                        >
                            <Plus size={16} /> Generar reporte
                        </Button>
                    </div>
                    {reports.length === 0 ? (
                        <div className="empty-state">
                            <FileText size={48} className="placeholder-icon" />
                            <h3>Sin reportes</h3>
                            <p>No se han generado reportes para este propietario.</p>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => setShowReportGenerator(true)}
                            >
                                <Plus size={16} /> Generar primer reporte
                            </Button>
                        </div>
                    ) : (
                        <div className="card table-card">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Tipo</th>
                                        <th>Estado</th>
                                        <th>Generado</th>
                                        <th>Enviado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report) => (
                                        <tr key={report.id}>
                                            <td>
                                                <strong>{report.title}</strong>
                                            </td>
                                            <td>{REPORT_TYPE_LABEL[report.report_type]}</td>
                                            <td>
                                                <Badge
                                                    variant={
                                                        COMMUNICATION_STATUS_TONE[
                                                            report.status
                                                        ] as BadgeVariant
                                                    }
                                                >
                                                    {COMMUNICATION_STATUS_LABEL[report.status]}
                                                </Badge>
                                            </td>
                                            <td>
                                                {new Date(report.generated_at).toLocaleString(
                                                    'es-AR',
                                                )}
                                            </td>
                                            <td>
                                                {report.sent_at
                                                    ? new Date(report.sent_at).toLocaleString(
                                                          'es-AR',
                                                      )
                                                    : '—'}
                                            </td>
                                            <td>
                                                <div className="row-actions">
                                                    <IconButton
                                                        variant="ghost"
                                                        aria-label="Ver"
                                                        title="Ver"
                                                        onClick={() => setShowReportPreview(report)}
                                                    >
                                                        <FileText size={14} />
                                                    </IconButton>
                                                    {report.status === 'draft' && (
                                                        <IconButton
                                                            variant="ghost"
                                                            aria-label="Enviar por WhatsApp"
                                                            title="Enviar por WhatsApp"
                                                            onClick={() => handleSendReport(report)}
                                                        >
                                                            <MessageSquare size={14} />
                                                        </IconButton>
                                                    )}
                                                    <IconButton
                                                        variant="ghost"
                                                        aria-label="Descargar JSON"
                                                        title="Descargar JSON"
                                                        onClick={() => {
                                                            const blob = new Blob(
                                                                [
                                                                    JSON.stringify(
                                                                        report.content_json,
                                                                        null,
                                                                        2,
                                                                    ),
                                                                ],
                                                                { type: 'application/json' },
                                                            );
                                                            const url = URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `${report.title || 'reporte'}.json`;
                                                            a.click();
                                                            URL.revokeObjectURL(url);
                                                        }}
                                                    >
                                                        <Download size={14} />
                                                    </IconButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {showReportGenerator && (
                <OwnerReportGenerator
                    propertyId={propertyOwners?.[0]?.property_id ?? ''}
                    ownerId={ownerId!}
                    onGenerate={handleGenerateReport}
                    onCancel={() => setShowReportGenerator(false)}
                    priceAnalysis={priceAnalysis ?? null}
                    actionPlans={actionPlans}
                    communications={communications}
                />
            )}

            {showReportPreview && (
                <OwnerReportPreview
                    report={showReportPreview}
                    onClose={() => setShowReportPreview(null)}
                    onSendWhatsApp={() => handleSendReport(showReportPreview!)}
                    onDownload={() => {
                        const blob = new Blob(
                            [JSON.stringify(showReportPreview!.content_json, null, 2)],
                            { type: 'application/json' },
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${showReportPreview!.title || 'reporte'}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                />
            )}

            <ConfirmDialog
                open={confirmSoftDelete}
                title="Enviar a papelera"
                message={owner ? `¿Enviar a papelera a "${owner.full_name}"?` : ''}
                confirmLabel="Enviar"
                danger
                onConfirm={() => {
                    setConfirmSoftDelete(false);
                    void handleSoftDelete();
                }}
                onCancel={() => setConfirmSoftDelete(false)}
            />

            <ConfirmDialog
                open={deleteCommId !== null}
                title="Eliminar comunicación"
                message="¿Eliminar esta comunicación?"
                confirmLabel="Eliminar"
                danger
                onConfirm={() => {
                    // TODO: Implement delete communication
                    setDeleteCommId(null);
                }}
                onCancel={() => setDeleteCommId(null)}
            />
        </div>
    );
}
