import { adminSupabase } from '@/lib/admin-supabase'
import CaptionGallery from '@/components/CaptionGallery'

interface Image {
  id: string
  url: string | null
  additional_context?: string
  captions: { count: number }[]
  caption_requests: { id: number }[]
}

export const revalidate = 0 // Disable cache for admin content page to ensure fresh data

export default async function ContentOverviewPage() {
  const BATCH_SIZE = 1000
  let allImages: any[] = []
  let from = 0
  let to = BATCH_SIZE - 1
  let hasMore = true

  // Looping Fetch: Retrieve all images in batches of 1,000 until exhausted
  while (hasMore) {
    const { data: batch, error: batchError } = await adminSupabase
      .from('images')
      .select(`
        id,
        url,
        additional_context,
        captions(count),
        caption_requests(id)
      `)
      .order('created_datetime_utc', { ascending: false })
      .range(from, to)

    if (batchError) {
      console.error(`Error fetching batch from ${from} to ${to}:`, batchError.message)
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
          <p className="text-xl font-semibold">Error loading content batch</p>
          <p className="text-white/60">{batchError.message}</p>
        </div>
      )
    }

    if (batch && batch.length > 0) {
      allImages = [...allImages, ...batch]
      from += BATCH_SIZE
      to += BATCH_SIZE
      
      // If we got fewer than the batch size, we've reached the end
      if (batch.length < BATCH_SIZE) {
        hasMore = false
      }
    } else {
      hasMore = false
    }
  }

  // Debug Check for Type Mismatch: 
  // We use a separate minimal sample for this diagnostic to keep page load fast
  const firstImage = allImages?.[0]
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

  const images = (allImages as unknown as Image[]) || []

  return (
    <div className="flex-1 bg-[#243119] min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl text-white">Content Overview</h1>
            <p className="text-white/70 mt-1">Manage images, metadata, and track caption generation progress ({images.length} total images).</p>
          </div>
        </div>

        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40 border border-white/10 rounded-2xl bg-white/5">
            <p className="text-lg">No images found in the gallery.</p>
          </div>
        ) : (
          <CaptionGallery 
            initialImages={images} 
            typeMismatch={typeMismatch}
          />
        )}
      </div>
    </div>
  )
}
