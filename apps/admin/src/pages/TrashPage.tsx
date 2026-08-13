import { useEffect, useMemo, useState } from 'preact/hooks';
import {
    Building2,
    ClipboardList,
    type LucideIcon,
    Mail,
    RotateCcw,
    Trash2,
    UserCheck,
    UserRound,
    Users,
} from 'lucide-preact';
import {
    fetchDeletedProperties,
    permanentDeleteProperty,
    type PropertyRow,
    restoreProperty,
} from '../lib/properties';
import { fetchDeletedLeads, type LeadRow, permanentDeleteLead, restoreLead } from '../lib/leads';
import {
    type AgentRow,
    fetchDeletedAgents,
    permanentDeleteAgent,
    restoreAgent,
} from '../lib/agents';
import {
    fetchDeletedSubscribers,
    type NewsletterSubscriber,
    permanentDeleteSubscriber,
    restoreSubscriber,
} from '../lib/newsletter';
import {
    type ActionPlanRow,
    fetchDeletedActionPlans,
    fetchDeletedOwners,
    type OwnerRow,
    permanentDeleteActionPlan,
    permanentDeleteOwner,
    restoreActionPlan,
    restoreOwner,
} from '../lib/owners/api';
import { queryClient } from '../lib/query/client';
import { useQuery } from '../lib/query/hooks';
import { pushToast } from '../store/app';
import { ConfirmDialog } from '../components/ConfirmDialog';
import styles from './TrashPage.module.css';

type TabType = 'properties' | 'leads' | 'agents' | 'newsletter' | 'owners' | 'action_plans';

function tabToType(
    tab: TabType,
): 'property' | 'lead' | 'agent' | 'subscriber' | 'owner' | 'action_plan' {
    switch (tab) {
        case 'properties':
            return 'property';
        case 'leads':
            return 'lead';
        case 'agents':
            return 'agent';
        case 'newsletter':
            return 'subscriber';
        case 'owners':
            return 'owner';
        case 'action_plans':
            return 'action_plan';
    }
}

interface TrashRenderItem {
    id: string;
    title?: string | null;
    name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    email?: string | null;
    location?: string | null;
    status?: string | null;
    role?: string | null;
    property_count?: number | null;
    property_title?: string | null;
    source?: string | null;
    cover_url?: string | null;
    photo_url?: string | null;
    deleted_at?: string | null;
}

const TABS: { id: TabType; label: string; icon: LucideIcon; count: number }[] = [
    { id: 'properties', label: 'Propiedades', icon: Building2, count: 0 },
    { id: 'leads', label: 'Leads', icon: Users, count: 0 },
    { id: 'agents', label: 'Agentes', icon: UserRound, count: 0 },
    { id: 'newsletter', label: 'Newsletter', icon: Mail, count: 0 },
    { id: 'owners', label: 'Propietarios', icon: UserCheck, count: 0 },
    { id: 'action_plans', label: 'Planes de acción', icon: ClipboardList, count: 0 },
];

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

