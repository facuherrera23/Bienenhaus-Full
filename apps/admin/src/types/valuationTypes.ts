// ============================================================================
// valuationTypes.ts — Tipos TypeScript derivados de Zod (valuationSchemas.ts)
// Uso en componentes, hooks, servicios — SIN lógica, solo tipos
// ============================================================================

import type { z } from 'zod';

// ============================================================================
// IMPORTS — valores runtime (enums, constantes, schema de validación)
// ============================================================================

import {
    // Constantes
    AMBIENTE_IDS,
    // Types inferidos de Zod
    type Ambientes,
    type AmbientesData,
    type AnalisisComparativoInput,
    type AnalisisComparativoInputData,
    type AnalisisComparativoResultados,
    type AnalisisComparativoResultadosData,
    // Enums (Zod schemas — se usan con `typeof XEnum`)
    type BarrioTipoEnum,
    type CalidadPredomEnum,
    type CambiosUsoEnum,
    type CaracteristicasBarrio,
    type CaracteristicasBarrioData,
    type Comodidades,
    type ComodidadesData,
    type Comparable,
    type ComparableData,
    type ComparableDB,
    type ConstruidoPctEnum,
    type DemandaOfertaEnum,
    type DescripcionBarrio,
    type DescripcionBarrioData,
    type DestinoEnum,
    type EstacionamientoEnum,
    type FacilidadesEstacionamientoEnum,
    type IndiceCrecimientoEnum,
    type NivelCalidadEnum,
    NIVELES,
    NIVELES_LIST,
    type NivelesComparacionEnum,
    type NivelLuminosidadEnum,
    type NivelSocioEnum,
    type OrientacionEnum,
    PESOS,
    type PrevalenciaEnum,
    RUBRO_NIVELES,
    type RubroNivelEnum,
    RUBROS,
    type ServicioNivelEnum,
    type Servicios,
    SERVICIOS_MAP,
    type ServiciosBasicos,
    type ServiciosBasicosData,
    type ServiciosData,
    type SiNoNAEnum,
    SLOT_ORDER,
    type TendenciaValoresEnum,
    type TiempoComercializacionEnum,
    type TipoConstruccionEnum,
    type TipoInmuebleEnum,
    type TipologiaEdiliciaEnum,
    type TipoTechoEnum,
    type ValuacionConValidaciones,
    // Schema de validación (runtime)
    ValuacionConValidacionesSchema,
    type ValuacionDBRow,
    type ValuacionDraftData,
    type ValuacionFormData,
    type ValuacionInput,
    type ValuacionInputData,
    type ValuacionResultados,
    type ValuacionResultadosData,
    type VigilanciaEnum,
} from '../schemas/valuationSchemas';

// ============================================================================
// RE-EXPORTS — Enums y Constantes
// ============================================================================

export type {
    TipoInmuebleEnum,
    DestinoEnum,
    NivelCalidadEnum,
    NivelLuminosidadEnum,
    OrientacionEnum,
    TipoConstruccionEnum,
    TipoTechoEnum,
    EstacionamientoEnum,
    SiNoNAEnum,
    ServicioNivelEnum,
    RubroNivelEnum,
    TipologiaEdiliciaEnum,
    CalidadPredomEnum,
    PrevalenciaEnum,
    NivelSocioEnum,
    BarrioTipoEnum,
    ConstruidoPctEnum,
    IndiceCrecimientoEnum,
    VigilanciaEnum,
    TendenciaValoresEnum,
    DemandaOfertaEnum,
    TiempoComercializacionEnum,
    CambiosUsoEnum,
    FacilidadesEstacionamientoEnum,
    NivelesComparacionEnum,
};

export {
    PESOS,
    SLOT_ORDER,
    NIVELES_LIST,
    NIVELES,
    RUBRO_NIVELES,
    SERVICIOS_MAP,
    RUBROS,
    AMBIENTE_IDS,
};

