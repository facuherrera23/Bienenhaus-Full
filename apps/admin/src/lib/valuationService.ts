// ============================================================================
// valuationService.ts — Módulo Tasar
// Capa de acceso a Supabase: CRUD de tasaciones + drafts + finalize.
// Contrato: ValuacionServiceInterface (types/valuationTypes.ts).
// Los tipos de dominio (camelCase, de valuationSchemas.ts) se mapean a las
// columnas de la DB (snake_case) vía FORM_TO_DB (única fuente del mapping).
// ----------------------------------------------------------------------------
// Reglas de negocio reflejadas acá:
//   - Soft delete: nunca borrado físico (deleted_at), patrón Bienenhaus.
//   - Lock guard: la DB (trg_property_valuations_lock_guard) bloquea UPDATE
//     sobre filas locked=true; finalize()/enableEdit() son las únicas vías
//     para cambiar el estado de ciclo de vida.
//   - Drafts = filas con locked=false y finalized_at IS NULL (decisión #5 de
//     architecture.md: drafts en DB, no localStorage).
//   - Comparables se sincronizan por `orden` (diferencias, no borrado masivo)
//     para preservar ids y los links de valuation_images.comparable_id.
//   - valuation_images es un espejo de foto_fachada_url + fotoUrl: se
//     regenera por completo en cada save (idempotente).
// ============================================================================

import { getCurrentUser, supabase } from './supabase';
import type { Database, Json } from '../types/database';
import { type 
    ComparableData ,type ComparableDB,type 
    NivelesComparacion,type 
    TipoConstruccion,type 
    ValuacionDBRow,type 
    ValuacionDraftData,type 
    ValuacionFilters,type 
    ValuacionFormData,type 
    ValuacionServiceInterface,
} from '../types/valuationTypes';


// ============================================================================
// Tipos de la DB (derivados de los generados en types/database.ts)
// ============================================================================

export type ValuationRow = Database['public']['Tables']['property_valuations']['Row'];
type ValuationInsert = Database['public']['Tables']['property_valuations']['Insert'];
type ValuationUpdate = Database['public']['Tables']['property_valuations']['Update'];
type ComparableRow = Database['public']['Tables']['valuation_comparables']['Row'];
type ComparableInsert = Database['public']['Tables']['valuation_comparables']['Insert'];
type ComparableUpdate = Database['public']['Tables']['valuation_comparables']['Update'];
type ImageRow = Database['public']['Tables']['valuation_images']['Row'];
type ImageInsert = Database['public']['Tables']['valuation_images']['Insert'];

// ============================================================================
// Mapping camelCase (dominio/Zod) → snake_case (DB)
// Única fuente de verdad para ambos sentidos (leer + escribir).
// ============================================================================

