import { useEffect, useState, useRef, useCallback } from 'preact/hooks';
import { ArrowLeft, Save, Trash2, Copy, MapPin, Eye, Loader2, X } from 'lucide-preact';
import { Link, useLocation, useRoute } from 'wouter-preact';
import 'leaflet/dist/leaflet.css';
import {
  STATUS_LABEL,
  createProperty,
  duplicateProperty,
  fetchLocations,
  fetchProperty,
  toFormValues,
  toNumeric,
  updateProperty,
  softDeleteProperty,
  type LocationOption,
  type ListingType,
  type PropertyFormValues,
  type PropertyStatus,
} from '../lib/properties';
import { useQuery } from '../lib/query/hooks';
import { queryClient } from '../lib/query/client';
import { pushToast } from '../store/app';

const STORAGE_KEY = 'property-form-draft';
const AUTOSAVE_DELAY = 2000;

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
}: {
  label: string;
  value: number | null;
  onInput: (n: number | null) => void;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={0}
        step="any"
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
  const [autosaveTimer, setAutosaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showMLPreview, setShowMLPreview] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof PropertyFormValues>(key: K, value: PropertyFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  const { data: locations } = useQuery<LocationOption[]>({
    queryKey: ['locations'],
    queryFn: fetchLocations,
  });

  // Load draft from localStorage on mount
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
    }
    setLoaded(true);
  }, [isNew]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!isNew || !loaded) return;
    
    if (autosaveTimer) clearTimeout(autosaveTimer);
    
    const timer = setTimeout(() => {
      const draft: Partial<PropertyFormValues> = { ...values };
      delete draft.title; // Don't save title to avoid confusion
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      console.log('Draft saved');
    }, AUTOSAVE_DELAY);
    
    setAutosaveTimer(timer);
    return () => clearTimeout(timer);
  }, [values, loaded]);

  // Clear draft on successful submit
  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Load property for editing
  useEffect(() => {
    if (!editId) {
      setLoaded(true);
      return;
    }
    let alive = true;
    fetchProperty(editId)
      .then((p) => {
        if (!alive) return;
        setValues(toFormValues(p));
        // Load coords if available
        if (p.latitude && p.longitude) {
          setMapCoords({ lat: p.latitude, lng: p.longitude });
        }
        setLoaded(true);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setLoadError(e instanceof Error ? e.message : 'No se pudo cargar la propiedad.');
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [editId]);

  // Open map picker
  const openMapPicker = () => {
    setShowMap(true);
    // Load Leaflet dynamically
    if (!mapRef.current?.querySelector('.leaflet-container')) {
      import('leaflet').then((L) => {
        if (!mapRef.current) return;
        const map = L.map(mapRef.current, {
          center: mapCoords ? [mapCoords.lat, mapCoords.lng] : [-34.6037, -58.3816], // Buenos Aires default
          zoom: 13,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        
        let marker: L.Marker | null = null;
        const updateMarker = (latlng: L.LatLng) => {
          if (marker) marker.remove();
          marker = L.marker(latlng).addTo(map);
          setMapCoords({ lat: latlng.lat, lng: latlng.lng });
        };
        
        if (mapCoords) {
          updateMarker(L.latLng(mapCoords.lat, mapCoords.lng));
        }
        
        map.on('click', (e) => updateMarker(e.latlng));
      });
    }
  };

  useEffect(() => {
    document.title = isNew
      ? 'Nueva propiedad · BIENENHAUS'
      : 'Editar propiedad · BIENENHAUS';
    return () => {
      document.title = 'BIENENHAUS — Panel de Administración';
    };
  }, [isNew]);

  useEffect(() => {
    if (!editId) {
      setLoaded(true);
      return;
    }
    let alive = true;
    fetchProperty(editId)
      .then((p) => {
        if (!alive) return;
        setValues(toFormValues(p));
        if (p.latitude && p.longitude) {
          setMapCoords({ lat: p.latitude, lng: p.longitude });
        }
        setLoaded(true);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setLoadError(e instanceof Error ? e.message : 'No se pudo cargar la propiedad.');
        setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [editId]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!values.title.trim()) {
      pushToast({ type: 'error', title: 'Falta el título', description: 'El título es obligatorio.' });
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        await createProperty(values);
        pushToast({ type: 'success', title: 'Propiedad creada', description: values.title });
      } else if (editId) {
        await updateProperty(editId, values);
        pushToast({ type: 'success', title: 'Cambios guardados', description: values.title });
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
      const duplicated = await duplicateProperty(editId);
      pushToast({ type: 'success', title: 'Propiedad duplicada', description: duplicated.title });
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
    if (!window.confirm(`¿Mover "${values.title}" a la papelera?`)) return;
    try {
      await softDeleteProperty(editId);
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
        <div className="page-head-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
              className="btn btn--secondary"
              onClick={() => setShowMLPreview(!showMLPreview)}
              disabled={saving}
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
              <MapPin size={14} /> Coordenadas: {mapCoords.lat.toFixed(6)}, {mapCoords.lng.toFixed(6)}
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

      {!loadError && loaded && (
        <form className="form-card" onSubmit={handleSubmit}>
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
                  onInput={(e) => set('title', (e.currentTarget as HTMLInputElement).value)}
                />
              </label>
              <label className="field">
                <span>Estado</span>
                <select
                  className="select"
                  value={values.status}
                  onChange={(e) =>
                    set('status', (e.currentTarget as HTMLSelectElement).value as PropertyStatus)
                  }
                >
                  {(Object.keys(STATUS_LABEL) as PropertyStatus[]).map((s) => (
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
                    set('listing_type', (e.currentTarget as HTMLSelectElement).value as ListingType)
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
                  onChange={(e) => set('currency', (e.currentTarget as HTMLSelectElement).value as 'USD' | 'ARS')}
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
                  onInput={(e) => set('description', (e.currentTarget as HTMLTextAreaElement).value)}
                />
              </label>
              <label className="field field--wide">
                <span>Video (YouTube)</span>
                <input
                  type="url"
                  value={values.video_url}
                  placeholder="https://youtube.com/watch?v=... o https://youtu.be/..."
                  onInput={(e) => set('video_url', (e.currentTarget as HTMLInputElement).value)}
                />
                <small className="field-hint">Opcional. Link de YouTube para mostrar en el detalle.</small>
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
                    set('location_id', (e.currentTarget as HTMLSelectElement).value || null)
                  }
                >
                  <option value="">Sin zona</option>
                  {(locations ?? []).map((l) => (
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
                  onInput={(e) => set('address', (e.currentTarget as HTMLInputElement).value)}
                />
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section-head">
              <h3>Detalles</h3>
              <p>Superficies y distribución.</p>
            </div>
            <div className="form-grid">
              <NumField label="Superficie total (m²)" value={values.area_total} onInput={(n) => set('area_total', n)} />
              <NumField label="Superficie cubierta (m²)" value={values.area_covered} onInput={(n) => set('area_covered', n)} />
              <NumField label="Dormitorios" value={values.bedrooms} onInput={(n) => set('bedrooms', n)} />
              <NumField label="Baños" value={values.bathrooms} onInput={(n) => set('bathrooms', n)} />
              <NumField label="Cocheras" value={values.garages} onInput={(n) => set('garages', n)} />
              <NumField label="Pisos" value={values.floors} onInput={(n) => set('floors', n)} />
              <NumField label="Año de construcción" value={values.year_built} onInput={(n) => set('year_built', n)} />
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
                onChange={(e) => set('featured', (e.currentTarget as HTMLInputElement).checked)}
              />
              <span>Propiedad destacada</span>
            </label>
          </section>

          <div className="form-actions">
            {!isNew && (
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleDelete}
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
       
       {/* ML Preview Modal */}
       {showMLPreview && !isNew && (
         <div className="modal-backdrop" onClick={() => setShowMLPreview(false)}>
           <div className="modal-card modal--large" onClick={e => e.stopPropagation()}>
             <div className="modal-head">
               <h3>Vista previa Mercado Libre</h3>
               <button className="icon-btn" onClick={() => setShowMLPreview(false)}><X size={20} /></button>
             </div>
             <div className="modal-body" style={{ padding: '24px' }}>
               <div style={{ border: '1px solid var(--bh-border)', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
                 <div style={{ background: '#f5f5f5', padding: '16px', borderBottom: '1px solid var(--bh-border)' }}>
                   <h4 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{values.title}</h4>
                   <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                     <span className="badge badge--info">{values.listing_type === 'venta' ? 'Venta' : values.listing_type === 'alquiler' ? 'Alquiler' : values.listing_type}</span>
                     <span className="badge badge--success" style={{ fontSize: '14px' }}>{values.price ? `${values.currency} ${values.price.toLocaleString('es-AR')}` : 'Precio no definido'}</span>
                     <span className="badge badge--neutral">{values.currency}</span>
                   </div>
                 </div>
                 <div style={{ padding: '16px' }}>
                   <h5 style={{ margin: '0 0 12px', fontSize: '14px' }}>Descripción</h5>
                   <p style={{ margin: 0, lineHeight: '1.6', color: '#333' }}>{values.description || '<i style="color: var(--bh-text-tertiary)">Sin descripción</i>'}</p>
                   <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--bh-text-secondary)' }}>
                     {values.area_total && <span><strong>Sup. total:</strong> {values.area_total} m²</span>}
                     {values.area_covered && <span><strong>Sup. cubierta:</strong> {values.area_covered} m²</span>}
                     {values.bedrooms && <span><strong>Dormitorios:</strong> {values.bedrooms}</span>}
                     {values.bathrooms && <span><strong>Baños:</strong> {values.bathrooms}</span>}
                     {values.garages && <span><strong>Cocheras:</strong> {values.garages}</span>}
                     {values.address && <span><strong>Dirección:</strong> {values.address}</span>}
                   </div>
                 </div>
               </div>
               <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bh-bg-hover)', borderRadius: '8px', fontSize: '12px', color: 'var(--bh-text-tertiary)' }}>
                 <strong>Nota:</strong> Esta es una vista previa aproximada. La publicación final en Mercado Libre puede variar según la configuración de la cuenta y las políticas de la plataforma.
               </div>
             </div>
           </div>
         </div>
       )}
       
       {/* Map Picker Modal */}
       {showMap && (
         <div className="modal-backdrop" onClick={() => setShowMap(false)}>
           <div className="modal-card modal--large" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
             <div className="modal-head">
               <h3>Seleccionar coordenadas en el mapa</h3>
               <button className="icon-btn" onClick={() => setShowMap(false)}><X size={20} /></button>
             </div>
             <div className="modal-body" style={{ padding: 0 }}>
               <div ref={mapRef} style={{ width: '100%', height: '500px' }} />
               <div style={{ padding: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--bh-border)' }}>
                 <span style={{ alignSelf: 'center', fontSize: '13px', color: 'var(--bh-text-tertiary)' }}>
                   Coordenadas: <strong>{mapCoords?.lat.toFixed(6)}</strong>, <strong>{mapCoords?.lng.toFixed(6)}</strong>
                 </span>
                 <button className="btn btn--secondary" onClick={() => { setValues(v => ({ ...v, latitude: mapCoords?.lat ?? 0, longitude: mapCoords?.lng ?? 0 })); setShowMap(false); }} disabled={!mapCoords}>
                   <MapPin size={14} /> Usar estas coordenadas
                 </button>
                 <button className="btn btn--ghost" onClick={() => setShowMap(false)}>
                   Cancelar
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }
