import {
    type ExportColumn,
    queryKeys,
    useCreate,
    useDelete,
    useExport,
    useItem,
    useList,
    useMutation,
    useRpc,
    useUpdate,
    useUpload,
} from './api';
import { useQueryClient } from '@tanstack/react-query';
import {
    createProperty,
    deletePropertyImage,
    duplicateProperty,
    fetchDeletedProperties,
    fetchLocations,
    fetchProperties,
    fetchProperty,
    permanentDeleteProperty,
    reorderPropertyImages,
    restoreProperty,
    setPropertyCover,
    slugify,
    softDeleteProperty,
    updateProperty,
    updatePropertyStatus,
    uploadPropertyImage,
    uploadPropertyImages,
} from './properties';
import { embedProperty, type MetaApiRow, type QueueApiRow } from './ml';
import type {
    ListingType,
    LocationOption,
    MlMetaRow,
    MlOperation,
    MlQueueRow,
    PropertyDetail,
    PropertyFormValues,
    PropertyImage,
    PropertyRow,
    PropertyStatus,
} from '../types';
import { LISTING_TYPE_LABEL, STATUS_LABEL, STATUS_TONE } from '../types';

const PROPERTIES_PATH = 'properties';

// ============================================================
// DB row types with embedded relations
// ============================================================

interface PropertyApiRow {
    id: string;
    code: number;
    title: string;
    status: PropertyStatus;
    listing_type: ListingType;
    price: number | null;
    currency: 'USD' | 'ARS';
    area_total: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    featured: boolean;
    published_at: string | null;
    updated_at: string;
    location: { name: string } | { name: string }[] | null;
    images: { url: string; is_cover: boolean }[];
}

// ============================================================
// Mappers
// ============================================================

function toPropertyRow(p: PropertyApiRow): PropertyRow {
    const locName = Array.isArray(p.location) ? p.location[0]?.name : p.location?.name;
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
        cover_url: p.images?.find((i) => i.is_cover)?.url ?? p.images?.[0]?.url ?? null,
    };
}

function toMLQueueRow(q: QueueApiRow): MlQueueRow {
    const prop = embedProperty(q.property);
    return {
        id: q.id,
        property_id: q.property_id,
        operation: q.operation,
        status: q.status,
        attempts: q.attempts,
        max_attempts: q.max_attempts,
        next_attempt_at: q.next_attempt_at,
        ml_item_id: q.ml_item_id,
        last_error: q.last_error,
        created_at: q.created_at,
        property_title: prop.title,
        property_code: prop.code,
    };
}

function toMLMetaRow(m: MetaApiRow): MlMetaRow {
    const prop = embedProperty(m.property);
    return {
        property_id: m.property_id,
        ml_item_id: m.ml_item_id,
        status: m.status,
        permalink: m.permalink,
        price: m.price === null ? null : Number(m.price),
        last_sync_at: m.last_sync_at,
        last_sync_status: m.last_sync_status,
        property_title: prop.title,
        property_code: prop.code,
    };
}

// ============================================================
// Query Hooks - Properties
// ============================================================

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
    if (filters?.search) {
        const escaped = filters.search.replace(/[*%]/g, '');
        apiFilters.title = `ilike.*${escaped}*`;
    }

    return useList<PropertyRow, PropertyApiRow>({
        queryKey: queryKeys.properties(filters),
        path: PROPERTIES_PATH,
        select: 'id,code,title,status,listing_type,price,currency,area_total,bedrooms,bathrooms,featured,published_at,updated_at,location:locations(name),images:property_images(url,is_cover)',
        filters: apiFilters,
        page: filters?.page ?? 1,
        pageSize: filters?.pageSize ?? 20,
        orderBy: 'updated_at',
        ascending: false,
        transform: toPropertyRow,
    });
}

export function useProperty(id: string | null) {
    return useItem<PropertyDetail>(queryKeys.property(id ?? ''), PROPERTIES_PATH, id, !!id);
}

