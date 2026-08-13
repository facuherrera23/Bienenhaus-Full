import { supabase, supabaseUrl } from '@bienenhaus/supabase';
import type { Database } from '../types/database';
import {
    CONDITION_LABEL,
    type Currency,
    LISTING_TYPE_LABEL,
    type ListingType,
    type LocationOption,
    type PropertyCondition,
    type PropertyDetail,
    type PropertyFormValues,
    type PropertyImage,
    type PropertyRow,
    type PropertyStatus,
    STATUS_LABEL,
    STATUS_TONE,
} from '../types/properties';
import { validatePropertyForm, validatePropertyImage } from './_shared/properties-validation';

// ============================================================
// Re-export types and constants
// ============================================================

export type {
    PropertyStatus,
    ListingType,
    PropertyCondition,
    Currency,
    PropertyRow,
    PropertyDetail,
    PropertyFormValues,
    PropertyImage,
    LocationOption,
};

export { STATUS_LABEL, STATUS_TONE, LISTING_TYPE_LABEL, CONDITION_LABEL };

// ============================================================
// DB row types with embedded relations
// ============================================================

type PropertyDbRow = Database['public']['Tables']['properties']['Row'];

interface PropertyApiRow extends PropertyDbRow {
    location: { name: string } | { name: string }[] | null;
    images: { url: string; is_cover: boolean }[];
}

interface PropertyDetailApiRow extends PropertyDbRow {
    location: { name: string } | { name: string }[] | null;
    images: { url: string; is_cover: boolean }[];
}

const PROPERTIES_SELECT = `
  id, code, title, status, listing_type, price, currency, area_total, 
  bedrooms, bathrooms, featured, published_at, updated_at, 
  location:locations(name), images:property_images(url, is_cover)
`.trim();

const PROPERTY_DETAIL_SELECT = `
  id, code, title, slug, description, status, listing_type, price, currency, 
  expenses, address, location_id, latitude, longitude, area_total, area_covered, 
  bedrooms, bathrooms, garages, year_built, floors, featured, published_at, 
  video_url, updated_at, location:locations(name), images:property_images(url, is_cover)
`.trim();

const PROPERTY_IMAGES_SELECT = `
  id, property_id, url, alt, position, is_cover, created_at
`.trim();

export function toNumeric(v: string | null | undefined): number | null {
    if (v === null || v === undefined || v.trim() === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

export function slugify(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

function embedLocationName(v: { name: string } | { name: string }[] | null): string | null {
    if (!v) return null;
    return Array.isArray(v) ? (v[0]?.name ?? null) : v.name;
}

// ============================================================
// Mappers
// ============================================================

function toPropertyRow(p: PropertyApiRow): PropertyRow {
    const locName = embedLocationName(p.location);
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

function toPropertyDetail(p: PropertyDetailApiRow): PropertyDetail {
    const locName = embedLocationName(p.location);
    return {
        id: p.id,
        code: p.code,
        title: p.title,
        slug: p.slug,
        description: p.description,
        status: p.status,
        listing_type: p.listing_type,
        price: p.price === null ? null : Number(p.price),
        currency: p.currency,
        expenses: p.expenses === null ? null : Number(p.expenses),
        address: p.address,
        location: locName ?? 'Sin zona',
        location_id: p.location_id,
        latitude: p.latitude,
        longitude: p.longitude,
        area_total: p.area_total === null ? null : Number(p.area_total),
        area_covered: p.area_covered === null ? null : Number(p.area_covered),
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        garages: p.garages,
        year_built: p.year_built,
        floors: p.floors,
        featured: p.featured,
        published_at: p.published_at,
        updated_at: p.updated_at,
        video_url: p.video_url,
        cover_url: p.images?.find((i) => i.is_cover)?.url ?? p.images?.[0]?.url ?? null,
    };
}

// ============================================================
// API Functions - Fetch
// ============================================================

export async function fetchProperties(): Promise<PropertyRow[]> {
    const { data, error } = await supabase
        .from('properties')
        .select(PROPERTIES_SELECT)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .returns<PropertyApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toPropertyRow);
}

export async function fetchProperty(id: string): Promise<PropertyDetail> {
    const { data, error } = await supabase
        .from('properties')
        .select(PROPERTY_DETAIL_SELECT)
        .eq('id', id)
        .maybeSingle<PropertyDetailApiRow>();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Propiedad no encontrada');
    return toPropertyDetail(data);
}

export async function fetchDeletedProperties(): Promise<PropertyRow[]> {
    const { data, error } = await supabase
        .from('properties')
        .select(PROPERTIES_SELECT)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
        .returns<PropertyApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toPropertyRow);
}

export async function fetchPropertiesByStatus(status: PropertyStatus): Promise<PropertyRow[]> {
    const { data, error } = await supabase
        .from('properties')
        .select(PROPERTIES_SELECT)
        .eq('status', status)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .returns<PropertyApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toPropertyRow);
}

export async function fetchPropertiesByListingType(
    listingType: ListingType,
): Promise<PropertyRow[]> {
    const { data, error } = await supabase
        .from('properties')
        .select(PROPERTIES_SELECT)
        .eq('listing_type', listingType)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .returns<PropertyApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toPropertyRow);
}

