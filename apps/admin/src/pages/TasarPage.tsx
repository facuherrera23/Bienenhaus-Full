import { useEffect, useRef, useState } from 'preact/hooks';
import {
    ArrowLeft,
    Building2,
    ClipboardList,
    FileText,
    Home,
    Loader2,
    Lock,
    MapPin,
    PencilLine,
    Plus,
    Ruler,
    Save,
    Sparkles,
    Trash2,
    User,
} from 'lucide-preact';
import { Link, useLocation, useRoute } from 'wouter-preact';
import {
    useDeleteValuation,
    useEnableEditValuation,
    useFinalizeValuation,
    useSaveValuationDraft,
    useValuation,
    useValuations,
} from '../lib/valuationApi';

import { pushToast } from '../store/app';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type {
    ComparableData,
    NivelesComparacion,
    ValuacionDraftData,
    ValuacionFormData,
} from '../types/valuationTypes';
import {
    AMBIENTE_IDS,
    BarrioTipoEnum,
    CalidadPredomEnum,
    CambiosUsoEnum,
    ConstruidoPctEnum,
    DemandaOfertaEnum,
    DestinoEnum,
    EstacionamientoEnum,
    FacilidadesEstacionamientoEnum,
    IndiceCrecimientoEnum,
    NivelCalidadEnum,
    NIVELES_LIST,
    NivelLuminosidadEnum,
    NivelSocioEnum,
    OrientacionEnum,
    PrevalenciaEnum,
    RubroNivelEnum,
    ServicioNivelEnum,
    SERVICIOS_MAP,
    SiNoNAEnum,
    TendenciaValoresEnum,
    TiempoComercializacionEnum,
    TipoConstruccionEnum,
    TipoInmuebleEnum,
    TipologiaEdiliciaEnum,
    TipoTechoEnum,
    ValuacionConValidacionesSchema,
    VigilanciaEnum,
} from '../schemas/valuationSchemas';
import styles from './TasarPage.module.css';


// ============================================================
// Paso 6 — Pasada 2: WIZARD COMPLETO con campos reales
// Wizard de 8 pasos + auto-save a DB + carga de draft + routing.
// Cada paso renderiza sus campos (form-grid) según el schema Zod.
// ============================================================

const AUTOSAVE_DELAY = 2000;

const CHAR_LABELS = [
    'Calidad de ubicación',
    'Cantidad de habitaciones',
    'Superficie',
    'Estado / mantenimiento',
    'Antigüedad',
    'Comodidades',
];

const EMPTY_CHARS: ComparableData['chars'] = [
    'Igual',
    'Igual',
    'Igual',
    'Igual',
    'Igual',
    'Igual',
];

const AMBIENTE_LABELS: Record<(typeof AMBIENTE_IDS)[number], string> = {
    f_ambCocina: 'Cocina',
    f_ambDormitorios: 'Dormitorios',
    f_ambTerraza: 'Terraza',
    f_ambComedor: 'Comedor',
    f_ambSuite: 'Suite',
    f_ambPatio: 'Patio',
    f_ambCocinaComedor: 'Cocina comedor',
    f_ambSuiteVestidor: 'Suite con vestidor',
    f_ambBalcon: 'Balcón',
    f_ambLiving: 'Living',
    f_ambDormitVestidor: 'Dormitorio con vestidor',
    f_ambLavadero: 'Lavadero',
    f_ambLivingComedor: 'Living comedor',
    f_ambBanoServicio: 'Baño de servicio',
    f_ambCuartoGuardado: 'Cuarto de guardado',
    f_ambEscritorio: 'Escritorio',
    f_ambBano: 'Baño',
    f_ambGarage: 'Garage',
};

// ------------------------------------------------------------
// Formato vacío (todos los campos del schema ValuacionInputSchema)
// ------------------------------------------------------------

const EMPTY: ValuacionFormData = {
    // Datos cliente
    f_solicitante: '',
    f_fecha: new Date().toISOString().slice(0, 10),
    f_telefono: '',
    f_destino: 'Venta',
    f_fotoFachada: '',
    // Datos inmueble
    f_direccion: '',
    f_barrio: '',
    f_localidad: '',
    f_provincia: '',
    f_supTerreno: undefined,
    f_supConstruida: undefined,
    f_tipo: 'OTRO',
    f_precioDolar: undefined,
    f_valorUva: undefined,
    // Descripción propiedad
    f_tipoConstruccion: '',
    f_espacioHabitable: undefined,
    f_plantas: undefined,
    f_anioConstruccion: undefined,
    f_impInmobiliarios: undefined,
    f_tipoTecho: '',
    f_orientacion: '',
    f_luminosidad: '',
    f_calidadConstructiva: '',
    f_calidadMantenimiento: '',
    f_detallesTerminacion: '',
    f_estacionamientoTipo: '',
    // Ambientes (18)
    f_ambCocina: undefined,
    f_ambDormitorios: undefined,
    f_ambTerraza: undefined,
    f_ambComedor: undefined,
    f_ambSuite: undefined,
    f_ambPatio: undefined,
    f_ambCocinaComedor: undefined,
    f_ambSuiteVestidor: undefined,
    f_ambBalcon: undefined,
    f_ambLiving: undefined,
    f_ambDormitVestidor: undefined,
    f_ambLavadero: undefined,
    f_ambLivingComedor: undefined,
    f_ambBanoServicio: undefined,
    f_ambCuartoGuardado: undefined,
    f_ambEscritorio: undefined,
    f_ambBano: undefined,
    f_ambGarage: undefined,
    // Comodidades
    f_comDobleCirculacion: '',
    f_comAsador: '',
    f_comPiscina: '',
    // Servicios básicos (ServicioNivelEnum: sin opción vacía → default 'N/A')
    f_calefaccion: 'N/A',
    f_aireAcondicionado: 'N/A',
    f_aguaCaliente: 'N/A',
    // Adversas
    f_caracteristicasAdversas: '',
    // Servicios (6 rubros — RubroNivelEnum: sin opción vacía → default 'Optimo')
    electricidad: 'Optimo / Impecable (Listo para Habitar)',
    gas: 'Optimo / Impecable (Listo para Habitar)',
    internet: 'Optimo / Impecable (Listo para Habitar)',
    agua: 'Optimo / Impecable (Listo para Habitar)',
    cloaca: 'Optimo / Impecable (Listo para Habitar)',
    techos: 'Optimo / Impecable (Listo para Habitar)',
    // Barrio — características
    f_tipologiasEdilicias: '',
    f_calidadConstructivaPredom: '',
    f_construccionAlturaPrevalencia: '',
    f_usoComercialPrevalencia: '',
    f_usoIndustrialPrevalencia: '',
    f_nivelSocioeconomicoBarrio: '',
    f_barrioTipo: '',
    f_construidoPct: '',
    f_indiceCrecimiento: '',
    // Barrio — descripción + % uso suelo
    f_servVigilancia: '',
    f_tendenciaValores: '',
    f_demandaOferta: '',
    f_tiempoComercializacion: '',
    f_cambiosUsoTerreno: '',
    f_facilidadesEstacionamiento: '',
    f_usoResidencial: undefined,
    f_usoComercial: undefined,
    f_usoIndustrial: undefined,
    // Análisis comparativo
    ac_dispersion: 10,
    // Valuación
    v_terrenoPrecio: undefined,
    // Observaciones
    f_observaciones: '',
    // Comparables + estado
    comparables: [],
    locked: false,
};

