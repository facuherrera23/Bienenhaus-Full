import { supabase } from './supabase';

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

export async function fetchProperties(): Promise<PropertyRow[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      'id, code, title, status, listing_type, price, currency, area_total, bedrooms, bathrooms, featured, published_at, updated_at, location:locations(name), images:property_images(url, is_cover)',
    )
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((p: PropertyApiRow) => {
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
  });
}

// ---------------------------------------------------------------------------
// Detalle + formulario
// ---------------------------------------------------------------------------

export interface LocationOption {
  id: string;
  name: string;
  zone: string | null;
}

export async function fetchLocations(): Promise<LocationOption[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, zone')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as LocationOption[];
}

export interface PropertyDetail {
  id: string;
  code: number;
  title: string;
  slug: string;
  description: string | null;
  status: PropertyStatus;
  listing_type: ListingType;
  price: number | null;
  currency: 'USD' | 'ARS';
  expenses: number | null;
  address: string | null;
  location_id: string | null;
  latitude: number | null;
  longitude: number | null;
  area_total: number | null;
  area_covered: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  garages: number | null;
  year_built: number | null;
  floors: number | null;
  featured: boolean;
  published_at: string | null;
  cover_url: string | null;
  video_url: string | null;
}

interface PropertyDetailApiRow {
  id: string;
  code: number;
  title: string;
  slug: string;
  description: string | null;
  status: PropertyStatus;
  listing_type: ListingType;
  price: number | null;
  currency: 'USD' | 'ARS';
  expenses: number | null;
  address: string | null;
  location_id: string | null;
  latitude: number | null;
  longitude: number | null;
  area_total: number | null;
  area_covered: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  garages: number | null;
  year_built: number | null;
  floors: number | null;
  featured: boolean;
  published_at: string | null;
  video_url: string | null;
  images: { url: string; is_cover: boolean }[];
}

export async function fetchProperty(id: string): Promise<PropertyDetail> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      'id, code, title, slug, description, status, listing_type, price, currency, expenses, address, location_id, latitude, longitude, area_total, area_covered, bedrooms, bathrooms, garages, year_built, floors, featured, published_at, video_url, images:property_images(url, is_cover)',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Propiedad no encontrada');

  const p = data as PropertyDetailApiRow;
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
    video_url: p.video_url,
    cover_url: p.images?.find((i) => i.is_cover)?.url ?? p.images?.[0]?.url ?? null,
  };
}

export type PropertyFormValues = {
  title: string;
  status: PropertyStatus;
  listing_type: ListingType;
  price: number | null;
  currency: 'USD' | 'ARS';
  expenses: number | null;
  description: string;
  address: string;
  location_id: string | null;
  area_total: number | null;
  area_covered: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  garages: number | null;
  floors: number | null;
  year_built: number | null;
  featured: boolean;
  video_url: string;
  latitude: number | null;
  longitude: number | null;
};