// ============================================================================
// RE-EXPORTS — Types inferidos (para uso en componentes/hooks)
// ============================================================================

export type {
    Comparable,
    ComparableDB,
    Servicios,
    Ambientes,
    Comodidades,
    ServiciosBasicos,
    CaracteristicasBarrio,
    DescripcionBarrio,
    AnalisisComparativoInput,
    AnalisisComparativoResultados,
    ValuacionInput,
    ValuacionResultados,
    ValuacionFormData,
    ValuacionDraftData,
    ValuacionDBRow,
    ComparableData,
    ServiciosData,
    AmbientesData,
    ComodidadesData,
    ServiciosBasicosData,
    CaracteristicasBarrioData,
    DescripcionBarrioData,
    AnalisisComparativoInputData,
    AnalisisComparativoResultadosData,
    ValuacionInputData,
    ValuacionResultadosData,
    ValuacionConValidaciones,
};

// ============================================================================
// TIPOS ADICIONALES PARA UI / COMPONENTES
// ============================================================================

export type TipoInmueble = z.infer<typeof TipoInmuebleEnum>;
export type Destino = z.infer<typeof DestinoEnum>;
export type NivelCalidad = z.infer<typeof NivelCalidadEnum>;
export type NivelLuminosidad = z.infer<typeof NivelLuminosidadEnum>;
export type Orientacion = z.infer<typeof OrientacionEnum>;
export type TipoConstruccion = z.infer<typeof TipoConstruccionEnum>;
export type TipoTecho = z.infer<typeof TipoTechoEnum>;
export type Estacionamiento = z.infer<typeof EstacionamientoEnum>;
export type SiNoNA = z.infer<typeof SiNoNAEnum>;
export type ServicioNivel = z.infer<typeof ServicioNivelEnum>;
export type RubroNivel = z.infer<typeof RubroNivelEnum>;
export type TipologiaEdilicia = z.infer<typeof TipologiaEdiliciaEnum>;
export type CalidadPredom = z.infer<typeof CalidadPredomEnum>;
export type Prevalencia = z.infer<typeof PrevalenciaEnum>;
export type NivelSocio = z.infer<typeof NivelSocioEnum>;
export type BarrioTipo = z.infer<typeof BarrioTipoEnum>;
export type ConstruidoPct = z.infer<typeof ConstruidoPctEnum>;
export type IndiceCrecimiento = z.infer<typeof IndiceCrecimientoEnum>;
export type Vigilancia = z.infer<typeof VigilanciaEnum>;
export type TendenciaValores = z.infer<typeof TendenciaValoresEnum>;
export type DemandaOferta = z.infer<typeof DemandaOfertaEnum>;
export type TiempoComercializacion = z.infer<typeof TiempoComercializacionEnum>;
export type CambiosUso = z.infer<typeof CambiosUsoEnum>;
export type FacilidadesEstacionamiento = z.infer<typeof FacilidadesEstacionamientoEnum>;
export type NivelesComparacion = z.infer<typeof NivelesComparacionEnum>;

// ============================================================================
// TIPOS PARA FORMULARIOS REACTIVOS (preact-signals / React Hook Form)
// ============================================================================

export type ValuacionFormValues = ValuacionFormData;

export type ComparableFormValues = ComparableData;

export type ServiciosFormValues = ServiciosData;

export type AmbientesFormValues = AmbientesData;

export type ComodidadesFormValues = ComodidadesData;

export type ServiciosBasicosFormValues = ServiciosBasicosData;

export type CaracteristicasBarrioFormValues = CaracteristicasBarrioData;

export type DescripcionBarrioFormValues = DescripcionBarrioData;

export type AnalisisComparativoFormValues = AnalisisComparativoInputData;

export type ValuacionCalculadaFormValues = ValuacionResultadosData;

// ============================================================================
// TIPOS PARA COMPONENTES ESPECÍFICOS
// ============================================================================