// ------------------------------------------------------------
// Definición de los 8 pasos del wizard
// ------------------------------------------------------------

interface WizardStep {
    id: string;
    label: string;
    icon: typeof User;
    description: string;
}

const STEPS: WizardStep[] = [
    {
        id: 'cliente',
        label: 'Datos del cliente',
        icon: User,
        description: 'Solicitante, fecha, teléfono, destino y foto de fachada.',
    },
    {
        id: 'inmueble',
        label: 'Datos del inmueble',
        icon: Home,
        description: 'Ubicación, superficies, tipo y valores de referencia.',
    },
    {
        id: 'descripcion',
        label: 'Descripción propiedad',
        icon: Building2,
        description: 'Construcción, antigüedad, estado, terminación y orientación.',
    },
    {
        id: 'ambientes',
        label: 'Ambientes',
        icon: Ruler,
        description: 'Cantidad de ambientes (18 categorías).',
    },
    {
        id: 'comodidades',
        label: 'Comodidades y servicios',
        icon: ClipboardList,
        description: 'Comodidades, servicios básicos y características adversas.',
    },
    {
        id: 'servicios',
        label: 'Servicios (rubros)',
        icon: Sparkles,
        description: 'Estado de los 6 rubros de servicios.',
    },
    {
        id: 'barrio',
        label: 'Barrio',
        icon: MapPin,
        description: 'Características del barrio, descripción y % uso de suelo.',
    },
    {
        id: 'analisis',
        label: 'Análisis y valuación',
        icon: FileText,
        description: 'Comparables, dispersión, terreno y observaciones.',
    },
];

// ------------------------------------------------------------
// Componentes de campo reutilizables
// ------------------------------------------------------------

function TextInput({
    id,
    label,
    value,
    placeholder,
    disabled,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    placeholder?: string;
    disabled?: boolean;
    onChange: (v: string) => void;
}) {
    return (
        <label className="field" htmlFor={id}>
            <span>{label}</span>
            <input
                id={id}
                type="text"
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                onInput={(e) => onChange((e.currentTarget as HTMLInputElement).value)}
            />
        </label>
    );
}

function NumInput({
    id,
    label,
    value,
    placeholder,
    min,
    max,
    step,
    disabled,
    onChange,
}: {
    id: string;
    label: string;
    value: number | undefined;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: string;
    disabled?: boolean;
    onChange: (n: number | undefined) => void;
}) {
    return (
        <label className="field" htmlFor={id}>
            <span>{label}</span>
            <input
                id={id}
                type="number"
                min={min ?? 0}
                max={max}
                step={step ?? 'any'}
                placeholder={placeholder}
                value={value ?? ''}
                disabled={disabled}
                onInput={(e) => onChange(toNumeric((e.currentTarget as HTMLInputElement).value))}
            />
        </label>
    );
}

function SelectInput<T extends string>({
    id,
    label,
    value,
    options,
    disabled,
    onChange,
}: {
    id: string;
    label: string;
    value: T;
    options: readonly T[];
    disabled?: boolean;
    onChange: (v: T) => void;
}) {
    return (
        <label className="field" htmlFor={id}>
            <span>{label}</span>
            <select
                id={id}
                className="select"
                value={value}
                disabled={disabled}
                onChange={(e) => onChange((e.currentTarget as HTMLSelectElement).value as T)}
            >
                {options.map((o) => (
                    <option key={o} value={o}>
                        {o === '' ? '— Seleccionar —' : o}
                    </option>
                ))}
            </select>
        </label>
    );
}

function TextAreaInput({
    id,
    label,
    value,
    rows,
    disabled,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    rows?: number;
    disabled?: boolean;
    onChange: (v: string) => void;
}) {
    return (
        <label className="field field--wide" htmlFor={id}>
            <span>{label}</span>
            <textarea
                id={id}
                rows={rows ?? 3}
                value={value}
                disabled={disabled}
                onInput={(e) => onChange((e.currentTarget as HTMLTextAreaElement).value)}
            />
        </label>
    );
}

// ------------------------------------------------------------
// Editor de comparables (bloque dinámico)
// ------------------------------------------------------------

