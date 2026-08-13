import type { Database } from './database';

// Re-export del row crudo (formulario de tasación completo, ~80 campos)
export type ValuationDbRow = Database['public']['Tables']['property_valuations']['Row'];

// Versión resumida para listados (papelera, tablas) — no expone el formulario completo
export interface ValuationRow {
    id: string;
    direccion: string;
    barrio: string | null;
    destino: string;
    fecha: string;
    finalized_at: string | null;
    created_at: string | null;
    created_by: string | null;
    deleted_at: string | null;
}