export function TrashPage() {
    const [activeTab, setActiveTab] = useState<TabType>('properties');
    const [deleteTarget, setDeleteTarget] = useState<{
        type: 'property' | 'lead' | 'agent' | 'subscriber' | 'owner' | 'action_plan';
        id: string;
        name: string;
    } | null>(null);

    const { data: deletedProperties, isPending: propsPending } = useQuery<PropertyRow[]>({
        queryKey: ['deleted-properties'],
        queryFn: fetchDeletedProperties,
    });

    const { data: deletedLeads, isPending: leadsPending } = useQuery<LeadRow[]>({
        queryKey: ['deleted-leads'],
        queryFn: fetchDeletedLeads,
    });

    const { data: deletedAgents, isPending: agentsPending } = useQuery<AgentRow[]>({
        queryKey: ['deleted-agents'],
        queryFn: fetchDeletedAgents,
    });

    const { data: deletedSubscribers, isPending: subsPending } = useQuery<NewsletterSubscriber[]>({
        queryKey: ['deleted-subscribers'],
        queryFn: fetchDeletedSubscribers,
    });

    const { data: deletedOwners, isPending: ownersPending } = useQuery<OwnerRow[]>({
        queryKey: ['deleted-owners'],
        queryFn: fetchDeletedOwners,
    });

    const { data: deletedActionPlans, isPending: plansPending } = useQuery<ActionPlanRow[]>({
        queryKey: ['deleted-action-plans'],
        queryFn: fetchDeletedActionPlans,
    });

    const pending =
        propsPending ||
        leadsPending ||
        agentsPending ||
        subsPending ||
        ownersPending ||
        plansPending;

    // Tab counts - always show all tabs' counts
    const tabsWithCounts = useMemo(
        () =>
            TABS.map((t) => ({
                ...t,
                count:
                    t.id === 'properties'
                        ? (deletedProperties?.length ?? 0)
                        : t.id === 'leads'
                          ? (deletedLeads?.length ?? 0)
                          : t.id === 'agents'
                            ? (deletedAgents?.length ?? 0)
                            : t.id === 'newsletter'
                              ? (deletedSubscribers?.length ?? 0)
                              : t.id === 'owners'
                                ? (deletedOwners?.length ?? 0)
                                : (deletedActionPlans?.length ?? 0),
            })),
        [
            deletedProperties,
            deletedLeads,
            deletedAgents,
            deletedSubscribers,
            deletedOwners,
            deletedActionPlans,
        ],
    );

    useEffect(() => {
        document.title = 'Papelera · BIENENHAUS';
        return () => {
            document.title = 'BIENENHAUS — Panel de Administración';
        };
    }, []);

    const invalidateAll = () => {
        // Invalidate trash queries
        void queryClient.invalidateQueries({ queryKey: ['deleted-properties'] });
        void queryClient.invalidateQueries({ queryKey: ['deleted-leads'] });
        void queryClient.invalidateQueries({ queryKey: ['deleted-agents'] });
        void queryClient.invalidateQueries({ queryKey: ['deleted-subscribers'] });
        void queryClient.invalidateQueries({ queryKey: ['deleted-owners'] });
        void queryClient.invalidateQueries({ queryKey: ['deleted-action-plans'] });
        // Also invalidate main list queries so they refresh immediately
        void queryClient.invalidateQueries({ queryKey: ['properties'] });
        void queryClient.invalidateQueries({ queryKey: ['leads'] });
        void queryClient.invalidateQueries({ queryKey: ['agents-full'] });
        void queryClient.invalidateQueries({ queryKey: ['agents'] });
        void queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
        void queryClient.invalidateQueries({ queryKey: ['owners'] });
        void queryClient.invalidateQueries({ queryKey: ['action-plans'] });
    };

    const handleRestore = async (
        type: 'property' | 'lead' | 'agent' | 'subscriber' | 'owner' | 'action_plan',
        id: string,
        name: string,
    ) => {
        try {
            if (type === 'property') await restoreProperty(id);
            else if (type === 'lead') await restoreLead(id);
            else if (type === 'agent') await restoreAgent(id);
            else if (type === 'subscriber') await restoreSubscriber(id);
            else if (type === 'owner') await restoreOwner(id);
            else await restoreActionPlan(id);

            pushToast({ type: 'success', title: 'Restaurado', description: name });
            invalidateAll();
        } catch {
            pushToast({ type: 'error', title: 'No se pudo restaurar' });
        }
    };

    const handlePermanentDelete = async (
        type: 'property' | 'lead' | 'agent' | 'subscriber' | 'owner' | 'action_plan',
        id: string,
        name: string,
    ) => {
        try {
            if (type === 'property') await permanentDeleteProperty(id);
            else if (type === 'lead') await permanentDeleteLead(id);
            else if (type === 'agent') await permanentDeleteAgent(id);
            else if (type === 'subscriber') await permanentDeleteSubscriber(id);
            else if (type === 'owner') await permanentDeleteOwner(id);
            else await permanentDeleteActionPlan(id);

            pushToast({ type: 'success', title: 'Eliminado permanentemente', description: name });
            invalidateAll();
        } catch {
            pushToast({ type: 'error', title: 'No se pudo eliminar' });
        }
    };

    const renderRow = (
        item: TrashRenderItem,
        type: 'property' | 'lead' | 'agent' | 'subscriber' | 'owner' | 'action_plan',
    ) => {
        const name =
            type === 'property'
                ? item.title
                : type === 'lead'
                  ? `${item.name} ${item.last_name}`
                  : type === 'agent'
                    ? item.name
                    : type === 'owner'
                      ? item.full_name
                      : type === 'action_plan'
                        ? item.title
                        : item.email;

        const meta =
            type === 'property'
                ? `${item.location} · ${item.status}`
                : type === 'lead'
                  ? `${item.email} · ${item.status}`
                  : type === 'agent'
                    ? `${item.email} · ${item.role ?? 'Asesor'}`
                    : type === 'owner'
                      ? `${item.property_count} propiedades`
                      : type === 'action_plan'
                        ? `${item.property_title ?? '—'} · ${item.status}`
                        : `${item.source} · ${item.status}`;

        return (
            <tr key={item.id}>
                <td>
                    <div className="cell-property">
                        {type === 'property' && item.cover_url ? (
                            <img src={item.cover_url} alt="" loading="lazy" />
                        ) : type === 'agent' && item.photo_url ? (
                            <img src={item.photo_url} alt="" loading="lazy" />
                        ) : type === 'owner' ? (
                            <span className="cell-thumb" aria-hidden="true">
                                {(item.full_name ?? '').charAt(0).toUpperCase()}
                            </span>
                        ) : type === 'action_plan' ? (
                            <span className="cell-thumb" aria-hidden="true">
                                {(item.title ?? '').charAt(0).toUpperCase()}
                            </span>
                        ) : (
                            <span className="cell-thumb" aria-hidden="true">
                                {((name ?? '')[0] ?? '?').toUpperCase()}
                            </span>
                        )}
                        <div>
                            <strong>{name}</strong>
                            <span className="muted">{meta}</span>
                        </div>
                    </div>
                </td>
                <td className="muted">{formatDate(item.deleted_at ?? '')}</td>
                <td>
                    <div className="row-actions">
                        <button
                            className="icon-btn"
                            title="Restaurar"
                            onClick={() => handleRestore(type, item.id, name ?? '')}
                        >
                            <RotateCcw size={14} />
                        </button>
                        <button
                            className="icon-btn icon-btn--danger"
                            title="Eliminar permanentemente"
                            onClick={() => setDeleteTarget({ type, id: item.id, name: name ?? '' })}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </td>
            </tr>
        );
    };

    const getItems = () => {
        switch (activeTab) {
            case 'properties':
                return deletedProperties ?? [];
            case 'leads':
                return deletedLeads ?? [];
            case 'agents':
                return deletedAgents ?? [];
            case 'newsletter':
                return deletedSubscribers ?? [];
            case 'owners':
                return deletedOwners ?? [];
            default:
                return deletedActionPlans ?? [];
        }
    };

    const items = getItems();
    const totalCount = items.length;

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h2 className="page-title">Papelera</h2>
                    <p className="page-subtitle">
                        Elementos eliminados — {totalCount} elemento{totalCount === 1 ? '' : 's'}
                        {totalCount > 0 && (
                            <span className="muted"> · Restaurar o eliminar permanentemente</span>
                        )}
                    </p>
                </div>
                {totalCount > 0 && (
                    <button
                        className="btn btn--ghost"
                        onClick={() =>
                            items.forEach((i) => handleRestore(tabToType(activeTab), i.id, ''))
                        }
                        disabled={pending}
                    >
                        <RotateCcw size={16} /> Restaurar todos
                    </button>
                )}
            </div>

            <div className={styles['trash-tabs']} role="tablist">
                {tabsWithCounts.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={`${styles['trash-tab']}${activeTab === tab.id ? ' active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        disabled={pending}
                    >
                        <tab.icon size={16} />
                        <span>{tab.label}</span>
                        <span className="tab-count">{activeTab === tab.id ? items.length : 0}</span>
                    </button>
                ))}
            </div>

            {pending && <div className="card placeholder-card">Cargando papelera…</div>}

            {!pending && items.length === 0 && (
                <div className="card placeholder-card">
                    <Trash2 size={48} className="placeholder-icon" />
                    <h3>La papelera está vacía</h3>
                    <p>No hay elementos eliminados en esta sección.</p>
                </div>
            )}

            {!pending && items.length > 0 && (
                <div className="card table-card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Elemento</th>
                                <th>Eliminado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>{items.map((item) => renderRow(item, tabToType(activeTab)))}</tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Eliminar permanentemente"
                message={
                    deleteTarget
                        ? `¿Eliminar permanentemente "${deleteTarget.name}"? Esta acción no se puede deshacer.`
                        : ''
                }
                confirmLabel="Eliminar"
                danger
                onConfirm={() => {
                    if (!deleteTarget) return;
                    const { type, id, name } = deleteTarget;
                    setDeleteTarget(null);
                    void handlePermanentDelete(type, id, name);
                }}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
