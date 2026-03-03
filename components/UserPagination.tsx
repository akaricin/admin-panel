'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface Props {
  currentPage: number
  totalItems: number
  itemsPerPage: number
}

interface JumpToPageProps {
  totalPages: number
  onJump: (pageNum: number) => void
}

function JumpToPage({ totalPages, onJump }: JumpToPageProps) {
  const [jumpPage, setJumpPage] = useState('')
  const [isInvalid, setIsInvalid] = useState(false)

  // We use the key on the component in the parent to reset this state
  // So we don't need a useEffect here to reset jumpPage

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const pageNum = parseInt(jumpPage)
    
    if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
      setIsInvalid(true)
      return
    }

    setIsInvalid(false)
    onJump(pageNum)
  }

  return (
    <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
      <span className="text-xs text-white/40 whitespace-nowrap">Go to page:</span>
      <form onSubmit={handleJumpSubmit} className="flex items-center gap-1">
        <input
          type="text"
          value={jumpPage}
          onChange={(e) => {
            setJumpPage(e.target.value)
            setIsInvalid(false)
          }}
          className={`w-12 px-2 py-1 text-xs border rounded transition-colors focus:outline-none focus:ring-1 focus:ring-white/20 bg-white/5 text-white ${
            isInvalid ? 'border-red-500 bg-red-500/10' : 'border-white/10'
          }`}
        />
        <button
          type="submit"
          className="px-2 py-1 text-xs bg-white/10 border border-white/10 rounded hover:bg-white/20 text-white font-medium transition-colors"
        >
          Go
        </button>
      </form>
    </div>
  )
}

export default function UserPagination({
  currentPage,
  totalItems,
  itemsPerPage,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const from = (currentPage - 1) * itemsPerPage
  const to = Math.min(from + itemsPerPage, totalItems)

  const createPageURL = (pageNumber: number | string) => {
    if (pageNumber === undefined || pageNumber === null) return '#'
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('page', pageNumber.toString())
    return `?${params.toString()}`
  }

  const handleJump = (pageNum: number) => {
    router.push(createPageURL(pageNum))
  }

  const getPaginationItems = () => {
    const items: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i)
    } else {
      if (currentPage <= 4) {
        items.push(1, 2, 3, 4, 5, '...', totalPages)
      } else if (currentPage >= totalPages - 3) {
        items.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        items.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return items
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-white/40 order-2 sm:order-1">
        Showing <span className="font-medium text-white/60">{from + 1}</span> to <span className="font-medium text-white/60">{to}</span> of <span className="font-medium text-white/60">{totalItems}</span> users
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 order-1 sm:order-2">
        {/* Previous Button */}
        <Link
          href={currentPage > 1 ? createPageURL(currentPage - 1) : '#'}
          className={`px-3 py-1.5 border border-white/10 rounded-md text-sm font-medium transition-colors ${
            currentPage <= 1 ? 'pointer-events-none opacity-30 bg-white/5 text-white/40' : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          Prev
        </Link>

        {/* Numbered Links */}
        <div className="hidden md:flex items-center gap-1">
          {getPaginationItems().map((item, idx) => (
            item === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-white/30">...</span>
            ) : (
              <Link
                key={`page-${item}`}
                href={createPageURL(item)}
                className={`px-3 py-1.5 border rounded-md text-sm font-medium transition-colors ${
                  currentPage === item 
                    ? 'bg-white text-[#243119] border-white' 
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item}
              </Link>
            )
          ))}
        </div>

        {/* Next Button */}
        <Link
          href={currentPage < totalPages ? createPageURL(currentPage + 1) : '#'}
          className={`px-3 py-1.5 border border-white/10 rounded-md text-sm font-medium transition-colors ${
            currentPage >= totalPages ? 'pointer-events-none opacity-30 bg-white/5 text-white/40' : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          Next
        </Link>

        {/* Jump to Page */}
        <JumpToPage 
          key={currentPage} 
          totalPages={totalPages} 
          onJump={handleJump} 
        />
      </div>
    </div>
  )
}