function ComparablesEditor({
    comparables,
    disabled,
    onChange,
}: {
    comparables: ComparableData[];
    disabled: boolean;
    onChange: (next: ComparableData[]) => void;
}) {
    function addComparable() {
        const next: ComparableData = {
            orden: comparables.length + 1,
            direccion: '',
            barrio: '',
            precio: undefined,
            supTerreno: undefined,
            supCubierta: undefined,
            dias: undefined,
            tipoConstruccion: '',
            antiguedad: undefined,
            fotoUrl: '',
            urlOrigen: '',
            chars: [...EMPTY_CHARS],
            included: true,
        };
        onChange([...comparables, next]);
    }

    function updateComparable(index: number, patch: Partial<ComparableData>) {
        onChange(comparables.map((c, i) => (i === index ? { ...c, ...patch } : c)));
    }

    function removeComparable(index: number) {
        onChange(
            comparables.filter((_, i) => i !== index).map((c, i) => ({ ...c, orden: i + 1 })),
        );
    }

    function updateChar(index: number, charIndex: number, value: NivelesComparacion) {
        const chars = [...comparables[index].chars];
        chars[charIndex] = value;
        updateComparable(index, { chars });
    }

    return (
        <div className={`${styles['comparable-section']} field--wide`}>
            <div className={styles['comparable-section-head']}>
                <span>Comparables</span>
                <button type="button" className="btn btn--sm btn--secondary" onClick={addComparable} disabled={disabled}>
                    <Plus size={14} /> Agregar comparable
                </button>
            </div>

            {comparables.length === 0 ? (
                <p className={styles['comparable-empty']}>
                    Sin comparables cargados. Agregá al menos uno para el análisis comparativo.
                </p>
            ) : (
                comparables.map((c, i) => (
                    <div className={styles['comparable-card']} key={i}>
                        <div className={styles['comparable-card-head']}>
                            <span className={styles['comparable-card-title']}>Comparable #{c.orden}</span>
                            <button
                                type="button"
                                className="btn btn--sm btn--danger"
                                onClick={() => removeComparable(i)}
                                disabled={disabled}
                                aria-label={`Quitar comparable ${c.orden}`}
                            >
                                <Trash2 size={13} /> Quitar
                            </button>
                        </div>
                        <div className="form-grid">
                            <TextInput
                                id={`cmp-dir-${i}`}
                                label="Dirección"
                                value={c.direccion ?? ''}
                                disabled={disabled}
                                onChange={(v) => updateComparable(i, { direccion: v })}
                            />
                            <TextInput
                                id={`cmp-barrio-${i}`}
                                label="Barrio"
                                value={c.barrio ?? ''}
                                disabled={disabled}
                                onChange={(v) => updateComparable(i, { barrio: v })}
                            />
                            <NumInput
                                id={`cmp-precio-${i}`}
                                label="Precio (USD)"
                                value={c.precio}
                                disabled={disabled}
                                onChange={(v) => updateComparable(i, { precio: v })}
                            />
                            <NumInput
                                id={`cmp-supterr-${i}`}
                                label="Sup. terreno (m²)"
                                value={c.supTerreno}
                                disabled={disabled}
                                onChange={(v) => updateComparable(i, { supTerreno: v })}
                            />
                            <NumInput
                                id={`cmp-supcub-${i}`}
                                label="Sup. cubierta (m²)"
                                value={c.supCubierta}
                                disabled={disabled}
                                onChange={(v) => updateComparable(i, { supCubierta: v })}
                            />
                            <NumInput
                                id={`cmp-dias-${i}`}
                                label="Días publicado"
                                value={c.dias}
                                disabled={disabled}
                                onChange={(v) => updateComparable(i, { dias: v })}
                            />
                            <SelectInput
                                id={`cmp-tipo-${i}`}
                                label="Tipo construcción"
                                value={c.tipoConstruccion}
                                options={TipoConstruccionEnum.options}
                                disabled={disabled}
                                onChange={(v) => updateComparable(i, { tipoConstruccion: v })}
                            />
                            <NumInput
                                id={`cmp-antig-${i}`}
                                label="Antigüedad (años)"
                                value={c.antiguedad}
                                disabled={disabled}
                                onChange={(v) => updateComparable(i, { antiguedad: v })}
                            />
                            <TextInput
                                id={`cmp-foto-${i}`}
                                label="Foto URL"
                                value={c.fotoUrl ?? ''}
                                disabled={disabled}
                                onChange={(v) => updateComparable(i, { fotoUrl: v })}
                            />
                            <TextInput
                                id={`cmp-url-${i}`}
                                label="URL de origen"
                                value={c.urlOrigen ?? ''}
                                disabled={disabled}
                                onChange={(v) => updateComparable(i, { urlOrigen: v })}
                            />
                        </div>
                        <div className={styles['comparable-chars']}>
                            {c.chars.map((char, ci) => (
                                <SelectInput
                                    key={ci}
                                    id={`cmp-char-${i}-${ci}`}
                                    label={CHAR_LABELS[ci]}
                                    value={char}
                                    options={NIVELES_LIST}
                                    disabled={disabled}
                                    onChange={(v) => updateChar(i, ci, v)}
                                />
                            ))}
                        </div>
                        <label className={`checkbox ${styles['comparable-included']}`}>
                            <input
                                type="checkbox"
                                checked={c.included}
                                disabled={disabled}
                                onChange={(e) =>
                                    updateComparable(i, {
                                        included: (e.currentTarget as HTMLInputElement).checked,
                                    })
                                }
                            />
                            Incluir en el análisis
                        </label>
                    </div>
                ))
            )}
        </div>
    );
}

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------

function toNumeric(raw: string): number | undefined {
    if (raw.trim() === '') return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
}

/** Convierte un draft/row en ValuacionFormData (strip de metadatos). */
function toFormData(draft: ValuacionDraftData): ValuacionFormData {
    const { id: _id, createdAt: _c, updatedAt: _u, version: _v, ...form } = draft;
    return { ...form, comparables: draft.comparables ?? [] };
}

// ============================================================
// Componente
// ============================================================