export interface ComparableBlockProps {
    comparable: Comparable;
    index: number;
    tipoInmueble: TipoInmueble;
    onUpdate: (index: number, data: Partial<Comparable>) => void;
    onRemove: (index: number) => void;
    onExtractFromUrl: (index: number, url: string) => Promise<void>;
    onPhotoChange: (index: number, dataUrl: string | null) => void;
}

export interface CharacteristicsGridProps {
    tipoInmueble: TipoInmueble;
    chars: readonly NivelesComparacion[];
    onChange: (index: number, value: NivelesComparacion) => void;
}

export interface AmbienteGridProps {
    ambientes: AmbientesData;
    onChange: (key: keyof AmbientesData, value: number | undefined) => void;
}

export interface ValorBoxProps {
    label: string;
    value: string | number;
    isFinal?: boolean;
    currency?: 'USD' | 'UVA';
}

export interface CoefBoxProps {
    label: string;
    value: number;
    precision?: number;
}

export interface ValuationChartProps {
    data: Array<{ label: string; low: number; high: number; included: boolean }>;
    dispersion: number;
    promedio?: { low: number; high: number };
}

export interface MapWrapperProps {
    propiedad: { direccion: string; barrio: string; localidad: string; provincia: string };
    comparables: Array<{ direccion: string; barrio: string; label: string }>;
    onUpdate: () => void;
}

export interface PhotoUploaderProps {
    value: string | null;
    onChange: (dataUrl: string | null) => void;
    placeholder?: string;
    aspectRatio?: string;
    maxWidth?: number;
}

export interface ActionBarProps {
    onSave: () => void;
    onEdit: () => void;
    onFinish: () => void;
    onPdf: () => void;
    locked: boolean;
    saving?: boolean;
}

export interface SectionCardProps {
    title: string;
    children: React.ReactNode;
    initiallyCollapsed?: boolean;
    printGroupId?: string;
}

export interface AccordionProps {
    title: string;
    children: React.ReactNode;
    initiallyOpen?: boolean;
    printGroupId?: string;
}

// ============================================================================
// TIPOS PARA HOOKS
// ============================================================================

export interface UseTasacionReturn {
    form: ValuacionFormValues;
    setField: <K extends keyof ValuacionFormValues>(key: K, value: ValuacionFormValues[K]) => void;
    setFields: (fields: Partial<ValuacionFormValues>) => void;
    resetForm: (data?: Partial<ValuacionFormValues>) => void;
    locked: boolean;
    finalizedAt: string | undefined;
    setLocked: (locked: boolean) => void;
    finalize: () => Promise<void>;
    enableEdit: () => Promise<void>;
    saveDraft: () => Promise<void>;
    isSaving: boolean;
    lastSaved: string | null;
}

export interface UseComparablesReturn {
    comparables: Comparable[];
    addComparable: (prefill?: Partial<Comparable>) => void;
    removeComparable: (index: number) => void;
    updateComparable: (index: number, data: Partial<Comparable>) => void;
    reorderComparables: (fromIndex: number, toIndex: number) => void;
    extractFromUrl: (index: number, url: string) => Promise<void>;
    setPhoto: (index: number, dataUrl: string | null) => void;
}

export interface UseTasacionCalculationsReturn {
    recalcAll: (form: ValuacionFormValues) => ValuacionCalculadaFormValues;
    coefCondicionesFor: (comparable: Comparable, tipoInmueble: TipoInmueble) => number;
    coefDepreciacionPropia: (servicios: ServiciosData) => number;
    recalcAmbientes: (ambientes: AmbientesData) => number;
    recalcUsoTerreno: (uso: {
        residencial: number;
        comercial: number;
        industrial: number;
    }) => number;
    precioM2Comparable: (comparable: Comparable) => number;
}

