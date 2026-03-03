'use client'

import { useState, useEffect } from 'react'
import { Pencil, X, Save } from 'lucide-react'
import { updateCaption } from '@/app/admin/captions/actions'
import { createClient } from '@/lib/supabase'

interface Image {
  id: string
  url: string
  alt_text?: string
  captions?: { count: number }[]
}

interface Caption {
  id: string
  image_id: string
  content: string
}

interface UniqueImage {
  url: string
  alt_text?: string
  ids: string[]
  totalCaptions: number
  primaryId: string
}

interface Props {
  initialImages: Image[]
  typeMismatch?: boolean
}

export default function CaptionGallery({ initialImages, typeMismatch }: Props) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [selectedCaptions, setSelectedCaptions] = useState<Caption[]>([])
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoadingCaptions, setIsLoadingCaptions] = useState(false)
  const [showOnlyWithCaptions, setShowOnlyWithCaptions] = useState(false)
  const [counts, setCounts] = useState<{ images: number, captions: number } | null>(null)

  const supabase = createClient()

  // Group images by URL for deduplication
  const uniqueImagesMap = new Map<string, UniqueImage>()
  initialImages.forEach(img => {
    const existing = uniqueImagesMap.get(img.url)
    const captionCount = img.captions?.[0]?.count || 0
    if (existing) {
      existing.ids.push(img.id)
      existing.totalCaptions += captionCount
    } else {
      uniqueImagesMap.set(img.url, {
        url: img.url,
        alt_text: img.alt_text,
        ids: [img.id],
        totalCaptions: captionCount,
        primaryId: img.id
      })
    }
  })

  const uniqueImagesList = Array.from(uniqueImagesMap.values())

  // Filter based on totalCaptions
  const displayedImages = showOnlyWithCaptions 
    ? uniqueImagesList.filter(img => img.totalCaptions > 0)
    : uniqueImagesList

  // Fetch captions when an image is selected
  useEffect(() => {
    if (selectedImageId) {
      const fetchCaptions = async () => {
        setIsLoadingCaptions(true)
        const { data, error } = await supabase
          .from('captions')
          .select('*')
          .eq('image_id', selectedImageId)
        
        if (error) {
          console.error('Error fetching captions:', error.message)
        } else {
          setSelectedCaptions(data || [])
        }
        setIsLoadingCaptions(false)
      }
      fetchCaptions()
    } else {
      setSelectedCaptions([])
    }
  }, [selectedImageId])

  // Fetch diagnostic counts
  useEffect(() => {
    const fetchCounts = async () => {
      const { count: imgCount } = await supabase.from('images').select('*', { count: 'exact', head: true })
      const { count: capCount } = await supabase.from('captions').select('*', { count: 'exact', head: true })
      setCounts({ images: imgCount || 0, captions: capCount || 0 })
    }
    fetchCounts()
  }, [])

  const selectedImage = uniqueImagesList.find(img => img.ids.includes(selectedImageId!))

  const startEditing = (caption: Caption) => {
    setEditingCaptionId(caption.id)
    setEditValue(caption.content)
  }

  const cancelEditing = () => {
    setEditingCaptionId(null)
    setEditValue('')
  }

  const handleSave = async (id: string) => {
    if (!editValue.trim()) return
    
    setIsUpdating(true)
    try {
      await updateCaption(id, editValue)
      setSelectedCaptions(prev => prev.map(c => c.id === id ? { ...c, content: editValue } : c))
      setEditingCaptionId(null)
    } catch (err) {
      console.error(err)
      alert('Failed to update caption.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Filter Controls */}
      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm">
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
            Only show images with captions
          </span>
        </label>
        <div className="h-4 w-px bg-white/10" />
        <span className="text-xs text-white/40">
          Showing {displayedImages.length} of {uniqueImagesList.length} unique images
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {displayedImages.map((img) => (
          <div
            key={img.primaryId}
            onClick={() => setSelectedImageId(img.primaryId)}
            className="group cursor-pointer relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:scale-[1.02] hover:shadow-lg shadow-sm"
          >
            <img
              src={img.url}
              alt={img.alt_text || 'Gallery Image'}
              className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            
            {/* Badge */}
            <div className="absolute top-2 right-2 bg-white text-[#243119] px-2 py-1 rounded-md shadow-md text-[10px] font-bold">
              {img.totalCaptions} {img.totalCaptions === 1 ? 'Caption' : 'Captions'}
            </div>
          </div>
        ))}
      </div>

      {/* Diagnostic Mode */}
      <div className="mt-12 pt-8 border-t border-white/5 text-center">
        <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-2">Diagnostic Mode</p>
        <div className="inline-flex flex-col gap-4">
          <div className="inline-flex gap-8 text-sm text-white/50 bg-white/5 px-6 py-3 rounded-full border border-white/5">
            <span>Images in table: <span className="font-bold text-white">{counts?.images ?? '...'}</span></span>
            <span className="w-px h-4 bg-white/10 my-auto" />
            <span>Captions in table: <span className="font-bold text-white">{counts?.captions ?? '...'}</span></span>
          </div>
          {typeMismatch && (
            <div className="text-red-400 text-xs font-medium animate-pulse">
              ⚠️ Warning: Type mismatch detected between image_id columns (e.g. UUID vs Integer). 
              This may cause disconnections in the gallery.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedImageId && selectedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#243119] w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedImageId(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors shadow-sm"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Side: Large Image */}
            <div className="md:w-3/5 h-1/2 md:h-full bg-black/40 flex items-center justify-center">
              <img
                src={selectedImage.url}
                alt={selectedImage.alt_text || 'Large View'}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Right Side: Captions */}
            <div className="md:w-2/5 h-1/2 md:h-full p-6 flex flex-col bg-[#243119] border-l border-white/10">
              <h2 className="text-xl font-bold text-white mb-6">Manage Captions</h2>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {isLoadingCaptions ? (
                  <div className="flex items-center justify-center h-full text-white/30">
                    <p>Loading captions...</p>
                  </div>
                ) : selectedCaptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-white/40 gap-2 text-center">
                    <p className="font-medium">No captions found for this image ID</p>
                    <p className="text-sm px-4 opacity-70">There might be a disconnection between image_id and the captions table.</p>
                  </div>
                ) : (
                  selectedCaptions.map((caption) => (
                    <div
                      key={caption.id}
                      className="group relative p-4 rounded-xl border bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10 transition-all shadow-sm"
                    >
                      {editingCaptionId === caption.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full min-h-[80px] p-3 text-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 bg-white/5 text-white"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={cancelEditing}
                              className="px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/5 rounded-md transition-colors"
                              disabled={isUpdating}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSave(caption.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-[#243119] rounded-md hover:bg-white/90 transition-colors shadow-sm disabled:opacity-50"
                              disabled={isUpdating}
                            >
                              {isUpdating ? 'Saving...' : (
                                <>
                                  <Save className="h-3 w-3" />
                                  Save
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm text-white/80 leading-relaxed">
                            {caption.content}
                          </p>
                          <button
                            onClick={() => startEditing(caption)}
                            className="p-1.5 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-all shadow-sm border border-transparent hover:border-white/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
