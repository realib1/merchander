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
      business_targets: {
        Row: {
          batch_id: string | null
          created_at: string
          currency: string | null
          end_date: string
          id: string
          metric: string
          name: string
          period: string
          product_id: string | null
          start_date: string
          target_value: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          currency?: string | null
          end_date: string
          id?: string
          metric: string
          name: string
          period?: string
          product_id?: string | null
          start_date: string
          target_value: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          currency?: string | null
          end_date?: string
          id?: string
          metric?: string
          name?: string
          period?: string
          product_id?: string | null
          start_date?: string
          target_value?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_targets_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "preorder_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_targets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_targets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_connections: {
        Row: {
          channel: string
          created_at: string
          credentials: Json | null
          error_message: string | null
          id: string
          last_health_check: string | null
          settings: Json | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          credentials?: Json | null
          error_message?: string | null
          id?: string
          last_health_check?: string | null
          settings?: Json | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          credentials?: Json | null
          error_message?: string | null
          id?: string
          last_health_check?: string | null
          settings?: Json | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_connections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_identities: {
        Row: {
          channel: string
          created_at: string
          customer_id: string
          id: string
          identifier: string
          is_verified: boolean | null
          profile_data: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          customer_id: string
          id?: string
          identifier: string
          is_verified?: boolean | null
          profile_data?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          customer_id?: string
          id?: string
          identifier?: string
          is_verified?: boolean | null
          profile_data?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_identities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_identities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_identities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_saved_items: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          product_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          product_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          product_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_saved_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_saved_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_saved_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_saved_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          first_touch_source: string | null
          id: string
          last_order_at: string | null
          name: string | null
          phone: string
          referral_code: string | null
          short_id: string
          tenant_id: string
          total_orders_count: number | null
          total_spend_amount: number | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_touch_source?: string | null
          id?: string
          last_order_at?: string | null
          name?: string | null
          phone: string
          referral_code?: string | null
          short_id?: string
          tenant_id: string
          total_orders_count?: number | null
          total_spend_amount?: number | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_touch_source?: string | null
          id?: string
          last_order_at?: string | null
          name?: string | null
          phone?: string
          referral_code?: string | null
          short_id?: string
          tenant_id?: string
          total_orders_count?: number | null
          total_spend_amount?: number | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          description: string | null
          expense_date: string
          id: string
          payment_method: string | null
          receipt_url: string | null
          short_id: string
          store_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string
          id?: string
          payment_method?: string | null
          receipt_url?: string | null
          short_id?: string
          store_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string
          id?: string
          payment_method?: string | null
          receipt_url?: string | null
          short_id?: string
          store_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      flyer_shares: {
        Row: {
          channel_target: string | null
          created_at: string
          id: string
          orders_count: number
          product_id: string
          scans_count: number
          short_code: string
          tenant_id: string
          updated_at: string
          views_count: number
        }
        Insert: {
          channel_target?: string | null
          created_at?: string
          id?: string
          orders_count?: number
          product_id: string
          scans_count?: number
          short_code: string
          tenant_id: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          channel_target?: string | null
          created_at?: string
          id?: string
          orders_count?: number
          product_id?: string
          scans_count?: number
          short_code?: string
          tenant_id?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "flyer_shares_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flyer_shares_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_levels: {
        Row: {
          quantity: number
          store_id: string
          updated_at: string
          variant_id: string
        }
        Insert: {
          quantity?: number
          store_id: string
          updated_at?: string
          variant_id: string
        }
        Update: {
          quantity?: number
          store_id?: string
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_levels_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "inventory_levels_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_access_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          order_id: string
          tenant_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          order_id: string
          tenant_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          order_id?: string
          tenant_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_access_tokens_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_access_tokens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          order_id: string
          quantity: number
          unit_price: number
          variant_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          order_id: string
          quantity?: number
          unit_price: number
          variant_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          order_id?: string
          quantity?: number
          unit_price?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "preorder_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          attribution_source: string | null
          batch_id: string | null
          created_at: string
          customer_id: string
          delivery_address: string | null
          delivery_fee: number
          fulfillment_mode: string | null
          id: string
          notes: string | null
          payment_method: string | null
          referral_code: string | null
          sales_channel: string | null
          shipping_tbd: boolean
          short_id: string
          status: string
          store_id: string
          tenant_id: string
          total_amount: number
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          attribution_source?: string | null
          batch_id?: string | null
          created_at?: string
          customer_id: string
          delivery_address?: string | null
          delivery_fee?: number
          fulfillment_mode?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          referral_code?: string | null
          sales_channel?: string | null
          shipping_tbd?: boolean
          short_id?: string
          status?: string
          store_id: string
          tenant_id: string
          total_amount?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          attribution_source?: string | null
          batch_id?: string | null
          created_at?: string
          customer_id?: string
          delivery_address?: string | null
          delivery_fee?: number
          fulfillment_mode?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          referral_code?: string | null
          sales_channel?: string | null
          shipping_tbd?: boolean
          short_id?: string
          status?: string
          store_id?: string
          tenant_id?: string
          total_amount?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "preorder_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string | null
          fee: number
          id: string
          net_amount: number
          notes: string | null
          order_id: string | null
          payment_date: string
          provider: string
          recorded_by: string | null
          refund_reason: string | null
          refunded_at: string | null
          sender_name: string | null
          sender_phone: string | null
          status: string
          tenant_id: string
          transaction_ref: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id?: string | null
          fee?: number
          id?: string
          net_amount?: number
          notes?: string | null
          order_id?: string | null
          payment_date?: string
          provider: string
          recorded_by?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: string
          tenant_id: string
          transaction_ref?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string | null
          fee?: number
          id?: string
          net_amount?: number
          notes?: string | null
          order_id?: string | null
          payment_date?: string
          provider?: string
          recorded_by?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: string
          tenant_id?: string
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_stats_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_announcements: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          is_pinned: boolean
          message: string
          starts_at: string
          target_country: string | null
          target_tier: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean
          message: string
          starts_at?: string
          target_country?: string | null
          target_tier?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_pinned?: boolean
          message?: string
          starts_at?: string
          target_country?: string | null
          target_tier?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_audit_logs: {
        Row: {
          action: string
          actor_email: string
          actor_id: string | null
          actor_role: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          reason: string | null
          target_id: string
          target_name: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_email: string
          actor_id?: string | null
          actor_role: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          reason?: string | null
          target_id: string
          target_name?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_email?: string
          actor_id?: string | null
          actor_role?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          reason?: string | null
          target_id?: string
          target_name?: string | null
          target_type?: string
        }
        Relationships: []
      }
      platform_incidents: {
        Row: {
          affected_areas: string[] | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          message: string
          service: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_areas?: string[] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message: string
          service: string
          status: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_areas?: string[] | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message?: string
          service?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_plans: {
        Row: {
          billing_cycle: string
          created_at: string
          description: string | null
          entitlements: Json
          id: string
          is_active: boolean
          name: string
          price_ghs: number
          price_usd: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          description?: string | null
          entitlements?: Json
          id?: string
          is_active?: boolean
          name: string
          price_ghs?: number
          price_usd?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          description?: string | null
          entitlements?: Json
          id?: string
          is_active?: boolean
          name?: string
          price_ghs?: number
          price_usd?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_staff_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login_at: string | null
          mfa_enabled: boolean
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          mfa_enabled?: boolean
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          mfa_enabled?: boolean
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_support_access_grants: {
        Row: {
          created_at: string
          duration_hours: number
          expires_at: string
          granted_by: string
          id: string
          reason: string
          revoked_at: string | null
          status: string
          tenant_id: string
          ticket_id: string | null
          token: string
        }
        Insert: {
          created_at?: string
          duration_hours?: number
          expires_at: string
          granted_by: string
          id?: string
          reason: string
          revoked_at?: string | null
          status?: string
          tenant_id: string
          ticket_id?: string | null
          token: string
        }
        Update: {
          created_at?: string
          duration_hours?: number
          expires_at?: string
          granted_by?: string
          id?: string
          reason?: string
          revoked_at?: string | null
          status?: string
          tenant_id?: string
          ticket_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_support_access_grants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      preorder_batch_notifications: {
        Row: {
          batch_id: string
          channel: string
          created_at: string
          id: string
          message_template: string
          milestone: string
          recipient_count: number
          sent_by: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          batch_id: string
          channel?: string
          created_at?: string
          id?: string
          message_template: string
          milestone: string
          recipient_count?: number
          sent_by?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          batch_id?: string
          channel?: string
          created_at?: string
          id?: string
          message_template?: string
          milestone?: string
          recipient_count?: number
          sent_by?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preorder_batch_notifications_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "preorder_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preorder_batch_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      preorder_batches: {
        Row: {
          actual_arrival_date: string | null
          cargo_tracking_number: string | null
          closes_at: string
          code: string
          created_at: string | null
          expected_arrival_end: string
          expected_arrival_start: string
          freight_mode: string | null
          id: string
          max_capacity: number | null
          min_moq_target: number | null
          name: string
          notes: string | null
          opens_at: string
          origin_country: string | null
          status: string
          supplier_order_date: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          actual_arrival_date?: string | null
          cargo_tracking_number?: string | null
          closes_at: string
          code: string
          created_at?: string | null
          expected_arrival_end: string
          expected_arrival_start: string
          freight_mode?: string | null
          id?: string
          max_capacity?: number | null
          min_moq_target?: number | null
          name: string
          notes?: string | null
          opens_at: string
          origin_country?: string | null
          status?: string
          supplier_order_date?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          actual_arrival_date?: string | null
          cargo_tracking_number?: string | null
          closes_at?: string
          code?: string
          created_at?: string | null
          expected_arrival_end?: string
          expected_arrival_start?: string
          freight_mode?: string | null
          id?: string
          max_capacity?: number | null
          min_moq_target?: number | null
          name?: string
          notes?: string | null
          opens_at?: string
          origin_country?: string | null
          status?: string
          supplier_order_date?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preorder_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_preorder_batches: {
        Row: {
          batch_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          product_id: string
          tenant_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id: string
          tenant_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_preorder_batches_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "preorder_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_preorder_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_preorder_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          id: string
          name: string | null
          price: number
          product_id: string
          sku: string
        }
        Insert: {
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          id?: string
          name?: string | null
          price: number
          product_id: string
          sku: string
        }
        Update: {
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          id?: string
          name?: string | null
          price?: number
          product_id?: string
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_waitlist: {
        Row: {
          created_at: string
          customer_name: string | null
          email: string | null
          id: string
          phone: string | null
          status: string
          tenant_id: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          status?: string
          tenant_id: string
          variant_id: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          status?: string
          tenant_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_waitlist_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_waitlist_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "product_waitlist_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          availability_status: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_urls: string[] | null
          is_active: boolean
          name: string
          preorder_shipping_mode: string
          short_id: string
          specifications: Json
          stock_unit: string | null
          tenant_id: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          availability_status?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean
          name: string
          preorder_shipping_mode?: string
          short_id?: string
          specifications?: Json
          stock_unit?: string | null
          tenant_id: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          availability_status?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean
          name?: string
          preorder_shipping_mode?: string
          short_id?: string
          specifications?: Json
          stock_unit?: string | null
          tenant_id?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          cost_price: number | null
          created_at: string
          id: string
          purchase_order_id: string
          quantity: number
          variant_id: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          id?: string
          purchase_order_id: string
          quantity?: number
          variant_id: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          id?: string
          purchase_order_id?: string
          quantity?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "shipment_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          amount_paid: number | null
          created_at: string
          eta: string | null
          id: string
          import_cost: number | null
          po_number: string | null
          shipping_cost: number | null
          short_id: string
          status: string
          supplier_cost: number | null
          supplier_id: string
          tenant_id: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string
          eta?: string | null
          id?: string
          import_cost?: number | null
          po_number?: string | null
          shipping_cost?: number | null
          short_id?: string
          status?: string
          supplier_cost?: number | null
          supplier_id: string
          tenant_id: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          created_at?: string
          eta?: string | null
          id?: string
          import_cost?: number | null
          po_number?: string | null
          shipping_cost?: number | null
          short_id?: string
          status?: string
          supplier_cost?: number | null
          supplier_id?: string
          tenant_id?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier: string | null
          cbm: number | null
          created_at: string
          currency: string
          customs_duty: number | null
          departure_date: string | null
          destination_port: string | null
          eta: string | null
          freight_mode: string
          id: string
          notes: string | null
          origin_port: string | null
          purchase_order_id: string | null
          shipping_cost: number | null
          status: string
          supplier_id: string | null
          tenant_id: string
          title: string
          tracking_number: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          carrier?: string | null
          cbm?: number | null
          created_at?: string
          currency?: string
          customs_duty?: number | null
          departure_date?: string | null
          destination_port?: string | null
          eta?: string | null
          freight_mode?: string
          id?: string
          notes?: string | null
          origin_port?: string | null
          purchase_order_id?: string | null
          shipping_cost?: number | null
          status?: string
          supplier_id?: string | null
          tenant_id: string
          title: string
          tracking_number?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          carrier?: string | null
          cbm?: number | null
          created_at?: string
          currency?: string
          customs_duty?: number | null
          departure_date?: string | null
          destination_port?: string | null
          eta?: string | null
          freight_mode?: string
          id?: string
          notes?: string | null
          origin_port?: string | null
          purchase_order_id?: string | null
          shipping_cost?: number | null
          status?: string
          supplier_id?: string | null
          tenant_id?: string
          title?: string
          tracking_number?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_supplier_id_fkey1"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_tenant_id_fkey1"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_rate_limits: {
        Row: {
          bucket: string
          created_at: string
          id: string
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: string
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      storefront_sessions: {
        Row: {
          cart_data: Json
          created_at: string
          customer_phone: string | null
          id: string
          last_active_at: string
          session_token: string
          tenant_id: string
        }
        Insert: {
          cart_data?: Json
          created_at?: string
          customer_phone?: string | null
          id?: string
          last_active_at?: string
          session_token: string
          tenant_id: string
        }
        Update: {
          cart_data?: Json
          created_at?: string
          customer_phone?: string | null
          id?: string
          last_active_at?: string
          session_token?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefront_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      storefront_settings: {
        Row: {
          banner_cta_text: string | null
          banner_headline: string | null
          banner_tagline: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          currency: string
          custom_domain: string | null
          custom_domain_config: Json | null
          delivery_policy: string | null
          featured_product_ids: Json | null
          hero_mode: string | null
          id: string
          instagram_handle: string | null
          is_active: boolean
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string
          store_name: string
          tagline: string | null
          tenant_id: string
          tiktok_handle: string | null
          updated_at: string
          whatsapp_phone: string | null
        }
        Insert: {
          banner_cta_text?: string | null
          banner_headline?: string | null
          banner_tagline?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          currency?: string
          custom_domain?: string | null
          custom_domain_config?: Json | null
          delivery_policy?: string | null
          featured_product_ids?: Json | null
          hero_mode?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          store_name?: string
          tagline?: string | null
          tenant_id: string
          tiktok_handle?: string | null
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Update: {
          banner_cta_text?: string | null
          banner_headline?: string | null
          banner_tagline?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          currency?: string
          custom_domain?: string | null
          custom_domain_config?: Json | null
          delivery_policy?: string | null
          featured_product_ids?: Json | null
          hero_mode?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          store_name?: string
          tagline?: string | null
          tenant_id?: string
          tiktok_handle?: string | null
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storefront_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          city: string | null
          created_at: string
          digital_address: string | null
          id: string
          is_primary: boolean
          landmark: string | null
          location: string | null
          name: string
          operating_hours: Json | null
          phone: string | null
          pickup_enabled: boolean
          region: string | null
          street_address: string | null
          tenant_id: string
          updated_at: string
          whatsapp_phone: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          digital_address?: string | null
          id?: string
          is_primary?: boolean
          landmark?: string | null
          location?: string | null
          name: string
          operating_hours?: Json | null
          phone?: string | null
          pickup_enabled?: boolean
          region?: string | null
          street_address?: string | null
          tenant_id: string
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          digital_address?: string | null
          id?: string
          is_primary?: boolean
          landmark?: string | null
          location?: string | null
          name?: string
          operating_hours?: Json | null
          phone?: string | null
          pickup_enabled?: boolean
          region?: string | null
          street_address?: string | null
          tenant_id?: string
          updated_at?: string
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          purchase_order_id: string | null
          receipt_url: string | null
          reference_number: string | null
          supplier_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method: string
          purchase_order_id?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          supplier_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          purchase_order_id?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          supplier_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_name: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          outstanding_balance: number
          phone: string | null
          short_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          outstanding_balance?: number
          phone?: string | null
          short_id?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          outstanding_balance?: number
          phone?: string | null
          short_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          tenant_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          tenant_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          tenant_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          permissions: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          brand_primary_color: string | null
          brand_secondary_color: string | null
          branding: Json
          business_city: string | null
          business_country: string | null
          business_phone: string | null
          business_state: string | null
          business_street: string | null
          business_zip: string | null
          created_at: string
          description: string | null
          features: Json
          industry: string | null
          integrations: Json
          language: string | null
          logo_url: string | null
          low_stock_threshold: number | null
          settings_data: Json | null
          sms_recovery_enabled: boolean | null
          store_currency: string | null
          store_email: string | null
          tax_id: string | null
          tenant_id: string
          timezone: string | null
          trading_name: string | null
          two_factor_enabled: boolean | null
          updated_at: string
          website: string | null
        }
        Insert: {
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          branding?: Json
          business_city?: string | null
          business_country?: string | null
          business_phone?: string | null
          business_state?: string | null
          business_street?: string | null
          business_zip?: string | null
          created_at?: string
          description?: string | null
          features?: Json
          industry?: string | null
          integrations?: Json
          language?: string | null
          logo_url?: string | null
          low_stock_threshold?: number | null
          settings_data?: Json | null
          sms_recovery_enabled?: boolean | null
          store_currency?: string | null
          store_email?: string | null
          tax_id?: string | null
          tenant_id: string
          timezone?: string | null
          trading_name?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          branding?: Json
          business_city?: string | null
          business_country?: string | null
          business_phone?: string | null
          business_state?: string | null
          business_street?: string | null
          business_zip?: string | null
          created_at?: string
          description?: string | null
          features?: Json
          industry?: string | null
          integrations?: Json
          language?: string | null
          logo_url?: string | null
          low_stock_threshold?: number | null
          settings_data?: Json | null
          sms_recovery_enabled?: boolean | null
          store_currency?: string | null
          store_email?: string | null
          tax_id?: string | null
          tenant_id?: string
          timezone?: string | null
          trading_name?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["billing_cycle"]
          created_at: string | null
          id: string
          payment_method: Json | null
          price_monthly: number
          renewal_date: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string | null
          id?: string
          payment_method?: Json | null
          price_monthly?: number
          renewal_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["billing_cycle"]
          created_at?: string | null
          id?: string
          payment_method?: Json | null
          price_monthly?: number
          renewal_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          created_at: string
          id: string
          role: string
          role_id: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          role_id?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          role_id?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "tenant_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_backup_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      workflow_logs: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          payload: Json | null
          source: string
          tenant_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          payload?: Json | null
          source: string
          tenant_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          payload?: Json | null
          source?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      customer_stats_view: {
        Row: {
          aov: number | null
          created_at: string | null
          current_orders: number | null
          email: string | null
          id: string | null
          last_order_date: string | null
          name: string | null
          phone: string | null
          previous_orders: number | null
          tenant_id: string | null
          total_orders: number | null
          total_spent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_view: {
        Row: {
          category_id: string | null
          category_name: string | null
          image_urls: string[] | null
          price: number | null
          product_id: string | null
          product_name: string | null
          quantity: number | null
          sku: string | null
          store_id: string | null
          store_name: string | null
          tenant_id: string | null
          variant_id: string | null
          variant_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_levels_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      decrement_inventory: {
        Args: { p_amount: number; p_store_id: string; p_variant_id: string }
        Returns: boolean
      }
      decrement_inventory_batch: {
        Args: { p_items: Json; p_tenant_id: string }
        Returns: boolean
      }
      generate_short_id: { Args: { prefix: string }; Returns: string }
      get_auth_user_tenant_ids: { Args: never; Returns: string[] }
      get_customer_page_metrics: { Args: never; Returns: Json }
      get_dashboard_metrics: { Args: { p_days?: number }; Returns: Json }
      get_inventory_metrics: { Args: never; Returns: Json }
      increment_inventory_batch: {
        Args: { items: Json; target_store_id: string }
        Returns: undefined
      }
      normalize_ghana_phone_text: { Args: { p_phone: string }; Returns: string }
      transfer_inventory_between_branches: {
        Args: {
          p_quantity: number
          p_source_store_id: string
          p_target_store_id: string
          p_variant_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      billing_cycle: "monthly" | "annual"
      subscription_status: "active" | "past_due" | "canceled" | "trialing"
      subscription_tier:
        | "free"
        | "starter"
        | "growth"
        | "business"
        | "enterprise"
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
      billing_cycle: ["monthly", "annual"],
      subscription_status: ["active", "past_due", "canceled", "trialing"],
      subscription_tier: [
        "free",
        "starter",
        "growth",
        "business",
        "enterprise",
      ],
    },
  },
} as const

