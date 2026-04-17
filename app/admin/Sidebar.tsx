'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, 
  Globe, 
  Mail, 
  Scale, 
  Lightbulb, 
  Settings2, 
  History, 
  Terminal, 
  Database,
  LayoutDashboard,
  LayoutGrid,
  ChevronRight,
  Activity
} from 'lucide-react'

const navigation = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Statistics', href: '/admin/statistics', icon: Activity },
      { name: 'Content Gallery', href: '/admin/content', icon: LayoutGrid },
    ]
  },
  {
    title: 'Access Control',
    items: [
      { name: 'Profiles', href: '/admin/users', icon: Users },
      { name: 'Domains', href: '/admin/access', icon: Globe },
      { name: 'Whitelist', href: '/admin/access', icon: Mail },
    ]
  },
  {
    title: 'Content',
    items: [
      { name: 'Terms', href: '/admin/legal', icon: Scale },
      { name: 'Examples', href: '/admin/examples', icon: Lightbulb },
      { name: 'Humor Mix', href: '/admin/settings', icon: Settings2 },
    ]
  },
  {
    title: 'Activity Logs',
    items: [
      { name: 'Gen History', href: '/admin/history', icon: History },
      { name: 'Prompt Chains', href: '/admin/logs/chains', icon: Terminal },
      { name: 'Model Responses', href: '/admin/logs/responses', icon: Database },
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-950 border-r border-white/5 flex flex-col h-[calc(100vh-64px)] sticky top-16 overflow-y-auto custom-scrollbar">
      <div className="flex-1 px-4 py-8 space-y-8">
        {navigation.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-emerald-400' : 'group-hover:text-white'
                      }`} />
                      <span className="text-sm font-bold tracking-tight">{item.name}</span>
                    </div>
                    {isActive && (
                      <div className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-black text-slate-950">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-white uppercase tracking-wider">Admin Mode</span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Authorized</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
