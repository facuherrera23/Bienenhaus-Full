import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import {
    ArrowLeft,
    Building2,
    Copy,
    Eye,
    Home,
    List,
    Loader2,
    MapPin,
    Save,
    Trash2,
    Users,
    X,
} from 'lucide-preact';
import { Link, useLocation, useRoute } from 'wouter-preact';
import type {
    LatLng as LeafletLatLng,
    Map as LeafletMap,
    Marker as LeafletMarker,
    LeafletMouseEvent,
} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    type ListingType,
    type PropertyFormValues,
    type PropertyStatus,
    slugify,
    STATUS_LABEL,
    toFormValues,
    toNumeric,
    useCreateProperty,
    useDuplicateProperty,
    useLocations,
    useProperty,
    useSoftDeleteProperty,
    useUpdateProperty,
} from '../lib/properties.api';
import { PropertyOwnerManager } from '../components/owners';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { queryClient } from '../lib/query/client';
import { pushToast } from '../store/app';
import { getListData } from '../lib/utils';

const STORAGE_KEY = 'property-form-draft';
const AUTOSAVE_DELAY = 2000;

function getListingTypeLabel(listingType: ListingType): string {
    const labels: Record<ListingType, string> = {
        venta: 'Venta',
        alquiler: 'Alquiler',
        venta_alquiler: 'Venta o alquiler',
        emprendimiento: 'Emprendimiento',
    };
    return labels[listingType] ?? listingType;
}

const EMPTY: PropertyFormValues = {
    title: '',
    status: 'borrador',
    listing_type: 'venta',
    price: null,
    currency: 'USD',
    expenses: null,
    description: '',
    address: '',
    location_id: null,
    area_total: null,
    area_covered: null,
    bedrooms: null,
    bathrooms: null,
    garages: null,
    floors: null,
    year_built: null,
    featured: false,
    video_url: '',
    latitude: null,
    longitude: null,
};

const LISTING_OPTIONS: { value: ListingType; label: string }[] = [
    { value: 'venta', label: 'Venta' },
    { value: 'alquiler', label: 'Alquiler' },
    { value: 'venta_alquiler', label: 'Venta o alquiler' },
    { value: 'emprendimiento', label: 'Emprendimiento' },
];

function NumField({
    label,
    value,
    onInput,
    placeholder,
    step,
    min,
}: {
    label: string;
    value: number | null;
    onInput: (n: number | null) => void;
    placeholder?: string;
    step?: string;
    min?: number;
}) {
    return (
        <label className="field">
            <span>{label}</span>
            <input
                type="number"
                min={min ?? 0}
                step={step ?? 'any'}
                placeholder={placeholder}
                value={value ?? ''}
                onInput={(e) => onInput(toNumeric((e.currentTarget as HTMLInputElement).value))}
            />
        </label>
    );
}

export function PropertyFormPage() {
    const [, setLocation] = useLocation();
    const [, params] = useRoute('/propiedades/:id');
    const editId = params?.id && params.id !== 'nueva' ? params.id : null;

    const isNew = !editId;
    const [values, setValues] = useState<PropertyFormValues>(EMPTY);
    const [loaded, setLoaded] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);