const FORM_TO_DB = {
    // Datos cliente
    f_solicitante: 'solicitante',
    f_fecha: 'fecha',
    f_telefono: 'telefono',
    f_destino: 'destino',
    // Foto fachada
    f_fotoFachada: 'foto_fachada_url',
    // Datos inmueble
    f_direccion: 'direccion',
    f_barrio: 'barrio',
    f_localidad: 'localidad',
    f_provincia: 'provincia',
    f_supTerreno: 'sup_terreno',
    f_supConstruida: 'sup_construida',
    f_tipo: 'tipo',
    f_precioDolar: 'precio_dolar',
    f_valorUva: 'valor_uva',
    // Descripción propiedad
    f_tipoConstruccion: 'tipo_construccion',
    f_espacioHabitable: 'espacio_habitable',
    f_plantas: 'plantas',
    f_anioConstruccion: 'anio_construccion',
    f_impInmobiliarios: 'imp_inmobiliarios',
    f_tipoTecho: 'tipo_techo',
    f_orientacion: 'orientacion',
    f_luminosidad: 'luminosidad',
    f_calidadConstructiva: 'calidad_constructiva',
    f_calidadMantenimiento: 'calidad_mantenimiento',
    f_detallesTerminacion: 'detalles_terminacion',
    f_estacionamientoTipo: 'estacionamiento_tipo',
    // Ambientes (18 + total generado)
    f_ambCocina: 'amb_cocina',
    f_ambDormitorios: 'amb_dormitorios',
    f_ambTerraza: 'amb_terraza',
    f_ambComedor: 'amb_comedor',
    f_ambSuite: 'amb_suite',
    f_ambPatio: 'amb_patio',
    f_ambCocinaComedor: 'amb_cocina_comedor',
    f_ambSuiteVestidor: 'amb_suite_vestidor',
    f_ambBalcon: 'amb_balcon',
    f_ambLiving: 'amb_living',
    f_ambDormitVestidor: 'amb_dormit_vestidor',
    f_ambLavadero: 'amb_lavadero',
    f_ambLivingComedor: 'amb_living_comedor',
    f_ambBanoServicio: 'amb_bano_servicio',
    f_ambCuartoGuardado: 'amb_cuarto_guardado',
    f_ambEscritorio: 'amb_escritorio',
    f_ambBano: 'amb_bano',
    f_ambGarage: 'amb_garage',
    f_ambTotalCuartos: 'amb_total_cuartos', // GENERATED — solo lectura
    // Comodidades
    f_comDobleCirculacion: 'com_doble_circulacion',
    f_comAsador: 'com_asador',
    f_comPiscina: 'com_piscina',
    // Servicios básicos
    f_calefaccion: 'calefaccion',
    f_aireAcondicionado: 'aire_acondicionado',
    f_aguaCaliente: 'agua_caliente',
    // Adversas
    f_caracteristicasAdversas: 'caracteristicas_adversas',
    // Servicios (6 rubros)
    electricidad: 'serv_electricidad',
    gas: 'serv_gas',
    internet: 'serv_internet',
    agua: 'serv_agua',
    cloaca: 'serv_cloaca',
    techos: 'serv_techos',
    // Barrio — características
    f_tipologiasEdilicias: 'tipologias_edilicias',
    f_calidadConstructivaPredom: 'calidad_constructiva_predom',
    f_construccionAlturaPrevalencia: 'construccion_altura_prevalencia',
    f_usoComercialPrevalencia: 'uso_comercial_prevalencia',
    f_usoIndustrialPrevalencia: 'uso_industrial_prevalencia',
    f_nivelSocioeconomicoBarrio: 'nivel_socioeconomico_barrio',
    f_barrioTipo: 'barrio_tipo',
    f_construidoPct: 'construido_pct',
    f_indiceCrecimiento: 'indice_crecimiento',
    // Barrio — descripción + % uso de suelo
    f_servVigilancia: 'serv_vigilancia',
    f_tendenciaValores: 'tendencia_valores',
    f_demandaOferta: 'demanda_oferta',
    f_tiempoComercializacion: 'tiempo_comercializacion',
    f_cambiosUsoTerreno: 'cambios_uso_terreno',
    f_facilidadesEstacionamiento: 'facilidades_estacionamiento',
    f_usoResidencial: 'uso_residencial',
    f_usoComercial: 'uso_comercial',
    f_usoIndustrial: 'uso_industrial',
    f_usoOtro: 'uso_otro', // GENERATED — solo lectura
    // Análisis comparativo
    ac_dispersion: 'ac_dispersion',
    // Valuación
    v_terrenoPrecio: 'v_terreno_precio',
    // Observaciones
    f_observaciones: 'observaciones',
    // Estado / auditoría
    locked: 'locked',
    finalizedAt: 'finalized_at',
    id: 'id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    createdBy: 'created_by',
    updatedBy: 'updated_by',
} as const;

/** Claves del dominio que NUNCA se escriben (generadas por DB o auditoría). */
const SKIP_ON_WRITE = new Set([
    'id',
    'createdAt',
    'updatedAt',
    'deletedAt',
    'createdBy',
    'updatedBy',
    'f_ambTotalCuartos', // generated always as (...)
    'f_usoOtro', // generated always as (...)
]);

const DB_TO_FORM: Record<string, string> = {};
for (const [formKey, dbCol] of Object.entries(FORM_TO_DB)) {
    DB_TO_FORM[dbCol] = formKey;
}

const SORT_MAP = {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    fecha: 'fecha',
} as const;

/** Fecha local actual en formato YYYY-MM-DD (columna `fecha` es `date`). */
function todayStr(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Id del usuario autenticado (best-effort; puede ser null con RLS owner_read). */
async function getCurrentUserId(): Promise<string | null> {
    try {
        const user = await getCurrentUser();
        return user?.id ?? null;
    } catch {
        return null;
    }
}

// ============================================================================
// Mappers DB → dominio (snake_case → camelCase)
// ============================================================================

/**
 * Convierte una fila de property_valuations en ValuacionDBRow (dominio).
 * null → undefined (los tipos de dominio son opcionales, no nullable), salvo
 * los campos normalizados abajo. `comparables` se hidrata aparte.
 */
export function toValuacionDBRow(row: ValuationRow): ValuacionDBRow {
    const out: Record<string, unknown> = {};
    for (const [dbCol, value] of Object.entries(row)) {
        const formKey = DB_TO_FORM[dbCol];
        if (!formKey) continue;
        out[formKey] = value === null ? undefined : value;
    }
    out.id = row.id;
    out.createdAt = row.created_at ?? '';
    out.updatedAt = row.updated_at ?? '';
    out.locked = row.locked ?? false;
    out.comparables = [];
    // Cast de frontera: el objeto se arma con el mapping tipado de arriba
    // (mismo patrón que properties.ts con PostgREST).
    return out as ValuacionDBRow;
}

/** Convierte una fila en ValuacionDraftData (borrador: sin estado finalizado). */
function toValuacionDraftData(row: ValuacionDBRow): ValuacionDraftData {
    const { comparables, locked, finalizedAt, ...form } = row;
    return {
        ...form,
        comparables: comparables ?? [],
        id: row.id,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        finalizedAt: finalizedAt ?? undefined,
        locked: locked ?? false,
        version: 1,
    };
}

/** Convierte una fila de valuation_comparables en ComparableDB. */
function toComparableDBRow(row: ComparableRow): ComparableDB {
    return {
        id: row.id,
        valuationId: row.valuation_id,
        createdAt: row.created_at ?? '',
        updatedAt: row.updated_at ?? '',
        orden: row.orden,
        direccion: row.direccion ?? undefined,
        barrio: row.barrio ?? undefined,
        precio: row.precio ?? undefined,
        supTerreno: row.sup_terreno ?? undefined,
        supCubierta: row.sup_cubierta ?? undefined,
        dias: row.dias ?? undefined,
        tipoConstruccion: (row.tipo_construccion ?? '') as TipoConstruccion,
        antiguedad: row.antiguedad ?? undefined,
        fotoUrl: row.foto_url ?? undefined,
        urlOrigen: row.url_origen ?? undefined,
        chars: normalizeChars(row.chars),
        included: row.included ?? true,
    };
}

/**
 * Normaliza `chars` (jsonb) a un array de exactamente 6 niveles.
 * Defensivo contra datos viejos/corruptos: rellena con 'Igual' y recorta.
 */
function normalizeChars(value: Json): NivelesComparacion[] {
    if (!Array.isArray(value)) {
        return Array.from({ length: 6 }, () => 'Igual' as NivelesComparacion);
    }
    const chars = value.filter((v): v is string => typeof v === 'string');
    while (chars.length < 6) chars.push('Igual');
    return chars.slice(0, 6) as NivelesComparacion[];
}

/** Convierte una fila de valuation_images en ValuationImage. */
function toValuationImage(row: ImageRow): ValuationImage {
    return {
        id: row.id,
        comparableId: row.comparable_id,
        url: row.url,
        tipo: row.tipo === 'comparable' ? 'comparable' : 'fachada',
        orden: row.orden,
        createdAt: row.created_at,
    };
}

// ============================================================================
// Payload builders dominio → DB (camelCase → snake_case)
// ============================================================================

/** Payload de INSERT con defaults para las columnas NOT NULL de la DB. */
function toDbInsert(data: ValuacionFormData): ValuationInsert {
    const payload: Record<string, unknown> = {};

    for (const [formKey, value] of Object.entries(data)) {
        if (SKIP_ON_WRITE.has(formKey)) continue;
        const dbCol = FORM_TO_DB[formKey as keyof typeof FORM_TO_DB];
        if (!dbCol || value === undefined) continue;
        payload[dbCol] = value;
    }

    // NOT NULL (migración 0044): defaults si el form dejó el campo vacío
    payload.solicitante = data.f_solicitante?.trim() || 'Sin especificar';
    payload.destino = data.f_destino ?? 'Venta';
    payload.direccion = data.f_direccion ?? '';
    payload.fecha = data.f_fecha ?? todayStr();
    payload.tipo = data.f_tipo ?? 'OTRO';

    return payload as ValuationInsert;
}

/** Payload de UPDATE (parcial: solo los campos presentes en `data`). */
function toDbUpdate(data: Partial<ValuacionFormData>): ValuationUpdate {
    const payload: Record<string, unknown> = {};

    for (const [formKey, value] of Object.entries(data)) {
        if (SKIP_ON_WRITE.has(formKey)) continue;
        const dbCol = FORM_TO_DB[formKey as keyof typeof FORM_TO_DB];
        if (!dbCol || value === undefined) continue;
        payload[dbCol] = value;
    }

    return payload as ValuationUpdate;
}

/** Payload de INSERT para valuation_comparables. */
function toComparableInsert(valuationId: string, comp: ComparableData): ComparableInsert {
    return {
        valuation_id: valuationId,
        orden: comp.orden,
        direccion: comp.direccion,
        barrio: comp.barrio,
        precio: comp.precio,
        sup_terreno: comp.supTerreno,
        sup_cubierta: comp.supCubierta,
        dias: comp.dias,
        tipo_construccion: comp.tipoConstruccion,
        antiguedad: comp.antiguedad,
        foto_url: comp.fotoUrl,
        url_origen: comp.urlOrigen,
        chars: [...comp.chars],
        included: comp.included ?? true,
    };
}

// ============================================================================
// API Functions — Lectura
// ============================================================================

/**
 * Lista tasaciones (soft delete excluido) con filtros opcionales.
 * Los comparables NO se incluyen en la lista (se hidratan con fetchById).
 */
export async function fetchAll(filters: ValuacionFilters = {}): Promise<ValuacionDBRow[]> {
    const {
        search,
        status,
        tipo,
        dateFrom,
        dateTo,
        page,
        pageSize,
        sortBy = 'updatedAt',
        sortOrder = 'desc',
    } = filters;

    let query = supabase.from('property_valuations').select('*').is('deleted_at', null);

    if (search && search.trim()) {
        const term = search.trim();
        query = query.or(
            `solicitante.ilike.%${term}%,direccion.ilike.%${term}%,barrio.ilike.%${term}%`,
        );
    }
    if (status === 'draft') query = query.is('finalized_at', null);
    else if (status === 'finalized') query = query.not('finalized_at', 'is', null);
    if (tipo) query = query.eq('tipo', tipo);
    if (dateFrom) query = query.gte('fecha', dateFrom);
    if (dateTo) query = query.lte('fecha', dateTo);

    query = query.order(SORT_MAP[sortBy], { ascending: sortOrder === 'asc' });

    if (page !== undefined && pageSize !== undefined && pageSize > 0) {
        const from = page * pageSize;
        query = query.range(from, from + pageSize - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(toValuacionDBRow);
}

/** Tasación completa con comparables e imágenes (o null si no existe/borrada). */
export async function fetchById(id: string): Promise<ValuationDetail | null> {
    const { data, error } = await supabase
        .from('property_valuations')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;

    const [comparables, images] = await Promise.all([fetchComparables(id), fetchImages(id)]);
    return { ...toValuacionDBRow(data), comparables, images };
}

/** Comparables de una tasación, ordenados por `orden`. */
export async function fetchComparables(valuationId: string): Promise<ComparableDB[]> {
    const { data, error } = await supabase
        .from('valuation_comparables')
        .select('*')
        .eq('valuation_id', valuationId)
        .order('orden', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toComparableDBRow);
}

/** Imágenes (fachada + comparables) de una tasación. */
export async function fetchImages(valuationId: string): Promise<ValuationImage[]> {
    const { data, error } = await supabase
        .from('valuation_images')
        .select('*')
        .eq('valuation_id', valuationId)
        .order('tipo', { ascending: true })
        .order('orden', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toValuationImage);
}

// ============================================================================
// API Functions — Escritura (relaciones + imágenes)
// ============================================================================

/**
 * Sincroniza los comparables por `orden`: actualiza los existentes, inserta
 * los nuevos y borra los que ya no están. Preserva ids (y los links de
 * valuation_images.comparable_id). Devuelve los comparables guardados.
 */
async function replaceComparables(
    valuationId: string,
    comparables: ComparableData[],
): Promise<Array<{ id: string; orden: number; fotoUrl?: string }>> {
    const sorted = [...comparables].sort((a, b) => a.orden - b.orden);
    const existing = await fetchComparables(valuationId);

    const existingByOrden = new Map<number, ComparableDB>();
    for (const comp of existing) existingByOrden.set(comp.orden, comp);

    const saved: Array<{ id: string; orden: number; fotoUrl?: string }> = [];

    for (const comp of sorted) {
        const current = existingByOrden.get(comp.orden);
        if (current) {
            const patch: ComparableUpdate = {
                direccion: comp.direccion,
                barrio: comp.barrio,
                precio: comp.precio,
                sup_terreno: comp.supTerreno,
                sup_cubierta: comp.supCubierta,
                dias: comp.dias,
                tipo_construccion: comp.tipoConstruccion,
                antiguedad: comp.antiguedad,
                foto_url: comp.fotoUrl,
                url_origen: comp.urlOrigen,
                chars: [...comp.chars],
                included: comp.included ?? true,
            };
            const { error } = await supabase
                .from('valuation_comparables')
                .update(patch)
                .eq('id', current.id);
            if (error) throw new Error(error.message);
            saved.push({ id: current.id, orden: comp.orden, fotoUrl: comp.fotoUrl });
        } else {
            const { data: inserted, error } = await supabase
                .from('valuation_comparables')
                .insert(toComparableInsert(valuationId, comp))
                .select('id')
                .single();
            if (error) throw new Error(error.message);
            saved.push({ id: inserted.id, orden: comp.orden, fotoUrl: comp.fotoUrl });
        }
    }

    const wantedOrdens = new Set(sorted.map((c) => c.orden));
    const stale = existing.filter((c) => !wantedOrdens.has(c.orden));
    if (stale.length > 0) {
        const { error } = await supabase
            .from('valuation_comparables')
            .delete()
            .in(
                'id',
                stale.map((c) => c.id),
            );
        if (error) throw new Error(error.message);
    }

    return saved;
}

/**
 * Regenera valuation_images como espejo de foto_fachada_url + fotoUrl.
 * Idempotente: borra las filas de la tasación y re-inserta las actuales.
 */
async function syncImages(
    valuationId: string,
    fachadaUrl: string | undefined,
    comparables: Array<{ id?: string; orden: number; fotoUrl?: string }>,
): Promise<void> {
    const { error: delError } = await supabase
        .from('valuation_images')
        .delete()
        .eq('valuation_id', valuationId);
    if (delError) throw new Error(delError.message);

    const rows: ImageInsert[] = [];
    if (fachadaUrl) {
        rows.push({
            valuation_id: valuationId,
            comparable_id: null, // null = fachada
            url: fachadaUrl,
            tipo: 'fachada',
            orden: 0,
        });
    }
    for (const comp of comparables) {
        if (!comp.fotoUrl) continue;
        rows.push({
            valuation_id: valuationId,
            comparable_id: comp.id ?? null,
            url: comp.fotoUrl,
            tipo: 'comparable',
            orden: comp.orden,
        });
    }

    if (rows.length > 0) {
        const { error } = await supabase.from('valuation_images').insert(rows);
        if (error) throw new Error(error.message);
    }
}

// ============================================================================
// API Functions — CRUD
// ============================================================================

/** Crea una tasación (main row + comparables + imágenes) y la devuelve completa. */
export async function create(data: ValuacionFormData): Promise<ValuacionDBRow> {
    const userId = await getCurrentUserId();
    const insert: ValuationInsert = {
        ...toDbInsert(data),
        created_by: userId,
        updated_by: userId,
    };

    const { data: created, error } = await supabase
        .from('property_valuations')
        .insert(insert)
        .select('id')
        .single();
    if (error) throw new Error(error.message);

    const comparables = data.comparables ?? [];
    const savedComparables = await replaceComparables(created.id, comparables);
    await syncImages(created.id, data.f_fotoFachada, savedComparables);

    const detail = await fetchById(created.id);
    if (!detail) throw new Error('No se pudo cargar la tasación creada');
    return detail;
}

/**
 * Actualiza una tasación (espera el form completo, patrón saveDraft).
 * Rechaza tasaciones bloqueadas (locked) — usá enableEdit() primero.
 */
export async function update(
    id: string,
    data: Partial<ValuacionFormData>,
): Promise<ValuacionDBRow> {
    const current = await fetchById(id);
    if (!current) throw new Error('Tasación no encontrada');
    if (current.locked) throw new Error('Valuación bloqueada: desbloqueá para editar');

    const userId = await getCurrentUserId();
    const patch: ValuationUpdate = { ...toDbUpdate(data), updated_by: userId };

    const { error } = await supabase.from('property_valuations').update(patch).eq('id', id);
    if (error) throw new Error(error.message);

    if (data.comparables !== undefined) {
        const saved = await replaceComparables(id, data.comparables);
        await syncImages(id, data.f_fotoFachada, saved);
    } else if (data.f_fotoFachada !== undefined) {
        const comparables = await fetchComparables(id);
        await syncImages(
            id,
            data.f_fotoFachada,
            comparables.map((c) => ({ id: c.id, orden: c.orden, fotoUrl: c.fotoUrl })),
        );
    }

    const detail = await fetchById(id);
    if (!detail) throw new Error('No se pudo cargar la tasación actualizada');
    return detail;
}

/** Soft delete: marca deleted_at (patrón papelera de Bienenhaus). */
export async function deleteValuation(id: string): Promise<void> {
    const { error } = await supabase
        .from('property_valuations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw new Error(error.message);
}

/** Soft delete de un borrador (solo si aún no fue finalizado). */
export async function deleteDraft(id: string): Promise<void> {
    const { error } = await supabase
        .from('property_valuations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .is('finalized_at', null);
    if (error) throw new Error(error.message);
}

// ============================================================================
// API Functions — Ciclo de vida (lock / finalize)
// ============================================================================

/**
 * Finaliza una tasación: locked=true + finalized_at=now().
 * Si ya está bloqueada la devuelve tal cual (el guard de la DB impide tocarla).
 */
export async function finalize(id: string): Promise<ValuacionDBRow> {
    const current = await fetchById(id);
    if (!current) throw new Error('Tasación no encontrada');
    if (current.locked) return current;

    const { error } = await supabase
        .from('property_valuations')
        .update({ locked: true, finalized_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw new Error(error.message);

    const detail = await fetchById(id);
    if (!detail) throw new Error('No se pudo cargar la tasación finalizada');
    return detail;
}

/** Desbloquea una tasación finalizada (locked=false, finalized_at=null). */
export async function enableEdit(id: string): Promise<ValuacionDBRow> {
    const current = await fetchById(id);
    if (!current) throw new Error('Tasación no encontrada');
    if (!current.locked) return current;

    const { error } = await supabase
        .from('property_valuations')
        .update({ locked: false, finalized_at: null })
        .eq('id', id);
    if (error) throw new Error(error.message);

    const detail = await fetchById(id);
    if (!detail) throw new Error('No se pudo cargar la tasación');
    return detail;
}

// ============================================================================
// API Functions — Drafts (auto-save, decisión #5 de architecture.md)
// ============================================================================

/** Lista borradores (no finalizados, no borrados), más recientes primero. */
export async function fetchDrafts(): Promise<ValuacionDraftData[]> {
    const { data, error } = await supabase
        .from('property_valuations')
        .select('*')
        .is('deleted_at', null)
        .is('finalized_at', null)
        .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => toValuacionDraftData(toValuacionDBRow(r)));
}

/** Carga un borrador por id, o el más reciente si no se pasa id. */
export async function loadDraft(id?: string): Promise<ValuacionDraftData | null> {
    if (id) {
        const detail = await fetchById(id);
        return detail ? toValuacionDraftData(detail) : null;
    }

    const { data, error } = await supabase
        .from('property_valuations')
        .select('*')
        .is('deleted_at', null)
        .is('finalized_at', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toValuacionDraftData(toValuacionDBRow(data)) : null;
}

/**
 * Upsert de borrador: crea si no hay id, actualiza si lo hay.
 * Devuelve el id de la tasación guardada. Fuerza locked=false (es un draft).
 */
export async function saveDraft(data: ValuacionFormData, id?: string): Promise<string> {
    if (id) {
        const saved = await update(id, { ...data, locked: false, finalizedAt: undefined });
        return saved.id;
    }
    const created = await create({ ...data, locked: false, finalizedAt: undefined });
    return created.id;
}

// ============================================================================
// Interfaz canónica (ValuacionServiceInterface) — para inyección/test
// ============================================================================

export const valuationService: ValuacionServiceInterface = {
    fetchAll,
    fetchById,
    create,
    update,
    delete: deleteValuation,
    finalize,
    enableEdit,
    fetchDrafts,
    loadDraft,
    saveDraft,
    deleteDraft,
};

// ============================================================================
// Tipos adicionales exportados (fotos de la tasación)
// ============================================================================

export interface ValuationImage {
    id: string;
    comparableId: string | null;
    url: string;
    tipo: 'fachada' | 'comparable';
    orden: number | null;
    createdAt: string | null;
}

export interface ValuationDetail extends ValuacionDBRow {
    images: ValuationImage[];
}
