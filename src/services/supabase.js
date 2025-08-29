// services/supabase.js
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants'

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // ← Esto desactiva la persistencia
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})