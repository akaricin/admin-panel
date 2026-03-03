import { adminSupabase } from '@/lib/admin-supabase'
import CaptionGallery from '@/components/CaptionGallery'

interface Image {
  id: string
  url: string
  alt_text?: string
  captions?: { count: number }[]
}

export default async function ManageImagesPage() {
  // Fetch images with caption counts
  const { data: images, error: imagesError } = await adminSupabase
    .from('images')
    .select('*, captions(count)')
    .order('created_datetime_utc', { ascending: false })

  if (imagesError) {
    return <div className="p-8 text-red-400 font-medium bg-[#243119]">Error loading images: {imagesError.message}</div>
  }

  // Debug Check: Log image_id types
  const firstImage = images?.[0]
  const { data: captionSample } = await adminSupabase.from('captions').select('image_id').limit(1)
  const firstCaption = captionSample?.[0]
  
  let typeMismatch = false
  if (firstImage && firstCaption) {
    const imageIdType = typeof firstImage.id
    const captionImageIdType = typeof firstCaption.image_id
    
    if (imageIdType !== captionImageIdType) {
      typeMismatch = true
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-[#243119]">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Image Management</h1>
          <p className="text-white/60">Upload new images, update existing ones, or delete them from the gallery.</p>
        </div>
        
        {images.length === 0 ? (
          <div className="p-12 text-center border border-white/10 rounded-2xl bg-white/5 text-white/40">
            No images found in the gallery.
          </div>
        ) : (
          <CaptionGallery 
            initialImages={images as unknown as Image[]} 
            typeMismatch={typeMismatch}
          />
        )}
      </div>
    </div>
  )
}
