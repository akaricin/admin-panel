'use client'

import { useState } from 'react'
import { Mail, ShieldCheck, ShieldX } from 'lucide-react'
import { toggleUserRole } from '@/app/admin/users/actions'

interface Props {
  userId: string
  userEmail: string
  isSuperAdmin: boolean
}

export default function UserActions({ userId, userEmail, isSuperAdmin }: Props) {
  const [isPending, setIsPending] = useState(false)

  const handleToggleRole = async () => {
    try {
      setIsPending(true)
      await toggleUserRole(userId, isSuperAdmin)
    } catch (error) {
      console.error('Failed to toggle role:', error)
      alert('Error updating user role.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {/* Mailto Button */}
      <a
        href={`mailto:${userEmail}`}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        title={`Email ${userEmail}`}
      >
        <Mail className="h-4 w-4" />
      </a>

      {/* Role Toggle Button */}
      <button
        onClick={handleToggleRole}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
          isSuperAdmin
            ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isPending ? (
          <span className="flex items-center gap-1.5">
            <svg className="animate-spin h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Updating...
          </span>
        ) : (
          <>
            {isSuperAdmin ? (
              <>
                <ShieldX className="h-3 w-3" />
                Demote
              </>
            ) : (
              <>
                <ShieldCheck className="h-3 w-3" />
                Promote
              </>
            )}
          </>
        )}
      </button>
    </div>
  )
}
