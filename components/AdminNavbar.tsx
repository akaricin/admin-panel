'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminNavbar() {
  const pathname = usePathname()

  const links = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Manage Users', href: '/admin/users' },
    { name: 'Manage Images', href: '/admin/captions' },
  ]

  return (
    <nav className="border-b border-white/10 bg-[#243119]/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center gap-8">
          {links.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-white ${
                  isActive 
                    ? 'text-white border-b-2 border-white h-full flex items-center' 
                    : 'text-white/50'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