export function TasarPage() {
    const [location, setLocation] = useLocation();
    const [, params] = useRoute('/tasar/:id');
    const editId = params?.id && params.id !== 'nueva' ? params.id : null;

    // ---- Estado del formulario ----
    const [values, setValues] = useState<ValuacionFormData>(EMPTY);
    const [draftId, setDraftId] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [dirty, setDirty] = useState(false);
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [listSearch, setListSearch] = useState('');
    const [listStatus, setListStatus] = useState<'all' | 'draft' | 'finalized'>('all');
    const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ---- Hooks API ----
    const existing = useValuation(editId);
    const saveDraftMutation = useSaveValuationDraft();
    const finalizeMutation = useFinalizeValuation();
    const enableEditMutation = useEnableEditValuation();
    const valuationsQuery = useValuations({
        search: listSearch.trim() || undefined,
        status: listStatus === 'all' ? undefined : listStatus,
        page: 1,
        pageSize: 1000,
    });
    const deleteValuationMutation = useDeleteValuation();
    const isLocked = existing.data?.locked ?? false;
    const ambientTotal = AMBIENTE_IDS.reduce((acc, id) => acc + (values[id] ?? 0), 0);

    // ------------------------------------------------------------
    // Carga inicial: edición existente o draft más reciente
    // ------------------------------------------------------------
    useEffect(() => {
        let cancelled = false;

        async function init() {
            if (editId) {
                // La carga la maneja useValuation (existing)
                setLoaded(true);
                return;
            }
            try {
                // /tasar/nueva siempre comienza una tasación nueva. Los borradores
                // existentes se seleccionan desde el listado principal.
                setValues(EMPTY);
                setDraftId(null);
                setDirty(false);
                setLastSavedAt(null);
            } catch (e) {
                if (cancelled) return;
                setLoadError(e instanceof Error ? e.message : 'Error al inicializar la tasación');
            } finally {
                if (!cancelled) setLoaded(true);
            }
        }

        init();
        return () => {
            cancelled = true;
        };
    }, [editId, location]);

    // Hidratar formulario cuando llega la tasación existente
    useEffect(() => {
        if (existing.data) {
            setValues(toFormData(existing.data as unknown as ValuacionDraftData));
            setDraftId(existing.data.id);
        }
    }, [existing.data]);

    // ------------------------------------------------------------
    // Auto-save (debounce 2s → saveDraft)
    // ------------------------------------------------------------
    useEffect(() => {
        return () => {
            if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        };
    }, []);

    useEffect(() => {
        if (!loaded || !dirty || isLocked) return;

        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => {
            setSaving(true);
            saveDraftMutation.mutate(
                { form: values, id: draftId ?? undefined },
                {
                    onSuccess: (savedId) => {
                        setDraftId(savedId);
                        setDirty(false);
                        setLastSavedAt(new Date());
                        setSaving(false);
                    },
                    onError: (err) => {
                        setSaving(false);
                        pushToast({
                            type: 'error',
                            title: 'Error al guardar borrador',
                            description: err instanceof Error ? err.message : 'Error desconocido',
                        });
                    },
                },
            );
        }, AUTOSAVE_DELAY);
    }, [values, dirty, loaded, isLocked]);

    // Aviso al salir con cambios sin guardar
    useEffect(() => {
        function onBeforeUnload(e: BeforeUnloadEvent) {
            if (!dirty) return;
            e.preventDefault();
        }
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [dirty]);

    // ------------------------------------------------------------
    // Handlers
    // ------------------------------------------------------------

    function setField<K extends keyof ValuacionFormData>(key: K, value: ValuacionFormData[K]) {
        setValues((prev) => {
            const next = { ...prev };
            next[key] = value;
            return next;
        });
    }

    function handleSaveNow() {
        if (!loaded) return;
        setSaving(true);
        saveDraftMutation.mutate(
            { form: values, id: draftId ?? undefined },
            {
                onSuccess: (savedId) => {
                    setDraftId(savedId);
                    setDirty(false);
                    setLastSavedAt(new Date());
                    setSaving(false);
                    pushToast({
                        type: 'success',
                        title: 'Borrador guardado',
                        description: 'La tasación se guardó como borrador.',
                    });
                },
                onError: (err) => {
                    setSaving(false);
                    pushToast({
                        type: 'error',
                        title: 'Error al guardar',
                        description: err instanceof Error ? err.message : 'Error desconocido',
                    });
                },
            },
        );
    }

    function handleFinalize() {
        if (!draftId) {
            pushToast({
                type: 'error',
                title: 'No hay borrador',
                description: 'Guardá primero el borrador para poder finalizar.',
            });
            return;
        }
        const parsed = ValuacionConValidacionesSchema.safeParse(values);
        if (!parsed.success) {
            const issue = parsed.error.issues[0];
            pushToast({
                type: 'error',
                title: 'Datos incompletos',
                description: issue?.message ?? 'Revisá los datos ingresados en los pasos.',
            });
            return;
        }
        finalizeMutation.mutate(draftId, {
            onSuccess: () => {
                pushToast({
                    type: 'success',
                    title: 'Tasación finalizada',
                    description: 'La tasación quedó bloqueada como definitiva.',
                });
                setLocation('/tasar');
            },
            onError: (err) => {
                pushToast({
                    type: 'error',
                    title: 'Error al finalizar',
                    description: err instanceof Error ? err.message : 'Error desconocido',
                });
            },
        });
    }

    function handleEnableEdit() {
        if (!editId) return;
        enableEditMutation.mutate(editId, {
            onSuccess: () => {
                pushToast({
                    type: 'success',
                    title: 'Edición habilitada',
                    description: 'La tasación volvió a estado borrador.',
                });
            },
            onError: (err) => {
                pushToast({
                    type: 'error',
                    title: 'Error al desbloquear',
                    description: err instanceof Error ? err.message : 'Error desconocido',
                });
            },
        });
    }

    function doNewValuation() {
        setValues(EMPTY);
        setDraftId(null);
        setDirty(false);
        setLastSavedAt(null);
        setLocation('/tasar/nueva');
    }

    // ------------------------------------------------------------
    // Contenido por paso
    // ------------------------------------------------------------

    function renderStepContent(stepId: string) {
        switch (stepId) {
            case 'cliente':
                return (
                    <div className="form-grid">
                        <TextInput
                            id="cliente-solicitante"
                            label="Solicitante"
                            value={values.f_solicitante ?? ''}
                            disabled={isLocked}
                            onChange={(v) => setField('f_solicitante', v)}
                        />
                        <TextInput
                            id="cliente-fecha"
                            label="Fecha"
                            value={values.f_fecha ?? ''}
                            disabled={isLocked}
                            onChange={(v) => setField('f_fecha', v)}
                        />
                        <TextInput
                            id="cliente-telefono"
                            label="Teléfono"
                            value={values.f_telefono ?? ''}
                            disabled={isLocked}
                            onChange={(v) => setField('f_telefono', v)}
                        />
                        <SelectInput
                            id="cliente-destino"
                            label="Destino"
                            value={values.f_destino}
                            options={DestinoEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_destino', v)}
                        />
                        <TextInput
                            id="cliente-foto"
                            label="Foto fachada (URL)"
                            value={values.f_fotoFachada ?? ''}
                            disabled={isLocked}
                            onChange={(v) => setField('f_fotoFachada', v)}
                        />
                    </div>
                );

            case 'inmueble':
                return (
                    <div className="form-grid">
                        <TextInput
                            id="inm-direccion"
                            label="Dirección"
                            value={values.f_direccion ?? ''}
                            disabled={isLocked}
                            onChange={(v) => setField('f_direccion', v)}
                        />
                        <TextInput
                            id="inm-barrio"
                            label="Barrio"
                            value={values.f_barrio ?? ''}
                            disabled={isLocked}
                            onChange={(v) => setField('f_barrio', v)}
                        />
                        <TextInput
                            id="inm-localidad"
                            label="Localidad"
                            value={values.f_localidad ?? ''}
                            disabled={isLocked}
                            onChange={(v) => setField('f_localidad', v)}
                        />
                        <TextInput
                            id="inm-provincia"
                            label="Provincia"
                            value={values.f_provincia ?? ''}
                            disabled={isLocked}
                            onChange={(v) => setField('f_provincia', v)}
                        />
                        <NumInput
                            id="inm-supterreno"
                            label="Sup. terreno (m²)"
                            value={values.f_supTerreno}
                            disabled={isLocked}
                            onChange={(v) => setField('f_supTerreno', v)}
                        />
                        <NumInput
                            id="inm-supconstruida"
                            label="Sup. construida (m²)"
                            value={values.f_supConstruida}
                            disabled={isLocked}
                            onChange={(v) => setField('f_supConstruida', v)}
                        />
                        <SelectInput
                            id="inm-tipo"
                            label="Tipo"
                            value={values.f_tipo}
                            options={TipoInmuebleEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_tipo', v)}
                        />
                        <NumInput
                            id="inm-precio"
                            label="Precio USD"
                            value={values.f_precioDolar}
                            disabled={isLocked}
                            onChange={(v) => setField('f_precioDolar', v)}
                        />
                        <NumInput
                            id="inm-uva"
                            label="Valor UVA"
                            value={values.f_valorUva}
                            disabled={isLocked}
                            onChange={(v) => setField('f_valorUva', v)}
                        />
                    </div>
                );

            case 'descripcion':
                return (
                    <div className="form-grid">
                        <SelectInput
                            id="des-tipoconstr"
                            label="Tipo construcción"
                            value={values.f_tipoConstruccion}
                            options={TipoConstruccionEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_tipoConstruccion', v)}
                        />
                        <NumInput
                            id="des-espacio"
                            label="Espacio habitable (m²)"
                            value={values.f_espacioHabitable}
                            disabled={isLocked}
                            onChange={(v) => setField('f_espacioHabitable', v)}
                        />
                        <NumInput
                            id="des-plantas"
                            label="Plantas"
                            value={values.f_plantas}
                            min={0}
                            step="1"
                            disabled={isLocked}
                            onChange={(v) => setField('f_plantas', v)}
                        />
                        <NumInput
                            id="des-anio"
                            label="Año construcción"
                            value={values.f_anioConstruccion}
                            min={1800}
                            step="1"
                            disabled={isLocked}
                            onChange={(v) => setField('f_anioConstruccion', v)}
                        />
                        <NumInput
                            id="des-imp"
                            label="Imp. inmobiliarios (USD)"
                            value={values.f_impInmobiliarios}
                            disabled={isLocked}
                            onChange={(v) => setField('f_impInmobiliarios', v)}
                        />
                        <SelectInput
                            id="des-techo"
                            label="Tipo techo"
                            value={values.f_tipoTecho}
                            options={TipoTechoEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_tipoTecho', v)}
                        />
                        <SelectInput
                            id="des-orientacion"
                            label="Orientación"
                            value={values.f_orientacion}
                            options={OrientacionEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_orientacion', v)}
                        />
                        <SelectInput
                            id="des-luminosidad"
                            label="Luminosidad"
                            value={values.f_luminosidad}
                            options={NivelLuminosidadEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_luminosidad', v)}
                        />
                        <SelectInput
                            id="des-calidad"
                            label="Calidad constructiva"
                            value={values.f_calidadConstructiva}
                            options={NivelCalidadEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_calidadConstructiva', v)}
                        />
                        <SelectInput
                            id="des-mant"
                            label="Calidad mantenimiento"
                            value={values.f_calidadMantenimiento}
                            options={NivelCalidadEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_calidadMantenimiento', v)}
                        />
                        <SelectInput
                            id="des-terminacion"
                            label="Detalles terminación"
                            value={values.f_detallesTerminacion}
                            options={NivelCalidadEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_detallesTerminacion', v)}
                        />
                        <SelectInput
                            id="des-estacionamiento"
                            label="Estacionamiento"
                            value={values.f_estacionamientoTipo}
                            options={EstacionamientoEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_estacionamientoTipo', v)}
                        />
                    </div>
                );

            case 'ambientes':
                return (
                    <div className="form-grid">
                        {AMBIENTE_IDS.map((id) => (
                            <NumInput
                                key={id}
                                id={`amb-${id}`}
                                label={AMBIENTE_LABELS[id]}
                                value={values[id]}
                                min={0}
                                step="1"
                                disabled={isLocked}
                                onChange={(v) => setField(id, v)}
                            />
                        ))}
                        <div className={styles['ambient-total']}>
                            <span>Total de ambientes</span>
                            <strong>{ambientTotal}</strong>
                        </div>
                    </div>
                );

            case 'comodidades':
                return (
                    <div className="form-grid">
                        <SelectInput
                            id="com-doble"
                            label="Doble circulación"
                            value={values.f_comDobleCirculacion}
                            options={SiNoNAEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_comDobleCirculacion', v)}
                        />
                        <SelectInput
                            id="com-asador"
                            label="Asador"
                            value={values.f_comAsador}
                            options={SiNoNAEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_comAsador', v)}
                        />
                        <SelectInput
                            id="com-piscina"
                            label="Piscina"
                            value={values.f_comPiscina}
                            options={SiNoNAEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_comPiscina', v)}
                        />
                        <SelectInput
                            id="com-calefaccion"
                            label="Calefacción"
                            value={values.f_calefaccion}
                            options={ServicioNivelEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_calefaccion', v)}
                        />
                        <SelectInput
                            id="com-aire"
                            label="Aire acondicionado"
                            value={values.f_aireAcondicionado}
                            options={ServicioNivelEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_aireAcondicionado', v)}
                        />
                        <SelectInput
                            id="com-agua"
                            label="Agua caliente"
                            value={values.f_aguaCaliente}
                            options={ServicioNivelEnum.options}
                            disabled={isLocked}
                            onChange={(v) => setField('f_aguaCaliente', v)}
                        />
                        <TextAreaInput
                            id="com-adversas"
                            label="Características adversas"
                            value={values.f_caracteristicasAdversas ?? ''}
                            disabled={isLocked}
                            onChange={(v) => setField('f_caracteristicasAdversas', v)}
                        />
                    </div>
                );

            case 'servicios':
                return (
                    <div className="form-grid">
                        {SERVICIOS_MAP.map((s) => (
                            <SelectInput
                                key={s.key}
                                id={`serv-${s.key}`}
                                label={s.label}
                                value={values[s.key]}
                                options={RubroNivelEnum.options}
                                disabled={isLocked}
                                onChange={(v) => setField(s.key, v)}
                            />
                        ))}
                    </div>
                );

            case 'barrio':
                return (
                    <>
                        <div className="form-section">
                            <div className="form-section-head">
                                <h3>Características del barrio</h3>
                                <p>Tipologías, calidad predominante, usos y nivel socioeconómico.</p>
                            </div>
                            <div className="form-grid">
                                <SelectInput
                                    id="bar-tipologia"
                                    label="Tipologías edilicias"
                                    value={values.f_tipologiasEdilicias}
                                    options={TipologiaEdiliciaEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_tipologiasEdilicias', v)}
                                />
                                <SelectInput
                                    id="bar-calidad"
                                    label="Calidad constructiva predom."
                                    value={values.f_calidadConstructivaPredom}
                                    options={CalidadPredomEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_calidadConstructivaPredom', v)}
                                />
                                <SelectInput
                                    id="bar-altura"
                                    label="Altura prevalencia"
                                    value={values.f_construccionAlturaPrevalencia}
                                    options={PrevalenciaEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_construccionAlturaPrevalencia', v)}
                                />
                                <SelectInput
                                    id="bar-comprev"
                                    label="Uso comercial prevalencia"
                                    value={values.f_usoComercialPrevalencia}
                                    options={PrevalenciaEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_usoComercialPrevalencia', v)}
                                />
                                <SelectInput
                                    id="bar-indprev"
                                    label="Uso industrial prevalencia"
                                    value={values.f_usoIndustrialPrevalencia}
                                    options={PrevalenciaEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_usoIndustrialPrevalencia', v)}
                                />
                                <SelectInput
                                    id="bar-socio"
                                    label="Nivel socioeconómico"
                                    value={values.f_nivelSocioeconomicoBarrio}
                                    options={NivelSocioEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_nivelSocioeconomicoBarrio', v)}
                                />
                                <SelectInput
                                    id="bar-tipo"
                                    label="Tipo de barrio"
                                    value={values.f_barrioTipo}
                                    options={BarrioTipoEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_barrioTipo', v)}
                                />
                                <SelectInput
                                    id="bar-construido"
                                    label="% construido"
                                    value={values.f_construidoPct}
                                    options={ConstruidoPctEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_construidoPct', v)}
                                />
                                <SelectInput
                                    id="bar-crecimiento"
                                    label="Índice crecimiento"
                                    value={values.f_indiceCrecimiento}
                                    options={IndiceCrecimientoEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_indiceCrecimiento', v)}
                                />
                            </div>
                        </div>
                        <div className="form-section">
                            <div className="form-section-head">
                                <h3>Descripción y % de uso de suelo</h3>
                                <p>Vigilancia, tendencia, demanda, tiempo de venta y usos del terreno.</p>
                            </div>
                            <div className="form-grid">
                                <SelectInput
                                    id="bar-vigilancia"
                                    label="Vigilancia"
                                    value={values.f_servVigilancia}
                                    options={VigilanciaEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_servVigilancia', v)}
                                />
                                <SelectInput
                                    id="bar-tendencia"
                                    label="Tendencia valores"
                                    value={values.f_tendenciaValores}
                                    options={TendenciaValoresEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_tendenciaValores', v)}
                                />
                                <SelectInput
                                    id="bar-demanda"
                                    label="Demanda / oferta"
                                    value={values.f_demandaOferta}
                                    options={DemandaOfertaEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_demandaOferta', v)}
                                />
                                <SelectInput
                                    id="bar-tiempo"
                                    label="Tiempo comercialización"
                                    value={values.f_tiempoComercializacion}
                                    options={TiempoComercializacionEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_tiempoComercializacion', v)}
                                />
                                <SelectInput
                                    id="bar-cambios"
                                    label="Cambios uso terreno"
                                    value={values.f_cambiosUsoTerreno}
                                    options={CambiosUsoEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_cambiosUsoTerreno', v)}
                                />
                                <SelectInput
                                    id="bar-estacionamiento"
                                    label="Facilidades estacionamiento"
                                    value={values.f_facilidadesEstacionamiento}
                                    options={FacilidadesEstacionamientoEnum.options}
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_facilidadesEstacionamiento', v)}
                                />
                                <NumInput
                                    id="bar-uso-res"
                                    label="% uso residencial"
                                    value={values.f_usoResidencial}
                                    min={0}
                                    max={100}
                                    step="1"
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_usoResidencial', v)}
                                />
                                <NumInput
                                    id="bar-uso-com"
                                    label="% uso comercial"
                                    value={values.f_usoComercial}
                                    min={0}
                                    max={100}
                                    step="1"
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_usoComercial', v)}
                                />
                                <NumInput
                                    id="bar-uso-ind"
                                    label="% uso industrial"
                                    value={values.f_usoIndustrial}
                                    min={0}
                                    max={100}
                                    step="1"
                                    disabled={isLocked}
                                    onChange={(v) => setField('f_usoIndustrial', v)}
                                />
                            </div>
                        </div>
                    </>
                );

            case 'analisis':
                return (
                    <>
                        <ComparablesEditor
                            comparables={values.comparables}
                            disabled={isLocked}
                            onChange={(next) => setField('comparables', next)}
                        />
                        <div className="form-grid">
                            <NumInput
                                id="ana-dispersion"
                                label="Dispersión (%)"
                                value={values.ac_dispersion}
                                min={0}
                                max={100}
                                disabled={isLocked}
                                onChange={(v) => setField('ac_dispersion', v ?? 10)}
                            />
                            <NumInput
                                id="ana-terreno"
                                label="Terreno (USD/m²)"
                                value={values.v_terrenoPrecio}
                                disabled={isLocked}
                                onChange={(v) => setField('v_terrenoPrecio', v)}
                            />
                        </div>
                        <TextAreaInput
                            id="ana-observaciones"
                            label="Observaciones"
                            value={values.f_observaciones ?? ''}
                            rows={4}
                            disabled={isLocked}
                            onChange={(v) => setField('f_observaciones', v)}
                        />
                    </>
                );

            default:
                return null;
        }
    }

    // ------------------------------------------------------------
    // Render
    // ------------------------------------------------------------

    if (location === '/tasar') {
        const rows = valuationsQuery.data?.data ?? [];
        const isListLoading = valuationsQuery.isLoading;
        const isListError = valuationsQuery.error instanceof Error ? valuationsQuery.error.message : null;

        return (
            <div className="page">
                <div className="page-head">
                    <div>
                        <h1 className="page-title">Tasaciones</h1>
                        <p className="page-subtitle">
                            Historial completo de tasaciones, borradores y tasaciones finalizadas.
                        </p>
                    </div>
                    <div className={styles['page-actions']}>
                        <button className="btn btn--primary" onClick={() => setLocation('/tasar/nueva')}>
                            <Plus size={16} /> Nueva tasación
                        </button>
                    </div>
                </div>

                <section className={`card ${styles['valuation-list-card']}`}>
                    <div className={styles['valuation-list-toolbar']}>
                        <input
                            className={styles['valuation-search']}
                            type="search"
                            value={listSearch}
                            placeholder="Buscar por solicitante, dirección o barrio…"
                            aria-label="Buscar tasaciones"
                            onInput={(e) => setListSearch((e.currentTarget as HTMLInputElement).value)}
                        />
                        <select
                            className={styles['valuation-filter']}
                            value={listStatus}
                            aria-label="Filtrar tasaciones por estado"
                            onChange={(e) =>
                                setListStatus((e.currentTarget as HTMLSelectElement).value as typeof listStatus)
                            }
                        >
                            <option value="all">Todas</option>
                            <option value="draft">Borradores</option>
                            <option value="finalized">Finalizadas</option>
                        </select>
                        <button className="btn btn--ghost" onClick={() => void valuationsQuery.refetch()} disabled={valuationsQuery.isFetching}>
                            {valuationsQuery.isFetching ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
                            Actualizar
                        </button>
                    </div>

                    {isListLoading ? (
                        <div className="page-loader" role="status" aria-label="Cargando tasaciones…">
                            <div className="spinner" aria-hidden="true" />
                            <p>Cargando tasaciones…</p>
                        </div>
                    ) : isListError ? (
                        <div className={`${styles['valuation-banner']} ${styles['valuation-banner--error']}`}>
                            {isListError}
                        </div>
                    ) : rows.length === 0 ? (
                        <div className={styles['valuation-empty']}>
                            <FileText size={32} />
                            <h2>No hay tasaciones</h2>
                            <p>Creá la primera tasación para comenzar.</p>
                            <button className="btn btn--primary" onClick={() => setLocation('/tasar/nueva')}>
                                <Plus size={16} /> Crear tasación
                            </button>
                        </div>
                    ) : (
                        <div className={styles['valuation-table-wrap']}>
                            <table className={styles['valuation-table']}>
                                <thead>
                                    <tr>
                                        <th>Solicitante</th>
                                        <th>Inmueble</th>
                                        <th>Tipo</th>
                                        <th>Fecha</th>
                                        <th>Estado</th>
                                        <th>Actualizada</th>
                                        <th aria-label="Acciones" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => {
                                        const finalized = Boolean(row.finalizedAt || row.locked);
                                        return (
                                            <tr key={row.id}>
                                                <td>
                                                    <strong>{row.f_solicitante || 'Sin solicitante'}</strong>
                                                    <span className={styles['valuation-secondary']}>{row.f_telefono || '—'}</span>
                                                </td>
                                                <td>
                                                    <strong>{row.f_direccion || 'Sin dirección'}</strong>
                                                    <span className={styles['valuation-secondary']}>
                                                        {[row.f_barrio, row.f_localidad].filter(Boolean).join(' · ') || '—'}
                                                    </span>
                                                </td>
                                                <td>{row.f_tipo || '—'}</td>
                                                <td>{row.f_fecha || '—'}</td>
                                                <td>
                                                    <span className={`${styles['valuation-status']} ${finalized ? styles['valuation-status--finalized'] : styles['valuation-status--draft']}`}>
                                                        {finalized ? 'Finalizada' : 'Borrador'}
                                                    </span>
                                                </td>
                                                <td>{row.updatedAt ? new Date(row.updatedAt).toLocaleString('es-AR') : '—'}</td>
                                                <td>
                                                    <div className={styles['valuation-row-actions']}>
                                                        <button className="btn btn--ghost btn--sm" onClick={() => setLocation(`/tasar/${row.id}`)}>
                                                            <PencilLine size={15} /> Editar
                                                        </button>
                                                        <button
                                                            className="btn btn--ghost btn--sm"
                                                            aria-label={`Eliminar tasación de ${row.f_solicitante || 'sin solicitante'}`}
                                                            onClick={() => setPendingDeleteId(row.id)}
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <ConfirmDialog
                    open={Boolean(pendingDeleteId)}
                    title="Enviar tasación a papelera"
                    message="La tasación no se borrará físicamente; se moverá a la papelera y podrá recuperarse según las políticas del sistema."
                    confirmLabel="Enviar a papelera"
                    danger
                    onConfirm={() => {
                        if (!pendingDeleteId) return;
                        deleteValuationMutation.mutate(pendingDeleteId, {
                            onSuccess: () => {
                                setPendingDeleteId(null);
                                pushToast({ type: 'success', title: 'Tasación eliminada', description: 'La tasación fue enviada a la papelera.' });
                            },
                            onError: (err) => {
                                setPendingDeleteId(null);
                                pushToast({ type: 'error', title: 'No se pudo eliminar', description: err instanceof Error ? err.message : 'Error desconocido' });
                            },
                        });
                    }}
                    onCancel={() => setPendingDeleteId(null)}
                />
            </div>
        );
    }

    if (!loaded) {
        return (
            <div className="page">
                <div className="page-loader" role="status" aria-label="Cargando tasación…">
                    <div className="spinner" aria-hidden="true"></div>
                    <p>Cargando…</p>
                </div>
            </div>
        );
    }

    const formSections = STEPS;

    return (
        <div className="page">
            <div className="page-head">
                <div>
                    <div className={styles['breadcrumbs']}>
                        <Link href="/tasar">Tasaciones</Link>
                        <span className={styles['breadcrumb-sep']}>/</span>
                        <span>{editId ? 'Editar tasación' : 'Nueva tasación'}</span>
                    </div>
                    <h1 className="page-title">{editId ? 'Editar tasación' : 'Nueva tasación'}</h1>
                    <p className="page-subtitle">
                        {isLocked
                            ? 'Tasación finalizada — modo solo lectura.'
                            : 'Todos los campos están disponibles en una sola página. El borrador se guarda automáticamente.'}
                    </p>
                </div>

                <div className={styles['page-actions']}>
                    <button className="btn btn--ghost" onClick={() => setLocation('/tasar')}>
                        <ArrowLeft size={16} /> Volver al listado
                    </button>
                    {!isLocked && (
                        <button className="btn btn--secondary" onClick={handleSaveNow} disabled={saving}>
                            {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
                            {saving ? 'Guardando…' : 'Guardar borrador'}
                        </button>
                    )}
                    {isLocked && editId && (
                        <button className="btn btn--secondary" onClick={handleEnableEdit} disabled={enableEditMutation.isPending}>
                            <PencilLine size={16} /> {enableEditMutation.isPending ? 'Habilitando…' : 'Habilitar edición'}
                        </button>
                    )}
                    {!isLocked && (
                        <button className="btn btn--primary" onClick={handleFinalize} disabled={finalizeMutation.isPending}>
                            <Lock size={16} /> {finalizeMutation.isPending ? 'Finalizando…' : 'Finalizar tasación'}
                        </button>
                    )}
                </div>
            </div>

            {isLocked && (
                <div className={`${styles['valuation-banner']} ${styles['valuation-banner--locked']}`}>
                    <Lock size={16} />
                    <span>Esta tasación está finalizada. Para modificarla, usá «Habilitar edición».</span>
                </div>
            )}
            {!isLocked && (
                <div className={styles['valuation-banner']}>
                    {saving ? <Loader2 className="spin" size={14} /> : <span className={`${styles['valuation-status-dot']} ${dirty ? styles['valuation-status-dot--dirty'] : styles['valuation-status-dot--saved']}`} />}
                    <span>
                        {saving ? 'Guardando…' : dirty ? 'Cambios sin guardar' : lastSavedAt ? `Guardado ${lastSavedAt.toLocaleTimeString('es-AR')}` : 'Borrador automático activo'}
                    </span>
                </div>
            )}

            {loadError && <div className={`${styles['valuation-banner']} ${styles['valuation-banner--error']}`}>{loadError}</div>}

            <div className={styles['valuation-form-stack']}>
                {formSections.map((section, index) => {
                    const Icon = section.icon;
                    return (
                        <section key={section.id} className={`card ${styles['valuation-step-card']}`} id={`tasacion-${section.id}`}>
                            <div className={styles['valuation-step-head']}>
                                <div className={styles['valuation-section-heading']}>
                                    <span className={styles['valuation-section-icon']}><Icon size={18} /></span>
                                    <div>
                                        <h2 className={styles['valuation-step-title']}>{index + 1}. {section.label}</h2>
                                        <p className={styles['valuation-step-desc']}>{section.description}</p>
                                    </div>
                                </div>
                            </div>
                            <div className={styles['valuation-step-body']}>{renderStepContent(section.id)}</div>
                        </section>
                    );
                })}
            </div>

            <div className={styles['valuation-form-footer']}>
                <button className="btn btn--ghost" onClick={() => setLocation('/tasar')}>
                    <ArrowLeft size={16} /> Volver al listado
                </button>
                {!isLocked && (
                    <div className={styles['page-actions']}>
                        <button className="btn btn--secondary" onClick={handleSaveNow} disabled={saving}>
                            <Save size={16} /> Guardar borrador
                        </button>
                        <button className="btn btn--primary" onClick={handleFinalize} disabled={finalizeMutation.isPending}>
                            <Lock size={16} /> Finalizar tasación
                        </button>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={confirmDiscard}
                title="Descartar cambios"
                message="Hay cambios sin guardar. ¿Descartar y empezar una tasación nueva?"
                confirmLabel="Descartar"
                danger
                onConfirm={() => {
                    setConfirmDiscard(false);
                    doNewValuation();
                }}
                onCancel={() => setConfirmDiscard(false)}
            />
        </div>
    );
}
