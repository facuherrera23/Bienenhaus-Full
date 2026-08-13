// ============================================================================
// valuationSchemas.ts — Módulo Tasar
// SOURCE OF TRUTH: Zod schemas para validaciones, formularios, DB, API
// Derivado de audit.md (Fase 1) — TAI.html es la única fuente de verdad
// ============================================================================

import { z } from 'zod';

// ============================================================================
// ENUMS — Valores EXACTOS de TAI.html (no modificar, no simplificar)
// ============================================================================

export const TipoInmuebleEnum = z.enum([
    'CASA',
    'DEPTO',
    'LOTE',
    'GALPON',
    'OFICINA',
    'LOCAL',
    'OTRO',
]);

export const DestinoEnum = z.enum(['Venta', 'Alquiler']);

export const NivelCalidadEnum = z.enum([
    '',
    'Excelente',
    'Buena',
    'Media',
    'Regular',
    'Mala',
    'N/A',
]);

export const NivelLuminosidadEnum = z.enum([
    '',
    'Malo',
    'Regular',
    'Promedio',
    'Buena',
    'Excelente',
    'N/A',
]);

export const OrientacionEnum = z.enum([
    '',
    'Norte',
    'Sur',
    'Este',
    'Oeste',
    'Noreste',
    'Sudeste',
    'Noroeste',
    'Sudoeste',
    'N/A',
]);

export const TipoConstruccionEnum = z.enum([
    '',
    'Ladrillo',
    'Metalica',
    'Madera',
    'Bloques de hormigon',
    'N/A',
]);

export const TipoTechoEnum = z.enum([
    '',
    'N/A',
    'Losa H°A°',
    'Losa ceramica',
    'Tejas s/ estr. Madera',
    'Pizarra s/ estr. Madera',
    'Chapa s/ estr. Madera',
    'Chapa s/ estr. Metalica',
]);

export const EstacionamientoEnum = z.enum([
    '',
    'Garaje cubierto',
    'Garaje semicubierto',
    'Garaje descubierto',
    'N/A',
]);

export const SiNoNAEnum = z.enum(['', 'Si', 'No', 'N/A']);

export const ServicioNivelEnum = z.enum(['Central', 'Individual', 'Inexistente', 'N/A']);

export const RubroNivelEnum = z.enum([
    'Optimo / Impecable (Listo para Habitar)',
    'Sencilla (Cosmetica / Menor)',
    'Moderada (Parcial / Funcional)',
    'Grave (Deterioro Estructural)',
    'A Nuevo (Redisenio Total)',
]);

export const TipologiaEdiliciaEnum = z.enum([
    '',
    'Construccion en altura',
    'Construccion de media altura',
    'Viviendas unifamiliares y PH de hasta tres plantas',
    'Viviendas unifamiliares y PH de una planta',
    'Casas quinta',
    'Industrias de gran envergadura',
    'Industrias de pequena y mediana envergadura',
]);

export const CalidadPredomEnum = z.enum([
    '',
    'Excelente',
    'Muy Buena',
    'Buena',
    'Media',
    'Economica',
    'Precaria',
]);

export const PrevalenciaEnum = z.enum([
    '',
    'En todo el entorno',
    'Sobre arterias principales',
    'Ocasional',
    'No relevante o inexistente',
]);

export const NivelSocioEnum = z.enum(['', 'Alto', 'Medio alto', 'Medio', 'Medio Bajo', 'Bajo']);

export const BarrioTipoEnum = z.enum(['', 'Urbano', 'Suburbano', 'Rural']);

export const ConstruidoPctEnum = z.enum([
    '',
    'Mas del 75%',
    'Entre el 75% y el 25%',
    'Menos del 25%',
]);

export const IndiceCrecimientoEnum = z.enum(['', 'Estable', 'Creciente', 'Decreciente']);

export const VigilanciaEnum = z.enum(['', 'Si', 'No']);

export const TendenciaValoresEnum = z.enum(['', 'Creciente', 'Estable', 'Decreciente']);

export const DemandaOfertaEnum = z.enum([
    '',
    'Exceso de Oferta',
    'Falta de Oferta',
    'Relacion Oferta/Demanda Equilibrada',
]);

export const TiempoComercializacionEnum = z.enum([
    '',
    'Menos de 3 meses',
    'Entre 3 y 6 meses',
    'Mas de 6 meses',
]);

export const CambiosUsoEnum = z.enum(['', 'Probable', 'Improbable', 'En Proceso']);

export const FacilidadesEstacionamientoEnum = z.enum([
    '',
    'Garage Propio',
    'Garajes privados',
    'En la via publica',
]);

