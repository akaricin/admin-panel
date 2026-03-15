import Sidebar from './Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar - Fixed on the left */}
      <Sidebar />
      
      {/* Main Content - Scrollable area on the right */}
      <main className="flex-1 overflow-y-auto bg-[#243119] custom-scrollbar">
        {children}
      </main>
    </div>
  )
}
