export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
    __InternalSupabase: {
        PostgrestVersion: '14.5';
    };
    public: {
        Tables: {
            properties: {
                Row: {
                    id: string;
                    title: string;
                    description: string | null;
                    property_type: Database['public']['Enums']['property_type'];
                    operation_type: Database['public']['Enums']['operation_type'];
                    listing_type: Database['public']['Enums']['listing_type'];
                    status: Database['public']['Enums']['property_status'];
                    price: number | null;
                    surface_total: number | null;
                    surface_covered: number | null;
                    bedrooms: number | null;
                    bathrooms: number | null;
                    parking_spaces: number | null;
                    floor: string | null;
                    has_garage: boolean | null;
                    has_laundry: boolean | null;
                    has_pool: boolean | null;
                    has_terrace: boolean | null;
                    address: string | null;
                    neighborhood: string | null;
                    city: string | null;
                    province: string | null;
                    amenities: string[] | null;
                    images: Json | null;
                    video_url: string | null;
                    condition: string | null;
                    owner_id: string | null;
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    id?: string;
                    title: string;
                    description?: string | null;
                    property_type?: Database['public']['Enums']['property_type'];
                    operation_type?: Database['public']['Enums']['operation_type'];
                    listing_type?: Database['public']['Enums']['listing_type'];
                    status?: Database['public']['Enums']['property_status'];
                    price?: number | null;
                    surface_total?: number | null;
                    surface_covered?: number | null;
                    bedrooms?: number | null;
                    bathrooms?: number | null;
                    parking_spaces?: number | null;
                    floor?: string | null;
                    has_garage?: boolean | null;
                    has_laundry?: boolean | null;
                    has_pool?: boolean | null;
                    has_terrace?: boolean | null;
                    address?: string | null;
                    neighborhood?: string | null;
                    city?: string | null;
                    province?: string | null;
                    amenities?: string[] | null;
                    images?: Json | null;
                    video_url?: string | null;
                    condition?: string | null;
                    owner_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Update: {
                    id?: string;
                    title?: string;
                    description?: string | null;
                    property_type?: Database['public']['Enums']['property_type'];
                    operation_type?: Database['public']['Enums']['operation_type'];
                    listing_type?: Database['public']['Enums']['listing_type'];
                    status?: Database['public']['Enums']['property_status'];
                    price?: number | null;
                    surface_total?: number | null;
                    surface_covered?: number | null;
                    bedrooms?: number | null;
                    bathrooms?: number | null;
                    parking_spaces?: number | null;
                    floor?: string | null;
                    has_garage?: boolean | null;
                    has_laundry?: boolean | null;
                    has_pool?: boolean | null;
                    has_terrace?: boolean | null;
                    address?: string | null;
                    neighborhood?: string | null;
                    city?: string | null;
                    province?: string | null;
                    amenities?: string[] | null;
                    images?: Json | null;
                    video_url?: string | null;
                    condition?: string | null;
                    owner_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'properties_owner_id_fkey';
                        columns: ['owner_id'];
                        isOneToOne: false;
                        referencedRelation: 'owners';
                        referencedColumns: ['id'];
                    },
                ];
            };
            locations: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    parent_id: string | null;
                    zone: string | null;
                    latitude: number | null;
                    longitude: number | null;
                    is_active: boolean;
                    sort_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    parent_id?: string | null;
                    zone?: string | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    is_active?: boolean;
                    sort_order?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    slug?: string;
                    parent_id?: string | null;
                    zone?: string | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    is_active?: boolean;
                    sort_order?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'locations_parent_id_fkey';
                        columns: ['parent_id'];
                        isOneToOne: false;
                        referencedRelation: 'locations';
                        referencedColumns: ['id'];
                    },
                ];
            };
            agents_realtime: {
                Row: {
                    id: string;
                    name: string;
                    matricula: string | null;
                    role: string | null;
                    photo_url: string | null;
                    bio: string | null;
                    sort_order: number | null;
                    is_active: boolean | null;
                    created_at: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    id: string;
                    name: string;
                    matricula?: string | null;
                    role?: string | null;
                    photo_url?: string | null;
                    bio?: string | null;
                    sort_order?: number | null;
                    is_active?: boolean | null;
                    created_at?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    id?: string;
                    name?: string;
                    matricula?: string | null;
                    role?: string | null;
                    photo_url?: string | null;
                    bio?: string | null;
                    sort_order?: number | null;
                    is_active?: boolean | null;
                    created_at?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            newsletter_subscribers: {
                Row: {
                    id: string;
                    email: string;
                    source: string | null;
                    status: Database['public']['Enums']['newsletter_status'];
                    created_at: string;
                    updated_at: string;
                    deleted_at: string | null;
                };
                Insert: {
                    id?: string;
                    email: string;
                    source?: string | null;
                    status?: Database['public']['Enums']['newsletter_status'];
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Update: {
                    id?: string;
                    email?: string;
                    source?: string | null;
                    status?: Database['public']['Enums']['newsletter_status'];
                    created_at?: string;
                    updated_at?: string;
                    deleted_at?: string | null;
                };
                Relationships: [];
            };
            site_settings: {
                Row: {
                    id: string;
                    key: string;
                    value: Json | null;
                    description: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    key?: string;
                    value?: Json | null;
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    key?: string;
                    value?: Json | null;
                    description?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
        };
        Views: {
            agents_public: {
                Row: {
                    id: string;
                    name: string;
                    matricula: string | null;
                    role: string | null;
                    photo_url: string | null;
                    bio: string | null;
                    sort_order: number;
                    is_active: boolean;
                };
                Relationships: [];
            };
        };
        Functions: {
            submit_contact: {
                Args: {
                    p_name: string;
                    p_last_name: string;
                    p_email: string;
                    p_phone: string;
                    p_city: string;
                    p_intent: Database['public']['Enums']['lead_intent'];
                    p_message: string;
                    p_data: Json;
                    p_files: Json;
                    p_hp: string;
                };
                Returns: unknown;
            };
            subscribe_newsletter: {
                Args: { p_email: string; p_source: string; p_hp: string };
                Returns: unknown;
            };
        };
        Enums: {
            property_type: 'house' | 'apartment' | 'lot' | 'commercial' | 'other';
            operation_type: 'sale' | 'rent';
            listing_type: 'gold' | 'gold_premium' | 'gold_special' | 'silver' | 'bronze' | 'free';
            property_status: 'draft' | 'publicada' | 'pausada' | 'vendida' | 'alquilada' | 'trash';
            newsletter_status: 'pending' | 'confirmed' | 'unsubscribed';
            lead_intent: 'buy' | 'rent' | 'sell' | 'valuation' | 'info';
            lead_source: 'landing' | 'ml' | 'whatsapp' | 'referral' | 'walkin' | 'other';
            lead_status:
                | 'new'
                | 'contacted'
                | 'qualified'
                | 'proposal'
                | 'closed_won'
                | 'closed_lost'
                | 'trash';
            audit_action:
                | 'create'
                | 'update'
                | 'delete'
                | 'publish'
                | 'unpublish'
                | 'restore'
                | 'purge'
                | 'ml_publish'
                | 'ml_update'
                | 'ml_delete';
            admin_role: 'super_admin' | 'admin' | 'staff' | 'viewer';
            chat_channel_type: 'direct' | 'group' | 'property' | 'lead';
            chat_message_type: 'text' | 'image' | 'file' | 'reply';
            ml_operation: 'publish' | 'update' | 'delete';
            ml_sync_status: 'pending' | 'processing' | 'completed' | 'failed';
            action_plan_status: 'draft' | 'active' | 'completed' | 'archived';
            visit_status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
            visit_type: 'presencial' | 'virtual';
        };
        CompositeTypes: {
            audit_action: never;
        };
    };
};