export const NivelesComparacionEnum = z.enum([
    'Mucho Mejor',
    'Mejor',
    'Igual',
    'Peor',
    'Mucho Peor',
]);

// ============================================================================
// CONSTANTES — PESOS + SLOT_ORDER + NIVELES + RUBROS (EXACTOS de TAI.html)
// ============================================================================

export const PESOS = {
    CASA: {
        vars: [
            ['Calidad de ubicacion', 0.3],
            ['Cantidad de habitaciones', 0.2],
            ['Estado de mantenimiento', 0.2],
            ['Antiguedad', 0.15],
            ['Comodidades', 0.1],
            ['Estacionamiento', 0.05],
        ],
    },
    DEPTO: {
        vars: [
            ['Calidad de ubicacion (barrio)', 0.3],
            ['Cantidad de habitaciones', 0.2],
            ['Ubicacion piso', 0.15],
            ['Antiguedad', 0.15],
            ['Comodidades (edificio)', 0.12],
            ['Ubicacion planta', 0.08],
        ],
    },
    LOTE: {
        vars: [
            ['Calidad de ubicacion', 0.35],
            ['Superficie', 0.25],
            ['Servicios', 0.2],
            ['Acceso', 0.1],
            ['Forma', 0.06],
            ['Orientacion', 0.04],
        ],
    },
    GALPON: {
        vars: [
            ['Calidad de ubicacion', 0.25],
            ['Superficie y altura libre', 0.25],
            ['Acceso', 0.2],
            ['Instalaciones', 0.15],
            ['Estado / antigüedad', 0.1],
            ['Oficinas y servicios anexos', 0.05],
        ],
    },
    OFICINA: {
        vars: [
            ['Calidad de ubicacion', 0.3],
            ['Superficie y layout', 0.2],
            ['Ubicacion piso / vista', 0.15],
            ['Comodidades del edificio', 0.15],
            ['Antiguedad / estado', 0.12],
            ['Estacionamiento', 0.08],
        ],
    },
    LOCAL: {
        vars: [
            ['Calidad de ubicacion', 0.35],
            ['Frente / vidriera', 0.2],
            ['Superficie y forma', 0.15],
            ['Instalaciones', 0.12],
            ['Estado de mantenimiento', 0.1],
            ['Estacionamiento / carga y descarga', 0.08],
        ],
    },
    OTRO: {
        vars: [
            ['Calidad de ubicacion', 0.3],
            ['Superficie', 0.15],
            ['Servicios', 0.15],
            ['Acceso', 0.15],
            ['Instalaciones', 0.15],
            ['Estado de mantenimiento', 0.1],
        ],
    },
} as const;

export const SLOT_ORDER = [3, 2, 5, 0, 4, 1] as const;

export const NIVELES_LIST = ['Mucho Mejor', 'Mejor', 'Igual', 'Peor', 'Mucho Peor'] as const;

export const NIVELES = {
    'Mucho Mejor': -0.75,
    Mejor: -0.3,
    Igual: 0,
    Peor: 0.3,
    'Mucho Peor': 0.75,
} as const;

export const RUBRO_NIVELES = [
    'Optimo / Impecable (Listo para Habitar)',
    'Sencilla (Cosmetica / Menor)',
    'Moderada (Parcial / Funcional)',
    'Grave (Deterioro Estructural)',
    'A Nuevo (Redisenio Total)',
] as const;

export const SERVICIOS_MAP = [
    { key: 'electricidad', label: 'Electricidad', rubro: 'Electricidad' },
    { key: 'gas', label: 'Gas', rubro: 'Gas Natural' },
    { key: 'internet', label: 'Internet', rubro: 'Internet / Redes' },
    { key: 'agua', label: 'Agua', rubro: 'Agua Sanitaria' },
    { key: 'cloaca', label: 'Cloaca', rubro: 'Cloacas y Desagües' },
    { key: 'techos', label: 'Techos y Desagües', rubro: 'Techos y Cubiertas' },
] as const;

