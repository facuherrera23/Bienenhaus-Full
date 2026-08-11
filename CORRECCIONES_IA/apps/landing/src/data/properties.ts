export type PropertyType = 'casa' | 'depto' | 'oficina' | 'local' | 'terreno' | 'country';
export type PropertyOperation = 'venta' | 'alquiler';

export interface Property {
    id: string | number;
    title: string;
    price: string;
    location: string;
    image: string;
    alt: string;
    beds: number;
    baths: number;
    area: number;
    garage: number;
    desc: string;
    featured?: boolean;
    type: PropertyType;
    operation: PropertyOperation;
    video_url?: string;
    gallery?: string[];
    code?: string;
    slug?: string;
}

// Mock data REMOVED - now using Supabase realtime via useProperties hook
export const properties: Property[] = [];