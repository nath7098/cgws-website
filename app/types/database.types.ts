export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      consignments: {
        Row: {
          agreed_price: number | null
          asking_price: number
          brand: string | null
          condition: string
          created_at: string | null
          depositor_email: string
          depositor_name: string
          depositor_phone: string | null
          id: string
          images: string[] | null
          item_description: string
          notes: string | null
          status: string | null
        }
        Insert: {
          agreed_price?: number | null
          asking_price: number
          brand?: string | null
          condition: string
          created_at?: string | null
          depositor_email: string
          depositor_name: string
          depositor_phone?: string | null
          id?: string
          images?: string[] | null
          item_description: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          agreed_price?: number | null
          asking_price?: number
          brand?: string | null
          condition?: string
          created_at?: string | null
          depositor_email?: string
          depositor_name?: string
          depositor_phone?: string | null
          id?: string
          images?: string[] | null
          item_description?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_id: string | null
          quantity: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          quantity?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          client_id: string | null
          created_at: string | null
          currency: string | null
          customer_name: string
          email: string
          fulfillment_method: string
          id: string
          phone: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          subtotal: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_name: string
          email: string
          fulfillment_method: string
          id?: string
          phone?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_name?: string
          email?: string
          fulfillment_method?: string
          id?: string
          phone?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'orders_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string
          condition: string
          consignment_id: string | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          is_consignment: boolean | null
          price: number
          size: string | null
          slug: string
          status: string | null
          stock: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          category: string
          condition: string
          consignment_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_consignment?: boolean | null
          price: number
          size?: string | null
          slug: string
          status?: string | null
          stock?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          brand?: string | null
          category?: string
          condition?: string
          consignment_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_consignment?: boolean | null
          price?: number
          size?: string | null
          slug?: string
          status?: string | null
          stock?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'products_consignment_id_fkey'
            columns: ['consignment_id']
            isOneToOne: false
            referencedRelation: 'consignments'
            referencedColumns: ['id']
          },
        ]
      }
      sales: {
        Row: {
          client_id: string | null
          commission_amount: number | null
          created_at: string | null
          id: string
          notes: string | null
          payment_method: string
          product_id: string | null
          sale_date: string
          sale_price: number
        }
        Insert: {
          client_id?: string | null
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method: string
          product_id?: string | null
          sale_date: string
          sale_price: number
        }
        Update: {
          client_id?: string | null
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          product_id?: string | null
          sale_date?: string
          sale_price?: number
        }
        Relationships: [
          {
            foreignKeyName: 'sales_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sales_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
