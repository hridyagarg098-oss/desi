export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          tokens: number
          plan: 'free' | 'trial' | 'basic' | 'premium'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          tokens?: number
          plan?: 'free' | 'trial' | 'basic' | 'premium'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          tokens?: number
          plan?: 'free' | 'trial' | 'basic' | 'premium'
          updated_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          user_id: string
          character_id: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          character_id: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string | null
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
        Update: never
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          plan: 'free' | 'trial' | 'basic' | 'premium'
          status: string
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          plan?: 'free' | 'trial' | 'basic' | 'premium'
          status?: string
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          plan?: 'free' | 'trial' | 'basic' | 'premium'
          status?: string
          current_period_end?: string | null
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      plan_type: 'free' | 'trial' | 'basic' | 'premium'
    }
  }
}
