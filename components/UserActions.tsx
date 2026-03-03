'use client'

import { Mail } from 'lucide-react'

interface Props {
  userId: string
  userEmail: string
  isSuperAdmin: boolean
}

export default function UserActions({ userEmail }: Props) {
  return (
    <div className="flex items-center justify-end gap-3">
      {/* Mailto Button */}
      <a
        href={`mailto:${userEmail}`}
        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        title={`Email ${userEmail}`}
      >
        <Mail className="h-4 w-4" />
      </a>
    </div>
  )
}
