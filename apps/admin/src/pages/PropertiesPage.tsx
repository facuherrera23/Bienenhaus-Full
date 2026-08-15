import { useEffect, useMemo, useState } from 'preact/hooks';
import { Download, Plus, Search } from 'lucide-preact';
import { Link, useLocation } from 'wouter-preact';
import { Badge , type BadgeVariant, Button  } from '@bienenhaus/ui';
import {
    type MlMetaRow,
    type PropertyRow,
    type PropertyStatus,
    STATUS_LABEL,
    STATUS_TONE,
    useMLMeta,
    useProperties,
} from '../lib/properties.api';
import { downloadCsv, getListData as getListDataUtil, toCsv, todayStamp } from '../lib/utils';
import styles from '../styles/PropertiesPage.module.css';


function StatusBadge({ status }: { status: PropertyStatus }) {
    return <Badge variant={STATUS_TONE[status] as BadgeVariant} size="sm">{STATUS_LABEL[status]}</Badge>;
}

function formatPrice(row: PropertyRow): string {
    if (row.price === null) return '—';
    return `${row.currency} ${row.price.toLocaleString('es-AR')}`;
}

function getListData<T>(data: unknown): T[] {
    if (!data) return [];
    if (Array.isArray(data)) return data as T[];
    if (typeof data === 'object' && data !== null && 'data' in data) {
        return (data as { data: T[] }).data ?? [];
    }
    return [];
}

export function PropertiesPage() {
    const [, setLocation] = useLocation();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'todos' | PropertyStatus>('todos');

    const { data, isPending, isError } = useProperties({
        search,
        status: statusFilter === 'todos' ? undefined : statusFilter,
    });
    const properties = getListDataUtil<PropertyRow>(data);

    const { data: mlMetaRaw } = useMLMeta();

    const mlMeta = getListData<MlMetaRow>(mlMetaRaw);

    const metaByProp = useMemo(() => new Map(mlMeta.map((m) => [m.property_id, m])), [mlMeta]);

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
            return matchesSearch && matchesStatus;
        });
    }, [properties, search, statusFilter]);

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
            const meta = metaByProp.get(p.id);
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
            </div>

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
                                <th>Propiedad</th>
                                <th>Estado</th>
                                <th>Operación</th>
                                <th>Precio</th>
                                <th>Zona</th>
                                <th>Dorm.</th>
                                <th>Actualizada</th>
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
                                        <td>
                                            <div className={styles.cellProperty}>
                                                {p.cover_url ? (
                                                    <img
                                                        src={p.cover_url}
                                                        alt=""
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
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className={styles.emptyCell}>
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