export const RUBROS = {
    Electricidad: {
        'Optimo / Impecable (Listo para Habitar)': 0,
        'Sencilla (Cosmetica / Menor)': 0.01,
        'Moderada (Parcial / Funcional)': 0.03,
        'Grave (Deterioro Estructural)': 0.065,
        'A Nuevo (Redisenio Total)': 0.1,
    },
    'Agua Sanitaria': {
        'Optimo / Impecable (Listo para Habitar)': 0,
        'Sencilla (Cosmetica / Menor)': 0.0075,
        'Moderada (Parcial / Funcional)': 0.03,
        'Grave (Deterioro Estructural)': 0.07,
        'A Nuevo (Redisenio Total)': 0.11,
    },
    'Cloacas y Desagües': {
        'Optimo / Impecable (Listo para Habitar)': 0,
        'Sencilla (Cosmetica / Menor)': 0.0075,
        'Moderada (Parcial / Funcional)': 0.03,
        'Grave (Deterioro Estructural)': 0.08,
        'A Nuevo (Redisenio Total)': 0.115,
    },
    'Gas Natural': {
        'Optimo / Impecable (Listo para Habitar)': 0,
        'Sencilla (Cosmetica / Menor)': 0.0075,
        'Moderada (Parcial / Funcional)': 0.03,
        'Grave (Deterioro Estructural)': 0.09,
        'A Nuevo (Redisenio Total)': 0.125,
    },
    'Techos y Cubiertas': {
        'Optimo / Impecable (Listo para Habitar)': 0,
        'Sencilla (Cosmetica / Menor)': 0.015,
        'Moderada (Parcial / Funcional)': 0.045,
        'Grave (Deterioro Estructural)': 0.115,
        'A Nuevo (Redisenio Total)': 0.2,
    },
    'Internet / Redes': {
        'Optimo / Impecable (Listo para Habitar)': 0,
        'Sencilla (Cosmetica / Menor)': 0.0035,
        'Moderada (Parcial / Funcional)': 0.01,
        'Grave (Deterioro Estructural)': 0.03,
        'A Nuevo (Redisenio Total)': 0.045,
    },
} as const;

export const AMBIENTE_IDS = [
    'f_ambCocina',
    'f_ambDormitorios',
    'f_ambTerraza',
    'f_ambComedor',
    'f_ambSuite',
    'f_ambPatio',
    'f_ambCocinaComedor',
    'f_ambSuiteVestidor',
    'f_ambBalcon',
    'f_ambLiving',
    'f_ambDormitVestidor',
    'f_ambLavadero',
    'f_ambLivingComedor',
    'f_ambBanoServicio',
    'f_ambCuartoGuardado',
    'f_ambEscritorio',
    'f_ambBano',
    'f_ambGarage',
] as const;

// ============================================================================
// SCHEMAS BASE — Campos reutilizables
// ============================================================================

const CampoTexto = z.string().optional();
const CampoNumero = z.number().optional();
const CampoFecha = z.string().date().optional();

// ============================================================================
// SCHEMA: Comparable (bloque dinámico)
// ============================================================================

export const ComparableSchema = z.object({
    orden: z.number().int().positive(),
    direccion: CampoTexto,
    barrio: CampoTexto,
    precio: CampoNumero,
    supTerreno: CampoNumero,
    supCubierta: CampoNumero,
    dias: CampoNumero,
    tipoConstruccion: TipoConstruccionEnum,
    antiguedad: CampoNumero,
    fotoUrl: CampoTexto,
    urlOrigen: CampoTexto,
    chars: z.array(NivelesComparacionEnum).length(6),
    included: z.boolean().default(true),
});

export type Comparable = z.infer<typeof ComparableSchema>;

// ============================================================================
// SCHEMA: Servicios (6 rubros)
// ============================================================================

export const ServiciosSchema = z.object({
    electricidad: RubroNivelEnum,
    gas: RubroNivelEnum,
    internet: RubroNivelEnum,
    agua: RubroNivelEnum,
    cloaca: RubroNivelEnum,
    techos: RubroNivelEnum,
});

export type Servicios = z.infer<typeof ServiciosSchema>;

// ============================================================================
// SCHEMA: Ambientes (18 campos)
// ============================================================================

export const AmbientesSchema = z.object({
    f_ambCocina: CampoNumero,
    f_ambDormitorios: CampoNumero,
    f_ambTerraza: CampoNumero,
    f_ambComedor: CampoNumero,
    f_ambSuite: CampoNumero,
    f_ambPatio: CampoNumero,
    f_ambCocinaComedor: CampoNumero,
    f_ambSuiteVestidor: CampoNumero,
    f_ambBalcon: CampoNumero,
    f_ambLiving: CampoNumero,
    f_ambDormitVestidor: CampoNumero,
    f_ambLavadero: CampoNumero,
    f_ambLivingComedor: CampoNumero,
    f_ambBanoServicio: CampoNumero,
    f_ambCuartoGuardado: CampoNumero,
    f_ambEscritorio: CampoNumero,
    f_ambBano: CampoNumero,
    f_ambGarage: CampoNumero,
    f_ambTotalCuartos: CampoNumero,
});

