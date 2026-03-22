'use client'

import { useState, useCallback } from 'react'
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { uploadImage } from '@/app/admin/content/actions'

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

export default function ImageUploader({ onSuccess, onCancel }: Props) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload an image file.')
      return
    }
    // Limit to 5MB
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB.')
      return
    }

    setFile(selectedFile)
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(selectedFile)
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setIsUploading(true)
    setError(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // 1. Upload to Supabase Storage
      const { error: storageError, data } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (storageError) {
        throw new Error(`Storage upload failed: ${storageError.message}`)
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      // 3. Sync to database via server action
      await uploadImage(publicUrl, description)

      onSuccess()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred during upload.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {!file ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-all duration-200
            ${dragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:bg-white/[0.07] hover:border-white/20'}
            min-h-[300px] text-center cursor-pointer
          `}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
          />
          <div className="p-4 bg-emerald-500/10 rounded-full mb-4">
            <Upload className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-white font-bold text-lg">Drop your image here</p>
          <p className="text-white/40 text-sm mt-2">or click to browse from files</p>
          <p className="text-[10px] text-white/20 uppercase tracking-widest mt-8 font-black">Max size: 5MB</p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Preview & File Info */}
          <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black/40 aspect-video flex items-center justify-center">
            {preview && (
              <img src={preview} alt="Preview" className="h-full w-full object-contain" />
            )}
            <button
              onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white/70 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-xs font-mono truncate">{file.name}</p>
            </div>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Contextual Metadata</label>
            <textarea
              placeholder="Provide context for captioning (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-white/20 resize-none h-24"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 bg-emerald-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Finalize & Upload
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={isUploading}
              className="px-6 py-4 border border-white/10 rounded-xl text-white/50 hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest disabled:opacity-30"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400 font-medium">{error}</p>
        </div>
      )}
    </div>
  )
}
