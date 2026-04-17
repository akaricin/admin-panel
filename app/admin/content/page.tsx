import { adminSupabase } from '@/lib/admin-supabase'
import CaptionGallery from '@/components/CaptionGallery'
import GalleryPagination from '@/components/GalleryPagination'

interface Image {
  id: string
  url: string | null
  additional_context?: string
  captions: { count: number }[]
  caption_requests: { id: number }[]
}

export const revalidate = 0

const IMAGES_PER_PAGE = 60

export default async function ContentOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const currentPage = parseInt(params.page || '1')

  // 1. Fetch total count for pagination
  const { count: totalCount } = await adminSupabase
    .from('images')
    .select('*', { count: 'exact', head: true })

  // 2. Fetch paginated images
  const from = (currentPage - 1) * IMAGES_PER_PAGE
  const to = from + IMAGES_PER_PAGE - 1

  const { data: imagesData, error: imagesError } = await adminSupabase
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

  if (imagesError) {
    console.error(`Error fetching images for page ${currentPage}:`, imagesError.message)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white bg-[#243119]">
        <p className="text-xl font-semibold uppercase tracking-widest italic">Error loading gallery</p>
        <p className="text-white/40 mt-2 font-mono text-sm">{imagesError.message}</p>
      </div>
    )
  }

  // 3. Type Mismatch Diagnostic (Minimal Sample)
  const firstImage = imagesData?.[0]
  const { data: captionSample } = await adminSupabase.from('captions').select('image_id').limit(1)
  const firstCaption = captionSample?.[0]
  
  let typeMismatch = false
  if (firstImage && firstCaption) {
    const imageIdType = typeof firstImage.id
    const captionImageIdType = typeof firstCaption.image_id
    if (imageIdType !== captionImageIdType) typeMismatch = true
  }

  const images = (imagesData as unknown as Image[]) || []

  return (
    <div className="flex-1 bg-[#243119] min-h-screen p-8 pb-20 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="space-y-1">
            <h1 className="text-4xl italic font-black uppercase tracking-widest text-white">Content Overview</h1>
            <p className="text-white/50 font-medium italic">
              Manage images, metadata, and track progress ({totalCount?.toLocaleString() || 0} total images).
            </p>
          </div>
        </header>

        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-white/20 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
            <p className="text-xl font-black uppercase tracking-widest italic">No images found</p>
            <p className="text-xs mt-2 uppercase tracking-widest font-bold">Try adjusting your filters or uploading new content.</p>
          </div>
        ) : (
          <div className="space-y-12">
            <CaptionGallery 
              initialImages={images} 
              typeMismatch={typeMismatch}
              totalImages={totalCount || 0}
            />
            
            <div className="pt-8 border-t border-white/5">
              <GalleryPagination 
                currentPage={currentPage}
                totalItems={totalCount || 0}
                itemsPerPage={IMAGES_PER_PAGE}
                itemType="images"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