export function useFetchDeletedProperties() {
    return useList<PropertyRow, PropertyApiRow>({
        queryKey: queryKeys.properties({ deleted: true }),
        path: PROPERTIES_PATH,
        select: 'id,code,title,status,listing_type,price,currency,area_total,bedrooms,bathrooms,featured,published_at,updated_at,location:locations(name),images:property_images(url,is_cover)',
        filters: { deleted_at: 'not.is.null' },
        page: 1,
        pageSize: 50,
        orderBy: 'deleted_at',
        ascending: false,
        transform: toPropertyRow,
    });
}

// ============================================================
// Query Hooks - Locations
// ============================================================

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

// ============================================================
// Mutation Hooks - CRUD
// ============================================================

export function useCreateProperty() {
    return useCreate<PropertyRow, Partial<PropertyDetail>>(
        queryKeys.properties(),
        PROPERTIES_PATH,
        {
            invalidateKeys: [
                queryKeys.properties(),
                queryKeys.leads(),
                queryKeys.owners(),
                ['recent-activity'],
            ],
        },
    );
}

export function useUpdateProperty() {
    return useUpdate<PropertyRow, Partial<PropertyDetail>>(
        queryKeys.properties(),
        PROPERTIES_PATH,
        {
            invalidateKeys: [
                queryKeys.properties(),
                queryKeys.leads(),
                queryKeys.owners(),
                ['recent-activity'],
            ],
        },
    );
}

export function useDeleteProperty() {
    return useDelete(queryKeys.properties(), PROPERTIES_PATH, {
        invalidateKeys: [
            queryKeys.properties(),
            queryKeys.leads(),
            queryKeys.owners(),
            ['recent-activity'],
        ],
    });
}

export function useDuplicateProperty() {
    return useMutation({
        mutationFn: async (id: string) => {
            return duplicateProperty(id);
        },
    });
}

export function useUpdatePropertyStatus() {
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: PropertyStatus }) => {
            return updatePropertyStatus(id, status);
        },
    });
}

// ============================================================
// Mutation Hooks - Images
// ============================================================

export function usePropertyImages() {
    return useUpload('property-images');
}

export function useUploadPropertyImage() {
    return useMutation({
        mutationFn: async ({
            propertyId,
            file,
            alt,
        }: {
            propertyId: string;
            file: File;
            alt?: string;
        }) => {
            return uploadPropertyImage(propertyId, file, alt);
        },
    });
}

export function useUploadPropertyImages() {
    return useMutation({
        mutationFn: async ({ propertyId, files }: { propertyId: string; files: File[] }) => {
            return uploadPropertyImages(propertyId, files);
        },
    });
}

export function useDeletePropertyImage() {
    return useMutation({
        mutationFn: async (imageId: string) => {
            return deletePropertyImage(imageId);
        },
    });
}

export function useSetPropertyCover() {
    return useMutation({
        mutationFn: async ({ propertyId, imageId }: { propertyId: string; imageId: string }) => {
            return setPropertyCover(propertyId, imageId);
        },
    });
}

export function useReorderPropertyImages() {
    return useMutation({
        mutationFn: async ({
            propertyId,
            imageIds,
        }: {
            propertyId: string;
            imageIds: string[];
        }) => {
            return reorderPropertyImages(propertyId, imageIds);
        },
    });
}

// ============================================================
// Mutation Hooks - Soft Delete & Restore
// ============================================================

export function useSoftDeleteProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            return softDeleteProperty(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.properties() });
            queryClient.invalidateQueries({ queryKey: queryKeys.leads() });
            queryClient.invalidateQueries({ queryKey: queryKeys.owners() });
            queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
        },
    });
}

export function useRestoreProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            return restoreProperty(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.properties() });
            queryClient.invalidateQueries({ queryKey: queryKeys.leads() });
            queryClient.invalidateQueries({ queryKey: queryKeys.owners() });
            queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
        },
    });
}

export function usePermanentDeleteProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            return permanentDeleteProperty(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.properties() });
            queryClient.invalidateQueries({ queryKey: queryKeys.leads() });
            queryClient.invalidateQueries({ queryKey: queryKeys.owners() });
            queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
        },
    });
}

// ============================================================
// Query Hooks - ML Queue & Meta
// ============================================================

