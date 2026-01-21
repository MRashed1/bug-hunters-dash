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
          name: string
          avatar_url: string | null
          status: 'HUNTING' | 'RESEARCHING' | 'IDLE' | 'OFFLINE'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          status?: 'HUNTING' | 'RESEARCHING' | 'IDLE' | 'OFFLINE'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          status?: 'HUNTING' | 'RESEARCHING' | 'IDLE' | 'OFFLINE'
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          action_type: 'BUG' | 'LAB' | 'WRITEUP'
          details: string
          timestamp: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: 'BUG' | 'LAB' | 'WRITEUP'
          details: string
          timestamp?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: 'BUG' | 'LAB' | 'WRITEUP'
          details?: string
          timestamp?: string
        }
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
  }
}