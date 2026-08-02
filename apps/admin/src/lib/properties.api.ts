import { useList, useItem, useCreate, useUpdate, useDelete, useRpc, useUpload, useExport, useMutation, queryKeys, type ExportColumn } from './api';
import {
  duplicateProperty,
  softDeleteProperty,
} from './properties';
import { bulkEnqueueMl } from './ml';
import type {
  PropertyStatus,
  ListingType,
  PropertyRow,
  PropertyDetail,
  PropertyFormValues,
  PropertyImage,
  LocationOption,
  MlMetaRow,
  MlQueueRow,
  MlOperation,
} from '../types';
import {
  STATUS_LABEL,
  STATUS_TONE,
  LISTING_TYPE_LABEL,
} from '../types';

const PROPERTIES_PATH = 'properties';

// ==================== QUERY HOOKS ====================

export function useProperties(filters?: {
  status?: PropertyStatus;
  listing_type?: ListingType;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const apiFilters: Record<string, unknown> = { deleted_at: 'is.null' };

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

export function useDuplicateProperty() {
  return useMutation({
    mutationFn: async (id: string) => {
      return duplicateProperty(id);
    },
  });
}

export function useSoftDeleteProperty() {
  return useMutation({
    mutationFn: async (id: string) => {
      return softDeleteProperty(id);
    },
  });
}

export function useLocations() {
  return useList<LocationOption>({
    queryKey: queryKeys.leads([{ locations: true }]),
    path: 'locations',
    select: 'id,name,zone',
    filters: { is_active: 'eq.true' },
    page: 1,
    pageSize: 100,
    orderBy: 'sort_order',
    ascending: true,
  });
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

export function useBulkEnqueueMl() {
  return useMutation({
    mutationFn: async ({ propertyIds, operation }: { propertyIds: string[]; operation: 'publish' | 'update' | 'delete' }) => {
      return bulkEnqueueMl(propertyIds, operation);
    },
  });
}

// ==================== ML QUEUE HOOKS ====================

export function useMLQueue() {
  return useList<unknown>({
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
  return useList<unknown>({
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
  return useRpc<unknown, Record<string, never>>('ml_get_connection');
}

// ==================== FORM HELPERS ====================

export function toFormValues(property: PropertyDetail): PropertyFormValues {
  const p = property as any;
  return {
    title: property.title ?? '',
    status: (property.status as PropertyStatus) ?? 'borrador',
    listing_type: (property.listing_type as ListingType) ?? 'venta',
    price: property.price ?? null,
    currency: property.currency ?? 'USD',
    expenses: property.expenses ?? null,
    description: property.description ?? '',
    address: property.address ?? '',
    location_id: p.location_id ?? null,
    area_total: property.area_total ?? null,
    area_covered: property.area_covered ?? null,
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    garages: property.garages ?? null,
    floors: property.floors ?? null,
    year_built: p.year_built ?? null,
    featured: property.featured ?? false,
    video_url: property.video_url ?? '',
    latitude: property.latitude ?? null,
    longitude: property.longitude ?? null,
  };
}

export function toNumeric(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return isNaN(n) ? null : n;
}

// ==================== EXPORT ====================

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
  const properties = useProperties({ pageSize: 1000 });

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

export { queryKeys };
export type { PropertyStatus, ListingType, PropertyRow, PropertyDetail, PropertyFormValues, PropertyImage, LocationOption };
export type { MlMetaRow, MlQueueRow, MlOperation };
export { STATUS_LABEL, STATUS_TONE, LISTING_TYPE_LABEL };