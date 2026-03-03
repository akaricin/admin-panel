import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for admin client')
}

// Admin client bypasses RLS - use ONLY on server-side
// SECURITY POLICY: This client is strictly for Data Manipulation (SELECT, INSERT, UPDATE, DELETE).
// It MUST NOT be used for schema changes or modifying RLS policies.
// The @supabase/supabase-js library used here does not support CREATE/ALTER POLICY.
export const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
