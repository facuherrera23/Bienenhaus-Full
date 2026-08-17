import type { Database } from './database';

export type MlOperation = Database['public']['Enums']['ml_operation'];
export type MlSyncStatus = Database['public']['Enums']['ml_sync_status'];

export interface MlConnectionInfo {
    id: string;
    provider: string;
    site_id: string;
    user_id: number | null;
    nickname: string | null;
    email: string | null;
    token_expires_at: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface MlOverview {
    ml_enabled: boolean;
    connection: MlConnectionInfo | null;
}

export interface MlSettings {
    app_id: string;
    defaults: { category_id: string; listing_type_id: string; condition: string };
    client_secret?: string;
    webhook_secret?: string;
}

export interface MlQueueRow {
    id: number;
    property_id: string;
    operation: MlOperation;
    status: MlSyncStatus;
    attempts: number;
    max_attempts: number;
    next_attempt_at: string;
    ml_item_id: string | null;
    last_error: string | null;
    created_at: string;
    property_title: string | null;
    property_code: number | null;
}

export interface MlMetaRow {
    property_id: string;
    ml_item_id: string | null;
    status: string | null;
    permalink: string | null;
    price: number | null;
    last_sync_at: string | null;
    last_sync_status: MlSyncStatus | null;
    property_title: string | null;
    property_code: number | null;
}

export interface MlCategory {
    id: string;
    name: string;
}

export interface MlListingType {
    id: string;
    name: string;
}

export interface MlQuestion {
    id: number;
    question_id: string;
    property_id: string | null;
    ml_item_id: string | null;
    question_text: string | null;
    answer_text: string | null;
    status: 'unanswered' | 'answered' | 'deleted';
    from_user_id: number | null;
    from_user_nickname: string | null;
    date_created: string | null;
    date_updated: string | null;
    received_at: string;
}

export interface MlOrder {
    id: number;
    order_id: string;
    property_id: string | null;
    ml_item_id: string | null;
    buyer_id: number | null;
    buyer_nickname: string | null;
    status: 'new' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
    total_amount: number | null;
    currency: string;
    date_created: string | null;
    date_closed: string | null;
    received_at: string;
}

export interface MlMetrics {
    items: MlItemMetrics[];
    total_visits: number;
    total_questions: number;
    unanswered_questions: number;
    total_sales: number;
    total_revenue: number;
    conversion_rate: number;
}

export interface MlItemMetrics {
    item_id: string;
    title: string;
    visits: number;
    questions: number;
    sold_quantity: number;
    available_quantity: number;
    price: number;
    currency_id: string;
    status: string;
    permalink: string;
}

export interface MlAutoReplyTemplate {
    id: number;
    name: string;
    trigger: 'new_question' | 'new_order' | 'order_paid' | 'order_shipped' | 'order_delivered';
    message: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export const ML_OPERATION_LABEL: Record<MlOperation, string> = {
    publish: 'Publicar',
    update: 'Actualizar',
    delete: 'Eliminar',
};

export const ML_SYNC_STATUS_LABEL: Record<MlSyncStatus, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    success: '�xito',
    failed: 'Fall�',
    cancelled: 'Cancelada',
};

export const ML_SYNC_STATUS_TONE: Record<MlSyncStatus, string> = {
    pending: 'neutral',
    processing: 'warning',
    success: 'success',
    failed: 'danger',
    cancelled: 'neutral',
};
export type MlDeadLetterStatus = 'pending' | 'resolved' | 'ignored';

// Fila de la cola de fallos definitivos de sync con ML.
// Mismo shape que ml_sync_queue (de donde "caen" los items tras agotar max_attempts),
// m�s los campos propios de resoluci�n manual.
export interface MlDeadLetterRow {
    id: number;
    property_id: string;
    operation: MlOperation;
    payload: Record<string, unknown>;
    attempts: number;
    max_attempts: number;
    ml_item_id: string | null;
    last_error: string | null;
    status: MlDeadLetterStatus;
    resolved_at: string | null;
    resolved_by: string | null;
    created_at: string;
    property_title: string | null;
    property_code: number | null;
}

export interface ImportMlListingsResult {
    total_fetched: number;
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{ ml_item_id: string; error: string }>;
    has_more: boolean;
    total_available: number;
    next_offset: number;
}

// ============================================================
// Preview / Import with Filters
// ============================================================

export type MlItemStatus = 'active' | 'paused' | 'closed' | 'under_review' | 'payment_required';

export interface ImportFilters {
    status?: MlItemStatus | MlItemStatus[];
    category_id?: string;
    date_from?: string; // ISO date
    date_to?: string;   // ISO date
    limit?: number;
    offset?: number;
}

export interface PreviewItem {
    ml_item_id: string;
    title: string;
    price: number;
    currency_id: string;
    status: string;
    permalink: string;
    thumbnail: string | null;
    category_id: string | null;
    listing_type_id: string;
    date_created: string;
    pictures_count: number;
    has_video: boolean;
}

export interface PreviewResult {
    mode: 'preview';
    items: PreviewItem[];
    total_previewed: number;
    total_available: number;
    has_more: boolean;
    filters_applied: ImportFilters;
}

export interface ImportSelectedParams {
    ml_item_ids: string[];
}

// ============================================================
// Webhook Topics
// ============================================================

export type MlWebhookTopic = 'questions' | 'orders' | 'items' | 'payments' | 'shipments';