export async function fetchFeaturedProperties(limit = 6): Promise<PropertyRow[]> {
    const { data, error } = await supabase
        .from('properties')
        .select(PROPERTIES_SELECT)
        .eq('featured', true)
        .eq('status', 'publicada')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(limit)
        .returns<PropertyApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toPropertyRow);
}

// ============================================================
// API Functions - Locations
// ============================================================

export async function fetchLocations(): Promise<LocationOption[]> {
    const { data, error } = await supabase
        .from('locations')
        .select('id, name, zone')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .returns<LocationOption[]>();

    if (error) throw new Error(error.message);
    return data ?? [];
}

// ============================================================
// API Functions - CRUD (with Zod validation)
// ============================================================

export async function createProperty(values: PropertyFormValues): Promise<PropertyDetail> {
    const validation = validatePropertyForm(values);
    if (!validation.valid) {
        throw new Error(validation.error ?? 'Datos de propiedad inválidos');
    }

    const slug = slugify(values.title);
    const payload = {
        title: values.title,
        slug,
        status: values.status,
        listing_type: values.listing_type,
        price: values.price,
        currency: values.currency,
        expenses: values.expenses,
        description: values.description || null,
        address: values.address || null,
        location_id: values.location_id,
        area_total: values.area_total,
        area_covered: values.area_covered,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        garages: values.garages,
        floors: values.floors,
        year_built: values.year_built,
        featured: values.featured,
        video_url: values.video_url || null,
        latitude: values.latitude,
        longitude: values.longitude,
        published_at: values.status === 'publicada' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase.from('properties').insert(payload).select('id').single();

    if (error) {
        if (error.message.includes('duplicate key') || error.code === '23505') {
            throw new Error('Ya existe una propiedad con ese título.');
        }
        throw new Error(error.message);
    }

    return fetchProperty(data.id);
}

export async function updateProperty(id: string, values: PropertyFormValues): Promise<void> {
    const validation = validatePropertyForm(values);
    if (!validation.valid) {
        throw new Error(validation.error ?? 'Datos de propiedad inválidos');
    }

    const detail = await fetchProperty(id);
    const payload: Database['public']['Tables']['properties']['Update'] = {
        title: values.title,
        status: values.status,
        listing_type: values.listing_type,
        price: values.price,
        currency: values.currency,
        expenses: values.expenses,
        description: values.description || null,
        address: values.address || null,
        location_id: values.location_id,
        area_total: values.area_total,
        area_covered: values.area_covered,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        garages: values.garages,
        floors: values.floors,
        year_built: values.year_built,
        featured: values.featured,
        video_url: values.video_url || null,
        latitude: values.latitude,
        longitude: values.longitude,
    };

    if (values.status === 'publicada' && !detail.published_at) {
        payload.published_at = new Date().toISOString();
    }
    if (values.title !== detail.title) {
        payload.slug = slugify(values.title);
    }

    const { error } = await supabase.from('properties').update(payload).eq('id', id);

    if (error) throw new Error(error.message);
}

export async function updatePropertyStatus(id: string, status: PropertyStatus): Promise<void> {
    let published_at: string | null = null;
    if (status === 'publicada') {
        const { data } = await supabase
            .from('properties')
            .select('published_at')
            .eq('id', id)
            .maybeSingle();

        if (data && !data.published_at) {
            published_at = new Date().toISOString();
        }
    }

    const patch: Database['public']['Tables']['properties']['Update'] = { status };
    if (published_at) patch.published_at = published_at;

    const { error } = await supabase.from('properties').update(patch).eq('id', id);
    if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Soft Delete & Restore
// ============================================================

export async function softDeleteProperty(id: string): Promise<void> {
    const { error } = await supabase
        .from('properties')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw new Error(error.message);
}

export async function restoreProperty(id: string): Promise<void> {
    const { error } = await supabase.from('properties').update({ deleted_at: null }).eq('id', id);

    if (error) throw new Error(error.message);
}

export async function permanentDeleteProperty(id: string): Promise<void> {
    // Obtener imágenes para eliminar del storage
    const { data: images } = await supabase
        .from('property_images')
        .select('url')
        .eq('property_id', id);

    if (images?.length) {
        const paths = images
            .map((img: { url: string }) => img.url.split('/property-images/')[1])
            .filter(Boolean);

        if (paths.length) {
            await supabase.storage.from('property-images').remove(paths);
        }
    }

    const { error } = await supabase.from('properties').delete().eq('id', id);

    if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Duplicate
// ============================================================

export async function duplicateProperty(id: string): Promise<PropertyDetail> {
    const original = await fetchProperty(id);

    const duplicateValues: PropertyFormValues = {
        title: `${original.title} (Copia)`,
        status: 'borrador',
        listing_type: original.listing_type,
        price: original.price,
        currency: original.currency,
        expenses: original.expenses,
        description: original.description || '',
        address: original.address || '',
        location_id: original.location_id,
        area_total: original.area_total,
        area_covered: original.area_covered,
        bedrooms: original.bedrooms,
        bathrooms: original.bathrooms,
        garages: original.garages,
        floors: original.floors,
        year_built: original.year_built,
        featured: false,
        video_url: original.video_url || '',
        latitude: original.latitude,
        longitude: original.longitude,
    };

    return createProperty(duplicateValues);
}

// ============================================================
// API Functions - Images (Parallel Upload + Validation)
// ============================================================

export async function fetchPropertyImages(propertyId: string): Promise<PropertyImage[]> {
    const { data, error } = await supabase
        .from('property_images')
        .select(PROPERTY_IMAGES_SELECT)
        .eq('property_id', propertyId)
        .order('position', { ascending: true })
        .returns<PropertyImage[]>();

    if (error) throw new Error(error.message);
    return data ?? [];
}

export async function uploadPropertyImage(
    propertyId: string,
    file: File,
    alt: string = '',
): Promise<PropertyImage> {
    const validation = validatePropertyImage({ property_id: propertyId, file, alt });
    if (!validation.valid) {
        throw new Error(validation.error ?? 'Archivo inválido');
    }

    const webpFile = await convertToWebP(file);
    const ext = 'webp';
    const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(path, webpFile, { upsert: false, contentType: 'image/webp' });

    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { data: maxPos } = await supabase
        .from('property_images')
        .select('position')
        .eq('property_id', propertyId)
        .order('position', { ascending: false })
        .limit(1);

    const nextPosition = (maxPos?.[0]?.position ?? -1) + 1;

    const { data, error } = await supabase
        .from('property_images')
        .insert({
            property_id: propertyId,
            url: publicUrl,
            alt: alt || null,
            position: nextPosition,
            is_cover: false,
        })
        .select('*')
        .returns<PropertyImage>()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

export async function uploadPropertyImages(
    propertyId: string,
    files: File[],
): Promise<PropertyImage[]> {
    const uploadOne = async (file: File) => {
        try {
            return await uploadPropertyImage(propertyId, file, file.name);
        } catch (err) {
            console.warn(`[uploadPropertyImages] Failed ${file.name}:`, err);
            return null;
        }
    };

    const results = await Promise.allSettled(files.map(uploadOne));

    const images: PropertyImage[] = [];
    results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) images.push(r.value);
        else
            console.error(
                `Upload failed for ${files[i].name}:`,
                r.status === 'rejected' ? r.reason : 'no result',
            );
    });
    return images;
}

export async function deletePropertyImage(imageId: string): Promise<void> {
    const { data: img } = await supabase
        .from('property_images')
        .select('url')
        .eq('id', imageId)
        .maybeSingle();

    const { error } = await supabase.from('property_images').delete().eq('id', imageId);

    if (error) throw new Error(error.message);

    if (img?.url && img.url.includes('/property-images/')) {
        try {
            const path = img.url.split('/property-images/')[1];
            if (path) await supabase.storage.from('property-images').remove([path]);
        } catch {
            // ignore
        }
    }
}

export async function setPropertyCover(propertyId: string, imageId: string): Promise<void> {
    // Primero, quitar cover de todas las imágenes
    await supabase
        .from('property_images')
        .update({ is_cover: false })
        .eq('property_id', propertyId)
        .eq('is_cover', true);

    // Luego, establecer la nueva cover
    const { error } = await supabase
        .from('property_images')
        .update({ is_cover: true })
        .eq('id', imageId);

    if (error) throw new Error(error.message);
}

export async function reorderPropertyImages(propertyId: string, imageIds: string[]): Promise<void> {
    const { error } = await supabase.rpc('reorder_property_images', {
        p_property_id: propertyId,
        p_image_ids: imageIds,
    });
    if (error) throw new Error(error.message);
}

// ============================================================
// Helpers - Image Conversion (with server fallback)
// ============================================================

async function convertToWebP(file: File, quality = 0.85): Promise<File> {
    // Try server-side conversion first (Edge Function)
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('quality', String(quality * 100));

        const res = await fetch(`${supabaseUrl}/functions/v1/convert-image`, {
            method: 'POST',
            body: formData,
        });

        if (res.ok) {
            const blob = await res.blob();
            return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
        }
    } catch {
        // Fall through to client-side
    }

    // Client-side fallback
    return new Promise((resolve) => {
        if (file.type === 'image/webp') {
            resolve(file);
            return;
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                resolve(file);
                return;
            }

            ctx.drawImage(img, 0, 0);
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const webpFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
                            type: 'image/webp',
                        });
                        resolve(webpFile);
                    } else {
                        resolve(file);
                    }
                },
                'image/webp',
                quality,
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(file);
        };

        img.src = objectUrl;
    });
}

// ============================================================
// Form Helpers
// ============================================================

export function toFormValues(p: PropertyDetail): PropertyFormValues {
    return {
        title: p.title,
        status: p.status,
        listing_type: p.listing_type,
        price: p.price,
        currency: p.currency,
        expenses: p.expenses,
        description: p.description ?? '',
        address: p.address ?? '',
        location_id: p.location_id,
        area_total: p.area_total,
        area_covered: p.area_covered,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        garages: p.garages,
        floors: p.floors,
        year_built: p.year_built,
        featured: p.featured,
        video_url: p.video_url ?? '',
        latitude: p.latitude,
        longitude: p.longitude,
    };
}
