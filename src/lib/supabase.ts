import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mmoqdsvcwacedzpjgzvk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tb3Fkc3Zjd2FjZWR6cGpnenZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTQzMjYsImV4cCI6MjA3MjYzMDMyNn0.mKKvbKEd_nzP8dkEC-eYeHlrzSZ4nSA0DWw2ZbJg4L4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for TypeScript
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Entry {
  id: string
  user_id: string
  content: string
  mood: number // 1-5 scale
  topics: string[]
  created_at: string
  updated_at: string
}

export interface Mood {
  id: string
  user_id: string
  entry_id: string
  value: number // 1-5 scale
  date: string // YYYY-MM-DD
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  message_text: string
  is_user_message: boolean
  created_at: string
  updated_at: string
}