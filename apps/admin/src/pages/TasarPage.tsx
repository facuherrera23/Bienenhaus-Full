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
    useEnableEditValuation,
    useFinalizeValuation,
    useSaveValuationDraft,
    useValuation,
    useValuations,
    useDeleteValuation,
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
    value: