import { supabase } from './supabase';
import { useList, useItem, useCreate, useUpdate, useDelete, useRpc, useUpload, useExport, queryKeys, type ExportColumn } from './api';

export type PropertyStatus =
  | 'borrador'
  | 'en_revision'
  | 'publicada'
  | 'pausada'
  | 'vendida'
  | 'alquilada'
  | 'archivada';

export type ListingType =
  | 'venta'
  | 'alquiler'
  | 'venta_alquiler'
  | 'emprendimiento';

export interface PropertyRow {
  id: string;
  code: number;
  title: string;
  status: PropertyStatus;
  listing_type: ListingType;
  price: number | null;
  currency: 'USD' | 'ARS';
  location: string;
  area_total: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  featured: boolean;
  published_at: string | null;
  updated_at: string;
  cover_url: string | null;
}

export interface PropertyDetail extends PropertyRow {
  description: string | null;
  expenses: number | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  area_covered: number | null;
  garages: number | null;
  floors: number | null;
  floor_number: number | null;
  antiquity: number | null;
  orientation: string | null;
  condition: 'nuevo' | 'usado' | 'a_refaccionar';
  video_url: string | null;
  images: { id: string; url: string; is_cover: boolean; sort_order: number }[];
  ml_meta: {
    ml_item_id: number | null;
    status: string | null;
    permalink: string | null;
    price: number | null;
    last_sync_at: string | null;
  } | null;
}

export const STATUS_LABEL: Record<PropertyStatus, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  publicada: 'Publicada',
  pausada: 'Pausada',
  vendida: 'Vendida',
  alquilada: 'Alquilada',
  archivada: 'Archivada',
};

export const STATUS_TONE: Record<PropertyStatus, string> = {
  borrador: 'neutral',
  en_revision: 'warning',
  publicada: 'success',
  pausada: 'warning',
  vendida: 'info',
  alquilada: 'info',
  archivada: 'neutral',
};

// Legacy functions (keeping for backward compatibility)
export async function fetchProperties(): Promise<PropertyRow[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      'id, code, title, status, listing_type, price, currency, area_total, bedrooms, bathrooms, featured, published_at, updated_at, location:locations(name), images:property_images(url, is_cover)',
    )
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((p: any) => {
    const locName = Array.isArray(p.location) ? p.location[0]?.name : p.location?.name;
    const cover = p.images?.find((img: any) => img.is_cover);
    return {
      id: p.id,
      code: p.code,
      title: p.title,
      status: p.status,
      listing_type: p.listing_type,
      price: p.price,
      currency: p.currency,
      location: locName ?? 'Sin zona',
      area_total: p.area_total,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      featured: p.featured,
      published_at: p.published_at,
      updated_at: p.updated_at,
      cover_url: cover?.url ?? null,
    };
  });
}

// ==================== NEW API LAYER HOOKS ====================

const PROPERTIES_PATH = 'properties';

export function useProperties(filters?: {
  status?: PropertyStatus;
  listing_type?: ListingType;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const apiFilters: Record<string, any> = { deleted_at: 'is.null' };
  
  if (filters?.status) apiFilters.status = `eq.${filters.status}`;
  if (filters?.listing_type) apiFilters.listing_type = `eq.${filters.listing_type}`;
  if (filters?.search) apiFilters.title = `ilike.*${filters.search}*`;

  return useList<PropertyRow>({
    queryKey: queryKeys.properties(filters),
    path: PROPERTIES_PATH,
    select: 'id,code,title,status,listing_type,price,currency,area_total,bedrooms,bathrooms,featured,published_at,updated_at,location:locations(name),images:property_images(url,is_cover)',
    filters: apiFilters,
    page: filters?.page ?? 1,
    pageSize: filters?.pageSize ?? 20,
    orderBy: 'updated_at',
    ascending: false,
  });
}

export function useProperty(id: string | null) {
  return useItem<PropertyDetail>(
    queryKeys.property(id ?? ''),
    PROPERTIES_PATH,
    id,
    !!id
  );
}

export function useCreateProperty() {
  return useCreate<PropertyRow, Partial<PropertyDetail>>(
    queryKeys.properties(),
    PROPERTIES_PATH,
    {
      invalidateKeys: [queryKeys.properties()],
    }
  );
}

export function useUpdateProperty() {
  return useUpdate<PropertyRow, Partial<PropertyDetail>>(
    queryKeys.properties(),
    PROPERTIES_PATH,
    {
      invalidateKeys: [queryKeys.properties()],
    }
  );
}

export function useDeleteProperty() {
  return useDelete(
    queryKeys.properties(),
    PROPERTIES_PATH,
    {
      invalidateKeys: [queryKeys.properties()],
    }
  );
}

export function usePropertyImages(_propertyId: string) {
  return useUpload('property-images');
}

export function usePublishToML() {
  return useRpc<{ itemId: number; permalink: string }, { p_property_id: string; p_operation: 'publish' | 'update' | 'delete' }>(
    'ml_enqueue',
    {
      onSuccess: (data) => {
        console.log('ML enqueue result:', data);
      },
    }
  );
}

// ML Queue hooks
export function useMLQueue() {
  return useList<any>({
    queryKey: queryKeys.mlQueue(),
    path: 'ml_sync_queue',
    select: 'id,property_id,operation,status,attempts,max_attempts,next_attempt_at,ml_item_id,last_error,created_at,property:properties(title,code)',
    filters: {},
    page: 1,
    pageSize: 50,
    orderBy: 'created_at',
    ascending: false,
  });
}

export function useMLMeta() {
  return useList<any>({
    queryKey: queryKeys.mlMeta(),
    path: 'property_ml_meta',
    select: 'property_id,ml_item_id,status,permalink,price,last_sync_at,last_sync_status,property:properties(title,code)',
    filters: {},
    page: 1,
    pageSize: 100,
    orderBy: 'last_sync_at',
    ascending: false,
  });
}

export function useMLOverview() {
  return useRpc<any, Record<string, never>>('ml_get_connection');
}

// Export columns for properties
export const PROPERTY_EXPORT_COLUMNS: ExportColumn<PropertyRow>[] = [
  { key: 'code', label: 'Código' },
  { key: 'title', label: 'Título' },
  { key: 'status', label: 'Estado', format: (v) => STATUS_LABEL[v as PropertyStatus] ?? v },
  { key: 'listing_type', label: 'Tipo operación' },
  { key: 'price', label: 'Precio', format: (v) => v ? `${v.toLocaleString('es-AR')} USD` : '—' },
  { key: 'currency', label: 'Moneda' },
  { key: 'location', label: 'Ubicación' },
  { key: 'area_total', label: 'Sup. total (m²)', format: (v) => v ?? '—' },
  { key: 'bedrooms', label: 'Dormitorios', format: (v) => v ?? '—' },
  { key: 'bathrooms', label: 'Baños', format: (v) => v ?? '—' },
  { key: 'featured', label: 'Destacada', format: (v) => v ? 'Sí' : 'No' },
  { key: 'published_at', label: 'Publicada', format: (v) => v ? new Date(v).toLocaleDateString('es-AR') : '—' },
  { key: 'updated_at', label: 'Actualizada', format: (v) => v ? new Date(v).toLocaleDateString('es-AR') : '—' },
];

export function useExportProperties() {
  const { exportToCSV } = useExport<PropertyRow>();
  const properties = useProperties({ pageSize: 1000 }); // Fetch all for export
  
  return {
    exportToCSV: async (filename = 'propiedades') => {
      if (properties.data?.data) {
        await exportToCSV({
          data: properties.data.data,
          columns: PROPERTY_EXPORT_COLUMNS,
          filename,
        });
      }
    },
    isLoading: properties.isPending,
  };
}

// Export query keys for external invalidation
export { queryKeys };