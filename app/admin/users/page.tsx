import { adminSupabase } from '@/lib/admin-supabase'
import UserActions from '@/components/UserActions'
import UserPagination from '@/components/UserPagination'
import { Users, ShieldCheck, User as UserIcon } from 'lucide-react'

const USERS_PER_PAGE = 10

export default async function ManageUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const currentPage = parseInt(params.page || '1')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // 1. Fetch counts
  const [
    { count: totalUsers },
    { count: superAdminCount },
    { count: activeTodayCount }
  ] = await Promise.all([
    adminSupabase.from('profiles').select('*', { count: 'exact', head: true }),
    adminSupabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_superadmin', true),
    adminSupabase.from('profiles').select('*', { count: 'exact', head: true }).gte('modified_datetime_utc', today.toISOString())
  ])

  // 2. Fetch paginated users
  const from = (currentPage - 1) * USERS_PER_PAGE
  const to = from + USERS_PER_PAGE - 1

  const { data: profiles, error } = await adminSupabase
    .from('profiles')
    .select('*')
    .order('created_datetime_utc', { ascending: false })
    .range(from, to)

  if (error) {
    return <div className="p-8 text-red-400 font-medium">Error loading users: {error.message}</div>
  }

  // Calculate stats
  const totalCount = totalUsers || 0

  return (
    <div className="flex-1 overflow-auto bg-[#243119]">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-white/60">Manage permissions and view system users.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Users" 
            value={totalCount.toString()} 
            icon={<Users className="h-5 w-5 text-indigo-400" />}
          />
          <StatCard 
            title="Super Admins" 
            value={(superAdminCount || 0).toString()} 
            icon={<ShieldCheck className="h-5 w-5 text-emerald-400" />}
          />
          <StatCard 
            title="Active Today" 
            value={(activeTodayCount || 0).toString()} 
            icon={<UserIcon className="h-5 w-5 text-amber-400" />}
          />
        </div>

        {/* Table Section */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {profiles?.map((profile) => (
                  <tr key={profile.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 overflow-hidden text-white/30 text-xs font-bold">
                          {profile.first_name?.[0] || profile.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {profile.first_name || profile.last_name 
                              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                              : 'Anonymous User'}
                          </p>
                          <p className="text-xs text-white/40">{profile.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {profile.is_superadmin ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-1 text-xs font-medium text-white/60 ring-1 ring-inset ring-white/10">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/50">
                      {profile.created_datetime_utc 
                        ? new Date(profile.created_datetime_utc).toLocaleDateString()
                        : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <UserActions 
                        userId={profile.id} 
                        userEmail={profile.email} 
                        isSuperAdmin={profile.is_superadmin} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-white/10 bg-white/5">
            <UserPagination 
              totalItems={totalCount} 
              itemsPerPage={USERS_PER_PAGE} 
              currentPage={currentPage} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
          {icon}
        </div>
      </div>
      <p className="text-sm font-medium text-white/50">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}
