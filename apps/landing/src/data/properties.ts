export type PropertyType = 'casa' | 'depto' | 'oficina' | 'local' | 'terreno' | 'country';
export type PropertyOperation = 'venta' | 'alquiler';

export interface Property {
  id: number;
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
}

export const properties: Property[] = [
  {
    id: 1,
    price: 'USD 285.000',
    title: 'Casa Moderna en Country',
    location: 'Villa Belgrano',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&crop=center',
    alt: 'Casa Moderna en Country - Fachada principal',
    beds: 4,
    baths: 3,
    area: 280,
    garage: 2,
    desc: 'Hermosa casa moderna con amplios espacios y diseño funcional. Cuenta con living comedor con hogar, cocina integrada con isla, lavadero, dependencia de servicio, y master suite con vestidor y baño en suite. El exterior ofrece galería con parrilla, pileta climatizada y jardín parquizado con riego automático.',
    featured: true,
    type: 'casa',
    operation: 'venta',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    gallery: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop&crop=center',
    ],
    code: 'BH-001',
  },
  {
    id: 2,
    price: 'USD 420.000',
    title: 'Penthouse con Terraza',
    location: 'Nueva Córdoba',
    image:
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop&crop=center',
    alt: 'Penthouse con Terraza - Vista panorámica',
    beds: 3,
    baths: 2,
    area: 195,
    garage: 1,
    desc: 'Impresionante penthouse con vista panorámica y terraza privada de 80m². Living comedor de doble altura, cocina gourmet, toilette de recepción, 3 dormitorios (master con vestidor y baño en suite), baño completo, y lavadero. Terraza con parrilla, jacuzzi y deck de madera. Edificio con amenities premium: pileta, SUM, gym, seguridad 24hs.',
    type: 'depto',
    operation: 'venta',
    gallery: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop&crop=center',
    ],
    code: 'BH-002',
  },
  {
    id: 3,
    price: 'USD 680.000',
    title: 'Villa de Lujo en Country',
    location: 'Country Los Pinos',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&crop=center',
    alt: 'Villa de Lujo en Country - Fachada',
    beds: 5,
    baths: 4,
    area: 450,
    garage: 3,
    desc: 'Espectacular villa con pileta, jardín y acabados de primer nivel. Planta baja: hall de entrada, living con hogar a leños, comedor formal, cocina con office, family room, toilette, lavadero, dependencia de servicio. Planta alta: master suite con doble vestidor y baño con hidromasaje, 4 dormitorios adicionales (2 en suite), playroom. Exterior: galería con parrilla y horno de barro, pileta revestida en venecita, parque con árboles añejos, riego y iluminación.',
    featured: true,
    type: 'country',
    operation: 'venta',
    video_url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    gallery: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&crop=center',
    ],
    code: 'BH-003',
  },
  {
    id: 4,
    price: 'USD 1.200',
    title: 'Departamento 3 ambientes',
    location: 'Nueva Córdoba',
    image:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop&crop=center',
    alt: 'Departamento 3 ambientes',
    beds: 2,
    baths: 1,
    area: 68,
    garage: 0,
    desc: 'Departamento luminoso a pasos del Parque Sarmiento, ideal para estudiantes o jóvenes profesionales.',
    type: 'depto',
    operation: 'alquiler',
  },
  {
    id: 5,
    price: 'USD 95.000',
    title: 'Oficina en el Centro',
    location: 'Centro',
    image:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&h=400&fit=crop&crop=center',
    alt: 'Oficina en el Centro',
    beds: 0,
    baths: 1,
    area: 45,
    garage: 0,
    desc: 'Oficina lista para operar en pleno centro comercial, con muy buena luminosidad.',
    type: 'oficina',
    operation: 'venta',
  },
  {
    id: 6,
    price: 'USD 180.000',
    title: 'Terreno en Country',
    location: 'Country Los Pinos',
    image:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop&crop=center',
    alt: 'Terreno en Country',
    beds: 0,
    baths: 0,
    area: 800,
    garage: 0,
    desc: 'Lote de 800 m² en barrio cerrado con seguridad y amenities exclusivos.',
    type: 'terreno',
    operation: 'venta',
  },
  {
    id: 7,
    price: 'USD 260.000',
    title: 'Casa en General Paz',
    location: 'General Paz',
    image:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=400&fit=crop&crop=center',
    alt: 'Casa en General Paz',
    beds: 3,
    baths: 2,
    area: 220,
    garage: 1,
    desc: 'Casa con patio y asador, a pasos de la avenida principal del barrio.',
    type: 'casa',
    operation: 'venta',
  },
];
