import { useEffect, useMemo, useState } from 'preact/hooks';
import { Download, Plus, RefreshCw, Search, Send, Trash2 } from 'lucide-preact';
import { Link, useLocation } from 'wouter-preact';
import { Badge , type BadgeVariant, Button  } from '@bienenhaus/ui';
import {
    type MlMetaRow,
    type PropertyRow,
    type PropertyStatus,
    STATUS_LABEL,
    STATUS_TONE,
    useProperties,
} from '../lib/properties.api';
import { ML_SYNC_STATUS_LABEL, ML_SYNC_STATUS_TONE } from '../lib/ml';
import { useMlMeta } from '../lib/ml.api';
import { useAgents } from '../lib/agents.api';
import { fetchPropertiesForAgent } from '../lib/agentPropertyAssignments';
import { bulkEnqueueMl } from '../lib/ml';
import { queryClient } from '../lib/query/client';
import { pushToast } from '../store/app';
import { downloadCsv, getListData, toCsv, todayStamp } from '../lib/utils';
import styles from '../styles/PropertiesPage.module.css';


function StatusBadge({ status }: { status: PropertyStatus }) {
    return <Badge variant={STATUS_TONE[status] as BadgeVariant} size="sm">{STATUS_LABEL[status]}</Badge>;
}

function formatPrice(row: PropertyRow): string {
    if (row.price === null) return '—';
    return `${row.currency} ${row.price.toLocaleString('es-AR')}`;
}

export function PropertiesPage() {
    const [, setLocation] = useLocation();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'todos' | PropertyStatus>('todos');
    const [agentFilter, setAgentFilter] = useState<string>('todos');
    const [assignedPropIds, setAssignedPropIds] = useState<Set<string> | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkBusy, setBulkBusy] = useState<'publish' | 'update' | 'delete' | null>(null);

    const { data, isPending, isError } = useProperties({
        search,
        status: statusFilter === 'todos' ? undefined : statusFilter,
    });
