'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Save, Trash2, Edit2, Loader2 } from 'lucide-react'
import { uploadImage, updateImage, deleteImage } from '@/app/admin/captions/actions'
import { createClient } from '@/lib/supabase'

interface Image {
  id: string
  url: string
  alt_text?: string
  captions?: { count: number }[]
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
  const [selectedCaptions, setSelectedCaptions] = useState<{ id: string, content: string }[]>([])
  const [isLoadingCaptions, setIsLoadingCaptions] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showOnlyWithCaptions, setShowOnlyWithCaptions] = useState(false)
  const [counts, setCounts] = useState<{ images: number, captions: number } | null>(null)

  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageAlt, setNewImageAlt] = useState('')

  // Edit state for selected image
  const [isEditing, setIsEditing] = useState(false)
  const [editUrl, setEditUrl] = useState('')
  const [editAlt, setEditAlt] = useState('')

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

  const displayedImages = showOnlyWithCaptions 
    ? uniqueImagesList.filter(img => img.totalCaptions > 0)
    : uniqueImagesList

  // Fetch diagnostic counts
  useEffect(() => {
    const fetchCounts = async () => {
      const { count: imgCount } = await supabase.from('images').select('*', { count: 'exact', head: true })
      const { count: capCount } = await supabase.from('captions').select('*', { count: 'exact', head: true })
      setCounts({ images: imgCount || 0, captions: capCount || 0 })
    }
    fetchCounts()
  }, [supabase])

  const selectedImage = uniqueImagesList.find(img => img.ids.includes(selectedImageId!))

  // Fetch captions when an image is selected
  useEffect(() => {
    if (selectedImageId) {
      const fetchCaptions = async () => {
        setIsLoadingCaptions(true)
        const { data, error } = await supabase
          .from('captions')
          .select('id, content')
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
  }, [selectedImageId, supabase])

  useEffect(() => {
    if (selectedImage) {
      setEditUrl(selectedImage.url)
      setEditAlt(selectedImage.alt_text || '')
    }
  }, [selectedImage])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newImageUrl.trim()) return
    setIsUploading(true)
    try {
      await uploadImage(newImageUrl, newImageAlt)
      setNewImageUrl('')
      setNewImageAlt('')
      setShowUploadModal(false)
    } catch (err) {
      console.error(err)
      alert('Failed to upload image.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedImageId || !editUrl.trim()) return
    setIsUpdating(true)
    try {
      await updateImage(selectedImageId, editUrl, editAlt)
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
          <span className="text-xs text-white/40">
            {displayedImages.length} images
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#243119] w-full max-w-md p-6 rounded-2xl shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Upload Image</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-2">Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-2">Alt Text (Optional)</label>
                <input
                  type="text"
                  placeholder="Image description..."
                  value={newImageAlt}
                  onChange={e => setNewImageAlt(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <button
                type="submit"
                disabled={isUploading}
                className="w-full bg-white text-[#243119] py-3 rounded-xl font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                Add Image
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Window (Image Detail/Edit) */}
      {selectedImageId && selectedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#243119] w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row relative">
            <button
              onClick={() => { setSelectedImageId(null); setIsEditing(false); }}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Side: Large View */}
            <div className="md:w-3/5 h-1/2 md:h-full bg-black/40 flex items-center justify-center p-8">
              <img
                src={selectedImage.url}
                alt={selectedImage.alt_text || 'Large View'}
                className="max-h-full max-w-full object-contain rounded-lg shadow-xl"
              />
            </div>

            {/* Right Side: Info & Actions */}
            <div className="md:w-2/5 h-1/2 md:h-full flex flex-col bg-[#243119] border-l border-white/10">
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Image Details</h2>
                  <p className="text-white/40 text-sm">Update URL, metadata, or delete this image.</p>
                </div>

                {isEditing ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/30 uppercase tracking-widest">URL</label>
                      <input 
                        type="text" 
                        value={editUrl}
                        onChange={e => setEditUrl(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/30 uppercase tracking-widest">Alt Text</label>
                      <input 
                        type="text" 
                        value={editAlt}
                        onChange={e => setEditAlt(e.target.value)}
                        className="w-full bg-white/5 border border-white/20 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <label className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Source URL</label>
                        <p className="text-xs text-white/70 break-all font-mono">{selectedImage.url}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                        <label className="block text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Alt Text</label>
                        <p className="text-sm text-white/90">{selectedImage.alt_text || 'No description provided'}</p>
                      </div>
                    </div>

                    {/* Captions Section */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                        Captions
                        <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-black">{selectedCaptions.length}</span>
                      </h3>
                      {isLoadingCaptions ? (
                        <div className="flex items-center gap-2 text-white/30 text-xs">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading...
                        </div>
                      ) : selectedCaptions.length === 0 ? (
                        <p className="text-xs text-white/20 italic">No captions found for this image.</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedCaptions.map((cap) => (
                            <div key={cap.id} className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-white/80 leading-relaxed italic">
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
                      className="flex-1 bg-white text-[#243119] py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 border border-white/10 rounded-xl text-white/50 hover:bg-white/5 transition-all text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white py-3 rounded-xl hover:bg-white/20 transition-all font-bold text-sm border border-white/5"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Meta
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 text-red-500 py-3 rounded-xl hover:bg-red-500/20 transition-all font-bold text-sm border border-red-500/20"
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete
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
        <p className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-2">Diagnostic Mode</p>
        <div className="inline-flex flex-col gap-4">
          <div className="inline-flex gap-8 text-sm text-white/50 bg-white/5 px-6 py-3 rounded-full border border-white/5">
            <span>Images in table: <span className="font-bold text-white">{counts?.images ?? '...'}</span></span>
            <span className="w-px h-4 bg-white/10 my-auto" />
            <span>Captions in table: <span className="font-bold text-white">{counts?.captions ?? '...'}</span></span>
          </div>
          {typeMismatch && (
            <div className="text-red-400 text-xs font-medium animate-pulse">
              ⚠️ Warning: Type mismatch detected between image_id columns.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