export interface UseGeocodingReturn {
    geocode: (query: string) => Promise<{ lat: number; lon: number } | null>;
    geocodeAll: (
        points: Array<{ label: string; query: string; color: string }>,
    ) => Promise<Array<{ label: string; lat: number; lon: number; color: string }>>;
    extractFromUrl: (url: string) => Promise<Partial<Comparable> | null>;
}

export interface UsePhotoUploadReturn {
    upload: (file: File, bucket?: string) => Promise<string>;
    uploadMultiple: (files: File[], bucket?: string) => Promise<string[]>;
    remove: (url: string) => Promise<void>;
}

export interface UseDraftPersistenceReturn {
    loadDraft: (id?: string) => Promise<ValuacionDraftData | null>;
    saveDraft: (data: ValuacionFormData, id?: string) => Promise<string>;
    deleteDraft: (id: string) => Promise<void>;
    listDrafts: () => Promise<Array<{ id: string; updatedAt: string; solicitante: string }>>;
}

// ============================================================================
// TIPOS PARA SERVICIOS / API
// ============================================================================

export interface ValuacionServiceInterface {
    fetchAll: (filters?: ValuacionFilters) => Promise<ValuacionDBRow[]>;
    fetchById: (id: string) => Promise<ValuacionDBRow | null>;
    create: (data: ValuacionFormData) => Promise<ValuacionDBRow>;
    update: (id: string, data: Partial<ValuacionFormData>) => Promise<ValuacionDBRow>;
    delete: (id: string) => Promise<void>;
    finalize: (id: string) => Promise<ValuacionDBRow>;
    enableEdit: (id: string) => Promise<ValuacionDBRow>;
    fetchDrafts: () => Promise<ValuacionDraftData[]>;
    loadDraft: (id?: string) => Promise<ValuacionDraftData | null>;
    saveDraft: (data: ValuacionFormData, id?: string) => Promise<string>;
    deleteDraft: (id: string) => Promise<void>;
}

export interface ValuacionFilters {
    search?: string;
    status?: 'draft' | 'finalized' | 'all';
    tipo?: TipoInmueble;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'fecha';
    sortOrder?: 'asc' | 'desc';
}

export interface GeocodingServiceInterface {
    geocode: (query: string) => Promise<{ lat: number; lon: number } | null>;
    geocodeAll: (
        queries: string[],
    ) => Promise<Array<{ query: string; lat: number; lon: number } | null>>;
    extractFromUrl: (url: string) => Promise<Partial<Comparable> | null>;
}

export interface PhotoUploadServiceInterface {
    upload: (file: File, valuationId: string, comparableId?: string) => Promise<string>;
    uploadMultiple: (
        files: File[],
        valuationId: string,
        comparableId?: string,
    ) => Promise<string[]>;
    remove: (url: string) => Promise<void>;
    getSignedUrl: (path: string) => Promise<string>;
}

// ============================================================================
// TIPOS PARA PDF / IMPRESIÓN
// ============================================================================

export interface PrintLayoutConfig {
    printGroups: string[];
    pageBreaks: string[];
    hideElements: string[];
    forceExpandAccordions: string[];
}

export const PRINT_CONFIG: PrintLayoutConfig = {
    printGroups: ['printGroupPropiedad', 'printGroupBarrio', 'sectionAnalisisComparativo'],
    pageBreaks: ['#printGroupPropiedad', '#printGroupBarrio', '#sectionAnalisisComparativo'],
    hideElements: [
        '.action-bar',
        '.toast',
        '.add-btn',
        '.remove',
        '.comp-block[data-included="false"]',
    ],
    forceExpandAccordions: ['section.card'],
};

// ============================================================================
// ZOD INSTANCE PARA VALIDACIÓN EN RUNTIME (si se necesita)
// ============================================================================

export const ValuacionSchema = ValuacionConValidacionesSchema;
export type ValuacionSchemaType = ValuacionConValidaciones;
