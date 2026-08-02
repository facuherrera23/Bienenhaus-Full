/**
 * Tipos de base de datos generados desde migraciones locales.
 * Para regenerar con proyecto remoto: npx supabase gen types typescript --project-id TU_PROJECT_REF > apps/admin/src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'super_admin' | 'admin' | 'staff' | 'agent';
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'super_admin' | 'admin' | 'staff' | 'agent';
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'super_admin' | 'admin' | 'staff' | 'agent';
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agents: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          matricula: string | null;
          photo_url: string | null;
          bio: string | null;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          matricula?: string | null;
          photo_url?: string | null;
          bio?: string | null;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          phone?: string | null;
          matricula?: string | null;
          photo_url?: string | null;
          bio?: string | null;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          name: string;
          last_name: string;
          email: string;
          phone: string | null;
          source: string | null;
          status: 'nuevo' | 'contactado' | 'calificado' | 'propuesta' | 'cerrado_ganado' | 'cerrado_perdido';
          assigned_agent_id: string | null;
          notes: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          source?: string | null;
          status?: 'nuevo' | 'contactado' | 'calificado' | 'propuesta' | 'cerrado_ganado' | 'cerrado_perdido';
          assigned_agent_id?: string | null;
          notes?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          source?: string | null;
          status?: 'nuevo' | 'contactado' | 'calificado' | 'propuesta' | 'cerrado_ganado' | 'cerrado_perdido';
          assigned_agent_id?: string | null;
          notes?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          code: number;
          title: string;
          description: string | null;
          status: 'borrador' | 'en_revision' | 'publicada' | 'pausada' | 'vendida' | 'alquilada' | 'archivada';
          listing_type: 'venta' | 'alquiler' | 'venta_alquiler' | 'emprendimiento';
          price: number | null;
          currency: 'USD' | 'ARS';
          expenses: number | null;
          address: string | null;
          neighborhood: string | null;
          city: string | null;
          province: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          area_total: number | null;
          area_covered: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          garages: number | null;
          floors: number | null;
          floor_number: number | null;
          antiquity: number | null;
          orientation: string | null;
          condition: 'nuevo' | 'usado' | 'a_refaccionar';
          featured: boolean;
          video_url: string | null;
          published_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code?: number;
          title: string;
          description?: string | null;
          status?: 'borrador' | 'en_revision' | 'publicada' | 'pausada' | 'vendida' | 'alquilada' | 'archivada';
          listing_type?: 'venta' | 'alquiler' | 'venta_alquiler' | 'emprendimiento';
          price?: number | null;
          currency?: 'USD' | 'ARS';
          expenses?: number | null;
          address?: string | null;
          neighborhood?: string | null;
          city?: string | null;
          province?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          area_total?: number | null;
          area_covered?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          garages?: number | null;
          floors?: number | null;
          floor_number?: number | null;
          antiquity?: number | null;
          orientation?: string | null;
          condition?: 'nuevo' | 'usado' | 'a_refaccionar';
          featured?: boolean;
          video_url?: string | null;
          published_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: number;
          title?: string;
          description?: string | null;
          status?: 'borrador' | 'en_revision' | 'publicada' | 'pausada' | 'vendida' | 'alquilada' | 'archivada';
          listing_type?: 'venta' | 'alquiler' | 'venta_alquiler' | 'emprendimiento';
          price?: number | null;
          currency?: 'USD' | 'ARS';
          expenses?: number | null;
          address?: string | null;
          neighborhood?: string | null;
          city?: string | null;
          province?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          area_total?: number | null;
          area_covered?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          garages?: number | null;
          floors?: number | null;
          floor_number?: number | null;
          antiquity?: number | null;
          orientation?: string | null;
          condition?: 'nuevo' | 'usado' | 'a_refaccionar';
          featured?: boolean;
          video_url?: string | null;
          published_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      property_images: {
        Row: {
          id: string;
          property_id: string;
          url: string;
          storage_path: string | null;
          is_cover: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          url: string;
          storage_path?: string | null;
          is_cover?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          url?: string;
          storage_path?: string | null;
          is_cover?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      visits: {
        Row: {
          id: string;
          property_id: string;
          lead_id: string | null;
          agent_id: string | null;
          title: string | null;
          description: string | null;
          start_at: string;
          end_at: string;
          status: 'programada' | 'confirmada' | 'realizada' | 'cancelada' | 'no_show';
          visit_type: 'presencial' | 'virtual';
          meeting_url: string | null;
          address: string | null;
          notes: string | null;
          reminder_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          lead_id?: string | null;
          agent_id?: string | null;
          title?: string | null;
          description?: string | null;
          start_at: string;
          end_at: string;
          status?: 'programada' | 'confirmada' | 'realizada' | 'cancelada' | 'no_show';
          visit_type?: 'presencial' | 'virtual';
          meeting_url?: string | null;
          address?: string | null;
          notes?: string | null;
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          lead_id?: string | null;
          agent_id?: string | null;
          title?: string | null;
          description?: string | null;
          start_at?: string;
          end_at?: string;
          status?: 'programada' | 'confirmada' | 'realizada' | 'cancelada' | 'no_show';
          visit_type?: 'presencial' | 'virtual';
          meeting_url?: string | null;
          address?: string | null;
          notes?: string | null;
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_availability: {
        Row: {
          id: string;
          agent_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_channels: {
        Row: {
          id: string;
          name: string | null;
          type: 'direct' | 'group' | 'property' | 'lead';
          property_id: string | null;
          lead_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          type?: 'direct' | 'group' | 'property' | 'lead';
          property_id?: string | null;
          lead_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          type?: 'direct' | 'group' | 'property' | 'lead';
          property_id?: string | null;
          lead_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_channel_participants: {
        Row: {
          id: string;
          channel_id: string;
          user_id: string;
          joined_at: string;
          last_read_at: string | null;
        };
        Insert: {
          id?: string;
          channel_id: string;
          user_id: string;
          joined_at?: string;
          last_read_at?: string | null;
        };
        Update: {
          id?: string;
          channel_id?: string;
          user_id?: string;
          joined_at?: string;
          last_read_at?: string | null;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          channel_id: string;
          sender_id: string;
          content: string;
          message_type: 'text' | 'image' | 'file' | 'system';
          file_url: string | null;
          file_name: string | null;
          file_size: number | null;
          reply_to_id: string | null;
          edited_at: string | null;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          channel_id: string;
          sender_id: string;
          content: string;
          message_type?: 'text' | 'image' | 'file' | 'system';
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          reply_to_id?: string | null;
          edited_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: 'text' | 'image' | 'file' | 'system';
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          reply_to_id?: string | null;
          edited_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ml_connection: {
        Row: {
          id: string;
          provider: string;
          site_id: string;
          user_id: number | null;
          nickname: string | null;
          email: string | null;
          access_token_encrypted: string;
          access_token_iv: string;
          refresh_token_encrypted: string;
          refresh_token_iv: string;
          token_expires_at: string;
          scope: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider?: string;
          site_id?: string;
          user_id?: number | null;
          nickname?: string | null;
          email?: string | null;
          access_token_encrypted: string;
          access_token_iv: string;
          refresh_token_encrypted: string;
          refresh_token_iv: string;
          token_expires_at: string;
          scope?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          site_id?: string;
          user_id?: number | null;
          nickname?: string | null;
          email?: string | null;
          access_token_encrypted?: string;
          access_token_iv?: string;
          refresh_token_encrypted?: string;
          refresh_token_iv?: string;
          token_expires_at?: string;
          scope?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ml_sync_queue: {
        Row: {
          id: number;
          property_id: string;
          operation: 'publish' | 'update' | 'delete';
          status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
          attempts: number;
          max_attempts: number;
          next_attempt_at: string | null;
          ml_item_id: number | null;
          last_error: string | null;
          locked_by: string | null;
          locked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          property_id: string;
          operation: 'publish' | 'update' | 'delete';
          status?: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
          attempts?: number;
          max_attempts?: number;
          next_attempt_at?: string | null;
          ml_item_id?: number | null;
          last_error?: string | null;
          locked_by?: string | null;
          locked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          property_id?: string;
          operation?: 'publish' | 'update' | 'delete';
          status?: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
          attempts?: number;
          max_attempts?: number;
          next_attempt_at?: string | null;
          ml_item_id?: number | null;
          last_error?: string | null;
          locked_by?: string | null;
          locked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ml_sync_history: {
        Row: {
          id: number;
          queue_id: number;
          operation: 'publish' | 'update' | 'delete';
          status: 'success' | 'failed';
          attempt: number;
          response: Json | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          queue_id: number;
          operation: 'publish' | 'update' | 'delete';
          status: 'success' | 'failed';
          attempt: number;
          response?: Json | null;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          queue_id?: number;
          operation?: 'publish' | 'update' | 'delete';
          status?: 'success' | 'failed';
          attempt?: number;
          response?: Json | null;
          error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      property_ml_meta: {
        Row: {
          property_id: string;
          ml_item_id: number | null;
          status: string | null;
          permalink: string | null;
          price: number | null;
          last_sync_at: string | null;
          last_sync_status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          property_id: string;
          ml_item_id?: number | null;
          status?: string | null;
          permalink?: string | null;
          price?: number | null;
          last_sync_at?: string | null;
          last_sync_status?: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          property_id?: string;
          ml_item_id?: number | null;
          status?: string | null;
          permalink?: string | null;
          price?: number | null;
          last_sync_at?: string | null;
          last_sync_status?: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ml_webhook_events: {
        Row: {
          id: number;
          user_id: number;
          resource: string;
          topic: string;
          application_id: number;
          attempts: number;
          sent_at: string;
          received_at: string;
          status: 'received' | 'processed' | 'failed';
          error: string | null;
          payload: Json;
        };
        Insert: {
          user_id: number;
          resource: string;
          topic: string;
          application_id: number;
          attempts?: number;
          sent_at: string;
          received_at?: string;
          status?: 'received' | 'processed' | 'failed';
          error?: string | null;
          payload: Json;
        };
        Update: {
          id?: number;
          user_id?: number;
          resource?: string;
          topic?: string;
          application_id?: number;
          attempts?: number;
          sent_at?: string;
          received_at?: string;
          status?: 'received' | 'processed' | 'failed';
          error?: string | null;
          payload?: Json;
        };
        Relationships: [];
      };
      ml_questions: {
        Row: {
          id: number;
          question_id: string;
          property_id: string | null;
          ml_item_id: number;
          question_text: string | null;
          answer_text: string | null;
          status: 'unanswered' | 'answered' | 'deleted';
          from_user_id: number | null;
          from_user_nickname: string | null;
          date_created: string | null;
          date_updated: string | null;
          received_at: string;
        };
        Insert: {
          question_id: string;
          property_id?: string | null;
          ml_item_id: number;
          question_text?: string | null;
          answer_text?: string | null;
          status?: 'unanswered' | 'answered' | 'deleted';
          from_user_id?: number | null;
          from_user_nickname?: string | null;
          date_created?: string | null;
          date_updated?: string | null;
          received_at?: string;
        };
        Update: {
          id?: number;
          question_id?: string;
          property_id?: string | null;
          ml_item_id?: number;
          question_text?: string | null;
          answer_text?: string | null;
          status?: 'unanswered' | 'answered' | 'deleted';
          from_user_id?: number | null;
          from_user_nickname?: string | null;
          date_created?: string | null;
          date_updated?: string | null;
          received_at?: string;
        };
        Relationships: [];
      };
      ml_orders: {
        Row: {
          id: number;
          order_id: string;
          property_id: string | null;
          ml_item_id: number;
          buyer_id: number | null;
          buyer_nickname: string | null;
          status: 'new' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
          total_amount: number | null;
          currency: string;
          date_created: string | null;
          date_closed: string | null;
          received_at: string;
        };
        Insert: {
          order_id: string;
          property_id?: string | null;
          ml_item_id: number;
          buyer_id?: number | null;
          buyer_nickname?: string | null;
          status?: 'new' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
          total_amount?: number | null;
          currency?: string;
          date_created?: string | null;
          date_closed?: string | null;
          received_at?: string;
        };
        Update: {
          id?: number;
          order_id?: string;
          property_id?: string | null;
          ml_item_id?: number;
          buyer_id?: number | null;
          buyer_nickname?: string | null;
          status?: 'new' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
          total_amount?: number | null;
          currency?: string;
          date_created?: string | null;
          date_closed?: string | null;
          received_at?: string;
        };
        Relationships: [];
      };
      ml_payments: {
        Row: {
          id: number;
          payment_id: string;
          order_id: string | null;
          property_id: string | null;
          status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled';
          amount: number | null;
          currency: string;
          payment_method_id: string | null;
          payment_type: string | null;
          date_created: string | null;
          date_approved: string | null;
          received_at: string;
          payload: Json;
        };
        Insert: {
          payment_id: string;
          order_id?: string | null;
          property_id?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled';
          amount?: number | null;
          currency?: string;
          payment_method_id?: string | null;
          payment_type?: string | null;
          date_created?: string | null;
          date_approved?: string | null;
          received_at?: string;
          payload: Json;
        };
        Update: {
          id?: number;
          payment_id?: string;
          order_id?: string | null;
          property_id?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled';
          amount?: number | null;
          currency?: string;
          payment_method_id?: string | null;
          payment_type?: string | null;
          date_created?: string | null;
          date_approved?: string | null;
          received_at?: string;
          payload?: Json;
        };
        Relationships: [];
      };
      ml_shipments: {
        Row: {
          id: number;
          shipment_id: string;
          order_id: string | null;
          property_id: string | null;
          status: 'pending' | 'handling' | 'ready_to_ship' | 'shipped' | 'delivered' | 'cancelled';
          tracking_number: string | null;
          tracking_url: string | null;
          logistics_type: string | null;
          date_created: string | null;
          date_delivered: string | null;
          received_at: string;
          payload: Json;
        };
        Insert: {
          shipment_id: string;
          order_id?: string | null;
          property_id?: string | null;
          status?: 'pending' | 'handling' | 'ready_to_ship' | 'shipped' | 'delivered' | 'cancelled';
          tracking_number?: string | null;
          tracking_url?: string | null;
          logistics_type?: string | null;
          date_created?: string | null;
          date_delivered?: string | null;
          received_at?: string;
          payload: Json;
        };
        Update: {
          id?: number;
          shipment_id?: string;
          order_id?: string | null;
          property_id?: string | null;
          status?: 'pending' | 'handling' | 'ready_to_ship' | 'shipped' | 'delivered' | 'cancelled';
          tracking_number?: string | null;
          tracking_url?: string | null;
          logistics_type?: string | null;
          date_created?: string | null;
          date_delivered?: string | null;
          received_at?: string;
          payload?: Json;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          value_type: 'string' | 'number' | 'boolean' | 'json';
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          value_type?: 'string' | 'number' | 'boolean' | 'json';
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          value_type?: 'string' | 'number' | 'boolean' | 'json';
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_content: {
        Row: {
          id: string;
          section: string;
          locale: string;
          key: string;
          value: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section: string;
          locale: string;
          key: string;
          value: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section?: string;
          locale?: string;
          key?: string;
          value?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
          source: string | null;
          confirmed_at: string | null;
          unsubscribed_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          status?: 'active' | 'unsubscribed' | 'bounced' | 'complained';
          source?: string | null;
          confirmed_at?: string | null;
          unsubscribed_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          status?: 'active' | 'unsubscribed' | 'bounced' | 'complained';
          source?: string | null;
          confirmed_at?: string | null;
          unsubscribed_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      ml_get_connection: {
        Args: Record<PropertyKey, never>;
        Returns: {
          ml_enabled: boolean;
          connection: {
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
          } | null;
        } | null;
      };
      ml_enqueue: {
        Args: {
          p_property_id: string;
          p_operation: 'publish' | 'update' | 'delete';
        };
        Returns: number;
      };
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      property_status: 'borrador' | 'en_revision' | 'publicada' | 'pausada' | 'vendida' | 'alquilada' | 'archivada';
      listing_type: 'venta' | 'alquiler' | 'venta_alquiler' | 'emprendimiento';
      lead_status: 'nuevo' | 'contactado' | 'calificado' | 'propuesta' | 'cerrado_ganado' | 'cerrado_perdido';
      visit_status: 'programada' | 'confirmada' | 'realizada' | 'cancelada' | 'no_show';
      visit_type: 'presencial' | 'virtual';
      ml_operation: 'publish' | 'update' | 'delete';
      ml_sync_status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';
      admin_role: 'super_admin' | 'admin' | 'staff' | 'agent';
      chat_channel_type: 'direct' | 'group' | 'property' | 'lead';
      message_type: 'text' | 'image' | 'file' | 'system';
      newsletter_status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
      agent_condition: 'nuevo' | 'usado' | 'a_refaccionar';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}