function toNumeric(v: string | null | undefined): number | null {
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

export async function createProperty(values: PropertyFormValues): Promise<PropertyDetail> {
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

  const { data, error } = await supabase
    .from('properties')
    .insert(payload)
    .select('id, code')
    .single();

  if (error) {
    if (error.message.includes('duplicate key') || error.code === '23505') {
      throw new Error('Ya existe una propiedad con ese título.');
    }
    throw new Error(error.message);
  }
  return data as PropertyDetail;
}

export async function updateProperty(id: string, values: PropertyFormValues): Promise<void> {
  const detail = await fetchProperty(id);
  const payload: Record<string, unknown> = {
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

export async function updatePropertyStatus(id: string, status: PropertyStatus): Promise<void> {
  let published_at: string | null = null;
  if (status === 'publicada') {
    const { data } = await supabase.from('properties').select('published_at').eq('id', id).maybeSingle();
    if (data && !data.published_at) published_at = new Date().toISOString();
  }

  const patch: Record<string, unknown> = { status };
  if (published_at) patch.published_at = published_at;

  const { error } = await supabase.from('properties').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Imágenes de propiedades
// ---------------------------------------------------------------------------

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  alt: string | null;
  position: number;
  is_cover: boolean;
  created_at: string;
}

export async function fetchPropertyImages(propertyId: string): Promise<PropertyImage[]> {
  const { data, error } = await supabase
    .from('property_images')
    .select('*')
    .eq('property_id', propertyId)
    .order('position', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PropertyImage[];
}

export async function uploadPropertyImage(
  propertyId: string,
  file: File,
  alt: string = ''
): Promise<PropertyImage> {
  // Convertir a WebP en el cliente
  const webpFile = await convertToWebP(file);
  const ext = 'webp';
  const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('property-images')
    .upload(path, webpFile, { upsert: false, contentType: 'image/webp' });

  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  // Obtener el siguiente position
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
    .single();

  if (error) throw new Error(error.message);
  return data as PropertyImage;
}

export async function uploadPropertyImages(
  propertyId: string,
  files: File[]
): Promise<PropertyImage[]> {
  const results: PropertyImage[] = [];
  for (const file of files) {
    try {
      const img = await uploadPropertyImage(propertyId, file, file.name);
      results.push(img);
    } catch (err) {
      console.error('Error subiendo imagen:', err);
    }
  }
  return results;
}

export async function deletePropertyImage(imageId: string): Promise<void> {
  // Obtener la imagen para borrar del storage
  const { data: img } = await supabase
    .from('property_images')
    .select('url')
    .eq('id', imageId)
    .maybeSingle();

  const { error } = await supabase.from('property_images').delete().eq('id', imageId);
  if (error) throw new Error(error.message);

  // Borrar del storage si es URL de nuestro bucket
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
  // Quitar portada actual
  await supabase
    .from('property_images')
    .update({ is_cover: false })
    .eq('property_id', propertyId)
    .eq('is_cover', true);

  // Setear nueva portada
  const { error } = await supabase
    .from('property_images')
    .update({ is_cover: true })
    .eq('id', imageId);
  if (error) throw new Error(error.message);
}

export async function reorderPropertyImages(
  propertyId: string,
  imageIds: string[]
): Promise<void> {
  const updates = imageIds.map((id, index) =>
    supabase.from('property_images').update({ position: index }).eq('id', id).eq('property_id', propertyId)
  );
  await Promise.all(updates);
}

// Conversión client-side a WebP
function convertToWebP(file: File, quality = 0.85): Promise<File> {
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
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}

// ---------------------------------------------------------------------------
// Soft Delete (Papelera)
// ---------------------------------------------------------------------------

export async function softDeleteProperty(id: string): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function restoreProperty(id: string): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({ deleted_at: null })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function permanentDeleteProperty(id: string): Promise<void> {
  // Primero borrar imágenes del storage
  const { data: images } = await supabase
    .from('property_images')
    .select('url')
    .eq('property_id', id);

  if (images?.length) {
    const paths = images
      .map((img) => img.url.split('/property-images/')[1])
      .filter(Boolean);
    if (paths.length) {
      await supabase.storage.from('property-images').remove(paths);
    }
  }

  // Borrar propiedad (cascada borra images, ml_meta, etc.)
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function duplicateProperty(id: string): Promise<PropertyDetail> {
  const original = await fetchProperty(id);
  
  const duplicateValues = {
    title: `${original.title} (Copia)`,
    status: 'borrador' as const,
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

export async function fetchDeletedProperties(): Promise<PropertyRow[]> {
  const { data, error } = await supabase
    .from('properties')
    .select(
      'id, code, title, status, listing_type, price, currency, area_total, bedrooms, bathrooms, featured, published_at, updated_at, location:locations(name), images:property_images(url, is_cover)'
    )
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((p: PropertyApiRow) => {
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
  });
}

export { toNumeric };