const [confirmDelete, setConfirmDelete] = useState(false);
    const [autosaveTimer, setAutosaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [showMLPreview, setShowMLPreview] = useState(false);
    const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [activeTab, setActiveTab] = useState<
        'basic' | 'location' | 'details' | 'publish' | 'owners'
    >('basic');
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMapRef = useRef<LeafletMap | null>(null);

    useEffect(() => {
        return () => {
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!showMap && leafletMapRef.current) {
            leafletMapRef.current.remove();
            leafletMapRef.current = null;
        }
    }, [showMap]);

    const { data: locations } = useLocations();
    const property = useProperty(editId);
    const createProperty = useCreateProperty();
    const updateProperty = useUpdateProperty();
    const duplicateProperty = useDuplicateProperty();
    const softDeleteProperty = useSoftDeleteProperty();

    const set = <K extends keyof PropertyFormValues>(key: K, value: PropertyFormValues[K]) => {
        setValues((v) => ({ ...v, [key]: value }));
    };

    useEffect(() => {
        if (!editId) {
            setLoaded(true);
            return;
        }
        if (property.isSuccess && property.data) {
            setValues(toFormValues(property.data));
            if (property.data.latitude && property.data.longitude) {
                setMapCoords({ lat: property.data.latitude, lng: property.data.longitude });
            }
            setLoaded(true);
        } else if (property.isError) {
            setLoadError(property.error?.message ?? 'No se pudo cargar la propiedad.');
            setLoaded(true);
        }
    }, [editId, property.data, property.isSuccess, property.isError]);

    useEffect(() => {
        if (isNew) {
            const draft = localStorage.getItem(STORAGE_KEY);
            if (draft) {
                try {
                    const parsed = JSON.parse(draft);
                    setValues({ ...EMPTY, ...parsed });
                } catch {
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
            setLoaded(true);
        }
    }, [isNew]);

    useEffect(() => {
        if (!isNew || !loaded) return;

        if (autosaveTimer) clearTimeout(autosaveTimer);

        const timer = setTimeout(() => {
            const draft: Partial<PropertyFormValues> = { ...values };
            delete (draft as Record<string, unknown>).title;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        }, AUTOSAVE_DELAY);

        setAutosaveTimer(timer);
        return () => clearTimeout(timer);
    }, [values, loaded, isNew]);

    const clearDraft = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const openMapPicker = () => {
        setShowMap(true);
        if (!mapRef.current?.querySelector('.leaflet-container')) {
            import('leaflet').then((L) => {
                if (!mapRef.current) return;
                const map = L.map(mapRef.current, {
                    center: mapCoords ? [mapCoords.lat, mapCoords.lng] : [-34.6037, -58.3816],
                    zoom: 13,
                });
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                }).addTo(map);

                leafletMapRef.current = map;

                let marker: LeafletMarker | null = null;
                const updateMarker = (latlng: LeafletLatLng) => {
                    if (marker) marker.remove();
                    marker = L.marker(latlng).addTo(map);
                    setMapCoords({ lat: latlng.lat, lng: latlng.lng });
                };

                if (mapCoords) {
                    updateMarker(L.latLng(mapCoords.lat, mapCoords.lng));
                }

                map.on('click', (e: LeafletMouseEvent) => updateMarker(e.latlng));
            });
        }
    };

    useEffect(() => {
        document.title = isNew ? 'Nueva propiedad · BIENENHAUS' : 'Editar propiedad · BIENENHAUS';
        return () => {
            document.title = 'BIENENHAUS — Panel de Administración';
        };
    }, [isNew]);

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!values.title.trim()) {
            pushToast({
                type: 'error',
                title: 'Falta el título',
                description: 'El título es obligatorio.',
            });
            return;
        }
        setSaving(true);
        try {
            if (isNew) {
                const slug = slugify(values.title);
                await createProperty.mutateAsync({ ...values, slug });
                pushToast({
                    type: 'success',
                    title: 'Propiedad creada',
                    description: values.title,
                });
            } else if (editId) {
                await updateProperty.mutateAsync({ id: editId, body: values });
                pushToast({
                    type: 'success',
                    title: 'Cambios guardados',
                    description: values.title,
                });
            }
            await queryClient.invalidateQueries({ queryKey: ['properties'] });
            clearDraft();
            setLocation('/propiedades');
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'No se pudo guardar',
                description: err instanceof Error ? err.message : 'Error inesperado.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDuplicate = async () => {
        if (!editId) return;
        try {
            setSaving(true);
            const duplicated = await duplicateProperty.mutateAsync(editId);
            pushToast({
                type: 'success',
                title: 'Propiedad duplicada',
                description: duplicated.title,
            });
            await queryClient.invalidateQueries({ queryKey: ['properties'] });
            setLocation(`/propiedades/${duplicated.id}`);
        } catch (err) {
            pushToast({
                type: 'error',
                title: 'No se pudo duplicar',
                description: err instanceof Error ? err.message : 'Error inesperado.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editId) return;
        try {
            await softDeleteProperty.mutateAsync(editId);
            pushToast({ type: 'success', title: 'Propiedad movida a papelera' });
            await queryClient.invalidateQueries({ queryKey: ['properties'] });
            setLocation('/propiedades');
        } catch {
            pushToast({ type: 'error', title: 'No se pudo mover a papelera' });
        }
    };

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <h2 className="page-title">{isNew ? 'Nueva propiedad' : 'Editar propiedad'}</h2>
                    <p className="page-subtitle">
                        {isNew
                            ? 'Cargá los datos del inmueble para incorporarlo al catálogo.'
                            : 'Actualizá los datos del inmueble y guardá los cambios.'}
                    </p>
                </div>
                <div
                    className="page-head-actions"
                    style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}
                >
                    {!isNew && (
                        <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={handleDuplicate}
                            disabled={saving}
                        >
                            <Copy size={16} /> Duplicar
                        </button>
                    )}
                    {!isNew && (
                        <button
                            type="button"
                            className={`btn btn--secondary btn--ml-toggle${showMLPreview ? ' active' : ''}`}
                            onClick={() => setShowMLPreview(!showMLPreview)}
                            disabled={saving}
                            aria-pressed={showMLPreview}
                        >
                            <Eye size={16} /> {showMLPreview ? 'Ocultar' : 'Vista previa'} ML
                        </button>
                    )}
                    {!isNew && mapCoords && (
                        <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={openMapPicker}
                            disabled={saving}
                        >
                            <MapPin size={14} /> Coordenadas: {mapCoords.lat.toFixed(6)},{' '}
                            {mapCoords.lng.toFixed(6)}
                        </button>
                    )}
                    <Link href="/propiedades" className="btn btn--secondary">
                        <ArrowLeft size={16} /> Volver
                    </Link>
                </div>
            </div>

            {loadError && (
                <div className="card placeholder-card">
                    <h3>No se pudo abrir la propiedad</h3>
                    <p>{loadError}</p>
                    <Link href="/propiedades" className="btn btn--secondary">
                        Volver al listado
                    </Link>
                </div>
            )}

            {!loadError && !loaded && <div className="card placeholder-card">Cargando…</div>}

            {!loadError && loaded && !isNew && (
                <div
                    className="form-tabs"
                    role="tablist"
                    data-active-index={[
                        'basic',
                        'location',
                        'details',
                        'publish',
                        'owners',
                    ].indexOf(activeTab)}
                >
                    <button
                        role="tab"
                        aria-selected={activeTab === 'basic'}
                        data-tab="basic"
                        className={`form-tab${activeTab === 'basic' ? ' active' : ''}`}
                        onClick={() => setActiveTab('basic')}
                    >
                        <Home size={16} /> Datos básicos
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'location'}
                        data-tab="location"
                        className={`form-tab${activeTab === 'location' ? ' active' : ''}`}
                        onClick={() => setActiveTab('location')}
                    >
                        <MapPin size={16} /> Ubicación
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'details'}
                        data-tab="details"
                        className={`form-tab${activeTab === 'details' ? ' active' : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        <List size={16} /> Detalles
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'publish'}
                        data-tab="publish"
                        className={`form-tab${activeTab === 'publish' ? ' active' : ''}`}
                        onClick={() => setActiveTab('publish')}
                    >
                        <Building2 size={16} /> Publicación
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'owners'}
                        data-tab="owners"
                        className={`form-tab${activeTab === 'owners' ? ' active' : ''}`}
                        onClick={() => setActiveTab('owners')}
                    >
                        <Users size={16} /> Propietarios
                    </button>
                </div>
            )}

            {!loadError && loaded && (
                <form className="form-card" onSubmit={handleSubmit} noValidate>
                    {isNew ? (
                        <>
                            <section className="form-section">
                                <div className="form-section-head">
                                    <h3>Datos básicos</h3>
                                    <p>Nombre del inmueble, operación y precio.</p>
                                </div>
                                <div className="form-grid">
                                    <label className="field field--wide">
                                        <span>Título *</span>
                                        <input
                                            type="text"
                                            value={values.title}
                                            placeholder="Ej: Casa en Villa Belgrano"
                                            required
                                            onInput={(e) =>
                                                set(
                                                    'title',
                                                    (e.currentTarget as HTMLInputElement).value,
                                                )
                                            }
                                        />
                                    </label>
                                    <label className="field">
                                        <span>Estado</span>
                                        <select
                                            className="select"
                                            value={values.status}
                                            onChange={(e) =>
                                                set(
                                                    'status',
                                                    (e.currentTarget as HTMLSelectElement)
                                                        .value as PropertyStatus,
                                                )
                                            }
                                        >
                                            {(Object.keys(STATUS_LABEL) as PropertyStatus[]).map(
                                                (s) => (
                                                    <option key={s} value={s}>
                                                        {STATUS_LABEL[s]}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </label>
                                    <label className="field">
                                        <span>Operación</span>
                                        <select
                                            className="select"
                                            value={values.listing_type}
                                            onChange={(e) =>
                                                set(
                                                    'listing_type',
                                                    (e.currentTarget as HTMLSelectElement)
                                                        .value as ListingType,
                                                )
                                            }
                                        >
                                            {LISTING_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <NumField
                                        label="Precio"
                                        value={values.price}
                                        onInput={(n) => set('price', n)}
                                        placeholder="Ej: 285000"
                                    />
                                    <label className="field">
                                        <span>Moneda</span>
                                        <select
                                            className="select"
                                            value={values.currency}
                                            onChange={(e) =>
                                                set(
                                                    'currency',
                                                    (e.currentTarget as HTMLSelectElement).value as
                                                        'USD' | 'ARS',
                                                )
                                            }
                                        >
                                            <option value="USD">USD</option>
                                            <option value="ARS">ARS</option>
                                        </select>
                                    </label>
                                    <NumField
                                        label="Expensas"
                                        value={values.expenses}
                                        onInput={(n) => set('expenses', n)}
                                        placeholder="Opcional"
                                    />
                                    <label className="field field--wide">
                                        <span>Descripción</span>
                                        <textarea
                                            rows={4}
                                            value={values.description}
                                            placeholder="Descripción del inmueble…"
                                            onInput={(e) =>
                                                set(
                                                    'description',
                                                    (e.currentTarget as HTMLTextAreaElement).value,
                                                )
                                            }
                                        />
                                    </label>
                                    <label className="field field--wide">
                                        <span>Video (YouTube)</span>
                                        <input
                                            type="url"
                                            value={values.video_url}
                                            placeholder="https://youtube.com/watch?v=... o https://youtu.be/..."
                                            onInput={(e) =>
                                                set(
                                                    'video_url',
                                                    (e.currentTarget as HTMLInputElement).value,
                                                )
                                            }
                                        />
                                        <small className="field-hint">
                                            Opcional. Link de YouTube para mostrar en el detalle.
                                        </small>
                                    </label>
                                </div>
                            </section>

                            <section className="form-section">
                                <div className="form-section-head">
                                    <h3>Ubicación</h3>
                                    <p>Zona y dirección del inmueble.</p>
                                </div>
                                <div className="form-grid">
                                    <label className="field">
                                        <span>Zona</span>
                                        <select
                                            className="select"
                                            value={values.location_id ?? ''}
                                            onChange={(e) =>
                                                set(
                                                    'location_id',
                                                    (e.currentTarget as HTMLSelectElement).value ||
                                                        null,
                                                )
                                            }
                                        >
                                            <option value="">Sin zona</option>
                                            {getListData<{ id: string; name: string }>(
                                                locations?.data,
                                            ).map((l) => (
                                                <option key={l.id} value={l.id}>
                                                    {l.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="field field--wide">
                                        <span>Dirección</span>
                                        <input
                                            type="text"
                                            value={values.address}
                                            placeholder="Ej: Av. Vélez Sarsfield 900"
                                            onInput={(e) =>
                                                set(
                                                    'address',
                                                    (e.currentTarget as HTMLInputElement).value,
                                                )
                                            }
                                        />
                                    </label>
                                    <NumField
                                        label="Latitud"
                                        value={values.latitude}
                                        onInput={(n) => set('latitude', n)}
                                        placeholder="Ej: -34.6037"
                                        step="0.000001"
                                    />
                                    <NumField
                                        label="Longitud"
                                        value={values.longitude}
                                        onInput={(n) => set('longitude', n)}
                                        placeholder="Ej: -58.3816"
                                        step="0.000001"
                                    />
                                </div>
                            </section>

                            <section className="form-section">
                                <div className="form-section-head">
                                    <h3>Detalles</h3>
                                    <p>Superficies y distribución.</p>
                                </div>
                                <div className="form-grid">
                                    <NumField
                                        label="Superficie total (m²)"
                                        value={values.area_total}
                                        onInput={(n) => set('area_total', n)}
                                    />
                                    <NumField
                                        label="Superficie cubierta (m²)"
                                        value={values.area_covered}
                                        onInput={(n) => set('area_covered', n)}
                                    />
                                    <NumField
                                        label="Dormitorios"
                                        value={values.bedrooms}
                                        onInput={(n) => set('bedrooms', n)}
                                    />
                                    <NumField
                                        label="Baños"
                                        value={values.bathrooms}
                                        onInput={(n) => set('bathrooms', n)}
                                    />
                                    <NumField
                                        label="Cocheras"
                                        value={values.garages}
                                        onInput={(n) => set('garages', n)}
                                    />
                                    <NumField
                                        label="Pisos"
                                        value={values.floors}
                                        onInput={(n) => set('floors', n)}
                                    />
                                    <NumField
                                        label="Año de construcción"
                                        value={values.year_built}
                                        onInput={(n) => set('year_built', n)}
                                    />
                                </div>
                            </section>

                            <section className="form-section">
                                <div className="form-section-head">
                                    <h3>Publicación</h3>
                                    <p>Visibilidad en el catálogo.</p>
                                </div>
                                <label className="checkbox">
                                    <input
                                        type="checkbox"
                                        checked={values.featured}
                                        onChange={(e) =>
                                            set(
                                                'featured',
                                                (e.currentTarget as HTMLInputElement).checked,
                                            )
                                        }
                                    />
                                    <span>Propiedad destacada</span>
                                </label>
                            </section>
                        </>
                    ) : (
                        <>
                            {activeTab === 'basic' && (
                                <section className="form-section">
                                    <div className="form-section-head">
                                        <h3>Datos básicos</h3>
                                        <p>Nombre del inmueble, operación y precio.</p>
                                    </div>
                                    <div className="form-grid">
                                        <label className="field field--wide">
                                            <span>Título *</span>
                                            <input
                                                type="text"
                                                value={values.title}
                                                placeholder="Ej: Casa en Villa Belgrano"
                                                required
                                                onInput={(e) =>
                                                    set(
                                                        'title',
                                                        (e.currentTarget as HTMLInputElement).value,
                                                    )
                                                }
                                            />
                                        </label>
                                        <label className="field">
                                            <span>Estado</span>
                                            <select
                                                className="select"
                                                value={values.status}
                                                onChange={(e) =>
                                                    set(
                                                        'status',
                                                        (e.currentTarget as HTMLSelectElement)
                                                            .value as PropertyStatus,
                                                    )
                                                }
                                            >
                                                {(
                                                    Object.keys(STATUS_LABEL) as PropertyStatus[]
                                                ).map((s) => (
                                                    <option key={s} value={s}>
                                                        {STATUS_LABEL[s]}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="field">
                                            <span>Operación</span>
                                            <select
                                                className="select"
                                                value={values.listing_type}
                                                onChange={(e) =>
                                                    set(
                                                        'listing_type',
                                                        (e.currentTarget as HTMLSelectElement)
                                                            .value as ListingType,
                                                    )
                                                }
                                            >
                                                {LISTING_OPTIONS.map((o) => (
                                                    <option key={o.value} value={o.value}>
                                                        {o.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <NumField
                                            label="Precio"
                                            value={values.price}
                                            onInput={(n) => set('price', n)}
                                            placeholder="Ej: 285000"
                                        />
                                        <label className="field">
                                            <span>Moneda</span>
                                            <select
                                                className="select"
                                                value={values.currency}
                                                onChange={(e) =>
                                                    set(
                                                        'currency',
                                                        (e.currentTarget as HTMLSelectElement)
                                                            .value as 'USD' | 'ARS',
                                                    )
                                                }
                                            >
                                                <option value="USD">USD</option>
                                                <option value="ARS">ARS</option>
                                            </select>
                                        </label>
                                        <NumField
                                            label="Expensas"
                                            value={values.expenses}
                                            onInput={(n) => set('expenses', n)}
                                            placeholder="Opcional"
                                        />
                                        <label className="field field--wide">
                                            <span>Descripción</span>
                                            <textarea
                                                rows={4}
                                                value={values.description}
                                                placeholder="Descripción del inmueble…"
                                                onInput={(e) =>
                                                    set(
                                                        'description',
                                                        (e.currentTarget as HTMLTextAreaElement)
                                                            .value,
                                                    )
                                                }
                                            />
                                        </label>
                                        <label className="field field--wide">
                                            <span>Video (YouTube)</span>
                                            <input
                                                type="url"
                                                value={values.video_url}
                                                placeholder="https://youtube.com/watch?v=... o https://youtu.be/..."
                                                onInput={(e) =>
                                                    set(
                                                        'video_url',
                                                        (e.currentTarget as HTMLInputElement).value,
                                                    )
                                                }
                                            />
                                            <small className="field-hint">
                                                Opcional. Link de YouTube para mostrar en el
                                                detalle.
                                            </small>
                                        </label>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'location' && (
                                <section className="form-section">
                                    <div className="form-section-head">
                                        <h3>Ubicación</h3>
                                        <p>Zona y dirección del inmueble.</p>
                                    </div>
                                    <div className="form-grid">
                                        <label className="field">
                                            <span>Zona</span>
                                            <select
                                                className="select"
                                                value={values.location_id ?? ''}
                                                onChange={(e) =>
                                                    set(
                                                        'location_id',
                                                        (e.currentTarget as HTMLSelectElement)
                                                            .value || null,
                                                    )
                                                }
                                            >
                                                <option value="">Sin zona</option>
                                                {getListData<{ id: string; name: string }>(
                                                    locations?.data,
                                                ).map((l) => (
                                                    <option key={l.id} value={l.id}>
                                                        {l.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="field field--wide">
                                            <span>Dirección</span>
                                            <input
                                                type="text"
                                                value={values.address}
                                                placeholder="Ej: Av. Vélez Sarsfield 900"
                                                onInput={(e) =>
                                                    set(
                                                        'address',
                                                        (e.currentTarget as HTMLInputElement).value,
                                                    )
                                                }
                                            />
                                        </label>
                                        <NumField
                                            label="Latitud"
                                            value={values.latitude}
                                            onInput={(n) => set('latitude', n)}
                                            placeholder="Ej: -34.6037"
                                            step="0.000001"
                                        />
                                        <NumField
                                            label="Longitud"
                                            value={values.longitude}
                                            onInput={(n) => set('longitude', n)}
                                            placeholder="Ej: -58.3816"
                                            step="0.000001"
                                        />
                                    </div>
                                </section>
                            )}

                            {activeTab === 'details' && (
                                <section className="form-section">
                                    <div className="form-section-head">
                                        <h3>Detalles</h3>
                                        <p>Superficies y distribución.</p>
                                    </div>
                                    <div className="form-grid">
                                        <NumField
                                            label="Superficie total (m²)"
                                            value={values.area_total}
                                            onInput={(n) => set('area_total', n)}
                                        />
                                        <NumField
                                            label="Superficie cubierta (m²)"
                                            value={values.area_covered}
                                            onInput={(n) => set('area_covered', n)}
                                        />
                                        <NumField
                                            label="Dormitorios"
                                            value={values.bedrooms}
                                            onInput={(n) => set('bedrooms', n)}
                                        />
                                        <NumField
                                            label="Baños"
                                            value={values.bathrooms}
                                            onInput={(n) => set('bathrooms', n)}
                                        />
                                        <NumField
                                            label="Cocheras"
                                            value={values.garages}
                                            onInput={(n) => set('garages', n)}
                                        />
                                        <NumField
                                            label="Pisos"
                                            value={values.floors}
                                            onInput={(n) => set('floors', n)}
                                        />
                                        <NumField
                                            label="Año de construcción"
                                            value={values.year_built}
                                            onInput={(n) => set('year_built', n)}
                                        />
                                    </div>
                                </section>
                            )}

                            {activeTab === 'publish' && (
                                <section className="form-section">
                                    <div className="form-section-head">
                                        <h3>Publicación</h3>
                                        <p>Visibilidad en el catálogo.</p>
                                    </div>
                                    <label className="checkbox">
                                        <input
                                            type="checkbox"
                                            checked={values.featured}
                                            onChange={(e) =>
                                                set(
                                                    'featured',
                                                    (e.currentTarget as HTMLInputElement).checked,
                                                )
                                            }
                                        />
                                        <span>Propiedad destacada</span>
                                    </label>
                                </section>
                            )}

                            {activeTab === 'owners' && (
                                <section className="form-section">
                                    <div className="form-section-head">
                                        <h3>Propietarios</h3>
                                        <p>Gestión de propietarios vinculados a esta propiedad.</p>
                                    </div>
                                    <PropertyOwnerManager propertyId={editId!} />
                                </section>
                            )}
                        </>
                    )}

                    <div className="form-actions">
                        {!isNew && (
                            <button
                                type="button"
                                className="btn btn--danger"
                                onClick={() => setConfirmDelete(true)}
                                disabled={saving}
                            >
                                <Trash2 size={16} /> Mover a papelera
                            </button>
                        )}
                        <button type="submit" className="btn btn--primary" disabled={saving}>
                            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                            {saving ? ' Guardando…' : ' Guardar'}
                        </button>
                    </div>
                </form>
            )}

            {showMLPreview && !isNew && (
                <div className="modal-backdrop" onClick={() => setShowMLPreview(false)}>
                    <div className="modal-card modal--large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3>Vista previa Mercado Libre</h3>
                            <button className="icon-btn" onClick={() => setShowMLPreview(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="ml-preview">
                                <div className="ml-preview-header">
                                    <h4>{values.title}</h4>
                                    <div className="ml-preview-badges">
                                        <span className="badge badge--info">
                                            {getListingTypeLabel(values.listing_type)}
                                        </span>
                                        <span className="badge badge--success">
                                            {values.price
                                                ? `${values.currency} ${values.price.toLocaleString('es-AR')}`
                                                : 'Precio no definido'}
                                        </span>
                                        <span className="badge badge--neutral">
                                            {values.currency}
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-preview-body">
                                    <h5>Descripción</h5>
                                    <p>{values.description || 'Sin descripción'}</p>
                                    <div className="ml-preview-attrs">
                                        {values.area_total && (
                                            <span>
                                                <strong>Sup. total:</strong> {values.area_total} m²
                                            </span>
                                        )}
                                        {values.area_covered && (
                                            <span>
                                                <strong>Sup. cubierta:</strong>{' '}
                                                {values.area_covered} m²
                                            </span>
                                        )}
                                        {values.bedrooms && (
                                            <span>
                                                <strong>Dormitorios:</strong> {values.bedrooms}
                                            </span>
                                        )}
                                        {values.bathrooms && (
                                            <span>
                                                <strong>Baños:</strong> {values.bathrooms}
                                            </span>
                                        )}
                                        {values.garages && (
                                            <span>
                                                <strong>Cocheras:</strong> {values.garages}
                                            </span>
                                        )}
                                        {values.address && (
                                            <span>
                                                <strong>Dirección:</strong> {values.address}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="ml-preview-note">
                                <strong>Nota:</strong> Esta es una vista previa aproximada. La
                                publicación final en Mercado Libre puede variar según la
                                configuración de la cuenta y las políticas de la plataforma.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showMap && (
                <div className="modal-backdrop" onClick={() => setShowMap(false)}>
                    <div className="modal-card modal--large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <h3>Seleccionar coordenadas en el mapa</h3>
                            <button className="icon-btn" onClick={() => setShowMap(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: 0 }}>
                            <div ref={mapRef} style={{ width: '100%', height: '500px' }} />
                            <div
                                style={{
                                    padding: '16px',
                                    display: 'flex',
                                    gap: '12px',
                                    justifyContent: 'flex-end',
                                    borderTop: '1px solid var(--bh-border)',
                                }}
                            >
                                <span
                                    style={{
                                        alignSelf: 'center',
                                        fontSize: '13px',
                                        color: 'var(--bh-text-tertiary)',
                                    }}
                                >
                                    Coordenadas: <strong>{mapCoords?.lat.toFixed(6)}</strong>,{' '}
                                    <strong>{mapCoords?.lng.toFixed(6)}</strong>
                                </span>
                                <button
                                    className="btn btn--secondary"
                                    onClick={() => {
                                        setValues((v) => ({
                                            ...v,
                                            latitude: mapCoords?.lat ?? null,
                                            longitude: mapCoords?.lng ?? null,
                                        }));
                                        setShowMap(false);
                                    }}
                                    disabled={!mapCoords}
                                >
                                    <MapPin size={14} /> Usar estas coordenadas
                                </button>
                                <button
                                    className="btn btn--ghost"
                                    onClick={() => setShowMap(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={confirmDelete}
                title="Mover a papelera"
                message={`¿Mover "${values.title}" a la papelera?`}
                confirmLabel="Mover a papelera"
                danger
                onConfirm={() => {
                    setConfirmDelete(false);
                    void handleDelete();
                }}
                onCancel={() => setConfirmDelete(false)}
            />
        </div>
    );
}
