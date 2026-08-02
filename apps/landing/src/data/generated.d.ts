export interface GeneratedProperty {
  id: string;
  code: number;
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
  featured: boolean;
  type: 'casa' | 'depto' | 'oficina' | 'local' | 'terreno' | 'country';
  operation: 'venta' | 'alquiler';
  video_url?: string;
  gallery?: string[];
  slug: string;
}

export interface GeneratedAgent {
  name: string;
  photo: string;
  alt: string;
  role: string;
  experience: string;
  bio: string;
}

export interface GeneratedLocation {
  id: string;
  name: string;
  zone: string;
}