export function useMLQueue() {
    return useList<MlQueueRow, QueueApiRow>({
        queryKey: queryKeys.mlQueue(),
        path: 'ml_sync_queue',
        select: 'id,property_id,operation,status,attempts,max_attempts,next_attempt_at,ml_item_id,last_error,created_at,property:properties(title,code)',
        filters: {},
        page: 1,
        pageSize: 50,
        orderBy: 'created_at',
        ascending: false,
        transform: toMLQueueRow,
    });
}

export function useMLMeta() {
    return useList<MlMetaRow, MetaApiRow>({
        queryKey: queryKeys.mlMeta(),
        path: 'property_ml_meta',
        select: 'property_id,ml_item_id,status,permalink,price,last_sync_at,last_sync_status,property:properties(title,code)',
        filters: {},
        page: 1,
        pageSize: 100,
        orderBy: 'last_sync_at',
        ascending: false,
        transform: toMLMetaRow,
    });
}

export function useMLOverview() {
    return useRpc<unknown, Record<string, never>>('ml_get_connection');
}

// ============================================================
// Form Helpers
// ============================================================

export function toFormValues(property: PropertyDetail): PropertyFormValues {
    return {
        title: property.title ?? '',
        status: (property.status as PropertyStatus) ?? 'borrador',
        listing_type: (property.listing_type as ListingType) ?? 'venta',
        price: property.price ?? null,
        currency: property.currency ?? 'USD',
        expenses: property.expenses ?? null,
        description: property.description ?? '',
        address: property.address ?? '',
        location_id: property.location_id ?? null,
        area_total: property.area_total ?? null,
        area_covered: property.area_covered ?? null,
        bedrooms: property.bedrooms ?? null,
        bathrooms: property.bathrooms ?? null,
        garages: property.garages ?? null,
        floors: property.floors ?? null,
        year_built: property.year_built ?? null,
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

// ============================================================
// Export
// ============================================================

export const PROPERTY_EXPORT_COLUMNS: ExportColumn<PropertyRow>[] = [
    { key: 'code', label: 'Código' },
    { key: 'title', label: 'Título' },
    { key: 'status', label: 'Estado', format: (v) => STATUS_LABEL[v as PropertyStatus] ?? v },
    { key: 'listing_type', label: 'Tipo operación' },
    {
        key: 'price',
        label: 'Precio',
        format: (v) => (v ? `${v.toLocaleString('es-AR')} USD` : '—'),
    },
    { key: 'currency', label: 'Moneda' },
    { key: 'location', label: 'Ubicación' },
    { key: 'area_total', label: 'Sup. total (m²)', format: (v) => v ?? '—' },
    { key: 'bedrooms', label: 'Dormitorios', format: (v) => v ?? '—' },
    { key: 'bathrooms', label: 'Baños', format: (v) => v ?? '—' },
    { key: 'featured', label: 'Destacada', format: (v) => (v ? 'Sí' : 'No') },
    {
        key: 'published_at',
        label: 'Publicada',
        format: (v) => (v ? new Date(v).toLocaleDateString('es-AR') : '—'),
    },
    {
        key: 'updated_at',
        label: 'Actualizada',
        format: (v) => (v ? new Date(v).toLocaleDateString('es-AR') : '—'),
    },
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

// ============================================================
// Export Direct Functions (for components that don't use hooks)
// ============================================================

export {
    fetchProperties,
    fetchProperty,
    fetchDeletedProperties,
    createProperty,
    updateProperty,
    updatePropertyStatus,
    duplicateProperty,
    softDeleteProperty,
    restoreProperty,
    permanentDeleteProperty,
    fetchLocations,
    uploadPropertyImage,
    uploadPropertyImages,
    deletePropertyImage,
    setPropertyCover,
    reorderPropertyImages,
};

// ============================================================
// Re-export
// ============================================================

export { queryKeys, slugify };
export type {
    PropertyStatus,
    ListingType,
    PropertyRow,
    PropertyDetail,
    PropertyFormValues,
    PropertyImage,
    LocationOption,
};
export type { MlMetaRow, MlQueueRow, MlOperation };
export { STATUS_LABEL, STATUS_TONE, LISTING_TYPE_LABEL };
