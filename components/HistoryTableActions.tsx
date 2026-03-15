'use client'

import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

export default function ReRunAction({ imageId }: { imageId: string | null }) {
  const [loading, setLoading] = useState(false)

  const handleReRun = async () => {
    if (!imageId) return
    setLoading(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: imageId })
      })

      if (response.ok) {
        alert('Generation started successfully!')
        window.location.reload()
      } else {
        const err = await response.json()
        alert(`Error: ${err.error || 'Failed to start generation'}`)
      }
    } catch (e) {
      alert('Network error occurred.')
    } finally {
      setLoading(false)
    }
  }

  if (!imageId) return null

  return (
    <button
      onClick={handleReRun}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
    >
      <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
      Re-generate
    </button>
  )
}
