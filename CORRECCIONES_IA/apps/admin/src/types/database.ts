export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      action_plan_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["action_plan_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["action_plan_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["action_plan_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plan_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "property_action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          ip: string | null
          metadata: Json
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          ip?: string | null
          metadata?: Json
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          ip?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          must_change_password: boolean
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          last_login_at?: string | null
          must_change_password?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          must_change_password?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
        }
        Relationships: []
      }
      agent_availability: {
        Row: {
          agent_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_availability_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_availability_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents_public"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          bio: string | null
          commission: Json
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          is_active: boolean
          matricula: string | null
          name: string
          permissions: Json
          phone: string | null
          photo_url: string | null
          role: string | null
          schedule: Json
          social: Json
          sort_order: number
          specialties: Json
          updated_at: string
        }
        Insert: {
          bio?: string | null
          commission?: Json
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: string
          is_active?: boolean
          matricula?: string | null
          name: string
          permissions?: Json
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          schedule?: Json
          social?: Json
          sort_order?: number
          specialties?: Json
          updated_at?: string
        }
        Update: {
          bio?: string | null
          commission?: Json
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          is_active?: boolean
          matricula?: string | null
          name?: string
          permissions?: Json
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          schedule?: Json
          social?: Json
          sort_order?: number
          specialties?: Json
          updated_at?: string
        }
        Relationships: []
      }
      agents_realtime: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          matricula: string | null
          name: string
          photo_url: string | null
          role: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id: string
          is_active?: boolean | null
          matricula?: string | null
          name: string
          photo_url?: string | null
          role?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          matricula?: string | null
          name?: string
          photo_url?: string | null
          role?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_role: string | null
          actor_user_agent: string | null
          changed_fields: string[] | null
          created_at: string
          entity_id: string | null
          entity_title: string | null
          entity_type: string
          error_message: string | null
          id: number
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          request_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_role?: string | null
          actor_user_agent?: string | null
          changed_fields?: string[] | null
          created_at?: string
          entity_id?: string | null
          entity_title?: string | null
          entity_type: string
          error_message?: string | null
          id?: number
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          request_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_role?: string | null
          actor_user_agent?: string | null
          changed_fields?: string[] | null
          created_at?: string
          entity_id?: string | null
          entity_title?: string | null
          entity_type?: string
          error_message?: string | null
          id?: number
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          request_id?: string | null
          status?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channel_participants: {
        Row: {
          agent_id: string
          channel_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          notifications_enabled: boolean | null
        }
        Insert: {
          agent_id: string
          channel_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          notifications_enabled?: boolean | null
        }
        Update: {
          agent_id?: string
          channel_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          notifications_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_participants_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channel_participants_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channel_participants_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          lead_id: string | null
          name: string | null
          property_id: string | null
          type: Database["public"]["Enums"]["chat_channel_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          lead_id?: string | null
          name?: string | null
          property_id?: string | null
          type?: Database["public"]["Enums"]["chat_channel_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          lead_id?: string | null
          name?: string | null
          property_id?: string | null
          type?: Database["public"]["Enums"]["chat_channel_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channels_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channels_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_reads: {
        Row: {
          agent_id: string
          id: string
          message_id: string
          read_at: string
        }
        Insert: {
          agent_id: string
          id?: string
          message_id: string
          read_at?: string
        }
        Update: {
          agent_id?: string
          id?: string
          message_id?: string
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_reads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          message_type: string
          reply_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          message_type?: string
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          message_type?: string
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "agents_public"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      geocode_cache: {
        Row: {
          created_at: string | null
          display_name: string | null
          lat: number | null
          lon: number | null
          query: string
          raw: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          lat?: number | null
          lon?: number | null
          query: string
          raw?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          lat?: number | null
          lon?: number | null
          query?: string
          raw?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          city: string | null
          created_at: string
          data: Json
          deleted_at: string | null
          email: string
          files: Json
          id: string
          intent: Database["public"]["Enums"]["lead_intent"]
          last_name: string
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          property_id: string | null
          score: number
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          tags: Json
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          city?: string | null
          created_at?: string
          data?: Json
          deleted_at?: string | null
          email: string
          files?: Json
          id?: string
          intent?: Database["public"]["Enums"]["lead_intent"]
          last_name: string
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          property_id?: string | null
          score?: number
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: Json
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          city?: string | null
          created_at?: string
          data?: Json
          deleted_at?: string | null
          email?: string
          files?: Json
          id?: string
          intent?: Database["public"]["Enums"]["lead_intent"]
          last_name?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          property_id?: string | null
          score?: number
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "agents_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
          zone: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
          zone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_auto_reply_templates: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          message: string
          name: string
          trigger: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          message: string
          name: string
          trigger: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          message?: string
          name?: string
          trigger?: string
          updated_at?: string
        }
        Relationships: []
      }
      ml_connection: {
        Row: {
          access_token_encrypted: string
          access_token_iv: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          nickname: string | null
          provider: string
          refresh_token_encrypted: string
          refresh_token_iv: string
          site_id: string
          token_expires_at: string
          updated_at: string
          user_id: number | null
        }
        Insert: {
          access_token_encrypted: string
          access_token_iv: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          nickname?: string | null
          provider?: string
          refresh_token_encrypted: string
          refresh_token_iv: string
          site_id?: string
          token_expires_at: string
          updated_at?: string
          user_id?: number | null
        }
        Update: {
          access_token_encrypted?: string
          access_token_iv?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          nickname?: string | null
          provider?: string
          refresh_token_encrypted?: string
          refresh_token_iv?: string
          site_id?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: number | null
        }
        Relationships: []
      }
      ml_orders: {
        Row: {
          auto_reply_sent: string | null
          buyer_id: number | null
          buyer_nickname: string | null
          currency: string | null
          date_closed: string | null
          date_created: string | null
          id: number
          ml_item_id: number
          order_id: string
          property_id: string | null
          received_at: string
          status: string
          total_amount: number | null
        }
        Insert: {
          auto_reply_sent?: string | null
          buyer_id?: number | null
          buyer_nickname?: string | null
          currency?: string | null
          date_closed?: string | null
          date_created?: string | null
          id?: number
          ml_item_id: number
          order_id: string
          property_id?: string | null
          received_at?: string
          status?: string
          total_amount?: number | null
        }
        Update: {
          auto_reply_sent?: string | null
          buyer_id?: number | null
          buyer_nickname?: string | null
          currency?: string | null
          date_closed?: string | null
          date_created?: string | null
          id?: number
          ml_item_id?: number
          order_id?: string
          property_id?: string | null
          received_at?: string
          status?: string
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_orders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_payments: {
        Row: {
          amount: number | null
          currency: string | null
          date_approved: string | null
          date_created: string | null
          id: number
          order_id: string | null
          payload: Json | null
          payment_id: string
          payment_method_id: string | null
          payment_type: string | null
          property_id: string | null
          received_at: string
          status: string
        }
        Insert: {
          amount?: number | null
          currency?: string | null
          date_approved?: string | null
          date_created?: string | null
          id?: number
          order_id?: string | null
          payload?: Json | null
          payment_id: string
          payment_method_id?: string | null
          payment_type?: string | null
          property_id?: string | null
          received_at?: string
          status?: string
        }
        Update: {
          amount?: number | null
          currency?: string | null
          date_approved?: string | null
          date_created?: string | null
          id?: number
          order_id?: string | null
          payload?: Json | null
          payment_id?: string
          payment_method_id?: string | null
          payment_type?: string | null
          property_id?: string | null
          received_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_questions: {
        Row: {
          answer_text: string | null
          date_created: string | null
          date_updated: string | null
          from_user_id: number | null
          from_user_nickname: string | null
          id: number
          ml_item_id: number
          property_id: string | null
          question_id: string
          question_text: string | null
          received_at: string
          status: string
        }
        Insert: {
          answer_text?: string | null
          date_created?: string | null
          date_updated?: string | null
          from_user_id?: number | null
          from_user_nickname?: string | null
          id?: number
          ml_item_id: number
          property_id?: string | null
          question_id: string
          question_text?: string | null
          received_at?: string
          status?: string
        }
        Update: {
          answer_text?: string | null
          date_created?: string | null
          date_updated?: string | null
          from_user_id?: number | null
          from_user_nickname?: string | null
          id?: number
          ml_item_id?: number
          property_id?: string | null
          question_id?: string
          question_text?: string | null
          received_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_questions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_shipments: {
        Row: {
          date_created: string | null
          date_delivered: string | null
          id: number
          logistics_type: string | null
          order_id: string | null
          payload: Json | null
          property_id: string | null
          received_at: string
          shipment_id: string
          status: string
          tracking_number: string | null
          tracking_url: string | null
        }
        Insert: {
          date_created?: string | null
          date_delivered?: string | null
          id?: number
          logistics_type?: string | null
          order_id?: string | null
          payload?: Json | null
          property_id?: string | null
          received_at?: string
          shipment_id: string
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
        }
        Update: {
          date_created?: string | null
          date_delivered?: string | null
          id?: number
          logistics_type?: string | null
          order_id?: string | null
          payload?: Json | null
          property_id?: string | null
          received_at?: string
          shipment_id?: string
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_shipments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_sync_dead_letter: {
        Row: {
          attempts: number
          created_at: string | null
          id: number
          last_error: string | null
          max_attempts: number
          ml_item_id: number | null
          moved_at: string | null
          operation: Database["public"]["Enums"]["ml_operation"]
          original_queue_id: number
          payload: Json | null
          property_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          attempts: number
          created_at?: string | null
          id?: number
          last_error?: string | null
          max_attempts: number
          ml_item_id?: number | null
          moved_at?: string | null
          operation: Database["public"]["Enums"]["ml_operation"]
          original_queue_id: number
          payload?: Json | null
          property_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string | null
          id?: number
          last_error?: string | null
          max_attempts?: number
          ml_item_id?: number | null
          moved_at?: string | null
          operation?: Database["public"]["Enums"]["ml_operation"]
          original_queue_id?: number
          payload?: Json | null
          property_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_sync_dead_letter_original_queue_id_fkey"
            columns: ["original_queue_id"]
            isOneToOne: false
            referencedRelation: "ml_sync_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_sync_dead_letter_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_sync_dead_letter_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_sync_history: {
        Row: {
          attempt: number
          created_at: string
          error: string | null
          id: number
          operation: Database["public"]["Enums"]["ml_operation"]
          queue_id: number
          response: Json | null
          status: Database["public"]["Enums"]["ml_sync_status"]
        }
        Insert: {
          attempt: number
          created_at?: string
          error?: string | null
          id?: never
          operation: Database["public"]["Enums"]["ml_operation"]
          queue_id: number
          response?: Json | null
          status: Database["public"]["Enums"]["ml_sync_status"]
        }
        Update: {
          attempt?: number
          created_at?: string
          error?: string | null
          id?: never
          operation?: Database["public"]["Enums"]["ml_operation"]
          queue_id?: number
          response?: Json | null
          status?: Database["public"]["Enums"]["ml_sync_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ml_sync_history_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "ml_sync_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_sync_queue: {
        Row: {
          attempts: number
          created_at: string
          created_by: string | null
          id: number
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          ml_item_id: number | null
          next_attempt_at: string
          operation: Database["public"]["Enums"]["ml_operation"]
          payload: Json
          property_id: string
          status: Database["public"]["Enums"]["ml_sync_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          created_by?: string | null
          id?: never
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          ml_item_id?: number | null
          next_attempt_at?: string
          operation: Database["public"]["Enums"]["ml_operation"]
          payload?: Json
          property_id: string
          status?: Database["public"]["Enums"]["ml_sync_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          created_by?: string | null
          id?: never
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          ml_item_id?: number | null
          next_attempt_at?: string
          operation?: Database["public"]["Enums"]["ml_operation"]
          payload?: Json
          property_id?: string
          status?: Database["public"]["Enums"]["ml_sync_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_sync_queue_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_sync_queue_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_webhook_events: {
        Row: {
          application_id: number
          attempts: number
          error: string | null
          id: number
          payload: Json
          received_at: string
          resource: string
          sent_at: string
          status: string
          topic: string
          user_id: number
        }
        Insert: {
          application_id: number
          attempts?: number
          error?: string | null
          id?: number
          payload: Json
          received_at?: string
          resource: string
          sent_at: string
          status: string
          topic: string
          user_id: number
        }
        Update: {
          application_id?: number
          attempts?: number
          error?: string | null
          id?: number
          payload?: Json
          received_at?: string
          resource?: string
          sent_at?: string
          status?: string
          topic?: string
          user_id?: number
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          source: string
          status: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: string
          source?: string
          status?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          source?: string
          status?: string
        }
        Relationships: []
      }
      owner_communications: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          owner_id: string
          property_id: string | null
          sent_at: string | null
          sent_by: string | null
          status: Database["public"]["Enums"]["communication_status"] | null
          subject: string | null
          type: Database["public"]["Enums"]["communication_type"]
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          owner_id: string
          property_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["communication_status"] | null
          subject?: string | null
          type: Database["public"]["Enums"]["communication_type"]
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          owner_id?: string
          property_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["communication_status"] | null
          subject?: string | null
          type?: Database["public"]["Enums"]["communication_type"]
        }
        Relationships: [
          {
            foreignKeyName: "owner_communications_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_communications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_communications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_reports: {
        Row: {
          content_json: Json | null
          created_by: string | null
          generated_at: string | null
          id: string
          owner_id: string
          pdf_url: string | null
          property_id: string
          report_type: Database["public"]["Enums"]["report_type"]
          sent_at: string | null
          status: Database["public"]["Enums"]["communication_status"] | null
          title: string | null
        }
        Insert: {
          content_json?: Json | null
          created_by?: string | null
          generated_at?: string | null
          id?: string
          owner_id: string
          pdf_url?: string | null
          property_id: string
          report_type: Database["public"]["Enums"]["report_type"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["communication_status"] | null
          title?: string | null
        }
        Update: {
          content_json?: Json | null
          created_by?: string | null
          generated_at?: string | null
          id?: string
          owner_id?: string
          pdf_url?: string | null
          property_id?: string
          report_type?: Database["public"]["Enums"]["report_type"]
          sent_at?: string | null
          status?: Database["public"]["Enums"]["communication_status"] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_reports_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          dni_cuit: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          owner_type: Database["public"]["Enums"]["owner_type"] | null
          phone: string | null
          preferred_contact:
            | Database["public"]["Enums"]["owner_preferred_contact"]
            | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          dni_cuit?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          owner_type?: Database["public"]["Enums"]["owner_type"] | null
          phone?: string | null
          preferred_contact?:
            | Database["public"]["Enums"]["owner_preferred_contact"]
            | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          dni_cuit?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          owner_type?: Database["public"]["Enums"]["owner_type"] | null
          phone?: string | null
          preferred_contact?:
            | Database["public"]["Enums"]["owner_preferred_contact"]
            | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owners_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          amenities: Json
          area_covered: number | null
          area_total: number | null
          bathrooms: number | null
          bedrooms: number | null
          code: number
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency"]
          deleted_at: string | null
          description: string | null
          expenses: number | null
          favorites_count: number
          featured: boolean
          floors: number | null
          garages: number | null
          id: string
          latitude: number | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          location_id: string | null
          longitude: number | null
          price: number | null
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at: string
          video_url: string | null
          views_count: number
          year_built: number | null
        }
        Insert: {
          address?: string | null
          amenities?: Json
          area_covered?: number | null
          area_total?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          code?: number
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency"]
          deleted_at?: string | null
          description?: string | null
          expenses?: number | null
          favorites_count?: number
          featured?: boolean
          floors?: number | null
          garages?: number | null
          id?: string
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          location_id?: string | null
          longitude?: number | null
          price?: number | null
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at?: string
          video_url?: string | null
          views_count?: number
          year_built?: number | null
        }
        Update: {
          address?: string | null
          amenities?: Json
          area_covered?: number | null
          area_total?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          code?: number
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency"]
          deleted_at?: string | null
          description?: string | null
          expenses?: number | null
          favorites_count?: number
          featured?: boolean
          floors?: number | null
          garages?: number | null
          id?: string
          latitude?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          location_id?: string | null
          longitude?: number | null
          price?: number | null
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          updated_at?: string
          video_url?: string | null
          views_count?: number
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      properties_history: {
        Row: {
          change_type: Database["public"]["Enums"]["audit_action"]
          changed_by: string | null
          created_at: string
          data: Json
          id: number
          property_id: string
        }
        Insert: {
          change_type: Database["public"]["Enums"]["audit_action"]
          changed_by?: string | null
          created_at?: string
          data?: Json
          id?: never
          property_id: string
        }
        Update: {
          change_type?: Database["public"]["Enums"]["audit_action"]
          changed_by?: string | null
          created_at?: string
          data?: Json
          id?: never
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_action_plans: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["action_plan_category"] | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          id: string
          owner_id: string | null
          priority: Database["public"]["Enums"]["action_plan_priority"] | null
          property_id: string
          status: Database["public"]["Enums"]["action_plan_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["action_plan_category"] | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["action_plan_priority"] | null
          property_id: string
          status?: Database["public"]["Enums"]["action_plan_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["action_plan_category"] | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["action_plan_priority"] | null
          property_id?: string
          status?: Database["public"]["Enums"]["action_plan_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_action_plans_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_action_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_action_plans_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_action_plans_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_drafts: {
        Row: {
          admin_user_id: string | null
          form_values: Json
          id: string
          property_id: string | null
          updated_at: string | null
        }
        Insert: {
          admin_user_id?: string | null
          form_values: Json
          id?: string
          property_id?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_user_id?: string | null
          form_values?: Json
          id?: string
          property_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_drafts_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_drafts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_features: {
        Row: {
          feature_id: string
          property_id: string
        }
        Insert: {
          feature_id: string
          property_id: string
        }
        Update: {
          feature_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_features_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          alt: string | null
          cloudinary_public_id: string | null
          created_at: string
          id: string
          is_cover: boolean
          position: number
          property_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          cloudinary_public_id?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          position?: number
          property_id: string
          url: string
        }
        Update: {
          alt?: string | null
          cloudinary_public_id?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          position?: number
          property_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_ml_meta: {
        Row: {
          category_id: string | null
          created_at: string
          last_sync_at: string | null
          last_sync_status: Database["public"]["Enums"]["ml_sync_status"] | null
          listing_type_id: number | null
          ml_item_id: number | null
          permalink: string | null
          price: number | null
          property_id: string
          published_at: string | null
          raw: Json
          status: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          last_sync_at?: string | null
          last_sync_status?:
            | Database["public"]["Enums"]["ml_sync_status"]
            | null
          listing_type_id?: number | null
          ml_item_id?: number | null
          permalink?: string | null
          price?: number | null
          property_id: string
          published_at?: string | null
          raw?: Json
          status?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          last_sync_at?: string | null
          last_sync_status?:
            | Database["public"]["Enums"]["ml_sync_status"]
            | null
          listing_type_id?: number | null
          ml_item_id?: number | null
          permalink?: string | null
          price?: number | null
          property_id?: string
          published_at?: string | null
          raw?: Json
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_ml_meta_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_owners: {
        Row: {
          created_at: string | null
          id: string
          is_primary_contact: boolean | null
          owner_id: string
          ownership_percentage: number | null
          property_id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary_contact?: boolean | null
          owner_id: string
          ownership_percentage?: number | null
          property_id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary_contact?: boolean | null
          owner_id?: string
          ownership_percentage?: number | null
          property_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_owners_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_owners_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_price_analyses: {
        Row: {
          analysis_date: string | null
          analyzed_by: string | null
          comparable_properties: Json | null
          created_at: string | null
          estimated_market_price: number
          id: string
          market_trend: Database["public"]["Enums"]["market_trend"] | null
          notes: string | null
          our_listing_price: number
          price_difference_pct: number | null
          price_per_sqm_market: number | null
          price_status: Database["public"]["Enums"]["price_status"] | null
          property_id: string
          recommendation: string | null
          valid_until: string | null
        }
        Insert: {
          analysis_date?: string | null
          analyzed_by?: string | null
          comparable_properties?: Json | null
          created_at?: string | null
          estimated_market_price: number
          id?: string
          market_trend?: Database["public"]["Enums"]["market_trend"] | null
          notes?: string | null
          our_listing_price: number
          price_difference_pct?: number | null
          price_per_sqm_market?: number | null
          price_status?: Database["public"]["Enums"]["price_status"] | null
          property_id: string
          recommendation?: string | null
          valid_until?: string | null
        }
        Update: {
          analysis_date?: string | null
          analyzed_by?: string | null
          comparable_properties?: Json | null
          created_at?: string | null
          estimated_market_price?: number
          id?: string
          market_trend?: Database["public"]["Enums"]["market_trend"] | null
          notes?: string | null
          our_listing_price?: number
          price_difference_pct?: number | null
          price_per_sqm_market?: number | null
          price_status?: Database["public"]["Enums"]["price_status"] | null
          property_id?: string
          recommendation?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_price_analyses_analyzed_by_fkey"
            columns: ["analyzed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_price_analyses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_tags: {
        Row: {
          property_id: string
          tag_id: string
        }
        Insert: {
          property_id: string
          tag_id: string
        }
        Update: {
          property_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_tags_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      property_types: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      property_valuations: {
        Row: {
          ac_dispersion: number | null
          agua_caliente: string | null
          aire_acondicionado: string | null
          amb_balcon: number | null
          amb_bano: number | null
          amb_bano_servicio: number | null
          amb_cocina: number | null
          amb_cocina_comedor: number | null
          amb_comedor: number | null
          amb_cuarto_guardado: number | null
          amb_dormit_vestidor: number | null
          amb_dormitorios: number | null
          amb_escritorio: number | null
          amb_garage: number | null
          amb_lavadero: number | null
          amb_living: number | null
          amb_living_comedor: number | null
          amb_patio: number | null
          amb_suite: number | null
          amb_suite_vestidor: number | null
          amb_terraza: number | null
          amb_total_cuartos: number | null
          anio_construccion: number | null
          barrio: string | null
          barrio_tipo: string | null
          calefaccion: string | null
          calidad_constructiva: string | null
          calidad_constructiva_predom: string | null
          calidad_mantenimiento: string | null
          cambios_uso_terreno: string | null
          caracteristicas_adversas: string | null
          com_asador: string | null
          com_doble_circulacion: string | null
          com_piscina: string | null
          construccion_altura_prevalencia: string | null
          construido_pct: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          demanda_oferta: string | null
          destino: string
          detalles_terminacion: string | null
          direccion: string
          espacio_habitable: number | null
          estacionamiento_tipo: string | null
          facilidades_estacionamiento: string | null
          fecha: string
          finalized_at: string | null
          foto_fachada_url: string | null
          id: string
          imp_inmobiliarios: number | null
          indice_crecimiento: string | null
          localidad: string | null
          locked: boolean | null
          luminosidad: string | null
          nivel_socioeconomico_barrio: string | null
          observaciones: string | null
          orientacion: string | null
          plantas: number | null
          precio_dolar: number | null
          provincia: string | null
          serv_agua: string | null
          serv_cloaca: string | null
          serv_electricidad: string | null
          serv_gas: string | null
          serv_internet: string | null
          serv_techos: string | null
          serv_vigilancia: string | null
          solicitante: string
          sup_construida: number | null
          sup_terreno: number | null
          telefono: string | null
          tendencia_valores: string | null
          tiempo_comercializacion: string | null
          tipo: string
          tipo_construccion: string | null
          tipo_techo: string | null
          tipologias_edilicias: string | null
          updated_at: string | null
          updated_by: string | null
          uso_comercial: number | null
          uso_comercial_prevalencia: string | null
          uso_industrial: number | null
          uso_industrial_prevalencia: string | null
          uso_otro: number | null
          uso_residencial: number | null
          v_terreno_precio: number | null
          valor_uva: number | null
        }
        Insert: {
          ac_dispersion?: number | null
          agua_caliente?: string | null
          aire_acondicionado?: string | null
          amb_balcon?: number | null
          amb_bano?: number | null
          amb_bano_servicio?: number | null
          amb_cocina?: number | null
          amb_cocina_comedor?: number | null
          amb_comedor?: number | null
          amb_cuarto_guardado?: number | null
          amb_dormit_vestidor?: number | null
          amb_dormitorios?: number | null
          amb_escritorio?: number | null
          amb_garage?: number | null
          amb_lavadero?: number | null
          amb_living?: number | null
          amb_living_comedor?: number | null
          amb_patio?: number | null
          amb_suite?: number | null
          amb_suite_vestidor?: number | null
          amb_terraza?: number | null
          amb_total_cuartos?: number | null
          anio_construccion?: number | null
          barrio?: string | null
          barrio_tipo?: string | null
          calefaccion?: string | null
          calidad_constructiva?: string | null
          calidad_constructiva_predom?: string | null
          calidad_mantenimiento?: string | null
          cambios_uso_terreno?: string | null
          caracteristicas_adversas?: string | null
          com_asador?: string | null
          com_doble_circulacion?: string | null
          com_piscina?: string | null
          construccion_altura_prevalencia?: string | null
          construido_pct?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          demanda_oferta?: string | null
          destino: string
          detalles_terminacion?: string | null
          direccion: string
          espacio_habitable?: number | null
          estacionamiento_tipo?: string | null
          facilidades_estacionamiento?: string | null
          fecha: string
          finalized_at?: string | null
          foto_fachada_url?: string | null
          id?: string
          imp_inmobiliarios?: number | null
          indice_crecimiento?: string | null
          localidad?: string | null
          locked?: boolean | null
          luminosidad?: string | null
          nivel_socioeconomico_barrio?: string | null
          observaciones?: string | null
          orientacion?: string | null
          plantas?: number | null
          precio_dolar?: number | null
          provincia?: string | null
          serv_agua?: string | null
          serv_cloaca?: string | null
          serv_electricidad?: string | null
          serv_gas?: string | null
          serv_internet?: string | null
          serv_techos?: string | null
          serv_vigilancia?: string | null
          solicitante: string
          sup_construida?: number | null
          sup_terreno?: number | null
          telefono?: string | null
          tendencia_valores?: string | null
          tiempo_comercializacion?: string | null
          tipo: string
          tipo_construccion?: string | null
          tipo_techo?: string | null
          tipologias_edilicias?: string | null
          updated_at?: string | null
          updated_by?: string | null
          uso_comercial?: number | null
          uso_comercial_prevalencia?: string | null
          uso_industrial?: number | null
          uso_industrial_prevalencia?: string | null
          uso_otro?: number | null
          uso_residencial?: number | null
          v_terreno_precio?: number | null
          valor_uva?: number | null
        }
        Update: {
          ac_dispersion?: number | null
          agua_caliente?: string | null
          aire_acondicionado?: string | null
          amb_balcon?: number | null
          amb_bano?: number | null
          amb_bano_servicio?: number | null
          amb_cocina?: number | null
          amb_cocina_comedor?: number | null
          amb_comedor?: number | null
          amb_cuarto_guardado?: number | null
          amb_dormit_vestidor?: number | null
          amb_dormitorios?: number | null
          amb_escritorio?: number | null
          amb_garage?: number | null
          amb_lavadero?: number | null
          amb_living?: number | null
          amb_living_comedor?: number | null
          amb_patio?: number | null
          amb_suite?: number | null
          amb_suite_vestidor?: number | null
          amb_terraza?: number | null
          amb_total_cuartos?: number | null
          anio_construccion?: number | null
          barrio?: string | null
          barrio_tipo?: string | null
          calefaccion?: string | null
          calidad_constructiva?: string | null
          calidad_constructiva_predom?: string | null
          calidad_mantenimiento?: string | null
          cambios_uso_terreno?: string | null
          caracteristicas_adversas?: string | null
          com_asador?: string | null
          com_doble_circulacion?: string | null
          com_piscina?: string | null
          construccion_altura_prevalencia?: string | null
          construido_pct?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          demanda_oferta?: string | null
          destino?: string
          detalles_terminacion?: string | null
          direccion?: string
          espacio_habitable?: number | null
          estacionamiento_tipo?: string | null
          facilidades_estacionamiento?: string | null
          fecha?: string
          finalized_at?: string | null
          foto_fachada_url?: string | null
          id?: string
          imp_inmobiliarios?: number | null
          indice_crecimiento?: string | null
          localidad?: string | null
          locked?: boolean | null
          luminosidad?: string | null
          nivel_socioeconomico_barrio?: string | null
          observaciones?: string | null
          orientacion?: string | null
          plantas?: number | null
          precio_dolar?: number | null
          provincia?: string | null
          serv_agua?: string | null
          serv_cloaca?: string | null
          serv_electricidad?: string | null
          serv_gas?: string | null
          serv_internet?: string | null
          serv_techos?: string | null
          serv_vigilancia?: string | null
          solicitante?: string
          sup_construida?: number | null
          sup_terreno?: number | null
          telefono?: string | null
          tendencia_valores?: string | null
          tiempo_comercializacion?: string | null
          tipo?: string
          tipo_construccion?: string | null
          tipo_techo?: string | null
          tipologias_edilicias?: string | null
          updated_at?: string | null
          updated_by?: string | null
          uso_comercial?: number | null
          uso_comercial_prevalencia?: string | null
          uso_industrial?: number | null
          uso_industrial_prevalencia?: string | null
          uso_otro?: number | null
          uso_residencial?: number | null
          v_terreno_precio?: number | null
          valor_uva?: number | null
        }
        Relationships: []
      }
      property_videos: {
        Row: {
          created_at: string
          id: string
          position: number
          property_id: string
          thumbnail: string | null
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          property_id: string
          thumbnail?: string | null
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          property_id?: string
          thumbnail?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_videos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_checkins: {
        Row: {
          checked_in: boolean
          checked_in_at: string | null
          checked_in_by: string | null
          code: string
          created_at: string
          id: number
          visit_id: string
        }
        Insert: {
          checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          code: string
          created_at?: string
          id?: number
          visit_id: string
        }
        Update: {
          checked_in?: boolean
          checked_in_at?: string | null
          checked_in_by?: string | null
          code?: string
          created_at?: string
          id?: number
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_checkins_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_logs: {
        Row: {
          created_at: string | null
          id: number
          key: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          key: string
        }
        Update: {
          created_at?: string | null
          id?: number
          key?: string
        }
        Relationships: []
      }
      recurring_visits: {
        Row: {
          base_visit_id: string
          created_at: string
          id: number
          is_active: boolean
          next_occurrence: string
          occurrences_generated: number
          rule: Json
          updated_at: string
        }
        Insert: {
          base_visit_id: string
          created_at?: string
          id?: number
          is_active?: boolean
          next_occurrence: string
          occurrences_generated?: number
          rule: Json
          updated_at?: string
        }
        Update: {
          base_visit_id?: string
          created_at?: string
          id?: number
          is_active?: boolean
          next_occurrence?: string
          occurrences_generated?: number
          rule?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_visits_base_visit_id_fkey"
            columns: ["base_visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          locale: string
          section: Database["public"]["Enums"]["content_section"]
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          locale?: string
          section: Database["public"]["Enums"]["content_section"]
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          locale?: string
          section?: Database["public"]["Enums"]["content_section"]
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_content_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          key: string
          locale: string
          updated_at: string
          updated_by: string | null
          value: Json
          value_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          key: string
          locale?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
          value_type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          key?: string
          locale?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
          value_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings_versions: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          changed_keys: string[]
          created_at: string | null
          id: string
          snapshot: Json
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          changed_keys: string[]
          created_at?: string | null
          id?: string
          snapshot: Json
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          changed_keys?: string[]
          created_at?: string | null
          id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      trash_retention_policies: {
        Row: {
          auto_delete_enabled: boolean | null
          entity: string
          notify_before_days: number | null
          retention_days: number
          updated_at: string | null
        }
        Insert: {
          auto_delete_enabled?: boolean | null
          entity: string
          notify_before_days?: number | null
          retention_days?: number
          updated_at?: string | null
        }
        Update: {
          auto_delete_enabled?: boolean | null
          entity?: string
          notify_before_days?: number | null
          retention_days?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      valuation_comparables: {
        Row: {
          antiguedad: number | null
          barrio: string | null
          chars: Json
          created_at: string | null
          dias: number | null
          direccion: string | null
          foto_url: string | null
          id: string
          included: boolean | null
          orden: number
          precio: number | null
          sup_cubierta: number | null
          sup_terreno: number | null
          tipo_construccion: string | null
          updated_at: string | null
          url_origen: string | null
          valuation_id: string
        }
        Insert: {
          antiguedad?: number | null
          barrio?: string | null
          chars?: Json
          created_at?: string | null
          dias?: number | null
          direccion?: string | null
          foto_url?: string | null
          id?: string
          included?: boolean | null
          orden: number
          precio?: number | null
          sup_cubierta?: number | null
          sup_terreno?: number | null
          tipo_construccion?: string | null
          updated_at?: string | null
          url_origen?: string | null
          valuation_id: string
        }
        Update: {
          antiguedad?: number | null
          barrio?: string | null
          chars?: Json
          created_at?: string | null
          dias?: number | null
          direccion?: string | null
          foto_url?: string | null
          id?: string
          included?: boolean | null
          orden?: number
          precio?: number | null
          sup_cubierta?: number | null
          sup_terreno?: number | null
          tipo_construccion?: string | null
          updated_at?: string | null
          url_origen?: string | null
          valuation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuation_comparables_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "property_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      valuation_history: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          valuation_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          valuation_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          valuation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuation_history_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "property_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      valuation_images: {
        Row: {
          comparable_id: string | null
          created_at: string | null
          id: string
          orden: number | null
          tipo: string
          url: string
          valuation_id: string
        }
        Insert: {
          comparable_id?: string | null
          created_at?: string | null
          id?: string
          orden?: number | null
          tipo: string
          url: string
          valuation_id: string
        }
        Update: {
          comparable_id?: string | null
          created_at?: string | null
          id?: string
          orden?: number | null
          tipo?: string
          url?: string
          valuation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuation_images_comparable_id_fkey"
            columns: ["comparable_id"]
            isOneToOne: false
            referencedRelation: "valuation_comparables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuation_images_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "property_valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_reminders: {
        Row: {
          created_at: string
          id: number
          is_sent: boolean
          sent_at: string | null
          template: string | null
          trigger_minutes_before: number
          type: string
          visit_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_sent?: boolean
          sent_at?: string | null
          template?: string | null
          trigger_minutes_before: number
          type: string
          visit_id: string
        }
        Update: {
          created_at?: string
          id?: number
          is_sent?: boolean
          sent_at?: string | null
          template?: string | null
          trigger_minutes_before?: number
          type?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_reminders_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          agent_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          ends_at: string
          id: string
          lead_id: string | null
          location: string | null
          meeting_link: string | null
          meeting_type: string | null
          notes: string | null
          property_id: string | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          starts_at: string
          status: Database["public"]["Enums"]["visit_status"]
          title: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          ends_at: string
          id?: string
          lead_id?: string | null
          location?: string | null
          meeting_link?: string | null
          meeting_type?: string | null
          notes?: string | null
          property_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["visit_status"]
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          lead_id?: string | null
          location?: string | null
          meeting_link?: string | null
          meeting_type?: string | null
          notes?: string | null
          property_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["visit_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      agents_public: {
        Row: {
          bio: string | null
          id: string | null
          is_active: boolean | null
          matricula: string | null
          name: string | null
          photo_url: string | null
          role: string | null
          sort_order: number | null
        }
        Insert: {
          bio?: string | null
          id?: string | null
          is_active?: boolean | null
          matricula?: string | null
          name?: string | null
          photo_url?: string | null
          role?: string | null
          sort_order?: number | null
        }
        Update: {
          bio?: string | null
          id?: string | null
          is_active?: boolean | null
          matricula?: string | null
          name?: string | null
          photo_url?: string | null
          role?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_audit_logs: {
        Args: { p_retention_days?: number }
        Returns: number
      }
      complete_password_change: { Args: never; Returns: undefined }
      create_admin_user: {
        Args: {
          p_email: string
          p_full_name: string
          p_role?: Database["public"]["Enums"]["admin_role"]
          p_user_id: string
        }
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          must_change_password: boolean
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "admin_users"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["admin_role"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_audit: {
        Args: {
          p_action: string
          p_changed_fields?: string[]
          p_entity_id?: string
          p_entity_title?: string
          p_entity_type: string
          p_error_message?: string
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_status?: string
        }
        Returns: undefined
      }
      ml_enqueue: {
        Args: {
          p_internal?: boolean
          p_operation: Database["public"]["Enums"]["ml_operation"]
          p_property_id: string
        }
        Returns: number
      }
      ml_get_connection: { Args: never; Returns: Json }
      reorder_property_images: {
        Args: { p_image_ids: string[]; p_property_id: string }
        Returns: undefined
      }
      submit_contact: {
        Args: {
          p_city?: string
          p_data?: Json
          p_email: string
          p_files?: Json
          p_hp?: string
          p_intent?: Database["public"]["Enums"]["lead_intent"]
          p_last_name: string
          p_message?: string
          p_name: string
          p_phone?: string
        }
        Returns: string
      }
      subscribe_newsletter: {
        Args: { p_email: string; p_hp?: string; p_source?: string }
        Returns: boolean
      }
      update_admin_last_login: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      action_plan_category:
        | "pricing"
        | "marketing"
        | "condition"
        | "legal"
        | "other"
      action_plan_priority: "low" | "medium" | "high" | "urgent"
      action_plan_status: "pending" | "in_progress" | "completed" | "cancelled"
      admin_role: "super_admin" | "admin" | "staff" | "viewer"
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "publish"
        | "unpublish"
        | "login"
        | "logout"
        | "ml_publish"
        | "ml_update"
        | "ml_delete"
        | "ml_sync"
        | "status_change"
      chat_channel_type: "direct" | "group" | "property" | "lead"
      communication_status: "draft" | "sent" | "delivered" | "read" | "failed"
      communication_type:
        | "email"
        | "whatsapp"
        | "call"
        | "meeting"
        | "report"
        | "note"
      content_section:
        | "hero"
        | "catalogo"
        | "servicios"
        | "equipo"
        | "estadisticas"
        | "proceso"
        | "contacto"
        | "footer"
        | "meta"
      currency: "USD" | "ARS"
      lead_intent:
        | "comprar"
        | "vender"
        | "alquilar"
        | "invertir"
        | "tasar"
        | "desarrollador"
        | "otro"
      lead_source:
        | "landing_form"
        | "whatsapp"
        | "telefono"
        | "email"
        | "referido"
        | "ml_contacto"
        | "manual"
      lead_status:
        | "nuevo"
        | "contactado"
        | "calificado"
        | "en_proceso"
        | "cerrado_ganado"
        | "cerrado_perdido"
      listing_type: "venta" | "alquiler" | "venta_alquiler" | "emprendimiento"
      market_trend: "rising" | "stable" | "falling"
      ml_operation: "publish" | "update" | "delete"
      ml_sync_status:
        | "pending"
        | "processing"
        | "success"
        | "failed"
        | "cancelled"
      owner_preferred_contact: "email" | "whatsapp" | "call"
      owner_type: "persona_fisica" | "persona_juridica"
      price_status:
        | "way_below"
        | "below"
        | "fair"
        | "above"
        | "way_above"
        | "premium"
      property_status:
        | "borrador"
        | "en_revision"
        | "publicada"
        | "pausada"
        | "vendida"
        | "alquilada"
        | "archivada"
      report_type:
        | "price_analysis"
        | "visit_summary"
        | "market_update"
        | "weekly"
        | "monthly"
        | "custom"
      visit_status:
        | "programada"
        | "confirmada"
        | "en_curso"
        | "completada"
        | "cancelada"
        | "no_show"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      action_plan_category: [
        "pricing",
        "marketing",
        "condition",
        "legal",
        "other",
      ],
      action_plan_priority: ["low", "medium", "high", "urgent"],
      action_plan_status: ["pending", "in_progress", "completed", "cancelled"],
      admin_role: ["super_admin", "admin", "staff", "viewer"],
      audit_action: [
        "create",
        "update",
        "delete",
        "publish",
        "unpublish",
        "login",
        "logout",
        "ml_publish",
        "ml_update",
        "ml_delete",
        "ml_sync",
        "status_change",
      ],
      chat_channel_type: ["direct", "group", "property", "lead"],
      communication_status: ["draft", "sent", "delivered", "read", "failed"],
      communication_type: [
        "email",
        "whatsapp",
        "call",
        "meeting",
        "report",
        "note",
      ],
      content_section: [
        "hero",
        "catalogo",
        "servicios",
        "equipo",
        "estadisticas",
        "proceso",
        "contacto",
        "footer",
        "meta",
      ],
      currency: ["USD", "ARS"],
      lead_intent: [
        "comprar",
        "vender",
        "alquilar",
        "invertir",
        "tasar",
        "desarrollador",
        "otro",
      ],
      lead_source: [
        "landing_form",
        "whatsapp",
        "telefono",
        "email",
        "referido",
        "ml_contacto",
        "manual",
      ],
      lead_status: [
        "nuevo",
        "contactado",
        "calificado",
        "en_proceso",
        "cerrado_ganado",
        "cerrado_perdido",
      ],
      listing_type: ["venta", "alquiler", "venta_alquiler", "emprendimiento"],
      market_trend: ["rising", "stable", "falling"],
      ml_operation: ["publish", "update", "delete"],
      ml_sync_status: [
        "pending",
        "processing",
        "success",
        "failed",
        "cancelled",
      ],
      owner_preferred_contact: ["email", "whatsapp", "call"],
      owner_type: ["persona_fisica", "persona_juridica"],
      price_status: [
        "way_below",
        "below",
        "fair",
        "above",
        "way_above",
        "premium",
      ],
      property_status: [
        "borrador",
        "en_revision",
        "publicada",
        "pausada",
        "vendida",
        "alquilada",
        "archivada",
      ],
      report_type: [
        "price_analysis",
        "visit_summary",
        "market_update",
        "weekly",
        "monthly",
        "custom",
      ],
      visit_status: [
        "programada",
        "confirmada",
        "en_curso",
        "completada",
        "cancelada",
        "no_show",
      ],
    },
  },
} as const