export type Ambientes = z.infer<typeof AmbientesSchema>;

// ============================================================================
// SCHEMA: Comodidades (3 selects)
// ============================================================================

export const ComodidadesSchema = z.object({
    f_comDobleCirculacion: SiNoNAEnum,
    f_comAsador: SiNoNAEnum,
    f_comPiscina: SiNoNAEnum,
});

export type Comodidades = z.infer<typeof ComodidadesSchema>;

// ============================================================================
// SCHEMA: Servicios Básicos (3 selects)
// ============================================================================

export const ServiciosBasicosSchema = z.object({
    f_calefaccion: ServicioNivelEnum,
    f_aireAcondicionado: ServicioNivelEnum,
    f_aguaCaliente: ServicioNivelEnum,
});

export type ServiciosBasicos = z.infer<typeof ServiciosBasicosSchema>;

// ============================================================================
// SCHEMA: Características del Barrio (9 selects)
// ============================================================================

export const CaracteristicasBarrioSchema = z.object({
    f_tipologiasEdilicias: TipologiaEdiliciaEnum,
    f_calidadConstructivaPredom: CalidadPredomEnum,
    f_construccionAlturaPrevalencia: PrevalenciaEnum,
    f_usoComercialPrevalencia: PrevalenciaEnum,
    f_usoIndustrialPrevalencia: PrevalenciaEnum,
    f_nivelSocioeconomicoBarrio: NivelSocioEnum,
    f_barrioTipo: BarrioTipoEnum,
    f_construidoPct: ConstruidoPctEnum,
    f_indiceCrecimiento: IndiceCrecimientoEnum,
});

export type CaracteristicasBarrio = z.infer<typeof CaracteristicasBarrioSchema>;

// ============================================================================
// SCHEMA: Descripción del Barrio (9 selects + 4 % uso suelo)
// ============================================================================

export const DescripcionBarrioSchema = z.object({
    f_servVigilancia: VigilanciaEnum,
    f_tendenciaValores: TendenciaValoresEnum,
    f_demandaOferta: DemandaOfertaEnum,
    f_tiempoComercializacion: TiempoComercializacionEnum,
    f_cambiosUsoTerreno: CambiosUsoEnum,
    f_facilidadesEstacionamiento: FacilidadesEstacionamientoEnum,
    f_usoResidencial: CampoNumero,
    f_usoComercial: CampoNumero,
    f_usoIndustrial: CampoNumero,
    f_usoOtro: CampoNumero,
});

export type DescripcionBarrio = z.infer<typeof DescripcionBarrioSchema>;

// ============================================================================
// SCHEMA: Análisis Comparativo (inputs + resultados)
// ============================================================================

export const AnalisisComparativoInputSchema = z.object({
    ac_dispersion: z.number().min(0).max(100).default(10),
});

export type AnalisisComparativoInput = z.infer<typeof AnalisisComparativoInputSchema>;

export const AnalisisComparativoResultadosSchema = z.object({
    ac_valMin: CampoTexto,
    ac_valProm: CampoTexto,
    ac_valMax: CampoTexto,
});

export type AnalisisComparativoResultados = z.infer<typeof AnalisisComparativoResultadosSchema>;

// ============================================================================
// SCHEMA: Valuación (inputs + resultados calculados)
// ============================================================================

export const ValuacionSeccionInputSchema = z.object({
    v_terrenoPrecio: CampoNumero,
});

export const ValuacionResultadosSchema = z.object({
    v_precioPromedio: CampoTexto,
    v_coefPromedio: CampoTexto,
    v_depreciacionServicios: CampoTexto,
    v_valorFinal: CampoTexto,
    v_terrenoM2: CampoTexto,
    v_terrenoTotal: CampoTexto,
    v_cubiertaM2: CampoTexto,
    v_cubiertaPrecio: CampoTexto,
    v_cubiertaTotal: CampoTexto,
});

export type ValuacionResultados = z.infer<typeof ValuacionResultadosSchema>;

// ============================================================================
// SCHEMA PRINCIPAL: Valuación completa (INPUT para formularios)
// ============================================================================

