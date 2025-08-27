import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function useSupabaseAuth() {
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }
  async function signup(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }
  async function logout() {
    await supabase.auth.signOut()
  }
  return { login, signup, logout }
}