const properties = getListData<PropertyRow>(data);

    const { data: mlMetaRaw } = useMlMeta();
    const mlMeta: MlMetaRow[] = getListData<MlMetaRow>(mlMetaRaw);
    const mlMetaByProp = useMemo(() => new Map(mlMeta.map((m: MlMetaRow) => [m.property_id, m])), [mlMeta]);

    const { data: agentsData } = useAgents({ is_active: true, pageSize: 100 });
    const agents = getListData<{ id: string; name: string }>(agentsData);

    // Fetch assigned property IDs when agent filter is active
    useEffect(() => {
        if (agentFilter === 'todos') {
            setAssignedPropIds(null);
            return;
        }
        let cancelled = false;
        fetchPropertiesForAgent(agentFilter)
            .then((rows) => {
                if (!cancelled) setAssignedPropIds(new Set(rows.map((r) => r.property_id)));
            })
            .catch(() => {
                if (!cancelled) setAssignedPropIds(new Set());
            });
        return () => {
            cancelled = true;
        };
    }, [agentFilter]);

    useEffect(() => {
        document.title = 'Propiedades · BIENENHAUS';
        return () => {
            document.title = 'BIENENHAUS — Panel de Administración';
        };
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return properties.filter((p) => {
            const matchesSearch =
                q === '' ||
                p.title.toLowerCase().includes(q) ||
                p.location.toLowerCase().includes(q);
            const matchesStatus = statusFilter === 'todos' || p.status === statusFilter;
            const matchesAgent = agentFilter === 'todos' || assignedPropIds?.has(p.id) === true;
            return matchesSearch && matchesStatus && matchesAgent;
        });
    }, [properties, search, statusFilter, agentFilter, assignedPropIds]);

    const allSelected =
        filtered.length > 0 && filtered.every((p) => selected.has(p.id));

    const toggleAll = () => {
        setSelected(allSelected ? new Set() : new Set(filtered.map((p) => p.id)));
    };

    const toggleOne = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleBulkMl = async (operation: 'publish' | 'update' | 'delete') => {
        const ids = [...selected];
        if (ids.length === 0 || bulkBusy) return;
        setBulkBusy(operation);
        try {
            const { enqueued, skipped } = await bulkEnqueueMl(ids, operation);
            pushToast({
                type: enqueued > 0 ? 'success' : 'info',
                title: 'Mercado Libre',
                description:
                    enqueued > 0
                        ? `${enqueued} propiedad${enqueued === 1 ? '' : 'es'} encolada${enqueued === 1 ? '' : 's'} para ${operation === 'publish' ? 'publicar' : operation === 'update' ? 'actualizar' : 'eliminar'}.${skipped > 0 ? ` ${skipped} omitida${skipped === 1 ? '' : 's'} (ya en cola).` : ''}`
                        : 'No se pudo encolar. Verificá la conexión con Mercado Libre.',
            });
            if (enqueued > 0) {
                setSelected(new Set());
                await queryClient.invalidateQueries({ queryKey: ['ml-queue'] });
                await queryClient.invalidateQueries({ queryKey: ['ml-queue-infinite'] });
            }
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'Mercado Libre',
                description: err instanceof Error ? err.message : 'Error desconocido',
            });
        } finally {
            setBulkBusy(null);
        }
    };

    const handleExport = () => {
        if (properties.length === 0) return;

        const header = [
            'Título',
            'Código',
            'Estado',
            'Operación',
            'Precio',
            'Moneda',
            'Zona',
            'Sup. Total',
            'Dorm.',
            'Baños',
            'Destacada',
            'Actualizada',
            'En ML',
            'Item ML',
            'Estado ML',
            'Precio ML',
            'Última Sync',
            'Link ML',
        ];
        const rows = properties.map((p) => {
            const meta = mlMetaByProp.get(p.id);
            return [
                p.title,
                p.code,
                STATUS_LABEL[p.status],
                p.listing_type,
                p.price ?? '',
                p.currency,
                p.location,
                p.area_total ?? '',
                p.bedrooms ?? '',
                p.bathrooms ?? '',
                p.featured ? 'Sí' : 'No',
                new Date(p.updated_at).toLocaleDateString('es-AR'),
                meta ? 'Sí' : 'No',
                meta?.ml_item_id ?? '',
                meta?.status ?? '',
                meta?.price ?? '',
                meta?.last_sync_at ? new Date(meta.last_sync_at).toLocaleDateString('es-AR') : '',
                meta?.permalink ?? '',
            ];
        });
        downloadCsv(`propiedades-${todayStamp()}.csv`, toCsv(header, rows));
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHead}>
                <div>
                    <h2 className={styles.pageTitle}>Propiedades</h2>
                    <p className={styles.pageSubtitle}>
                        Gestioná el catálogo completo de tu inmobiliaria.
                    </p>
                </div>

                <div className={styles.pageHeadActions}>
                    <Button
                        variant="secondary"
                        size="md"
                        iconLeft={<Download size={15} />}
                        onClick={handleExport}
                        disabled={properties.length === 0}
                    >
                        Exportar CSV
                    </Button>
                    <Link href="/propiedades/nueva">
                        <Button variant="primary" size="md" iconLeft={<Plus size={16} />}>
                            Nueva propiedad
                        </Button>
                    </Link>
                </div>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.toolbarSearch}>
                    <Search size={15} />
                    <input
                        type="text"
                        placeholder="Buscar por título o zona…"
                        value={search}
                        onInput={(e) => setSearch((e.currentTarget as HTMLInputElement).value)}
                    />
                </div>
                <select
                    className={styles.select}
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(
                            (e.currentTarget as HTMLSelectElement).value as
                                'todos' | PropertyStatus,
                        )
                    }
                >
                    <option value="todos">Todos los estados</option>
                    {(Object.keys(STATUS_LABEL) as PropertyStatus[]).map((s) => (
                        <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                        </option>
                    ))}
                </select>
                <select
                    className={styles.select}
                    value={agentFilter}
                    onChange={(e) => setAgentFilter((e.currentTarget as HTMLSelectElement).value)}
                >
                    <option value="todos">Todos los agentes</option>
                    <option value="mis-propiedades">Mis propiedades</option>
                    {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name}
                        </option>
                    ))}
                </select>
            </div>

            {selected.size > 0 && (
                <div className={styles.bulkBar}>
                    <span className={styles.bulkCount}>
                        {selected.size} seleccionada{selected.size === 1 ? '' : 's'}
                    </span>
                    <Button
                        variant="secondary"
                        size="sm"
                        iconLeft={<Send size={14} />}
                        disabled={bulkBusy !== null}
                        onClick={() => handleBulkMl('publish')}
                    >
                        Publicar en ML
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        iconLeft={<RefreshCw size={14} />}
                        disabled={bulkBusy !== null}
                        onClick={() => handleBulkMl('update')}
                    >
                        Actualizar en ML
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        iconLeft={<Trash2 size={14} />}
                        disabled={bulkBusy !== null}
                        onClick={() => handleBulkMl('delete')}
                    >
                        Eliminar en ML
                    </Button>
                    <button
                        type="button"
                        className={styles.bulkClear}
                        onClick={() => setSelected(new Set())}
                        disabled={bulkBusy !== null}
                    >
                        Limpiar
                    </button>
                </div>
            )}

            {isPending && (
                <div className={styles.cardPlaceholder}>
                    Cargando propiedades…
                </div>
            )}

            {isError && (
                <div className={styles.cardPlaceholder}>
                    No se pudieron cargar las propiedades.
                </div>
            )}

            {!isPending && !isError && (
                <div className={styles.cardTable}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th className={styles.checkCell}>
                                    <input
                                        type="checkbox"
                                        aria-label="Seleccionar todas las propiedades"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th>Propiedad</th>
                                <th>Estado</th>
                                <th>Operación</th>
                                <th>Precio</th>
                                <th>Zona</th>
                                <th>Dorm.</th>
                                <th>Actualizada</th>
                                <th>ML</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => {
                                return (
                                    <tr
                                        key={p.id}
                                        className={styles.rowClick}
                                        onClick={(e) => {
                                            if (
                                                (e.target as HTMLElement).closest(
                                                    'input,button,a',
                                                )
                                            ) {
                                                return;
                                            }
                                            setLocation(`/propiedades/${p.id}`);
                                        }}
                                    >
                                        <td className={styles.checkCell}>
                                            <input
                                                type="checkbox"
                                                aria-label={`Seleccionar ${p.title}`}
                                                checked={selected.has(p.id)}
                                                onChange={() => toggleOne(p.id)}
                                            />
                                        </td>                                        <td>
                                            <div className={styles.cellProperty}>
                                                {p.cover_url ? (
                                                    <img
                                                        src={p.cover_url}
                                                        alt={p.title || 'Portada de propiedad'}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <span
                                                        className={styles.cellThumb}
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                <div>
                                                    <strong>{p.title}</strong>
                                                    <span className={styles.muted}>
                                                        #{String(p.code).padStart(4, '0')}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge status={p.status} />
                                        </td>
                                        <td className={styles.cap}>
                                            {p.listing_type}
                                        </td>
                                        <td className={styles.num}>
                                            {formatPrice(p)}
                                        </td>
                                        <td>{p.location}</td>
                                        <td className={styles.num}>
                                            {p.bedrooms ?? '—'}
                                        </td>
<td className={styles.muted}>
                                             {new Date(p.updated_at).toLocaleDateString(
                                                 'es-AR',
                                             )}
                                         </td>
                                         <td>
                                             {(() => {
                                                 const meta = mlMetaByProp.get(p.id);
                                                 if (!meta || !meta.status) return <span className={styles.muted}>—</span>;
                                                 return (
                                                     <Badge
                                                         variant={ML_SYNC_STATUS_TONE[meta.status as keyof typeof ML_SYNC_STATUS_TONE] as import('@bienenhaus/ui').BadgeVariant}
                                                         size="sm"
                                                     >
                                                         {ML_SYNC_STATUS_LABEL[meta.status as keyof typeof ML_SYNC_STATUS_LABEL] || meta.status}
                                                     </Badge>
                                                 );
                                             })()}
                                         </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={9} className={styles.emptyCell}>
                                        No hay propiedades que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}