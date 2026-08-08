import { useState } from 'preact/hooks';
import { Check, Plus, Search, Trash2, X } from 'lucide-preact';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    type PropertyOwnerLinkFormValues,
    propertyOwnerLinkSchema,
} from '../../lib/owners/schemas';
import {
    fetchOwners,
    fetchPropertyOwners,
    linkOwnerToProperty,
    setPrimaryContact,
    unlinkOwnerFromProperty,
    updatePropertyOwnerLink,
} from '../../lib/owners/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface PropertyOwnerManagerProps {
    propertyId: string;
    onOwnersChange?: () => void;
}

export function PropertyOwnerManager({ propertyId, onOwnersChange }: PropertyOwnerManagerProps) {
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: linkedOwners, isLoading: loadingLinked } = useQuery({
        queryKey: ['property-owners', propertyId],
        queryFn: () => fetchPropertyOwners(propertyId),
    });

    const { data: allOwners, isLoading: loadingOwners } = useQuery({
        queryKey: ['owners', 'search', search],
        queryFn: () => fetchOwners(search),
        enabled: search.length >= 2,
    });

    const linkMutation = useMutation({
        mutationFn: (link: PropertyOwnerLinkFormValues) => linkOwnerToProperty(link),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['property-owners', propertyId] });
            queryClient.invalidateQueries({ queryKey: ['owners'] });
            setShowAddModal(false);
            setSearch('');
            onOwnersChange?.();
        },
    });

    const unlinkMutation = useMutation({
        mutationFn: ({ ownerId }: { ownerId: string }) =>
            unlinkOwnerFromProperty(propertyId, ownerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['property-owners', propertyId] });
            queryClient.invalidateQueries({ queryKey: ['owners'] });
            onOwnersChange?.();
        },
    });

    const updateLinkMutation = useMutation({
        mutationFn: ({
            ownerId,
            updates,
        }: {
            ownerId: string;
            updates: Partial<PropertyOwnerLinkFormValues>;
        }) => updatePropertyOwnerLink(propertyId, ownerId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['property-owners', propertyId] });
        },
    });

    const setPrimaryMutation = useMutation({
        mutationFn: (ownerId: string) => setPrimaryContact(propertyId, ownerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['property-owners', propertyId] });
        },
    });

    const methods = useForm<PropertyOwnerLinkFormValues>({
        resolver: zodResolver(propertyOwnerLinkSchema),
        defaultValues: {
            property_id: propertyId,
            owner_id: '',
            ownership_percentage: 100,
            is_primary_contact: false,
            role: 'propietario',
        },
    });

    const handleSubmit = async (data: PropertyOwnerLinkFormValues) => {
        await linkMutation.mutateAsync(data);
        methods.reset({
            property_id: propertyId,
            owner_id: '',
            ownership_percentage: 100,
            is_primary_contact: false,
            role: 'propietario',
        });
    };

    const filteredOwners =
        allOwners?.filter((o) => !linkedOwners?.some((lo) => lo.owner_id === o.id)) ?? [];

    if (loadingLinked) {
        return <div className="loading">Cargando propietarios...</div>;
    }

    return (
        <div className="property-owner-manager">
            <div className="manager-header">
                <h3>Propietarios de esta propiedad</h3>
                <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => setShowAddModal(true)}
                    disabled={linkMutation.isPending}
                >
                    <Plus size={14} /> Agregar propietario
                </button>
            </div>

            {linkedOwners && linkedOwners.length > 0 && (
                <div className="linked-owners">
                    <table className="table table--compact">
                        <thead>
                            <tr>
                                <th>Propietario</th>
                                <th>%</th>
                                <th>Rol</th>
                                <th>Contacto principal</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {linkedOwners.map((owner) => (
                                <tr key={owner.id}>
                                    <td>
                                        <div className="owner-cell">
                                            <span className="owner-avatar-sm">
                                                {owner.owner_name?.charAt(0).toUpperCase()}
                                            </span>
                                            <span>{owner.owner_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0.01"
                                            max="100"
                                            step="0.01"
                                            value={owner.ownership_percentage}
                                            onChange={(e) =>
                                                updateLinkMutation.mutate({
                                                    ownerId: owner.owner_id,
                                                    updates: {
                                                        ownership_percentage: parseFloat(
                                                            (e.currentTarget as HTMLInputElement)
                                                                .value,
                                                        ),
                                                    },
                                                })
                                            }
                                            className="input input--sm input--numeric"
                                            disabled={updateLinkMutation.isPending}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={owner.role}
                                            onChange={(e) =>
                                                updateLinkMutation.mutate({
                                                    ownerId: owner.owner_id,
                                                    updates: {
                                                        role: (e.currentTarget as HTMLInputElement)
                                                            .value,
                                                    },
                                                })
                                            }
                                            className="input input--sm"
                                            disabled={updateLinkMutation.isPending}
                                        />
                                    </td>
                                    <td className="text-center">
                                        <label className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                checked={owner.is_primary_contact}
                                                onChange={() =>
                                                    setPrimaryMutation.mutate(owner.owner_id)
                                                }
                                                disabled={
                                                    owner.is_primary_contact ||
                                                    setPrimaryMutation.isPending
                                                }
                                            />
                                            <span className="checkmark"></span>
                                        </label>
                                        {owner.is_primary_contact && (
                                            <span className="primary-badge">Principal</span>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="icon-btn icon-btn--danger"
                                            onClick={() => {
                                                if (
                                                    window.confirm(
                                                        `¿Desvincular a ${owner.owner_name}?`,
                                                    )
                                                ) {
                                                    unlinkMutation.mutate({
                                                        ownerId: owner.owner_id,
                                                    });
                                                }
                                            }}
                                            disabled={unlinkMutation.isPending}
                                            title="Desvincular"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {linkedOwners && linkedOwners.length === 0 && (
                <div className="empty-state">
                    <p>No hay propietarios vinculados a esta propiedad.</p>
                    <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={() => setShowAddModal(true)}
                    >
                        <Plus size={14} /> Agregar primer propietario
                    </button>
                </div>
            )}

            {/* Add Owner Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Agregar propietario</h3>
                            <button
                                type="button"
                                className="icon-btn"
                                onClick={() => setShowAddModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={methods.handleSubmit(handleSubmit)} className="modal-body">
                            <div className="field">
                                <label>Buscar propietario</label>
                                <div className="search-wrapper">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Nombre, DNI o email..."
                                        value={search}
                                        onInput={(e) =>
                                            setSearch((e.currentTarget as HTMLInputElement).value)
                                        }
                                        disabled={loadingOwners}
                                    />
                                </div>
                            </div>

                            {search.length >= 2 &&
                                filteredOwners.length === 0 &&
                                !loadingOwners && (
                                    <p className="hint">
                                        No se encontraron propietarios. Puedes crear uno nuevo desde{' '}
                                        <a href="/propietarios/nuevo">Propietarios → Nuevo</a>.
                                    </p>
                                )}

                            {search.length >= 2 && filteredOwners.length > 0 && (
                                <div className="owner-search-results">
                                    {filteredOwners.map((owner) => (
                                        <button
                                            key={owner.id}
                                            type="button"
                                            className={`owner-result${selectedOwnerId === owner.id ? ' selected' : ''}`}
                                            onClick={() => {
                                                setSelectedOwnerId(owner.id);
                                                methods.setValue('owner_id', owner.id);
                                            }}
                                        >
                                            <span className="owner-result-avatar">
                                                {owner.full_name.charAt(0).toUpperCase()}
                                            </span>
                                            <div>
                                                <strong>{owner.full_name}</strong>
                                                <span className="muted">
                                                    {owner.email || owner.phone || 'Sin contacto'}
                                                </span>
                                            </div>
                                            {selectedOwnerId === owner.id && <Check size={16} />}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedOwnerId && (
                                <div className="selected-owner-config">
                                    <h4>Configurar vinculación</h4>
                                    <div className="form-grid">
                                        <div className="field">
                                            <label htmlFor="ownership_percentage">
                                                % Propiedad
                                            </label>
                                            <input
                                                id="ownership_percentage"
                                                type="number"
                                                min="0.01"
                                                max="100"
                                                step="0.01"
                                                {...methods.register('ownership_percentage')}
                                            />
                                        </div>
                                        <div className="field">
                                            <label htmlFor="role">Rol</label>
                                            <input
                                                id="role"
                                                type="text"
                                                {...methods.register('role')}
                                            />
                                        </div>
                                        <div className="field checkbox-field">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    {...methods.register('is_primary_contact')}
                                                />
                                                Contacto principal
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn btn--ghost"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn--primary"
                                    disabled={!selectedOwnerId || linkMutation.isPending}
                                >
                                    {linkMutation.isPending
                                        ? 'Vinculando...'
                                        : 'Vincular propietario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
