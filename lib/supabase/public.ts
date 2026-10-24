import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Anonymous client for public reads during static generation and in the browser.
 * Supabase RLS ensures public queries expose only published, already-live prompts.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    },
  )
}