export const ValuacionInputSchema = z.object({
    f_solicitante: CampoTexto,
    f_fecha: CampoFecha,
    f_telefono: CampoTexto,
    f_destino: DestinoEnum,
    f_fotoFachada: CampoTexto,
    f_direccion: CampoTexto,
    f_barrio: CampoTexto,
    f_localidad: CampoTexto,
    f_provincia: CampoTexto,
    f_supTerreno: CampoNumero,
    f_supConstruida: CampoNumero,
    f_tipo: TipoInmuebleEnum,
    f_precioDolar: CampoNumero,
    f_valorUva: CampoNumero,
    f_tipoConstruccion: TipoConstruccionEnum,
    f_espacioHabitable: CampoNumero,
    f_plantas: CampoNumero,
    f_anioConstruccion: CampoNumero,
    f_impInmobiliarios: CampoNumero,
    f_tipoTecho: TipoTechoEnum,
    f_orientacion: OrientacionEnum,
    f_luminosidad: NivelLuminosidadEnum,
    f_calidadConstructiva: NivelCalidadEnum,
    f_calidadMantenimiento: NivelCalidadEnum,
    f_detallesTerminacion: NivelCalidadEnum,
    f_estacionamientoTipo: EstacionamientoEnum,
    ...AmbientesSchema.shape,
    ...ComodidadesSchema.shape,
    ...ServiciosBasicosSchema.shape,
    f_caracteristicasAdversas: CampoTexto,
    ...ServiciosSchema.shape,
    ...CaracteristicasBarrioSchema.shape,
    ...DescripcionBarrioSchema.shape,
    comparables: z.array(ComparableSchema).default([]),
    ...AnalisisComparativoInputSchema.shape,
    ...ValuacionSeccionInputSchema.shape,
    f_observaciones: CampoTexto,
    locked: z.boolean().default(false),
    finalizedAt: z.string().datetime().optional(),
});

export type ValuacionInput = z.infer<typeof ValuacionInputSchema>;

export const ValuacionDraftSchema = ValuacionInputSchema.extend({
    id: z.string().uuid().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    version: z.number().int().default(1),
});

export type ValuacionDraft = z.infer<typeof ValuacionDraftSchema>;

export const ValuacionDBSchema = ValuacionInputSchema.extend({
    id: z.string().uuid(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable().optional(),
    createdBy: z.string().uuid().optional(),
    updatedBy: z.string().uuid().optional(),
    locked: z.boolean(),
    finalizedAt: z.string().datetime().nullable().optional(),
});

export type ValuacionDB = z.infer<typeof ValuacionDBSchema>;

export const ComparableDBSchema = ComparableSchema.extend({
    id: z.string().uuid(),
    valuationId: z.string().uuid(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type ComparableDB = z.infer<typeof ComparableDBSchema>;

export type {
    ValuacionInput as ValuacionFormData,
    ValuacionDraft as ValuacionDraftData,
    ValuacionDB as ValuacionDBRow,
    Comparable as ComparableData,
    Servicios as ServiciosData,
    Ambientes as AmbientesData,
    Comodidades as ComodidadesData,
    ServiciosBasicos as ServiciosBasicosData,
    CaracteristicasBarrio as CaracteristicasBarrioData,
    DescripcionBarrio as DescripcionBarrioData,
    AnalisisComparativoInput as AnalisisComparativoInputData,
    AnalisisComparativoResultados as AnalisisComparativoResultadosData,
    ValuacionInput as ValuacionInputData,
    ValuacionResultados as ValuacionResultadosData,
};

// ============================================================================
// VALIDADORES DE NEGOCIO (refinements) — Reglas de TAI.html
// ============================================================================

export const ValuacionConValidacionesSchema = ValuacionInputSchema.refine(
    (data) => {
        return (
            (data.f_supTerreno && data.f_supTerreno > 0) ||
            (data.f_supConstruida && data.f_supConstruida > 0)
        );
    },
    {
        message: 'Se requiere al menos Superficie Terreno o Superficie Construida',
        path: ['f_supTerreno'],
    },
)
    .refine(
        (data) => {
            return data.f_tipo && data.f_tipo.length > 0;
        },
        { message: 'Tipo de inmueble es obligatorio', path: ['f_tipo'] },
    )
    .refine(
        (data) => {
            const r = data.f_usoResidencial ?? 0;
            const c = data.f_usoComercial ?? 0;
            const i = data.f_usoIndustrial ?? 0;
            return r + c + i <= 100;
        },
        { message: 'La suma de % uso de suelo no puede exceder 100%', path: ['f_usoResidencial'] },
    )
    .refine(
        (data) => {
            return data.ac_dispersion >= 0 && data.ac_dispersion <= 100;
        },
        { message: 'Dispersión debe estar entre 0 y 100', path: ['ac_dispersion'] },
    );

export type ValuacionConValidaciones = z.infer<typeof ValuacionConValidacionesSchema>;
