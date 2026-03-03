import AdminNavbar from '@/components/AdminNavbar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AdminNavbar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
