import { useMemo, useState } from 'preact/hooks';
import { Building2, Download, Filter, Plus, Search, Trash2, User, X } from 'lucide-preact';
import { Link, useLocation } from 'wouter-preact';
import { useQueryClient } from '@tanstack/react-query';
import {
    ownersKeys,
    useDeletedOwners,
    useOwners,
    usePermanentDeleteOwner,
    useRestoreOwner,
    useSoftDeleteOwner,
} from '@lib/owners/api';
import { pushToast } from '@store/app';
import { OwnerCard } from '@components/owners';
import type { OwnerPreferredContact, OwnerRow, OwnerType } from '@/types/owners';
import { OWNER_PREFERRED_CONTACT_LABEL, OWNER_TYPE_LABEL } from '@/types/owners';

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-AR');
}

function getListData<T>(data: unknown): T[] {
    if (!data) return [];
    if (Array.isArray(data)) return data as T[];
    if (typeof data === 'object' && data !== null && 'data' in data) {
        return (data as { data: T[] }).data ?? [];
    }
    return [];
}

function todayStamp(): string {
    return new Date().toISOString().split('T')[0];
}

function toCsv(header: string[], rows: (string | number)[][]): string {
    const escape = (v: string | number) => {
        const s = String(v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };
    return [header.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}

function downloadCsv(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

export function OwnersPage() {
    const [, setLocation] = useLocation();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'todos' | OwnerType>('todos');
    const [contactFilter, setContactFilter] = useState<'todos' | OwnerPreferredContact>('todos');
    const [hasPropertiesFilter, setHasPropertiesFilter] = useState<'todos' | 'si' | 'no'>('todos');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showTrash, setShowTrash] = useState(false);

    const queryClient = useQueryClient();

    const { data, isPending, isError } = useOwners({
        search: search || undefined,
        owner_type: typeFilter === 'todos' ? undefined : typeFilter,
        preferred_contact: contactFilter === 'todos' ? undefined : contactFilter,
        has_properties: hasPropertiesFilter === 'todos' ? undefined : hasPropertiesFilter === 'si',
        page: 1,
        pageSize: 100,
    });

    const owners = getListData<OwnerRow>(data);

    const { data: deletedOwnersRaw, isPending: deletedPending } = useDeletedOwners();
    const deletedOwners = getListData<OwnerRow>(deletedOwnersRaw);

    const softDeleteOwner = useSoftDeleteOwner();
    const restoreOwner = useRestoreOwner();
    const permanentDeleteOwner = usePermanentDeleteOwner();

    const handleExport = () => {
        if (owners.length === 0) return;

        const header = [
            'Nombre',
            'Tipo',
            'Email',
            'Teléfono',
            'DNI/CUIT',
            'Dirección',
            'Contacto preferido',
            'Propiedades',
            'Creado',
            'Actualizado',
        ];
        const rows = owners.map((o) => [
            o.full_name,
            OWNER_TYPE_LABEL[o.owner_type],
            o.email ?? '',
            o.phone ?? '',
            o.dni_cuit ?? '',
            o.address ?? '',
            OWNER_PREFERRED_CONTACT_LABEL[o.preferred_contact],
            o.property_count,
            formatDate(o.created_at),
            formatDate(o.updated_at),
        ]);
        downloadCsv(`propietarios-${todayStamp()}.csv`, toCsv(header, rows));
    };

    const invalidateOwners = () => {
        queryClient.invalidateQueries({ queryKey: ownersKeys.lists() });
        queryClient.invalidateQueries({ queryKey: ownersKeys.deleted() });
    };

    const handleSoftDelete = async (id: string, name: string) => {
        if (!window.confirm(`¿Enviar a papelera a "${name}"?`)) return;
        try {
            await softDeleteOwner.mutateAsync(id);
            pushToast({ type: 'success', title: 'Enviado a papelera', description: name });
            invalidateOwners();
        } catch {
            pushToast({ type: 'error', title: 'No se pudo eliminar' });
        }
    };

    const handleRestore = async (id: string, name: string) => {
        try {
            await restoreOwner.mutateAsync(id);
            pushToast({ type: 'success', title: 'Restaurado', description: name });
            invalidateOwners();
        } catch {
            pushToast({ type: 'error', title: 'No se pudo restaurar' });
        }
    };

    const handlePermanentDelete = async (id: string, name: string) => {
        if (
            !window.confirm(
                `¿Eliminar permanentemente "${name}"? Esta acción no se puede deshacer.`,
            )
        )
            return;
        try {
            await permanentDeleteOwner.mutateAsync(id);
            pushToast({ type: 'success', title: 'Eliminado permanentemente', description: name });
            invalidateOwners();
        } catch {
            pushToast({ type: 'error', title: 'No se pudo eliminar' });
        }
    };

    const someSelected = selectedIds.size > 0;

    const clearSelection = () => setSelectedIds(new Set());

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return owners.filter((o) => {
            const matchesSearch =
                q === '' ||
                o.full_name.toLowerCase().includes(q) ||
                o.email?.toLowerCase().includes(q) ||
                o.phone?.includes(q) ||
                o.dni_cuit?.toLowerCase().includes(q);
            return matchesSearch;
        });
    }, [owners, search]);

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h2 className="page-title">Propietarios</h2>
                    <p className="page-subtitle">
                        Gestioná la cartera de propietarios de la inmobiliaria.
                    </p>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                    {!showTrash && (
                        <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={handleExport}
                            disabled={owners.length === 0}
                        >
                            <Download size={15} /> Exportar CSV
                        </button>
                    )}
                    <Link href="/propietarios/nuevo" className="btn btn--primary">
                        <Plus size={16} /> Nuevo propietario
                    </Link>
                    <button
                        type="button"
                        className={`btn${showTrash ? ' btn--primary' : ' btn--ghost'}`}
                        onClick={() => setShowTrash(!showTrash)}
                    >
                        <Trash2 size={15} /> {showTrash ? 'Ver activos' : 'Papelera'}
                    </button>
                </div>
            </div>

            {someSelected && !showTrash && (
                <div className="bulk-bar">
                    <div className="bulk-info">
                        <span>
                            {selectedIds.size} seleccionada{selectedIds.size === 1 ? '' : 's'}
                        </span>
                        <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={clearSelection}
                        >
                            <X size={14} /> Limpiar
                        </button>
                    </div>
                    <div className="bulk-actions">
                        <button
                            type="button"
                            className="btn btn--danger btn--sm"
                            onClick={() => {
                                if (
                                    window.confirm(
                                        `¿Enviar a papelera ${selectedIds.size} propietario${selectedIds.size === 1 ? '' : 's'}?`,
                                    )
                                ) {
                                    selectedIds.forEach((id) => {
                                        const owner = owners.find((o) => o.id === id);
                                        if (owner) handleSoftDelete(id, owner.full_name);
                                    });
                                    clearSelection();
                                }
                            }}
                        >
                            <Trash2 size={14} /> A papelera
                        </button>
                    </div>
                </div>
            )}

            <div className="toolbar">
                <div className="toolbar-search">
                    <Search size={15} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email, teléfono, DNI..."
                        value={search}
                        onInput={(e) => setSearch((e.currentTarget as HTMLInputElement).value)}
                    />
                </div>

                <button
                    type="button"
                    className={`btn btn--ghost${showFilters ? ' active' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter size={15} /> Filtros
                </button>
            </div>

            {showFilters && (
                <div className="filters-panel">
                    <div className="filter-row">
                        <div className="filter-group">
                            <label>Tipo</label>
                            <select
                                className="select"
                                value={typeFilter}
                                onChange={(e) =>
                                    setTypeFilter(
                                        (e.currentTarget as HTMLSelectElement).value as
                                            'todos' | OwnerType,
                                    )
                                }
                            >
                                <option value="todos">Todos</option>
                                <option value="persona_fisica">
                                    {OWNER_TYPE_LABEL.persona_fisica}
                                </option>
                                <option value="persona_juridica">
                                    {OWNER_TYPE_LABEL.persona_juridica}
                                </option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Contacto preferido</label>
                            <select
                                className="select"
                                value={contactFilter}
                                onChange={(e) =>
                                    setContactFilter(
                                        (e.currentTarget as HTMLSelectElement).value as
                                            'todos' | OwnerPreferredContact,
                                    )
                                }
                            >
                                <option value="todos">Todos</option>
                                <option value="whatsapp">
                                    {OWNER_PREFERRED_CONTACT_LABEL.whatsapp}
                                </option>
                                <option value="email">{OWNER_PREFERRED_CONTACT_LABEL.email}</option>
                                <option value="call">{OWNER_PREFERRED_CONTACT_LABEL.call}</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Propiedades</label>
                            <select
                                className="select"
                                value={hasPropertiesFilter}
                                onChange={(e) =>
                                    setHasPropertiesFilter(
                                        (e.currentTarget as HTMLSelectElement).value as
                                            'todos' | 'si' | 'no',
                                    )
                                }
                            >
                                <option value="todos">Todas</option>
                                <option value="si">Con propiedades</option>
                                <option value="no">Sin propiedades</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {(isPending || deletedPending) && (
                <div className="card placeholder-card">Cargando propietarios…</div>
            )}
            {isError && (
                <div className="card placeholder-card">No se pudieron cargar los propietarios.</div>
            )}

            {!showTrash && !isPending && !isError && (
                <>
                    {filtered.length === 0 && (
                        <div className="card placeholder-card">
                            <User size={48} className="placeholder-icon" />
                            <h3>No hay propietarios</h3>
                            <p>
                                {search
                                    ? 'No se encontraron coincidencias.'
                                    : 'Comenzá agregando el primer propietario.'}
                            </p>
                            <Link href="/propietarios/nuevo" className="btn btn--primary">
                                <Plus size={16} /> Nuevo propietario
                            </Link>
                        </div>
                    )}

                    {filtered.length > 0 && (
                        <div className="owners-grid">
                            {filtered.map((owner) => (
                                <OwnerCard
                                    key={owner.id}
                                    owner={owner}
                                    onClick={() => setLocation(`/propietarios/${owner.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {showTrash && !deletedPending && (
                <>
                    {deletedOwners.length === 0 && (
                        <div className="card placeholder-card">
                            <Trash2 size={48} className="placeholder-icon" />
                            <h3>La papelera está vacía</h3>
                            <p>No hay propietarios eliminados.</p>
                        </div>
                    )}

                    {deletedOwners.length > 0 && (
                        <div className="card table-card">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Propietario</th>
                                        <th>Tipo</th>
                                        <th>Eliminado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deletedOwners.map((owner) => (
                                        <tr key={owner.id}>
                                            <td>
                                                <div className="cell-property">
                                                    <span className="cell-thumb" aria-hidden="true">
                                                        {owner.full_name.charAt(0).toUpperCase()}
                                                    </span>
                                                    <div>
                                                        <strong>{owner.full_name}</strong>
                                                        <span className="muted">
                                                            {OWNER_TYPE_LABEL[owner.owner_type]}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge badge--${owner.owner_type === 'persona_juridica' ? 'info' : 'neutral'}`}
                                                >
                                                    {OWNER_TYPE_LABEL[owner.owner_type]}
                                                </span>
                                            </td>
                                            <td className="muted">
                                                {formatDate(owner.deleted_at ?? '')}
                                            </td>
                                            <td>
                                                <div className="row-actions">
                                                    <button
                                                        className="icon-btn"
                                                        title="Restaurar"
                                                        onClick={() =>
                                                            handleRestore(owner.id, owner.full_name)
                                                        }
                                                    >
                                                        <Building2 size={14} />
                                                    </button>
                                                    <button
                                                        className="icon-btn icon-btn--danger"
                                                        title="Eliminar permanentemente"
                                                        onClick={() =>
                                                            handlePermanentDelete(
                                                                owner.id,
                                                                owner.full_name,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
