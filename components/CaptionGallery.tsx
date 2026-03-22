'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Save, Trash2, Edit2, Loader2, ImageOff, ChevronRight } from 'lucide-react'
import { updateImage, deleteImage } from '@/app/admin/content/actions'
import { createClient } from '@/lib/supabase'
import ImageUploader from '@/components/ImageUploader'
import { useRouter } from 'next/navigation'

interface Caption {
  id: string
  content: string | null
}

interface Image {
  id: string
  url: string | null
  additional_context?: string
  captions: { count: number }[]
  caption_requests: { id: number }[]
}

interface Props {
  initialImages: Image[]
  typeMismatch?: boolean
}

export default function CaptionGallery({ initialImages, typeMismatch }: Props) {
  const router = useRouter()
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  
  // Cache for fetched captions to minimize popup delay
  const [captionsCache, setCaptionsCache] = useState<Record<string, Caption[]>>({})
  const [isLoadingCaptions, setIsLoadingCaptions] = useState(false)
  
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showOnlyWithCaptions, setShowOnlyWithCaptions] = useState(false)
  const [counts, setCounts] = useState<{ images: number, captions: number } | null>(null)

  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Edit state for selected image
  const [isEditing, setIsEditing] = useState(false)
  const [editUrl, setEditUrl] = useState('')
  const [editContext, setEditContext] = useState('')

  const supabase = createClient()

  const closeModals = useCallback(() => {
    setSelectedImageId(null)
    setShowUploadModal(false)
    setIsEditing(false)
  }, [])

  // Keyboard Support: Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModals()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeModals])

  const displayedImages = showOnlyWithCaptions 
    ? initialImages.filter(img => (img.captions?.[0]?.count || 0) > 0)
    : initialImages

  // Fetch diagnostic counts
  useEffect(() => {
    const fetchCounts = async () => {
      const { count: imgCount } = await supabase.from('images').select('*', { count: 'exact', head: true })
      const { count: capCount } = await supabase.from('captions').select('*', { count: 'exact', head: true })
      setCounts({ images: imgCount || 0, captions: capCount || 0 })
    }
    fetchCounts()
  }, [supabase])

  const selectedImage = initialImages.find(img => img.id === selectedImageId)

  // Fetch captions when an image is selected if they aren't in cache
  useEffect(() => {
    if (selectedImageId && !captionsCache[selectedImageId]) {
      const fetchCaptions = async () => {
        setIsLoadingCaptions(true)
        const { data, error } = await supabase
          .from('captions')
          .select('id, content')
          .eq('image_id', selectedImageId)
        
        if (error) {
          console.error('Error fetching captions:', error.message)
        } else {
          setCaptionsCache(prev => ({
            ...prev,
            [selectedImageId]: data || []
          }))
        }
        setIsLoadingCaptions(false)
      }
      fetchCaptions()
    }
  }, [selectedImageId, supabase, captionsCache])

  useEffect(() => {
    if (selectedImage) {
      setEditUrl(selectedImage.url || '')
      setEditContext(selectedImage.additional_context || '')
    }
  }, [selectedImage])

  const handleUpdate = async () => {
    if (!selectedImageId || !editUrl.trim()) return
    setIsUpdating(true)
    try {
      await updateImage(selectedImageId, editUrl, editContext)
      setIsEditing(false)
    } catch (err) {
      console.error(err)
      alert('Failed to update image.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedImageId) return
    if (!confirm('Are you sure you want to delete this image? This will also remove associated captions.')) return
    
    setIsDeleting(true)
    try {
      await deleteImage(selectedImageId)
      setSelectedImageId(null)
    } catch (err) {
      console.error(err)
      alert('Failed to delete image.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showOnlyWithCaptions}
                onChange={(e) => setShowOnlyWithCaptions(e.target.checked)}
              />
              <div className="w-10 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/20"></div>
            </div>
            <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
              Only with captions
            </span>
          </label>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-xs text-white/40 font-mono tracking-tight uppercase">
            {displayedImages.length} images total
          </span>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-white text-[#243119] px-4 py-2 rounded-lg font-bold text-sm hover:bg-white/90 transition-all shadow-md"
        >
          <Plus className="h-4 w-4" />
          Upload New Image
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedImages.map((img) => {
          const captionCount = img.captions?.[0]?.count || 0
          const hasRequests = img.caption_requests && img.caption_requests.length > 0
          const isPending = hasRequests && captionCount === 0

          return (
            <div
              key={img.id}
              className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-lg transition-all hover:scale-[1.02] hover:bg-white/10 duration-300 flex flex-col min-h-0"
            >
              {/* Image Section */}
              <div 
                className="aspect-square overflow-hidden relative bg-black/20 cursor-pointer"
                onClick={() => setSelectedImageId(img.id)}
              >
                {img.url ? (
                  <img
                    src={img.url}
                    alt={img.additional_context || `Content for image ${img.id}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                    <ImageOff className="h-12 w-12 mb-2" />
                    <span className="text-xs font-medium uppercase tracking-wider text-center px-4">No image URL available</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {isPending ? (
                    <div className="flex items-center gap-1.5 bg-amber-500/90 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg backdrop-blur-sm animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      PENDING
                    </div>
                  ) : captionCount > 0 ? (
                    <div className="bg-emerald-500/90 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg backdrop-blur-sm">
                      COMPLETED
                    </div>
                  ) : (
                    <div className="bg-white/20 text-white/70 px-3 py-1 rounded-full text-[10px] font-black shadow-lg backdrop-blur-sm">
                      IDLE
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div 
                className="px-5 py-4 flex items-center justify-between border-t border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/[0.05] transition-colors"
                onClick={() => setSelectedImageId(img.id)}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Status</span>
                  <span className="text-sm font-bold text-white tracking-tight">
                    {captionCount} {captionCount === 1 ? 'Caption' : 'Captions'}
                  </span>
                </div>
                <div className="flex items-center text-white/20 group-hover:text-white/60 transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-widest mr-1 opacity-0 group-hover:opacity-100 transition-opacity">Details</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowUploadModal(false)
          }}
        >
          <div className="bg-[#243119] w-full max-w-xl p-8 rounded-2xl shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Upload New Image</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-white/40 hover:text-white transition-transform hover:scale-110"><X className="h-5 w-5" /></button>
            </div>
            
            <ImageUploader 
              onSuccess={() => {
                setShowUploadModal(false)
                router.refresh()
              }}
              onCancel={() => setShowUploadModal(false)}
            />
          </div>
        </div>
      )}

      {/* Floating Window (Image Detail/Edit) */}
      {selectedImageId && selectedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedImageId(null)
              setIsEditing(false)
            }
          }}
        >
          <div className="bg-[#243119] w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setSelectedImageId(null); setIsEditing(false); }}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Side: Large View */}
            <div className="md:w-3/5 h-1/2 md:h-full bg-black/40 flex items-center justify-center p-8">
              <img
                src={selectedImage.url || ''}
                alt={selectedImage.additional_context || 'Large View'}
                className="max-h-full max-w-full object-contain rounded-lg shadow-xl"
              />
            </div>

            {/* Right Side: Info & Actions */}
            <div className="md:w-2/5 h-1/2 md:h-full flex flex-col bg-[#243119] border-l border-white/10">
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                <div>
                  <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Image Data</h2>
                  <p className="text-white/40 text-sm">Manage image metadata and review all generated captions.</p>
                </div>

                {isEditing ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">URL</label>
                      <input 
                        type="text" 
                        value={editUrl}
                        onChange={e => setEditUrl(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Description</label>
                      <textarea 
                        rows={3}
                        value={editContext}
                        onChange={e => setEditContext(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <label className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Source URL</label>
                        <p className="text-xs text-white/70 break-all font-mono leading-relaxed">{selectedImage.url}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <label className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Description</label>
                        <p className="text-sm text-white/90 leading-relaxed italic">{selectedImage.additional_context || 'No description provided'}</p>
                      </div>
                    </div>

                    {/* Captions Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-white/60 uppercase tracking-widest flex items-center gap-2">
                        Captions
                        <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-black">
                          {captionsCache[selectedImageId]?.length ?? 0}
                        </span>
                      </h3>
                      {isLoadingCaptions ? (
                        <div className="flex items-center gap-3 text-white/30 text-xs py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Fetching caption records...
                        </div>
                      ) : !captionsCache[selectedImageId] || captionsCache[selectedImageId].length === 0 ? (
                        <div className="p-8 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                          <p className="text-xs text-white/20 italic font-medium">No captions generated for this image yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {captionsCache[selectedImageId].map((cap) => (
                            <div key={cap.id} className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/90 leading-relaxed italic shadow-inner">
                              &quot;{cap.content}&quot;
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Footer Buttons */}
              <div className="p-6 border-t border-white/10 bg-white/[0.02]">
                {isEditing ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="flex-1 bg-white text-[#243119] py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Update Record
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 border border-white/10 rounded-xl text-white/50 hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition-all font-black text-sm uppercase tracking-widest border border-white/5"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Meta
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 text-red-500 py-3 rounded-xl hover:bg-red-500/20 transition-all font-black text-sm uppercase tracking-widest border border-red-500/20"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Destroy
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Mode */}
      <div className="mt-12 pt-8 border-t border-white/5 text-center">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black mb-4">Diagnostic Context</p>
        <div className="inline-flex flex-col gap-4">
          <div className="inline-flex gap-8 text-[10px] text-white/40 bg-white/[0.03] px-8 py-3 rounded-full border border-white/5 font-mono">
            <span>Images: <span className="text-white">{counts?.images ?? '...'}</span></span>
            <span className="w-px h-3 bg-white/10 my-auto" />
            <span>Captions: <span className="text-white">{counts?.captions ?? '...'}</span></span>
          </div>
          {typeMismatch && (
            <div className="text-red-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
              ⚠️ Warning: image_id type collision detected
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
