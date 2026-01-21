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
          role: 'user' | 'admin'
          banned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          status?: 'HUNTING' | 'RESEARCHING' | 'IDLE' | 'OFFLINE'
          role?: 'user' | 'admin'
          banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          status?: 'HUNTING' | 'RESEARCHING' | 'IDLE' | 'OFFLINE'
          role?: 'user' | 'admin'
          banned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          action_type: 'BUG' | 'LAB' | 'TIP'
          details: string
          link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: 'BUG' | 'LAB' | 'TIP'
          details: string
          link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: 'BUG' | 'LAB' | 'TIP'
          details?: string
          link?: string | null
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          type: 'HUNTING' | 'RESEARCHING'
          start_time: string
          end_time: string | null
          duration_minutes: number | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'HUNTING' | 'RESEARCHING'
          start_time?: string
          end_time?: string | null
          duration_minutes?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'HUNTING' | 'RESEARCHING'
          start_time?: string
          end_time?: string | null
          duration_minutes?: number | null
        }
      }
    }
    Views: {
      leaderboard_stats: {
        Row: {
          user_id: string
          name: string
          avatar_url: string | null
          hunting_hours: number
          researching_hours: number
          bug_count: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}