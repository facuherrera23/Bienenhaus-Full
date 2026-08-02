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

export type PropertyCondition = 'nuevo' | 'usado' | 'a_refaccionar';

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
  condition: PropertyCondition;
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

export interface PropertyFormValues {
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
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  alt: string | null;
  position: number;
  is_cover: boolean;
  created_at: string;
}

export interface LocationOption {
  id: string;
  name: string;
  zone: string | null;
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

export const LISTING_TYPE_LABEL: Record<ListingType, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  venta_alquiler: 'Venta o alquiler',
  emprendimiento: 'Emprendimiento',
};

export const CONDITION_LABEL: Record<PropertyCondition, string> = {
  nuevo: 'Nuevo',
  usado: 'Usado',
  a_refaccionar: 'A refaccionar',
};