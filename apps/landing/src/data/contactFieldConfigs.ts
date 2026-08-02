export type FieldType = 'text' | 'select' | 'textarea';

export interface DynamicField {
  name: string;
  label: string;
  type: FieldType;
  icon: string;
  placeholder?: string;
  options?: string[];
}

export interface IntentConfig {
  fields: DynamicField[];
}

export const contactFieldConfigs: Record<string, IntentConfig> = {
  comprar: {
    fields: [
      {
        name: 'presupuesto',
        label: 'Presupuesto',
        type: 'text',
        icon: 'fas fa-money-bill-wave',
        placeholder: 'USD 100.000 - 500.000',
      },
      {
        name: 'ubicacion_deseada',
        label: 'Ubicación deseada',
        type: 'text',
        icon: 'fas fa-map-marker-alt',
        placeholder: 'Barrio o zona de interés',
      },
      {
        name: 'dormitorios_compra',
        label: 'Cantidad de dormitorios',
        type: 'select',
        icon: 'fas fa-bed',
        options: ['1', '2', '3', '4', '5+'],
      },
      {
        name: 'tipo_propiedad_compra',
        label: 'Tipo de propiedad',
        type: 'select',
        icon: 'fas fa-building',
        options: ['Casa', 'Departamento', 'PH', 'Country', 'Terreno'],
      },
      {
        name: 'financiacion',
        label: '¿Necesita financiación?',
        type: 'select',
        icon: 'fas fa-handshake',
        options: ['Sí', 'No', 'A consultar'],
      },
    ],
  },
  vender: {
    fields: [
      {
        name: 'tiempo_vender',
        label: '¿Cuándo desea vender?',
        type: 'select',
        icon: 'fas fa-calendar-alt',
        options: ['Urgente', '1-3 meses', '3-6 meses', 'Sin apuro'],
      },
      {
        name: 'direccion_propiedad',
        label: 'Dirección de la propiedad',
        type: 'text',
        icon: 'fas fa-home',
        placeholder: 'Calle y número',
      },
      {
        name: 'tipo_propiedad_vender',
        label: 'Tipo de propiedad',
        type: 'select',
        icon: 'fas fa-building',
        options: ['Casa', 'Departamento', 'PH', 'Country', 'Terreno', 'Local'],
      },
      {
        name: 'superficie_vender',
        label: 'Superficie (m²)',
        type: 'text',
        icon: 'fas fa-ruler',
        placeholder: 'Ej: 250',
      },
      {
        name: 'dormitorios_vender',
        label: 'Cantidad de dormitorios',
        type: 'select',
        icon: 'fas fa-bed',
        options: ['1', '2', '3', '4', '5+'],
      },
    ],
  },
  alquilar: {
    fields: [
      {
        name: 'destino_alquiler',
        label: 'Destino',
        type: 'select',
        icon: 'fas fa-briefcase',
        options: ['Vivienda', 'Comercial', 'Oficina', 'Temporal'],
      },
      {
        name: 'presupuesto_alquiler',
        label: 'Presupuesto mensual (USD)',
        type: 'text',
        icon: 'fas fa-money-bill-wave',
        placeholder: 'Ej: 800',
      },
      {
        name: 'ingreso_estimado',
        label: 'Ingreso estimado',
        type: 'text',
        icon: 'fas fa-calendar-alt',
        placeholder: '¿Cuándo necesitás ingresar?',
      },
      {
        name: 'ubicacion_alquiler',
        label: 'Ubicación deseada',
        type: 'text',
        icon: 'fas fa-map-marker-alt',
        placeholder: 'Barrio o zona de interés',
      },
      {
        name: 'dormitorios_alquiler',
        label: 'Cantidad de dormitorios',
        type: 'select',
        icon: 'fas fa-bed',
        options: ['1', '2', '3', '4', '5+'],
      },
    ],
  },
  invertir: {
    fields: [
      {
        name: 'capital_disponible',
        label: 'Capital disponible',
        type: 'text',
        icon: 'fas fa-coins',
        placeholder: 'USD 100.000 - 1.000.000',
      },
      {
        name: 'rentabilidad_esperada',
        label: 'Rentabilidad esperada',
        type: 'select',
        icon: 'fas fa-chart-line',
        options: ['6-8%', '8-10%', '10-12%', '12%+'],
      },
      {
        name: 'zona_interes',
        label: 'Zona de interés',
        type: 'text',
        icon: 'fas fa-map-marker-alt',
        placeholder: 'Barrio o zona de interés',
      },
      {
        name: 'tipo_inversion',
        label: 'Tipo de inversión',
        type: 'select',
        icon: 'fas fa-building',
        options: ['Residencial', 'Comercial', 'Terreno', 'Desarrollo'],
      },
    ],
  },
  tasar: {
    fields: [
      {
        name: 'direccion_tasar',
        label: 'Dirección',
        type: 'text',
        icon: 'fas fa-home',
        placeholder: 'Calle y número',
      },
      {
        name: 'barrio_tasar',
        label: 'Barrio',
        type: 'text',
        icon: 'fas fa-map-pin',
        placeholder: 'Barrio de la propiedad',
      },
      {
        name: 'tipo_propiedad_tasar',
        label: 'Tipo de propiedad',
        type: 'select',
        icon: 'fas fa-building',
        options: ['Casa', 'Departamento', 'PH', 'Country', 'Terreno', 'Local'],
      },
      {
        name: 'superficie_tasar',
        label: 'Superficie (m²)',
        type: 'text',
        icon: 'fas fa-ruler',
        placeholder: 'Ej: 250',
      },
      {
        name: 'estado_propiedad',
        label: 'Estado',
        type: 'select',
        icon: 'fas fa-clipboard-check',
        options: ['Excelente', 'Bueno', 'Regular', 'A reformar'],
      },
      {
        name: 'dormitorios_tasar',
        label: 'Cantidad de dormitorios',
        type: 'select',
        icon: 'fas fa-bed',
        options: ['1', '2', '3', '4', '5+'],
      },
      {
        name: 'banos_tasar',
        label: 'Cantidad de baños',
        type: 'select',
        icon: 'fas fa-bath',
        options: ['1', '2', '3', '4', '5+'],
      },
      {
        name: 'garage_tasar',
        label: 'Garage',
        type: 'select',
        icon: 'fas fa-car',
        options: ['Sí', 'No'],
      },
      {
        name: 'observaciones_tasar',
        label: 'Observaciones',
        type: 'textarea',
        icon: 'fas fa-comment',
        placeholder: 'Detalles adicionales sobre la propiedad...',
      },
    ],
  },
  desarrollador: {
    fields: [
      {
        name: 'tipo_proyecto',
        label: 'Tipo de proyecto',
        type: 'select',
        icon: 'fas fa-building',
        options: ['Residencial', 'Comercial', 'Mixto'],
      },
      {
        name: 'ubicacion_proyecto',
        label: 'Ubicación',
        type: 'text',
        icon: 'fas fa-map-marker-alt',
        placeholder: 'Dirección o zona del proyecto',
      },
      {
        name: 'superficie_proyecto',
        label: 'Superficie del terreno (m²)',
        type: 'text',
        icon: 'fas fa-ruler',
        placeholder: 'Ej: 5000',
      },
      {
        name: 'unidades_previstas',
        label: 'Unidades previstas',
        type: 'text',
        icon: 'fas fa-hotel',
        placeholder: 'Cantidad de unidades',
      },
      {
        name: 'presupuesto_proyecto',
        label: 'Presupuesto estimado',
        type: 'text',
        icon: 'fas fa-coins',
        placeholder: 'USD 500.000 - 5.000.000',
      },
    ],
  },
  otro: {
    fields: [
      {
        name: 'motivo_consulta',
        label: 'Motivo de tu consulta',
        type: 'textarea',
        icon: 'fas fa-comment',
        placeholder: 'Contanos qué necesitás...',
      },
    ],
  },
};
