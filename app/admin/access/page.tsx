import { adminSupabase } from '@/lib/admin-supabase'
import { Globe, Mail, Plus, Trash2, ShieldCheck, Lock } from 'lucide-react'
import AccessClient from './AccessClient'

export const revalidate = 0

export default async function AccessManagementPage() {
  const { data: domains } = await adminSupabase
    .from('allowed_signup_domains')
    .select('*')
    .order('created_datetime_utc', { ascending: false })

  const { data: emails } = await adminSupabase
    .from('whitelist_email_addresses')
    .select('*')
    .order('created_datetime_utc', { ascending: false })

  return (
    <div className="flex-1 overflow-auto bg-[#243119] min-h-screen">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <header className="space-y-2 border-b border-white/10 pb-8">
          <div className="flex items-center gap-3">
            <Lock className="h-8 w-8 text-white" />
            <h1 className="text-3xl text-white">Access Management</h1>
          </div>
          <p className="text-white/60">Configure who can access the platform via signup domains or specific email whitelisting.</p>
        </header>

        <AccessClient 
          initialDomains={domains || []} 
          initialEmails={emails || []} 
        />
      </div>
    </div>
  )
}
